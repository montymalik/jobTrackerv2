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
    } = {};

    if (companyName) {
      jobData.companyName = companyName;
    }
    if (jobTitle) {
      jobData.jobTitle = jobTitle;
    }
    if (jobDescription) {
      jobData.jobDescription = jobDescription;
    }
    if (jobUrl) {
      jobData.jobUrl = jobUrl;
    }
    if (status) {
      jobData.status = status;
    }
    if (dateSubmitted) {
      jobData.dateSubmitted = dateSubmitted && dateSubmitted.trim() !== "" ? new Date(dateSubmitted) : null;
    } else {
      jobData.dateSubmitted = null;
    }
    if (dateOfInterview) {
      jobData.dateOfInterview = dateOfInterview && dateOfInterview.trim() !== "" ? new Date(dateOfInterview) : null;
    } else {
      jobData.dateOfInterview = null;
    }
    jobData.confirmationReceived = confirmationReceived;

    console.log("Job Data to Update:", jobData);

    // Update the job in the database, including the related files if needed
    const job = await prisma.jobApplication.update({
      where: { id },
      data: jobData,
      include: { files: true },
    });

    console.log("Updated Job:", job);

    return NextResponse.json(job);
  } catch (error) {
    console.error("Failed to update job status:", error);
    return NextResponse.json(
      { error: "Failed to update job status", details: error.message },
      { status: 500 }
    );
  }
}

