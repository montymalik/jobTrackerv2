import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { ApplicationStatus } from "@/app/lib/types";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const status = formData.get("status") as ApplicationStatus;

    console.log("Received status:", status); // Log the status
    console.log("Job ID:", params.id); // Log the job ID

    const job = await prisma.jobApplication.update({
      where: { id: params.id },
      data: { status: status },
      include: { files: true },
    });

    console.log("Updated job:", job); // Log the updated job

    return NextResponse.json(job);
  } catch (error) {
    console.error("Failed to update job status:", error);

    // Ensure the error response is always JSON
    return NextResponse.json(
      { error: "Failed to update job status", details: error.message },
      { status: 500 }
    );
  }
}

