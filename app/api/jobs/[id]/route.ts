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

    const jobData = {
      status: status,
      dateSubmitted: formData.get("dateSubmitted") ? new Date(formData.get("dateSubmitted") as string) : null,
      dateOfInterview: formData.get("dateOfInterview") ? new Date(formData.get("dateOfInterview") as string) : null,
      confirmationReceived: formData.get("confirmationReceived") === "true",
    };

    const job = await prisma.jobApplication.update({
      where: { id: params.id },
      data: jobData,
      include: { files: true },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("Failed to update job status:", error);
    return NextResponse.json(
      { error: "Failed to update job status", details: error.message },
      { status: 500 }
    );
  }
}

