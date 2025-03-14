import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { id, markdownContent } = body;

    // Validate required fields
    if (!id || !markdownContent) {
      return NextResponse.json(
        { message: 'Resume ID and markdown content are required' },
        { status: 400 }
      );
    }

    // Check if the resume exists
    const existingResume = await prisma.generatedResume.findUnique({
      where: { id },
    });

    if (!existingResume) {
      return NextResponse.json(
        { message: 'Resume not found' },
        { status: 404 }
      );
    }

    // Update the resume content
    const updatedResume = await prisma.generatedResume.update({
      where: { id },
      data: { 
        markdownContent,
        updatedAt: new Date()
      },
    });

    return NextResponse.json(updatedResume, { status: 200 });
  } catch (error) {
    console.error('Error updating resume:', error);
    return NextResponse.json(
      { message: 'Failed to update resume', error: String(error) },
      { status: 500 }
    );
  }
}
