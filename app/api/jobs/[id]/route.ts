export const dynamic = "force-dynamic"; // if necessary

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { ApplicationStatus } from "@/app/lib/types";
import { promises as fs } from "fs";
import path from "path";

interface Params {
  id: string;
}

interface Props {
  params: Params;
}

// Helper to parse dates
const parseDate = (dateStr: string | null, fallback: Date | null) => {
  if (!dateStr) return fallback;
  return new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00.000Z");
};

export async function GET(
  request: Request,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const job = await prisma.jobApplication.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Error fetching job" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      console.error("No job ID provided in context");
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    const contentType = request.headers.get("content-type") || "";
    let bodyData: any = {};
    let uploadedFiles: any[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          const uploadDir = path.join(process.cwd(), "public/uploads");
          await fs.mkdir(uploadDir, { recursive: true });

          const filePath = path.join(uploadDir, value.name);
          const fileBuffer = Buffer.from(await value.arrayBuffer());
          await fs.writeFile(filePath, fileBuffer);

          uploadedFiles.push({ fileName: value.name, fileType: value.type, nextcloudPath: `/uploads/${value.name}` });
        } else {
          bodyData[key] = value;
        }
      }
    } else {
      bodyData = await request.json();
    }

    console.log("Request body:", bodyData);
    if (!bodyData || typeof bodyData !== "object") {
      console.error("Invalid or missing request body:", bodyData);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const {
      confirmationReceived,
      rejectionReceived,
      status,
      dateSubmitted,
      dateOfInterview,
      companyName,
      jobTitle,
      jobDescription,
      jobUrl,
    } = bodyData;

    const updateData: {
      confirmationReceived?: boolean;
      rejectionReceived?: boolean;
      status?: ApplicationStatus;
      companyName?: string;
      jobTitle?: string;
      jobDescription?: string;
      jobUrl?: string;
      dateSubmitted?: Date | null;
      dateOfInterview?: Date | null;
    } = {
      confirmationReceived: confirmationReceived === "true" || confirmationReceived === true,
      rejectionReceived: rejectionReceived === "true" || rejectionReceived === true,
    };

    if (updateData.rejectionReceived === true) {
      updateData.status = "ARCHIVED";
    }

    if (companyName) updateData.companyName = companyName;
    if (jobTitle) updateData.jobTitle = jobTitle;
    if (jobDescription) updateData.jobDescription = jobDescription;
    if (jobUrl) updateData.jobUrl = jobUrl;
    if (status && updateData.rejectionReceived !== true) updateData.status = status;
    if (dateSubmitted)
      updateData.dateSubmitted = parseDate(dateSubmitted, null);
    if (dateOfInterview)
      updateData.dateOfInterview = parseDate(dateOfInterview, null);

    console.log("Update data:", updateData);

    const updatedJob = await prisma.jobApplication.update({
      where: { id },
      data: updateData,
      include: { files: true },
    });

    if (uploadedFiles.length > 0) {
      await prisma.jobFile.createMany({
        data: uploadedFiles.map(file => ({
          fileName: file.fileName,
          fileType: file.fileType,
          nextcloudPath: file.nextcloudPath,
          jobApplicationId: id,
        })),
      });
    }

    const finalJob = await prisma.jobApplication.findUnique({
      where: { id },
      include: { files: true },
    });

    console.log("Updated job from Prisma:", finalJob);

    if (!finalJob) {
      console.error("Prisma update returned null for id:", id);
      return NextResponse.json({ error: "Updated job is null" }, { status: 500 });
    }

    return NextResponse.json(finalJob);
  } catch (error) {
    console.error("Failed to update job:", error);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}

