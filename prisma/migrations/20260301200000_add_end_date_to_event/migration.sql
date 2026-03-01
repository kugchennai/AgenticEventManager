-- AlterTable: Add endDate to Event, defaulting to date + 2 hours for existing rows
ALTER TABLE "Event" ADD COLUMN "endDate" TIMESTAMP(3) NOT NULL DEFAULT now();

-- Backfill: set endDate = date + 2 hours for existing rows
UPDATE "Event" SET "endDate" = "date" + INTERVAL '2 hours';

-- Remove the default so new rows must supply endDate explicitly
ALTER TABLE "Event" ALTER COLUMN "endDate" DROP DEFAULT;
