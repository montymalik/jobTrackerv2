import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { ApplicationStatus } from "@/app/lib/types";

// Helper to parse dates
const parseDate = (dateStr: string | null, fallback: Date | null) => {
  if (!dateStr) return fallback;
  return new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00.000Z");
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    console.log("Form Data Received:", Object.fromEntries(formData.entries()));

    // Extract values from formData
    const companyName = formData.get("companyName") as string;
    const jobTitle = formData.get("jobTitle") as string;
    const jobDescription = formData.get("jobDescription") as string;
    const jobUrl = formData.get("jobUrl") as string;
    const status = formData.get("status") as ApplicationStatus;
    const dateSubmitted = formData.get("dateSubmitted") as string | null;
    const dateOfInterview = formData.get("dateOfInterview") as string | null;
    const confirmationReceived = formData.get("confirmationReceived") === "true";

    // Fetch the existing job from the database
    const existingJob = await prisma.jobApplication.findUnique({
      where: { id },
    });

    if (!existingJob) {
      return NextResponse.json(
        { error: "Job application not found" },
        { status: 404 }
      );
    }

    // Prepare the job data for update, using the helper for dates
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
      dateSubmitted: parseDate(dateSubmitted, existingJob.dateSubmitted),
      dateOfInterview: parseDate(dateOfInterview, existingJob.dateOfInterview),
      confirmationReceived:
        confirmationReceived !== undefined ? confirmationReceived : existingJob.confirmationReceived,
    };

    console.log("Job Data to Update:", jobData);

    // Update the job in the database
    const job = await prisma.jobApplication.update({
      where: { id },
      data: jobData,
      include: { files: true },
    });

    console.log("Updated Job:", job);
    return NextResponse.json(job);
  } catch (error: any) {
    console.error("Failed to update job status:", error);
    let message = "Unknown error";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
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

