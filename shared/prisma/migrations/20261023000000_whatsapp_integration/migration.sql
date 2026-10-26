CREATE TYPE "WhatsAppProvider" AS ENUM ('WAME', 'ZAPSTER');
CREATE TABLE "whatsapp_integration" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "provider" "WhatsAppProvider",
  "wameApiKey" TEXT,
  "zapsterApiToken" TEXT,
  "zapsterInstanceId" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "whatsapp_integration_pkey" PRIMARY KEY ("id")
);
