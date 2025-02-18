import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { uploadFile } from "@/app/lib/webdav";

export async function GET() {
  try {
    const jobs = await prisma.jobApplication.findMany({
      include: {
        files: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
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
      status: formData.get("status") as "TO_APPLY" | "APPLIED" | "INTERVIEW_SCHEDULED" || "TO_APPLY",
      hasBeenContacted: false,
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
    return NextResponse.json(
      { error: "Failed to create job application" },
      { status: 500 }
    );
  }
}

