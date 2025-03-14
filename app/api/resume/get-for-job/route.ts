import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Get the job ID from the URL
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('jobId');

    console.log('Get resumes by job ID request:', jobId);

    if (!jobId) {
      return NextResponse.json(
        { message: 'Job application ID is required' },
        { status: 400 }
      );
    }

    // Log to help with debugging
    console.log('Checking if job exists:', jobId);
    
    // Check if the job application exists
    const jobApplication = await prisma.jobApplication.findUnique({
      where: { id: jobId },
    });

    if (!jobApplication) {
      console.log('Job application not found:', jobId);
      return NextResponse.json(
        { message: 'Job application not found' },
        { status: 404 }
      );
    }

    console.log('Job application found, fetching resumes');

    // Fetch all resumes for this job application, ordered by created date (newest first)
    const resumes = await prisma.generatedResume.findMany({
      where: { jobApplicationId: jobId },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${resumes.length} resumes for job ID: ${jobId}`);

    // Always return a 200 status, even if there are no resumes
    return NextResponse.json(resumes);
  } catch (error) {
    console.error('Error fetching resumes:', error);
    return NextResponse.json(
      { message: 'Failed to fetch resumes', error: String(error) },
      { status: 500 }
    );
  }
}
