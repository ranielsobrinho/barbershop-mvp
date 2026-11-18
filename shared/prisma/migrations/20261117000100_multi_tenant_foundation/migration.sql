CREATE TYPE "TenantRole" AS ENUM ('OWNER', 'ADMIN', 'STAFF');

CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tenant_memberships" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TenantRole" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tenant_memberships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "barbers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'tenant_seu_carlos',
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "barbers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "barber_business_hours" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'tenant_seu_carlos',
    "barberId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "opensAt" TEXT NOT NULL,
    "closesAt" TEXT NOT NULL,
    "breakStart" TEXT,
    "breakEnd" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "barber_business_hours_pkey" PRIMARY KEY ("id")
);

INSERT INTO "tenants" ("id", "name", "slug", "active", "createdAt", "updatedAt")
VALUES ('tenant_seu_carlos', 'Seu Carlos Barbearia', 'seu-carlos', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "barbers" ("id", "tenantId", "name", "active", "createdAt", "updatedAt")
VALUES ('barber_seu_carlos', 'tenant_seu_carlos', 'Seu Carlos', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO "tenant_memberships" ("id", "tenantId", "userId", "role", "createdAt", "updatedAt")
SELECT 'membership_' || md5(u."id" || ':tenant_seu_carlos'), 'tenant_seu_carlos', u."id",
       CASE WHEN lower(u."email") = 'carlos@barbearia.com' THEN 'OWNER'::"TenantRole" ELSE 'STAFF'::"TenantRole" END,
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users" u
ON CONFLICT DO NOTHING;

ALTER TABLE "services" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'tenant_seu_carlos';
ALTER TABLE "appointments" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'tenant_seu_carlos';
ALTER TABLE "appointments" ADD COLUMN "barberId" TEXT NOT NULL DEFAULT 'barber_seu_carlos';
ALTER TABLE "customers" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'tenant_seu_carlos';
ALTER TABLE "appointment_reminders" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'tenant_seu_carlos';
ALTER TABLE "business_hours" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'tenant_seu_carlos';
ALTER TABLE "blocks" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'tenant_seu_carlos';
ALTER TABLE "settings" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'tenant_seu_carlos';
ALTER TABLE "whatsapp_integration" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'tenant_seu_carlos';
ALTER TABLE "blocks" ADD COLUMN "barberId" TEXT;

INSERT INTO "barber_business_hours" ("id", "tenantId", "barberId", "weekday", "opensAt", "closesAt", "breakStart", "breakEnd", "active", "createdAt", "updatedAt")
SELECT 'barber_hours_' || bh."weekday", 'tenant_seu_carlos', 'barber_seu_carlos', bh."weekday", bh."opensAt", bh."closesAt", bh."breakStart", bh."breakEnd", bh."active", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "business_hours" bh;

CREATE UNIQUE INDEX "barbers_tenantId_id_key" ON "barbers"("tenantId", "id");
CREATE UNIQUE INDEX "services_tenantId_id_key" ON "services"("tenantId", "id");
CREATE UNIQUE INDEX "appointments_tenantId_id_key" ON "appointments"("tenantId", "id");
CREATE UNIQUE INDEX "customers_tenantId_id_key" ON "customers"("tenantId", "id");

ALTER TABLE "tenant_memberships"
    ADD CONSTRAINT "tenant_memberships_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tenant_memberships"
    ADD CONSTRAINT "tenant_memberships_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "appointments" DROP CONSTRAINT "appointments_serviceId_fkey";
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_customerId_fkey";
ALTER TABLE "appointment_reminders" DROP CONSTRAINT "appointment_reminders_appointmentId_fkey";

ALTER TABLE "barbers" ADD CONSTRAINT "barbers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "barber_business_hours" ADD CONSTRAINT "barber_business_hours_tenantId_barberId_fkey" FOREIGN KEY ("tenantId", "barberId") REFERENCES "barbers"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "services" ADD CONSTRAINT "services_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenantId_serviceId_fkey" FOREIGN KEY ("tenantId", "serviceId") REFERENCES "services"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenantId_customerId_fkey" FOREIGN KEY ("tenantId", "customerId") REFERENCES "customers"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_tenantId_barberId_fkey" FOREIGN KEY ("tenantId", "barberId") REFERENCES "barbers"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointment_reminders" ADD CONSTRAINT "appointment_reminders_tenantId_appointmentId_fkey" FOREIGN KEY ("tenantId", "appointmentId") REFERENCES "appointments"("tenantId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customers" ADD CONSTRAINT "customers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_tenantId_barberId_fkey" FOREIGN KEY ("tenantId", "barberId") REFERENCES "barbers"("tenantId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointment_reminders" ADD CONSTRAINT "appointment_reminders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "settings" ADD CONSTRAINT "settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "whatsapp_integration" ADD CONSTRAINT "whatsapp_integration_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");
CREATE UNIQUE INDEX "tenant_memberships_tenantId_userId_key" ON "tenant_memberships"("tenantId", "userId");
CREATE INDEX "tenant_memberships_userId_idx" ON "tenant_memberships"("userId");
CREATE UNIQUE INDEX "barbers_tenantId_name_key" ON "barbers"("tenantId", "name");
CREATE UNIQUE INDEX "barber_business_hours_barberId_weekday_key" ON "barber_business_hours"("barberId", "weekday");
CREATE INDEX "barber_business_hours_tenantId_weekday_idx" ON "barber_business_hours"("tenantId", "weekday");
DROP INDEX "services_name_key";
CREATE UNIQUE INDEX "services_tenantId_name_key" ON "services"("tenantId", "name");
DROP INDEX "customers_phone_key";
CREATE UNIQUE INDEX "customers_tenantId_phone_key" ON "customers"("tenantId", "phone");
DROP INDEX "business_hours_weekday_key";
CREATE UNIQUE INDEX "business_hours_tenantId_weekday_key" ON "business_hours"("tenantId", "weekday");
DROP INDEX "appointment_reminders_idempotencyKey_key";
CREATE UNIQUE INDEX "appointment_reminders_tenantId_idempotencyKey_key" ON "appointment_reminders"("tenantId", "idempotencyKey");
ALTER TABLE "settings" DROP CONSTRAINT "settings_pkey";
ALTER TABLE "settings" ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("tenantId", "id");
ALTER TABLE "whatsapp_integration" DROP CONSTRAINT "whatsapp_integration_pkey";
ALTER TABLE "whatsapp_integration" ADD CONSTRAINT "whatsapp_integration_pkey" PRIMARY KEY ("tenantId", "id");
CREATE INDEX "services_tenantId_idx" ON "services"("tenantId");
CREATE INDEX "appointments_tenantId_startsAt_status_idx" ON "appointments"("tenantId", "startsAt", "status");
CREATE INDEX "customers_tenantId_idx" ON "customers"("tenantId");
CREATE INDEX "appointment_reminders_tenantId_status_nextAttemptAt_idx" ON "appointment_reminders"("tenantId", "status", "nextAttemptAt");
CREATE INDEX "business_hours_tenantId_idx" ON "business_hours"("tenantId");
CREATE INDEX "blocks_tenantId_startsAt_endsAt_idx" ON "blocks"("tenantId", "startsAt", "endsAt");
CREATE INDEX "blocks_tenantId_barberId_startsAt_endsAt_idx" ON "blocks"("tenantId", "barberId", "startsAt", "endsAt");
CREATE INDEX "settings_tenantId_idx" ON "settings"("tenantId");
CREATE INDEX "whatsapp_integration_tenantId_idx" ON "whatsapp_integration"("tenantId");
