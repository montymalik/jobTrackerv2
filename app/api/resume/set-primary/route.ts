import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { resumeId } = body;

    if (!resumeId) {
      return NextResponse.json(
        { message: 'Resume ID is required' },
        { status: 400 }
      );
    }

    // Get the resume to determine the job application ID
    const resume = await prisma.generatedResume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      return NextResponse.json(
        { message: 'Resume not found' },
        { status: 404 }
      );
    }

    // Set all resumes for this job application as not primary
    await prisma.generatedResume.updateMany({
      where: { jobApplicationId: resume.jobApplicationId },
      data: { isPrimary: false },
    });

    // Set the selected resume as primary
    const updatedResume = await prisma.generatedResume.update({
      where: { id: resumeId },
      data: { isPrimary: true },
    });

    return NextResponse.json(updatedResume, { status: 200 });
  } catch (error) {
    console.error('Error setting primary resume:', error);
    return NextResponse.json(
      { message: 'Failed to set primary resume', error: String(error) },
      { status: 500 }
    );
  }
}
