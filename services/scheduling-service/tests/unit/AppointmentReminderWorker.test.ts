import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, query, send } = vi.hoisted(() => ({
  prisma: {
    $transaction: vi.fn(),
    appointmentReminder: { findUnique: vi.fn(), updateMany: vi.fn() },
  },
  query: vi.fn(),
  send: vi.fn(),
}));

vi.mock("../../src/infrastructure/database/prisma.js", () => ({
  default: prisma,
}));
vi.mock(
  "../../src/infrastructure/notifications/sendAppointmentReminder.js",
  async () => {
    const actual = await vi.importActual<
      typeof import("../../src/infrastructure/notifications/sendAppointmentReminder.js")
    >("../../src/infrastructure/notifications/sendAppointmentReminder.js");
    return { ...actual, sendAppointmentReminder: send };
  },
);

import { AppointmentReminderWorker } from "../../src/infrastructure/reminders/AppointmentReminderWorker.js";
import { ReminderDeliveryError } from "../../src/infrastructure/notifications/sendAppointmentReminder.js";

const future = new Date(Date.now() + 60 * 60_000);
const lease = { id: "reminder-1", leaseToken: "lease-1" };
const logger = { warn: vi.fn(), error: vi.fn() };
let activeLeaseToken = lease.leaseToken;

function setupReminder(overrides: Record<string, unknown> = {}) {
  prisma.appointmentReminder.findUnique.mockImplementation(
    async (args: any) => {
      if (args.include) {
        return {
          id: lease.id,
          status: "PROCESSING",
          leaseToken: activeLeaseToken,
          appointmentId: "appointment-1",
          idempotencyKey: "idempotency-1",
          appointment: {
            id: "appointment-1",
            status: "CONFIRMADO",
            startsAt: future,
          },
          ...overrides,
        };
      }
      return { attemptCount: 1 };
    },
  );
}

function setupClaim(rows: Array<{ id: string }> = [{ id: lease.id }]) {
  const tx = {
    $queryRawUnsafe: query.mockResolvedValue(rows),
    appointmentReminder: {
      update: vi.fn().mockImplementation(async ({ data }: any) => {
        activeLeaseToken = data.leaseToken;
      }),
    },
  };
  prisma.$transaction.mockImplementation(
    async (callback: (value: typeof tx) => unknown) => callback(tx),
  );
  return tx;
}

describe("AppointmentReminderWorker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activeLeaseToken = lease.leaseToken;
    setupClaim();
    setupReminder();
    prisma.appointmentReminder.updateMany.mockResolvedValue({ count: 1 });
    send.mockResolvedValue({ sent: true, providerResponseCode: 200 });
  });

  it("claims reminders with SKIP LOCKED and records one successful delivery", async () => {
    const worker = new AppointmentReminderWorker(logger as any);

    await worker.runOnce();

    expect(query.mock.calls[0][0]).toContain("FOR UPDATE SKIP LOCKED");
    expect(await query.mock.results[0].value).toEqual([{ id: lease.id }]);
    expect(send).toHaveBeenCalledWith("appointment-1", "idempotency-1");
    expect(prisma.appointmentReminder.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: lease.id,
          status: "PROCESSING",
          leaseToken: expect.any(String),
        },
        data: expect.objectContaining({
          status: "SENT",
          providerResponseCode: 200,
        }),
      }),
    );
  });

  it("shares an in-flight poll so concurrent ticks do not send the same leased reminder twice", async () => {
    let finish!: (value: { sent: boolean }) => void;
    send.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const worker = new AppointmentReminderWorker(logger as any);

    const first = worker.runOnce();
    const second = worker.runOnce();
    finish({ sent: true });
    await Promise.all([first, second]);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("requeues provider failures with bounded backoff and stores a safe error", async () => {
    send.mockRejectedValueOnce(
      new ReminderDeliveryError("Provider rejected message", 503),
    );
    const worker = new AppointmentReminderWorker(logger as any);

    await worker.runOnce();

    expect(prisma.appointmentReminder.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PENDING",
          lastError: "Provider rejected message",
          providerResponseCode: 503,
          nextAttemptAt: expect.any(Date),
        }),
      }),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ responseCode: 503 }),
      "Appointment reminder delivery failed",
    );
  });

  it("retries the same outbox reminder after backoff using its stable idempotency key", async () => {
    send.mockRejectedValueOnce(
      new ReminderDeliveryError("Provider temporarily unavailable", 503),
    );
    send.mockResolvedValueOnce({ sent: true, providerResponseCode: 200 });
    const worker = new AppointmentReminderWorker(logger as any);

    await worker.runOnce();
    await worker.runOnce();

    expect(send).toHaveBeenNthCalledWith(1, "appointment-1", "idempotency-1");
    expect(send).toHaveBeenNthCalledWith(2, "appointment-1", "idempotency-1");
    expect(prisma.appointmentReminder.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "SENT",
          providerResponseCode: 200,
        }),
      }),
    );
  });

  it("cancels a stale reminder after cancellation or rescheduling and never calls the provider", async () => {
    setupReminder({
      appointment: {
        id: "appointment-1",
        status: "CANCELADO",
        startsAt: future,
      },
    });
    const worker = new AppointmentReminderWorker(logger as any);

    await worker.runOnce();

    expect(send).not.toHaveBeenCalled();
    expect(prisma.appointmentReminder.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "CANCELLED" }),
      }),
    );
  });

  it("cancels the reminder when delivery is disabled or no provider is configured", async () => {
    send.mockResolvedValueOnce({
      sent: false,
      reason: "provider-not-configured",
    });
    const worker = new AppointmentReminderWorker(logger as any);

    await worker.runOnce();

    expect(prisma.appointmentReminder.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "CANCELLED",
          lastError: "provider-not-configured",
        }),
      }),
    );
  });
});
