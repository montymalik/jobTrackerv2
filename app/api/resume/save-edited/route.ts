// app/api/resume/save-edited/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { ResumeSection } from '@/app/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { jobId, sections, resumeId } = body;
    
    console.log('Save edited resume request received:', { jobId, resumeId, sectionsCount: sections?.length });

    // Validate required fields
    if (!jobId || !sections || !Array.isArray(sections)) {
      console.error('Missing or invalid required fields');
      return NextResponse.json(
        { message: 'Job ID and resume sections are required' },
        { status: 400 }
      );
    }

    // Check if the job application exists
    const jobApplication = await prisma.jobApplication.findUnique({
      where: { id: jobId },
    });

    if (!jobApplication) {
      console.error(`Job application with ID ${jobId} not found`);
      return NextResponse.json(
        { message: 'Job application not found' },
        { status: 404 }
      );
    }

    // Convert sections to markdown content
    const markdownContent = sectionsToMarkdown(sections);
    
    let result;
    
    // If resumeId is provided, update existing resume
    if (resumeId) {
      // Check if the resume exists
      const existingResume = await prisma.generatedResume.findUnique({
        where: { id: resumeId },
      });
      
      if (!existingResume) {
        console.error(`Resume with ID ${resumeId} not found`);
        return NextResponse.json(
          { message: 'Resume not found' },
          { status: 404 }
        );
      }
      
      // Update the existing resume
      result = await prisma.generatedResume.update({
        where: { id: resumeId },
        data: { 
          markdownContent,
          updatedAt: new Date()
        },
      });
      
      console.log('Resume updated successfully:', result.id);
    } 
    // Otherwise create a new resume
    else {
      // If this is a new resume, check if we should make it primary
      // Count existing resumes for this job
      const existingResumesCount = await prisma.generatedResume.count({
        where: { jobApplicationId: jobId }
      });
      
      // If no existing resumes, make this one primary
      const isPrimary = existingResumesCount === 0;
      
      // Create a new resume
      result = await prisma.generatedResume.create({
        data: {
          markdownContent,
          jobApplicationId: jobId,
          isPrimary,
          version: existingResumesCount + 1,
          fileName: `Resume_${jobApplication.companyName.replace(/\s+/g, '_')}_v${existingResumesCount + 1}`,
        },
      });
      
      console.log('New resume created successfully:', result.id);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error saving edited resume:', error);
    return NextResponse.json(
      { message: 'Failed to save resume', error: String(error) },
      { status: 500 }
    );
  }
}

// Helper function to convert sections to markdown
function sectionsToMarkdown(sections: ResumeSection[]): string {
  return sections.map(section => {
    if (section.type === 'HEADER') {
      // Headers usually don't have titles in the markdown
      return section.content.trim();
    } else {
      // For other sections, include the title as a section header
      return `## ${section.title}\n\n${section.content.trim()}`;
    }
  }).join('\n\n');
}
