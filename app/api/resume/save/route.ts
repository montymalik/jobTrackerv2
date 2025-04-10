import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { 
      jobApplicationId, 
      markdownContent, 
      jsonContent = null, // Add support for JSON content
      isPrimary = true, 
      fileName = null, 
      filePath = null 
    } = body;
    
    console.log('Resume save request received:', {
      jobApplicationId,
      contentType: jsonContent ? 'JSON' : 'Markdown',
      contentLength: jsonContent ? JSON.stringify(jsonContent).length : markdownContent?.length,
      isPrimary,
      fileName
    });

    // Validate required fields - either markdown or JSON content is required
    if (!jobApplicationId || (!markdownContent && !jsonContent)) {
      console.error('Missing required fields. jobApplicationId or content is undefined');
      return NextResponse.json(
        { message: 'Job application ID and content (markdown or JSON) are required' },
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

    // Prepare data for saving
    let dataToSave;
    
    if (jsonContent) {
      // If JSON content is provided, use it and also generate a markdown preview
      const markdownPreview = typeof jsonContent === 'string' 
        ? jsonContent 
        : generateMarkdownPreview(jsonContent);
      
      dataToSave = {
        jobApplicationId,
        markdownContent: markdownPreview,
        jsonContent: typeof jsonContent === 'string' ? jsonContent : JSON.stringify(jsonContent),
        isPrimary,
        fileName: fileName || `Resume_${jobApplication.companyName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`,
        filePath,
        contentType: 'json'
      };
    } else {
      // If only markdown content is provided, use that
      dataToSave = {
        jobApplicationId,
        markdownContent,
        isPrimary,
        fileName,
        filePath,
        contentType: 'markdown'
      };
    }

    // Create the new resume
    console.log('Creating new resume record...');
    const newResume = await prisma.generatedResume.create({
      data: dataToSave,
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

// Helper function to generate a simple markdown preview from JSON content
function generateMarkdownPreview(json: any): string {
  try {
    let markdown = '';

    // Extract name and contact info from header if available
    if (json.header) {
      const { name, email, phone, location } = json.header;
      markdown += `# ${name || 'Your Name'}\n`;
      
      const contactInfo = [];
      if (email) contactInfo.push(email);
      if (phone) contactInfo.push(phone);
      if (location) contactInfo.push(location);
      
      if (contactInfo.length > 0) {
        markdown += `${contactInfo.join(' | ')}\n\n`;
      }
    } else if (json.personalInfo) {
      const { name, email, phone, location } = json.personalInfo;
      markdown += `# ${name || 'Your Name'}\n`;
      
      const contactInfo = [];
      if (email) contactInfo.push(email);
      if (phone) contactInfo.push(phone);
      if (location) contactInfo.push(location);
      
      if (contactInfo.length > 0) {
        markdown += `${contactInfo.join(' | ')}\n\n`;
      }
    }

    // Add summary
    if (json.summary) {
      markdown += `## Professional Summary\n\n${json.summary}\n\n`;
    }

    // Add experience
    if (json.experience && json.experience.length > 0) {
      markdown += `## Professional Experience\n\n`;
      
      json.experience.forEach((exp: any) => {
        const title = exp.title || exp.position;
        const company = exp.company;
        const dateRange = exp.dateRange || exp.duration || exp.dates;
        
        markdown += `### ${title}\n${company} | ${dateRange}\n\n`;
        
        const bullets = exp.bullets || exp.achievements || [];
        bullets.forEach((bullet: string) => {
          markdown += `- ${bullet}\n`;
        });
        
        markdown += '\n';
      });
    }

    // Add education
    if (json.education && json.education.length > 0) {
      markdown += `## Education\n\n`;
      
      json.education.forEach((edu: any) => {
        const degree = edu.degree;
        const institution = edu.institution;
        const year = edu.year || edu.date || edu.dates;
        
        markdown += `${degree}\n${institution} | ${year}\n\n`;
      });
    }

    // Add skills - handle both formats (array and object)
    if (json.skills) {
      markdown += `## Skills\n\n`;
      
      if (Array.isArray(json.skills)) {
        markdown += json.skills.join(', ') + '\n\n';
      } else if (typeof json.skills === 'object') {
        for (const [category, skillsList] of Object.entries(json.skills)) {
          if (Array.isArray(skillsList) && skillsList.length > 0) {
            markdown += `**${category.charAt(0).toUpperCase() + category.slice(1)}:** ${(skillsList as string[]).join(', ')}\n\n`;
          }
        }
      }
    }

    // Add certifications if available
    if (json.certifications && json.certifications.length > 0) {
      markdown += `## Certifications\n\n`;
      
      json.certifications.forEach((cert: any) => {
        const certName = typeof cert === 'string' ? cert : (cert.name || cert.title);
        markdown += `- ${certName}\n`;
      });
      
      markdown += '\n';
    }

    return markdown;
  } catch (e) {
    console.error('Error generating markdown preview:', e);
    return 'Error generating markdown preview. Please view the JSON content.';
  }
}
