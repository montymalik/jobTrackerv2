import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { 
      id, 
      markdownContent, 
      jsonContent = null,
      contentType = 'markdown'
    } = body;

    // Validate required fields
    if (!id || (!markdownContent && !jsonContent)) {
      return NextResponse.json(
        { message: 'Resume ID and content (markdown or JSON) are required' },
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

    // Prepare data for update
    const updateData: any = {
      updatedAt: new Date()
    };

    // Always update markdown content for backward compatibility
    if (markdownContent) {
      updateData.markdownContent = markdownContent;
    }

    // Update JSON content if provided
    if (jsonContent) {
      updateData.jsonContent = typeof jsonContent === 'string' 
        ? jsonContent 
        : JSON.stringify(jsonContent);
      updateData.contentType = 'json';
    } else {
      updateData.contentType = contentType;
    }

    // Update the resume content
    const updatedResume = await prisma.generatedResume.update({
      where: { id },
      data: updateData,
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
