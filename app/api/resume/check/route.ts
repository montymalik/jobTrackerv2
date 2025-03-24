import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This API route checks if a resume exists and returns it if found
export async function GET(request: NextRequest) {
  try {
    // Get the resume ID from the URL
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    console.log('Checking if resume exists:', id);
    
    if (!id) {
      return NextResponse.json(
        { message: 'Resume ID is required' },
        { status: 400 }
      );
    }
    
    // Try to find the resume in the database
    const resume = await prisma.generatedResume.findUnique({
      where: { id },
      include: {
        jobApplication: true // Include the associated job application
      }
    });
    
    if (!resume) {
      console.log('Resume not found:', id);
      return NextResponse.json(
        { found: false, message: 'Resume not found' },
        { status: 200 } // Use 200 to indicate the check was successful, even if not found
      );
    }
    
    console.log('Resume found in database:', id);
    
    // If found, also get the job description if available
    let jobDescription = null;
    if (resume.jobApplication) {
      jobDescription = resume.jobApplication.jobDescription;
    }
    
    return NextResponse.json({
      found: true,
      resume: {
        ...resume,
        jobDescription
      }
    });
  } catch (error) {
    console.error('Error checking resume:', error);
    return NextResponse.json(
      { message: 'Failed to check resume', error: String(error) },
      { status: 500 }
    );
  }
}
