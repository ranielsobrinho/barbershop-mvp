CREATE TABLE IF NOT EXISTS "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "customerId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "customers_phone_key" ON "customers"("phone");

-- Normalize Brazilian phone formats and merge existing appointments that
-- represent the same number. Appointment name/phone columns remain snapshots.
WITH normalized AS (
    SELECT
        a."id" AS appointment_id,
        a."customerName" AS customer_name,
        a."updatedAt" AS updated_at,
        CASE
            WHEN length(regexp_replace(a."customerPhone", '[^0-9]', '', 'g')) IN (12, 13)
              AND left(regexp_replace(a."customerPhone", '[^0-9]', '', 'g'), 2) = '55'
            THEN substring(regexp_replace(a."customerPhone", '[^0-9]', '', 'g') FROM 3)
            ELSE regexp_replace(a."customerPhone", '[^0-9]', '', 'g')
        END AS phone
    FROM "appointments" a
), unique_customers AS (
    SELECT DISTINCT ON (phone) phone, customer_name
    FROM normalized
    WHERE phone <> ''
    ORDER BY phone, updated_at DESC, appointment_id DESC
)
INSERT INTO "customers" ("id", "name", "phone", "createdAt", "updatedAt")
SELECT 'customer_' || md5(phone), customer_name, phone, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM unique_customers
ON CONFLICT ("phone") DO NOTHING;

WITH normalized AS (
    SELECT
        a."id" AS appointment_id,
        CASE
            WHEN length(regexp_replace(a."customerPhone", '[^0-9]', '', 'g')) IN (12, 13)
              AND left(regexp_replace(a."customerPhone", '[^0-9]', '', 'g'), 2) = '55'
            THEN substring(regexp_replace(a."customerPhone", '[^0-9]', '', 'g') FROM 3)
            ELSE regexp_replace(a."customerPhone", '[^0-9]', '', 'g')
        END AS phone
    FROM "appointments" a
)
UPDATE "appointments" a
SET "customerId" = c."id"
FROM normalized n
JOIN "customers" c ON c."phone" = n.phone
WHERE a."id" = n.appointment_id;

CREATE INDEX IF NOT EXISTS "customers_name_idx" ON "customers"("name");
CREATE INDEX IF NOT EXISTS "appointments_customerId_startsAt_idx" ON "appointments"("customerId", "startsAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'appointments_customerId_fkey'
    ) THEN
        ALTER TABLE "appointments"
        ADD CONSTRAINT "appointments_customerId_fkey"
        FOREIGN KEY ("customerId") REFERENCES "customers"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
