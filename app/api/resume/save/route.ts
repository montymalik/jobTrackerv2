import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { jobApplicationId, markdownContent, isPrimary = true, fileName = null, filePath = null } = body;
    
    console.log('Resume save request received:', JSON.stringify(body));

    // Validate required fields
    if (!jobApplicationId || !markdownContent) {
      console.error('Missing required fields. jobApplicationId or markdownContent is undefined');
      return NextResponse.json(
        { message: 'Job application ID and markdown content are required' },
        { status: 400 }
      );
    }

    // Log the job ID to help with debugging
    console.log(`Looking for job application with ID: ${jobApplicationId}`);

    // Check if the job application exists
    const jobApplication = await prisma.jobApplication.findUnique({
      where: { id: jobApplicationId },
    });

    if (!jobApplication) {
      console.error(`Job application with ID ${jobApplicationId} not found`);
      return NextResponse.json(
        { message: 'Job application not found' },
        { status: 404 }
      );
    }

    console.log('Job application found, proceeding with resume creation');

    // If this is set as primary, update any existing resumes for this job to not be primary
    if (isPrimary) {
      await prisma.generatedResume.updateMany({
        where: { jobApplicationId },
        data: { isPrimary: false },
      });
    }

    // Create the new resume
    console.log('Creating new resume record...');
    const newResume = await prisma.generatedResume.create({
      data: {
        jobApplicationId,
        markdownContent,
        isPrimary,
        fileName,
        filePath,
      },
    });

    console.log('Resume created successfully:', newResume.id);
    return NextResponse.json(newResume, { status: 201 });
  } catch (error) {
    console.error('Error saving resume:', error);
    return NextResponse.json(
      { message: 'Failed to save resume', error: String(error) },
      { status: 500 }
    );
  }
}
