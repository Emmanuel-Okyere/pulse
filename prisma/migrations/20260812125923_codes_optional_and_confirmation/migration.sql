-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "codesEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "confirmationMessage" TEXT,
ADD COLUMN     "confirmationTitle" TEXT;

-- AlterTable
ALTER TABLE "Registration" ALTER COLUMN "code" DROP NOT NULL;
