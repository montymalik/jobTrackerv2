import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    const { 
      id, 
      jsonContent,
      contentType = 'json'
    } = body;
    
    // Log key information
    console.log("Processing request:", {
      id,
      contentType,
      jsonContentType: typeof jsonContent,
      jsonContentLength: typeof jsonContent === 'string' ? jsonContent.length : 'not a string'
    });
    
    // Validate required fields - only ID is required
    if (!id) {
      return new NextResponse(
        JSON.stringify({ message: 'Resume ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if the resume exists
    const existingResume = await prisma.generatedResume.findUnique({
      where: { id },
    });
    
    if (!existingResume) {
      return new NextResponse(
        JSON.stringify({ message: 'Resume not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Define the update data with all possible fields upfront
    // Fix: Include jsonContent in the initial type definition
    const updateData: {
      updatedAt: Date;
      contentType: string;
      markdownContent: string;
      jsonContent?: string; // Add this to the type definition
    } = {
      updatedAt: new Date(),
      contentType: contentType,
      markdownContent: "" // Use empty string instead of null
    };
    
    // Process jsonContent
    if (jsonContent !== undefined) {
      if (typeof jsonContent === 'string') {
        updateData.jsonContent = jsonContent;
      } else {
        try {
          updateData.jsonContent = JSON.stringify(jsonContent);
        } catch (e) {
          console.log("Error stringifying jsonContent");
          updateData.jsonContent = JSON.stringify({ error: "Could not process content" });
        }
      }
    }
    
    console.log("About to update resume with data:", {
      id,
      contentType: updateData.contentType,
      markdownContent: updateData.markdownContent,
      jsonContentLength: updateData.jsonContent?.length
    });
    
    // Update the resume content
    const updatedResume = await prisma.generatedResume.update({
      where: { id },
      data: updateData,
    });
    
    console.log("Resume updated successfully");
    
    return new NextResponse(
      JSON.stringify(updatedResume),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.log("Error occurred:", error instanceof Error ? error.message : "Unknown error");
    
    return new NextResponse(
      JSON.stringify({ message: 'Failed to update resume' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
