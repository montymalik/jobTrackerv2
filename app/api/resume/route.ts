import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { promises as fs } from "fs";
import path from "path";
import mammoth from "mammoth";

// Resume section types
type ResumeSection = {
  title: string;
  content: string;
};

// Structured resume data
interface ParsedResume {
  raw: string;
  sections: ResumeSection[];
  contactInfo: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  education: Array<{
    institution?: string;
    degree?: string;
    date?: string;
  }>;
  experience: Array<{
    company?: string;
    position?: string;
    duration?: string;
    description?: string;
  }>;
  skills: string[];
}

// Regex patterns for finding common resume sections
const SECTION_PATTERNS = {
  CONTACT: /contact|personal info/i,
  EDUCATION: /education|academic|qualification/i,
  EXPERIENCE: /experience|employment|work history|professional/i,
  SKILLS: /skills|expertise|proficiency|competencies/i,
  PROJECTS: /projects|portfolio/i,
  CERTIFICATIONS: /certifications|licenses/i,
  SUMMARY: /summary|profile|objective/i,
};

// Enhanced regex patterns for contact information
const CONTACT_PATTERNS = {
  EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  PHONE: /\b(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b|\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b/,
  LINKEDIN: /linkedin\.com\/in\/[a-zA-Z0-9\-_]{5,30}/i,
  WEBSITE: /https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/i,
};

// Helper function to identify resume sections
function identifySections(text: string): ResumeSection[] {
  // Split by common section headers (multiple line breaks followed by capitalized text)
  const sections: ResumeSection[] = [];
  
  // Simple split by multiple line breaks to find potential section boundaries
  const potentialSections = text.split(/\n{2,}/);
  
  let currentTitle = "Unclassified";
  let currentContent = "";
  
  potentialSections.forEach((section, index) => {
    // Check if this section might be a header
    const lines = section.trim().split("\n");
    if (lines.length === 1 && lines[0].toUpperCase() === lines[0] && lines[0].length < 30) {
      // This looks like a header
      if (currentContent.trim()) {
        sections.push({ title: currentTitle, content: currentContent.trim() });
      }
      currentTitle = lines[0].trim();
      currentContent = "";
    } else {
      // This is content for the current section
      currentContent += section + "\n\n";
    }
  });
  
  // Add the last section
  if (currentContent.trim()) {
    sections.push({ title: currentTitle, content: currentContent.trim() });
  }
  
  return sections;
}

// Enhanced function to extract contact information from resume header
function extractContactInfo(text: string): ParsedResume["contactInfo"] {
  const contactInfo: ParsedResume["contactInfo"] = {};
  
  // Split the text into lines and focus on the first few lines which typically contain header info
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const headerLines = lines.slice(0, Math.min(10, lines.length)); // Focus on first 10 non-empty lines
  
  // The first substantial line is usually the name
  if (headerLines.length > 0) {
    const nameCandidate = headerLines[0];
    // Name heuristic: first line, typically 2-4 words, all words capitalized
    // No email symbols, phone patterns, or very long lines (which might be titles)
    if (nameCandidate.length < 40 && 
        !CONTACT_PATTERNS.EMAIL.test(nameCandidate) && 
        !CONTACT_PATTERNS.PHONE.test(nameCandidate)) {
      contactInfo.name = nameCandidate;
    }
  }
  
  // Join the header lines to search for patterns
  const headerText = headerLines.join(' ');
  
  // Extract email
  const emailMatch = headerText.match(CONTACT_PATTERNS.EMAIL);
  if (emailMatch) contactInfo.email = emailMatch[0];
  
  // Extract phone with improved regex
  const phoneMatch = headerText.match(CONTACT_PATTERNS.PHONE);
  if (phoneMatch) contactInfo.phone = phoneMatch[0];
  
  // Look for location in header lines (typically City, State or City, State ZIP format)
  // Location is often on the same line as phone/email or on a dedicated line
  for (const line of headerLines) {
    // Skip lines that are clearly name, email, or phone
    if (line === contactInfo.name || 
        CONTACT_PATTERNS.EMAIL.test(line) || 
        CONTACT_PATTERNS.PHONE.test(line)) {
      continue;
    }
    
    // Location heuristics: Contains commas, possibly has state abbreviation, no email/phone patterns
    if (line.includes(',') && 
        line.length < 50 && 
        !CONTACT_PATTERNS.EMAIL.test(line) && 
        !CONTACT_PATTERNS.PHONE.test(line)) {
      contactInfo.location = line;
      break;
    }
    
    // Alternative: Look for common location phrases
    if ((/city|state|location|address/i.test(line)) && 
        line.length < 50 && 
        !CONTACT_PATTERNS.EMAIL.test(line) && 
        !CONTACT_PATTERNS.PHONE.test(line)) {
      const parts = line.split(':');
      if (parts.length > 1) {
        contactInfo.location = parts[1].trim();
        break;
      }
    }
  }
  
  // If we couldn't find location with above methods, try identifying a line with city/state pattern
  if (!contactInfo.location) {
    const cityStatePattern = /\b[A-Z][a-z]+(?:[\s-][A-Z][a-z]+)*,\s+[A-Z]{2}\b/;
    for (const line of headerLines) {
      const match = line.match(cityStatePattern);
      if (match) {
        contactInfo.location = match[0];
        break;
      }
    }
  }
  
  return cleanContactInfo(contactInfo);
}

// Additional helper function to clean up extracted contact info
function cleanContactInfo(contactInfo: ParsedResume["contactInfo"]): ParsedResume["contactInfo"] {
  const cleanedInfo = { ...contactInfo };
  
  // Clean name (remove titles, degrees, etc.)
  if (cleanedInfo.name) {
    // Remove common titles and suffixes
    cleanedInfo.name = cleanedInfo.name
      .replace(/^(Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.)\s+/i, '')
      .replace(/,?\s+(PhD|MD|JD|MBA|CPA|PE|Esq\.?)$/i, '')
      .trim();
  }
  
  // Clean email (lowercase)
  if (cleanedInfo.email) {
    cleanedInfo.email = cleanedInfo.email.toLowerCase();
  }
  
  // Clean phone (format consistently)
  if (cleanedInfo.phone) {
    // Remove all non-digit characters first
    const digitsOnly = cleanedInfo.phone.replace(/\D/g, '');
    
    // Format based on length (handle country codes)
    if (digitsOnly.length === 10) {
      // US format: (xxx) xxx-xxxx
      cleanedInfo.phone = `(${digitsOnly.substring(0, 3)}) ${digitsOnly.substring(3, 6)}-${digitsOnly.substring(6)}`;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
      // US with country code: +1 (xxx) xxx-xxxx
      cleanedInfo.phone = `+1 (${digitsOnly.substring(1, 4)}) ${digitsOnly.substring(4, 7)}-${digitsOnly.substring(7)}`;
    }
    // Otherwise keep as is
  }
  
  return cleanedInfo;
}

// Extract skills from text
function extractSkills(text: string): string[] {
  // A simple, non-exhaustive list of common skills to look for
  const skillKeywords = [
    "JavaScript", "TypeScript", "React", "Angular", "Vue", "Node.js", 
    "Python", "Java", "C#", "C++", "Go", "Ruby", "PHP", "Swift", "Kotlin",
    "SQL", "MongoDB", "PostgreSQL", "MySQL", "Oracle", "GraphQL",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Jenkins", "Git",
    "Agile", "Scrum", "Kanban", "Project Management", "Leadership",
    "Communication", "Teamwork", "Problem Solving"
  ];
  
  const skills: string[] = [];
  
  for (const skill of skillKeywords) {
    try {
      // Escape special regex characters in the skill name
      const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
      if (regex.test(text)) {
        skills.push(skill);
      }
    } catch (error) {
      // If there's an error with this skill's regex, log it but continue with other skills
      console.error(`Error checking for skill "${skill}":`, error);
      // Still add the skill if the text includes it (simple fallback)
      if (text.toLowerCase().includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    }
  }
  
  return skills;
}

// Extract education information
function extractEducation(text: string): ParsedResume["education"] {
  const education: ParsedResume["education"] = [];
  
  // Find education section
  const sections = identifySections(text);
  const educationSection = sections.find(section => 
    SECTION_PATTERNS.EDUCATION.test(section.title)
  );
  
  if (educationSection) {
    // Simple parsing - split by line breaks and try to identify education entries
    const lines = educationSection.content.split('\n').filter(line => line.trim().length > 0);
    
    let currentEntry: { institution?: string; degree?: string; date?: string } = {};
    
    for (const line of lines) {
      // Look for dates in the line (common in education entries)
      const dateMatch = line.match(/\b(19|20)\d{2}\b/);
      
      if (dateMatch) {
        // Line contains a year, likely a new entry
        if (currentEntry.institution) {
          education.push(currentEntry);
          currentEntry = {};
        }
        
        currentEntry.date = line.trim();
        
        // Try to extract degree and institution from the same line
        const parts = line.split(',').map(part => part.trim());
        if (parts.length > 1) {
          // First part before comma might be the degree
          if (!currentEntry.degree) {
            currentEntry.degree = parts[0];
          }
          
          // Next part might be the institution
          if (!currentEntry.institution && parts.length > 1) {
            currentEntry.institution = parts[1];
          }
        }
      } else if (!currentEntry.institution && line.length > 10) {
        // Longer line without date might be institution name
        currentEntry.institution = line.trim();
      } else if (!currentEntry.degree && line.length > 5) {
        // Might be degree information
        currentEntry.degree = line.trim();
      }
    }
    
    // Add the last entry
    if (currentEntry.institution) {
      education.push(currentEntry);
    }
  }
  
  return education;
}

// Extract work experience - new function
function extractExperience(text: string): ParsedResume["experience"] {
  const experience: ParsedResume["experience"] = [];
  
  // Find experience section
  const sections = identifySections(text);
  const experienceSection = sections.find(section => 
    SECTION_PATTERNS.EXPERIENCE.test(section.title)
  );
  
  if (experienceSection) {
    // Simple extraction logic - this could be enhanced with more sophisticated parsing
    const lines = experienceSection.content.split('\n').filter(line => line.trim().length > 0);
    
    let currentEntry: { company?: string; position?: string; duration?: string; description?: string } = {};
    let currentDescription = "";
    
    for (const line of lines) {
      // Look for company and position patterns - often contains a hyphen or vertical bar
      if (line.includes(' - ') || line.includes(' | ') || line.includes(' at ')) {
        // This might be a new job entry
        if (currentEntry.company) {
          // Save previous entry
          if (currentDescription) {
            currentEntry.description = currentDescription.trim();
            currentDescription = "";
          }
          experience.push(currentEntry);
          currentEntry = {};
        }
        
        // Parse this line for company and position
        let separator = line.includes(' - ') ? ' - ' : (line.includes(' | ') ? ' | ' : ' at ');
        const parts = line.split(separator);
        
        if (parts.length >= 2) {
          currentEntry.position = parts[0].trim();
          currentEntry.company = parts[1].trim();
          
          // Look for dates in the line
          const dateMatch = line.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s+(-|to|–|—)\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\s+(-|to|–|—)\s+Present\b|\b\d{4}\s+(-|to|–|—)\s+\d{4}\b|\b\d{4}\s+(-|to|–|—)\s+Present\b/i);
          
          if (dateMatch) {
            currentEntry.duration = dateMatch[0].trim();
          }
        }
      } else if (/^\d{4}\s+(-|to|–|—)\s+\d{4}|^\d{4}\s+(-|to|–|—)\s+Present/i.test(line)) {
        // This might be a duration line
        currentEntry.duration = line.trim();
      } else if (currentEntry.company) {
        // This is probably part of the job description
        currentDescription += line + " ";
      }
    }
    
    // Add the last entry
    if (currentEntry.company) {
      if (currentDescription) {
        currentEntry.description = currentDescription.trim();
      }
      experience.push(currentEntry);
    }
  }
  
  return experience;
}

// Updated helper function to parse resume content
async function parseResumeContent(file: File): Promise<ParsedResume> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    let resumeText = '';
    
    // Parse based on file type
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Parse DOCX
      const result = await mammoth.extractRawText({ buffer });
      resumeText = result.value;
    } else if (file.type === 'application/pdf') {
      // For PDFs, we'd use a PDF parsing library like pdf-parse
      // This is a placeholder - you'll need to implement actual PDF parsing
      resumeText = "PDF content would be extracted here";
    } else if (file.type === 'text/plain') {
      // Parse TXT
      resumeText = new TextDecoder().decode(buffer);
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }
    
    if (!resumeText || resumeText.trim().length === 0) {
      throw new Error("Failed to extract text from resume file");
    }
    
    // Initialize default return structure with safe defaults
    const parsedResume: ParsedResume = {
      raw: resumeText,
      sections: [],
      contactInfo: {},
      education: [],
      experience: [],
      skills: []
    };
    
    console.log("Extracted raw text from resume, beginning parsing");
    
    try {
      // Try to parse resume sections
      parsedResume.sections = identifySections(resumeText);
    } catch (sectionError) {
      console.error("Error identifying sections:", sectionError);
      // Fall back to a single unclassified section
      parsedResume.sections = [{ title: "Unclassified", content: resumeText }];
    }
    
    try {
      // Extract contact info using our improved function
      parsedResume.contactInfo = extractContactInfo(resumeText);
      console.log("Extracted contact info:", JSON.stringify(parsedResume.contactInfo));
    } catch (contactError) {
      console.error("Error extracting contact info:", contactError);
    }
    
    try {
      // Extract skills
      parsedResume.skills = extractSkills(resumeText);
    } catch (skillsError) {
      console.error("Error extracting skills:", skillsError);
    }
    
    try {
      // Extract education
      parsedResume.education = extractEducation(resumeText);
    } catch (educationError) {
      console.error("Error extracting education:", educationError);
    }
    
    try {
      // Extract work experience
      parsedResume.experience = extractExperience(resumeText);
    } catch (experienceError) {
      console.error("Error extracting experience:", experienceError);
    }
    
    return parsedResume;
  } catch (error) {
    console.error("Error parsing resume:", error);
    throw error;
  }
}

