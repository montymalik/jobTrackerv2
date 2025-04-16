// app/components/resume/builder/utils/resumeParser.ts
import { ResumeSection } from '@/app/lib/types';

export interface ParsedJobRole {
  id: string;
  title: string;
  company: string;
  dateRange: string;
  bulletPoints: string[];
}

/**
 * Extract structured job role data from HTML content
 */
export function parseJobRole(jobRoleSection: ResumeSection): ParsedJobRole {
  let title = jobRoleSection.title || '';
  let company = '';
  let dateRange = '';
  let bulletPoints: string[] = [];
  
  // Extract title from h3 tag if it exists
  const titleMatch = jobRoleSection.content.match(/<h3[^>]*>(.*?)<\/h3>/i);
  if (titleMatch && titleMatch[1]) {
    title = stripHtml(titleMatch[1]).trim();
  }
  
  // Extract company and date from p tag
  const companyMatch = jobRoleSection.content.match(/<p[^>]*>(.*?)<\/p>/i);
  if (companyMatch && companyMatch[1]) {
    const parts = stripHtml(companyMatch[1]).split('|');
    if (parts.length >= 2) {
      company = parts[0].trim();
      dateRange = parts[1].trim();
    } else {
      company = companyMatch[1].trim();
    }
  }
  
  // Extract bullet points
  const bulletMatches = jobRoleSection.content.match(/<li[^>]*>(.*?)<\/li>/gi);
  if (bulletMatches) {
    bulletPoints = bulletMatches.map(li => {
      const content = li.replace(/<li[^>]*>(.*?)<\/li>/i, '$1');
      return content.trim();
    });
  }
  
  return {
    id: jobRoleSection.id,
    title,
    company,
    dateRange,
    bulletPoints
  };
}

/**
 * Parse experience sections and their job roles into structured data
 */
export function parseExperienceSections(sections: ResumeSection[]): {
  experienceSections: ResumeSection[];
  jobRolesByParent: Record<string, ParsedJobRole[]>;
} {
  // Get all experience sections
  const experienceSections = sections.filter(section => 
    (section.type === 'EXPERIENCE' || section.title.toLowerCase().includes('experience')) &&
    section.type !== 'HEADER' && 
    section.type !== 'SUMMARY' && 
    section.type !== 'EDUCATION'
  );
  
  // Get job roles and organize them by parent section
  const jobRolesByParent: Record<string, ParsedJobRole[]> = {};
  
  experienceSections.forEach(expSection => {
    // Find job roles that belong to this experience section
    const jobRoles = sections.filter(section => 
      section.parentId === expSection.id && 
      section.type === 'JOB_ROLE'
    );
    
    // Parse each job role into structured data
    if (jobRoles.length > 0) {
      jobRolesByParent[expSection.id] = jobRoles.map(parseJobRole);
    }
  });
  
  return { experienceSections, jobRolesByParent };
}

/**
 * Helper to strip HTML tags
 */
function stripHtml(html: string): string {
  return html.replace(/<\/?[^>]+(>|$)/g, '');
}
