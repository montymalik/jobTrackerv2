// app/lib/enhanced-section-extraction.ts
import { ResumeSection, ResumeSectionType } from '@/app/lib/types';

/**
 * Maps a raw section title or type string to a valid ResumeSectionType
 */
const mapToSectionType = (rawType: string): ResumeSectionType => {
  // Normalize the input string
  const normalizedType = rawType.trim().toUpperCase();
  
  // Direct matches
  if (["HEADER", "SUMMARY", "EXPERIENCE", "EDUCATION", "SKILLS", 
       "CERTIFICATIONS", "PROJECTS", "OTHER", "JOB_ROLE"].includes(normalizedType)) {
    return normalizedType as ResumeSectionType;
  }
  
  // Summary/Profile variations
  if (normalizedType.includes("SUMMARY") || 
      normalizedType.includes("PROFILE") || 
      normalizedType.includes("OBJECTIVE")) {
    return ResumeSectionType.SUMMARY;
  }
  
  // Experience variations
  if (normalizedType.includes("EXPERIENCE") || 
      normalizedType.includes("EMPLOYMENT") || 
      normalizedType.includes("WORK HISTORY")) {
    return ResumeSectionType.EXPERIENCE;
  }
  
  // Education variations
  if (normalizedType.includes("EDUCATION") || 
      normalizedType.includes("ACADEMIC") || 
      normalizedType.includes("DEGREE")) {
    return ResumeSectionType.EDUCATION;
  }
  
  // Skills variations
  if (normalizedType.includes("SKILL") || 
      normalizedType.includes("COMPETENC") || 
      normalizedType.includes("EXPERTISE")) {
    return ResumeSectionType.SKILLS;
  }
  
  // Certifications variations
  if (normalizedType.includes("CERTIF") || 
      normalizedType.includes("LICENSE") || 
      normalizedType.includes("CREDENTIAL")) {
    return ResumeSectionType.CERTIFICATIONS;
  }
  
  // Projects variations
  if (normalizedType.includes("PROJECT")) {
    return ResumeSectionType.PROJECTS;
  }
  
  // Default to OTHER
  return ResumeSectionType.OTHER;
};

/**
 * Function to manually parse and normalize resume HTML
 * using a more direct approach than DOM manipulation
 */
export const parseResumeHtml = (html: string): ResumeSection[] => {
  const sections: ResumeSection[] = [];
  
  // Step 1: Split HTML into main sections by h2 tags
  const mainSectionRegex = /<h2[^>]*>(.*?)<\/h2>([\s\S]*?)(?=<h2|$)/g;
  let mainSectionMatch;
  
  while ((mainSectionMatch = mainSectionRegex.exec(html)) !== null) {
    const sectionTitle = stripTags(mainSectionMatch[1]);
    const sectionContent = mainSectionMatch[2];
    
    // Determine section type and map to valid ResumeSectionType
    const sectionType = mapToSectionType(determineSectionType(sectionTitle));
    
    if (sectionType === ResumeSectionType.EXPERIENCE) {
      // For experience section, extract the job roles
      const jobRoles = extractJobRoles(sectionContent);
      
      // Add the main experience section
      sections.push({
        id: 'experience',
        title: sectionTitle,
        type: ResumeSectionType.EXPERIENCE,
        content: '<div class="mb-6"><p class="text-gray-200">Professional experience:</p></div>'
      });
      
      // Add each job role as a separate section
      sections.push(...jobRoles);
    } else {
      // For other sections, add them directly
      sections.push({
        id: generateSectionId(sectionType, sectionTitle),
        title: sectionTitle,
        type: sectionType,
        content: sectionContent
      });
    }
  }
  
  // Extract the header section if it exists
  const headerMatch = html.match(/<h1[^>]*>(.*?)<\/h1>([\s\S]*?)(?=<h2|$)/);
  if (headerMatch) {
    const headerTitle = stripTags(headerMatch[1]);
    const headerContent = `<h1 class="text-2xl font-bold">${headerTitle}</h1>${headerMatch[2]}`;
    
    sections.unshift({
      id: 'header',
      title: 'Header',
      type: ResumeSectionType.HEADER,
      content: headerContent
    });
  }
  
  return sections;
};

