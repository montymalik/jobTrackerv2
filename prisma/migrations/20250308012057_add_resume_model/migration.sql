-- CreateTable
CREATE TABLE "BaseResume" (
    "id" TEXT NOT NULL,
    "resumeJson" JSONB NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "filePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BaseResume_pkey" PRIMARY KEY ("id")
);
