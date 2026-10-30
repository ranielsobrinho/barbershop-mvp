ALTER TABLE "whatsapp_integration"
  ADD COLUMN "reminderEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "reminderHoursBefore" INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN "messageReminder" TEXT;

CREATE TYPE "AppointmentReminderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED');

CREATE TABLE "appointment_reminders" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL,
  "status" "AppointmentReminderStatus" NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "providerResponseCode" INTEGER,
  "lastError" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "leaseExpiresAt" TIMESTAMP(3),
  "leaseToken" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "appointment_reminders_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "appointment_reminders_idempotencyKey_key"
  ON "appointment_reminders"("idempotencyKey");
CREATE INDEX "appointment_reminders_status_nextAttemptAt_idx"
  ON "appointment_reminders"("status", "nextAttemptAt");
CREATE INDEX "appointment_reminders_appointmentId_createdAt_idx"
  ON "appointment_reminders"("appointmentId", "createdAt");

ALTER TABLE "appointment_reminders"
  ADD CONSTRAINT "appointment_reminders_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