/**
 * Extract job roles from the experience section content
 */
const extractJobRoles = (experienceContent: string): ResumeSection[] => {
  const jobRoles: ResumeSection[] = [];
  
  // First, correctly identify job roles using h3 tags that aren't within list items
  // This is a more strict regex that won't match h3 tags within li elements
  const jobRoleRegex = /<div[^>]*>[\s\S]*?<h3[^>]*>(.*?)<\/h3>([\s\S]*?)(?=<div[^>]*>[\s\S]*?<h3|$)/g;
  let roleMatch;
  
  while ((roleMatch = jobRoleRegex.exec(experienceContent)) !== null) {
    const roleTitle = stripTags(roleMatch[1]);
    let roleContent = roleMatch[0];
    
    // Clean up any nested roles that might be in the content
    // This is the key step - we're specifically filtering out any potential nested h3 tags inside list items
    roleContent = cleanupRoleContent(roleContent);
    
    jobRoles.push({
      id: `job-role-${Date.now()}-${jobRoles.length}`,
      title: roleTitle,
      type: ResumeSectionType.JOB_ROLE,
      content: roleContent
    });
  }
  
  return jobRoles;
};

/**
 * Clean up the content of a job role to prevent nested role issues
 */
const cleanupRoleContent = (content: string): string => {
  // Replace any h3 tags that are inside list items with strong tags
  return content.replace(
    /(<li[^>]*>[\s\S]*?)(<h3[^>]*>)(.*?)(<\/h3>)([\s\S]*?<\/li>)/g,
    '$1<strong class="text-white">$3:</strong>$5'
  );
};

/**
 * Strip HTML tags from a string
 */
const stripTags = (html: string): string => {
  return html.replace(/<\/?[^>]+(>|$)/g, "");
};

/**
 * Determines section type based on the section title
 */
const determineSectionType = (title: string): string => {
  const normalizedTitle = title.toUpperCase();
  
  if (normalizedTitle.includes('SUMMARY') || normalizedTitle.includes('PROFILE')) {
    return 'SUMMARY';
  } else if (normalizedTitle.includes('EXPERIENCE') || normalizedTitle.includes('EMPLOYMENT')) {
    return 'EXPERIENCE';
  } else if (normalizedTitle.includes('EDUCATION')) {
    return 'EDUCATION';
  } else if (normalizedTitle.includes('SKILLS')) {
    return 'SKILLS';
  } else if (normalizedTitle.includes('CERTIFICATION')) {
    return 'CERTIFICATIONS';
  } else if (normalizedTitle.includes('PROJECT')) {
    return 'PROJECTS';
  } else {
    return 'OTHER';
  }
};

/**
 * Generates a section ID based on type and title
 */
const generateSectionId = (type: ResumeSectionType, title: string): string => {
  if (type === ResumeSectionType.SUMMARY) return 'summary';
  if (type === ResumeSectionType.EDUCATION) return 'education';
  if (type === ResumeSectionType.SKILLS) return 'skills';
  
  // For other sections, create a slug from the title
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + `-${Date.now()}`;
};

/**
 * Pre-process HTML to normalize structure before parsing
 * This is especially useful for fixing common LLM output issues
 */
export const normalizeResumeHtml = (html: string): string => {
  let normalized = html;
  
  // Replace h3 tags inside list items with strong tags
  normalized = normalized.replace(
    /(<li[^>]*>[\s\S]*?)(<h3[^>]*>)(.*?)(<\/h3>)([\s\S]*?<\/li>)/g,
    '$1<strong class="text-white">$3:</strong>$5'
  );
  
  // Replace any list items that start with a title pattern like "Leadership:" (without h3)
  normalized = normalized.replace(
    /(<li[^>]*>)([^<:]+:)([^<]*<\/li>)/g,
    '$1<strong class="text-white">$2</strong>$3'
  );
  
  // Ensure job roles are properly wrapped in div.mb-4
  normalized = normalized.replace(
    /(<h3[^>]*>[\s\S]*?)(?=<h3|<h2|$)/g,
    (match) => {
      if (!match.includes('<div class="mb-4">')) {
        return `<div class="mb-4">${match}</div>`;
      }
      return match;
    }
  );
  
  return normalized;
};
