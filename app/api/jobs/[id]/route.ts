export const dynamic = "force-dynamic"; // if necessary

import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { ApplicationStatus } from "@/app/lib/types";

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
      confirmationReceived: confirmationReceived !== undefined ? confirmationReceived : existingJob.confirmationReceived,
    };

    if (dateSubmitted !== null && dateSubmitted !== undefined) {
      jobData.dateSubmitted = dateSubmitted === "" ? null : new Date(dateSubmitted);
    } else {
      jobData.dateSubmitted = existingJob.dateSubmitted;
    }

    if (dateOfInterview !== null && dateOfInterview !== undefined) {
      jobData.dateOfInterview = dateOfInterview === "" ? null : new Date(dateOfInterview);
    } else {
      jobData.dateOfInterview = existingJob.dateOfInterview;
    }

    console.log("Job Data to Update:", jobData);

    // Update the job in the database, including the related files if needed
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

