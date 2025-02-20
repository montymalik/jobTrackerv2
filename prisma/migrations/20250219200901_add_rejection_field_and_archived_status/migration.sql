-- AlterEnum
ALTER TYPE "ApplicationStatus" ADD VALUE 'ARCHIVED';

-- DropForeignKey
ALTER TABLE "JobFile" DROP CONSTRAINT "JobFile_jobApplicationId_fkey";

-- DropIndex
DROP INDEX "JobApplication_status_idx";

-- DropIndex
DROP INDEX "JobFile_jobApplicationId_idx";

-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN     "rejectionReceived" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "hasBeenContacted" DROP DEFAULT,
ALTER COLUMN "confirmationReceived" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "JobFile" ADD CONSTRAINT "JobFile_jobApplicationId_fkey" FOREIGN KEY ("jobApplicationId") REFERENCES "JobApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
