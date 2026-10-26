ALTER TABLE "whatsapp_integration"
  ADD COLUMN "messageAwaitingConfirmation" TEXT,
  ADD COLUMN "messageConfirmed" TEXT,
  ADD COLUMN "messageCancelled" TEXT,
  ADD COLUMN "messageRescheduled" TEXT;
