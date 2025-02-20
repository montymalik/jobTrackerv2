export const dynamic = "force-dynamic"; // if necessary

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { ApplicationStatus } from "@/app/lib/types";
import { promises as fs } from 'fs';
import path from 'path';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Await or destructure the id from params (make sure this works for your Next.js version)
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    // Log the form data for debugging
    console.log("Form Data Received:", Object.fromEntries(formData.entries()));

    // Extract all the values from the form data
    const companyName = formData.get("companyName") as string;
    const jobTitle = formData.get("jobTitle") as string;
    const jobDescription = formData.get("jobDescription") as string;
    const jobUrl = formData.get("jobUrl") as string;
    const status = formData.get("status") as ApplicationStatus;
    const dateSubmitted = formData.get("dateSubmitted") as string | null;
    const dateOfInterview = formData.get("dateOfInterview") as string | null;
    const confirmationReceived = formData.get("confirmationReceived") === "true";

    // Fetch the existing job data from the database
    const existingJob = await prisma.jobApplication.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: "Job application not found" },
        { status: 404 }
      );
    }

    // Prepare the job data for the update
    const jobData: {
      companyName?: string;
      jobTitle?: string;
      jobDescription?: string;
      jobUrl?: string;
      status?: ApplicationStatus;
      dateSubmitted?: Date | null;
      dateOfInterview?: Date | null;
      confirmationReceived?: boolean;
    } = {
      companyName: companyName || existingJob.companyName,
      jobTitle: jobTitle || existingJob.jobTitle,
      jobDescription: jobDescription || existingJob.jobDescription,
      jobUrl: jobUrl || existingJob.jobUrl,
      status: status || existingJob.status,
      dateSubmitted: dateSubmitted ? new Date(dateSubmitted + "T00:00:00.000Z") : existingJob.dateSubmitted,
      dateOfInterview: dateOfInterview ? new Date(dateOfInterview + "T00:00:00.000Z") : existingJob.dateOfInterview,
      confirmationReceived: confirmationReceived !== undefined ? confirmationReceived : existingJob.confirmationReceived,
    };

    console.log("Job Data to Update:", jobData);

    // Update the job in the database, including the related files if needed
    const job = await prisma.jobApplication.update({
      where: { id },
      data: jobData,
      include: { files: true },
    });

    // Handle file uploads
    const files = formData.getAll("files") as File[];
    const filePaths = [];
    if (files.length > 0) {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', job.id);
      await fs.mkdir(uploadDir, { recursive: true });

      for (const file of files) {
        if (file.size > 0) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const filePath = path.join(uploadDir, file.name);
          await fs.writeFile(filePath, buffer);
          filePaths.push(`/uploads/${job.id}/${file.name}`);
        }
      }
    }

    // Update job with file paths
    const updatedJob = await prisma.jobApplication.update({
      where: { id },
      data: {
        files: {
          create: filePaths.map(filePath => ({
            fileName: path.basename(filePath),
            fileType: path.extname(filePath),
            nextcloudPath: filePath, // Use filePath as nextcloudPath
          })),
        },
      },
      include: {
        files: true,
      },
    });

    console.log("Updated Job:", updatedJob);

    return NextResponse.json(updatedJob);
  } catch (error: any) {
    console.error("Failed to update job status:", error);
    let message = "Unknown error";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else {
      try {
        message = JSON.stringify(error);
      } catch (stringifyError) {
        message = "Failed to stringify error";
      }
    }

    return new NextResponse(JSON.stringify({ error: "Failed to update job status", details: message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

