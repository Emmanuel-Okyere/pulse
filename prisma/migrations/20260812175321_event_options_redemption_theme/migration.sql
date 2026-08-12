-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "embedLogoInQr" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "maxRedemptions" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "themeAccent" TEXT,
ADD COLUMN     "themePrimary" TEXT;

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "redeemCount" INTEGER NOT NULL DEFAULT 0;