// GET: Fetch the base resume
export async function GET(request: NextRequest) {
  try {
    // Get the most recent base resume
    const baseResume = await prisma.baseResume.findFirst({
      orderBy: {
        createdAt: 'desc'
      }
    });
    if (!baseResume) {
      return NextResponse.json({ error: "No base resume found" }, { status: 404 });
    }
    return NextResponse.json(baseResume);
  } catch (error) {
    console.error("Error fetching base resume:", error);
    return NextResponse.json({ error: "Error fetching base resume" }, { status: 500 });
  }
}

// POST: Upload and parse a new base resume
export async function POST(request: NextRequest) {
  let savedFilePath: string | null = null;
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
      'application/pdf', // pdf
      'text/plain' // txt
    ];
    
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Please upload a DOCX, PDF, or TXT file." 
      }, { status: 400 });
    }
    // Create directory for storing resumes if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public/uploads/resumes");
    await fs.mkdir(uploadDir, { recursive: true });
    // Generate a unique filename to prevent overwrites
    const fileExtension = path.extname(file.name);
    const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1000)}${fileExtension}`;
    
    // Save the file
    const filePath = path.join(uploadDir, uniqueFileName);
    savedFilePath = filePath;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, fileBuffer);
    // Parse resume content
    let resumeJson: ParsedResume;
    try {
      resumeJson = await parseResumeContent(file);
    } catch (parseError) {
      console.error("Error parsing resume:", parseError);
      
      // Create a minimal valid structure even if parsing fails
      resumeJson = {
        raw: "Failed to parse resume content. Original file is saved and can be viewed manually.",
        sections: [],
        contactInfo: {},
        education: [],
        experience: [],
        skills: []
      };
    }
    
    // Convert the ParsedResume to a plain JavaScript object for Prisma
    const resumeJsonForPrisma = JSON.parse(JSON.stringify(resumeJson));
    
    // Save to database
    const baseResume = await prisma.baseResume.create({
      data: {
        resumeJson: resumeJsonForPrisma,
        fileName: file.name, // Original filename for display
        fileType: file.type,
        filePath: `/uploads/resumes/${uniqueFileName}`, // Path to the saved file
      }
    });
    
    return NextResponse.json({
      id: baseResume.id,
      fileName: baseResume.fileName,
      createdAt: baseResume.createdAt,
      // Include some of the parsed data for confirmation
      contactInfo: (baseResume.resumeJson as any).contactInfo || {},
      skills: (baseResume.resumeJson as any).skills?.length || 0,
      parsingComplete: true
    });
  } catch (error) {
    console.error("Error uploading base resume:", error);
    
    // Clean up the saved file if there was an error after saving it
    if (savedFilePath) {
      try {
        await fs.unlink(savedFilePath);
      } catch (unlinkError) {
        console.error("Error cleaning up file after failure:", unlinkError);
      }
    }
    
    const errorMessage = error instanceof Error ? error.message : "Error uploading base resume";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
