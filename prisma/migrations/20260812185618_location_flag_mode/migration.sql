-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "enforceLocation" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "atVenue" BOOLEAN;
