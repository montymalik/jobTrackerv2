import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: Request) {
  try {
    console.log("GET /api/jobs called");
    const url = new URL(request.url);
    const archivedParam = url.searchParams.get("archived");
    console.log("Archived query param:", archivedParam);
    const filterArchived = archivedParam === "true";
    console.log("Filter archived jobs:", filterArchived);

    const jobs = await prisma.jobApplication.findMany({
      where: filterArchived ? { status: "ARCHIVED" } : {},
      include: {
        files: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
    console.log("Fetched jobs:", jobs);
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Extract job data from form
    const jobData = {
      companyName: formData.get("companyName") as string,
      jobTitle: formData.get("jobTitle") as string,
      jobDescription: formData.get("jobDescription") as string,
      jobUrl: formData.get("jobUrl") as string,
      status:
        (formData.get("status") as
          | "TO_APPLY"
          | "APPLIED"
          | "INTERVIEW_SCHEDULED"
          | "ARCHIVED") || "TO_APPLY",
      hasBeenContacted: false,
      dateSubmitted: formData.get("dateSubmitted")
        ? new Date(formData.get("dateSubmitted") as string + "T00:00:00.000Z")
        : null,
      dateOfInterview: formData.get("dateOfInterview")
        ? new Date(formData.get("dateOfInterview") as string + "T00:00:00.000Z")
        : null,
      confirmationReceived: formData.get("confirmationReceived") === "true",
      rejectionReceived: formData.get("rejectionReceived") === "true",
    };

    // Create job in database
    const job = await prisma.jobApplication.create({
      data: jobData,
    });

    // Handle file uploads
    const files = formData.getAll("files") as File[];
    if (files.length > 0) {
      const filePromises = files.map(async (file) => {
        if (file.size > 0) { // Check if file is not empty
          const path = `/job-tracker/${job.id}/${file.name}`;
          await uploadFile(file, path);
          return prisma.jobFile.create({
            data: {
              fileName: file.name,
              fileType: file.type,
              nextcloudPath: path,
              jobApplicationId: job.id,
            },
          });
        }
      });

      await Promise.all(filePromises.filter(Boolean));
    }

    // Fetch the created job with files
    const createdJob = await prisma.jobApplication.findUnique({
      where: { id: job.id },
      include: { files: true },
    });

    return NextResponse.json(createdJob);
  } catch (error) {
    console.error("Failed to create job:", error);
    return NextResponse.json({ error: "Failed to create job application" }, { status: 500 });
  }
}

