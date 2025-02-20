-- DropForeignKey
ALTER TABLE "JobFile" DROP CONSTRAINT "JobFile_jobApplicationId_fkey";

-- AlterTable
ALTER TABLE "JobApplication" ALTER COLUMN "hasBeenContacted" SET DEFAULT false,
ALTER COLUMN "confirmationReceived" SET DEFAULT false;

-- AddForeignKey
ALTER TABLE "JobFile" ADD CONSTRAINT "JobFile_jobApplicationId_fkey" FOREIGN KEY ("jobApplicationId") REFERENCES "JobApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
