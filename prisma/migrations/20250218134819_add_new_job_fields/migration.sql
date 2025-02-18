-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN     "confirmationReceived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dateOfInterview" TIMESTAMP(3),
ADD COLUMN     "dateSubmitted" TIMESTAMP(3);
