-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "locationLabel" TEXT,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "radiusMeters" INTEGER NOT NULL DEFAULT 200,
ADD COLUMN     "requireLocation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "distanceMeters" INTEGER;
