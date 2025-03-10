import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Fetch the base resume from the database
    // Since there's only one resume in the system, we'll get the most recently updated one
    const baseResume = await prisma.baseResume.findFirst({
      orderBy: {
        updatedAt: 'desc' // Get the most recently updated resume
      }
    });
    
    if (!baseResume || !baseResume.resumeJson) {
      console.log('Base resume not found in database, returning default template');
      return NextResponse.json({
        personalInfo: {
          name: "Your Name",
          email: "your.email@example.com",
          phone: "(123) 456-7890",
          location: "City, State"
        },
        summary: "Professional summary...",
        experience: [
          {
            title: "Job Title",
            company: "Company Name",
            dates: "Jan 2020 - Present",
            achievements: ["Achievement 1", "Achievement 2"]
          }
        ],
        education: [
          {
            degree: "Degree",
            institution: "University Name",
            dates: "2014-2018"
          }
        ],
        skills: ["Skill 1", "Skill 2", "Skill 3"]
      });
    }
    
    // The resumeJson field should already be in JSON format as defined in the schema
    // We don't need to parse it, just return it directly
    return NextResponse.json(baseResume.resumeJson);
    
  } catch (error) {
    console.error('Error fetching base resume from database:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch resume data' },
      { status: 500 }
    );
  }
}
