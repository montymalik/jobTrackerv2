import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { resumeId, fileName, filePath } = body;

    // Validate required fields
    if (!resumeId || !fileName) {
      return NextResponse.json(
        { message: 'Resume ID and file name are required' },
        { status: 400 }
      );
    }

    // Find the resume
    const resume = await prisma.generatedResume.findUnique({
      where: { id: resumeId }
    });

    if (!resume) {
      return NextResponse.json(
        { message: 'Resume not found' },
        { status: 404 }
      );
    }

    // Update the filename and path
    const updatedResume = await prisma.generatedResume.update({
      where: { id: resumeId },
      data: { 
        fileName,
        filePath: filePath || null
      },
    });

    return NextResponse.json(updatedResume, { status: 200 });
  } catch (error) {
    console.error('Error updating resume filename:', error);
    return NextResponse.json(
      { message: 'Failed to update resume filename', error: String(error) },
      { status: 500 }
    );
  }
}
