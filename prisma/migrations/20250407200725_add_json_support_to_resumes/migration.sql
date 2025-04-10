-- AlterTable
ALTER TABLE "GeneratedResume" ADD COLUMN     "contentType" TEXT DEFAULT 'markdown',
ADD COLUMN     "jsonContent" TEXT;
