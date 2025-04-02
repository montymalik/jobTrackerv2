// app/lib/formatResumeForExport.ts
import { ResumeSection, ResumeSectionType } from './types';

/**
 * Formats resume sections into a structured markdown document ready for PDF export
 * This serves as a bridge between the resume editor and the PDF exporter
 */
export const formatResumeForExport = (sections: ResumeSection[]): string => {
  // Sort sections in the standard resume order
  const sectionOrder: Record<string, number> = {
    'HEADER': 0,
    'SUMMARY': 1,
    'EXPERIENCE': 2,
    'JOB_ROLE': 3,
    'EDUCATION': 4,
    'SKILLS': 5,
    'CERTIFICATIONS': 6,
    'PROJECTS': 7,
    'OTHER': 8
  };
  
  // Sort sections by type, preserving order within same types
  const sortedSections = [...sections].sort((a, b) => {
    const orderA = sectionOrder[a.type] ?? 999;
    const orderB = sectionOrder[b.type] ?? 999;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // For same types, preserve original order
    return sections.indexOf(a) - sections.indexOf(b);
  });
  
  // Map to collect parent-child relationships
  const parentMap: Record<string, ResumeSection[]> = {};
  
  // Group children by parent IDs
  sections.forEach(section => {
    if (section.parentId) {
      if (!parentMap[section.parentId]) {
        parentMap[section.parentId] = [];
      }
      parentMap[section.parentId].push(section);
    }
  });
  
  // Build the markdown content
  let markdown = '';
  
  // Extract header information
  const header = sortedSections.find(s => s.type === ResumeSectionType.HEADER);
  if (header) {
    // Extract name from h1
    const nameMatch = header.content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (nameMatch && nameMatch[1]) {
      markdown += `# ${stripHtml(nameMatch[1])}\n\n`;
    }
    
    // Extract contact info from paragraph
    const contactMatch = header.content.match(/<p[^>]*>(.*?)<\/p>/i);
    if (contactMatch && contactMatch[1]) {
      markdown += `${stripHtml(contactMatch[1])}\n\n`;
    }
  }
  
  // Process each section
  sortedSections.forEach(section => {
    // Skip header (already processed) and child sections (processed with parents)
    if (section.type === ResumeSectionType.HEADER || section.parentId) {
      return;
    }
    
    // Process section according to type
    switch (section.type) {
      case ResumeSectionType.SUMMARY:
        markdown += processSummarySection(section);
        break;
        
      case ResumeSectionType.EXPERIENCE:
        markdown += processExperienceSection(section, parentMap[section.id] || []);
        break;
        
      case ResumeSectionType.EDUCATION:
        markdown += processEducationSection(section);
        break;
        
      case ResumeSectionType.SKILLS:
        markdown += processSkillsSection(section);
        break;
        
      case ResumeSectionType.CERTIFICATIONS:
        markdown += processCertificationsSection(section);
        break;
        
      case ResumeSectionType.PROJECTS:
      case ResumeSectionType.OTHER:
        markdown += processGenericSection(section);
        break;
        
      case ResumeSectionType.JOB_ROLE:
        // Only process job roles if they don't have a parent
        // (otherwise they're processed with the experience section)
        if (!section.parentId) {
          markdown += processJobRole(section);
        }
        break;
    }
  });
  
  return markdown;
};

/**
 * Process summary section
 */
const processSummarySection = (section: ResumeSection): string => {
  let markdown = `## ${section.title}\n\n`;
  
  // Extract paragraphs from content
  const paragraphs = extractParagraphs(section.content);
  if (paragraphs.length > 0) {
    paragraphs.forEach(p => {
      markdown += `${p}\n\n`;
    });
  } else {
    markdown += `${stripHtml(section.content)}\n\n`;
  }
  
  return markdown;
};

/**
 * Process experience section with job roles
 */
const processExperienceSection = (section: ResumeSection, jobRoles: ResumeSection[]): string => {
  let markdown = `## ${section.title}\n\n`;
  
  // Process each job role
  jobRoles.forEach(role => {
    markdown += processJobRole(role);
  });
  
  return markdown;
};

/**
 * Process a job role section
 */
const processJobRole = (role: ResumeSection): string => {
  let markdown = '';
  
  // Extract job title from h3
  const titleMatch = role.content.match(/<h3[^>]*>(.*?)<\/h3>/i);
  let title = titleMatch ? stripHtml(titleMatch[1]) : role.title;
  
  // Extract company and date info
  const companyMatch = role.content.match(/<p[^>]*>(.*?)<\/p>/i);
  let companyInfo = '';
  
  if (companyMatch && companyMatch[1]) {
    companyInfo = stripHtml(companyMatch[1]);
  }
  
  // Split company and dates if possible
  let company = '';
  let dates = '';
  
  const parts = companyInfo.split('|');
  if (parts.length > 1) {
    company = parts[0].trim();
    dates = parts[1].trim();
    
    // Format in standard way: Company | Job Title | Dates
    markdown += `### ${company} | ${title}\n\n`;
  } else {
    // If no separator, use title as is
    markdown += `### ${title}\n\n`;
    
    // Add company info as a separate line if available
    if (companyInfo) {
      markdown += `${companyInfo}\n\n`;
    }
  }
  
  // Extract bullet points
  const bullets = extractBulletPoints(role.content);
  bullets.forEach(bullet => {
    markdown += `- ${bullet}\n`;
  });
  
  // Add spacing after job
  markdown += '\n';
  
  return markdown;
};

/**
 * Process education section
 */
const processEducationSection = (section: ResumeSection): string => {
  let markdown = `## ${section.title}\n\n`;
  
  // Try to extract structured education entries
  const entries = extractEducationEntries(section.content);
  
  if (entries.length > 0) {
    entries.forEach(entry => {
      markdown += `### ${entry.institution}\n\n`;
      
      if (entry.degree) {
        markdown += `${entry.degree}`;
        
        if (entry.year) {
          markdown += ` | ${entry.year}`;
        }
        
        markdown += '\n\n';
      }
      
      // Add any additional details
      if (entry.details.length > 0) {
        entry.details.forEach(detail => {
          markdown += `- ${detail}\n`;
        });
        markdown += '\n';
      }
    });
  } else {
    // Fallback to extracting paragraphs
    const paragraphs = extractParagraphs(section.content);
    if (paragraphs.length > 0) {
      paragraphs.forEach(p => {
        markdown += `${p}\n\n`;
      });
    } else {
      markdown += `${stripHtml(section.content)}\n\n`;
    }
  }
  
  return markdown;
};

/**
 * Process skills section
 */
const processSkillsSection = (section: ResumeSection): string => {
  let markdown = `## ${section.title}\n\n`;
  
  // Try to extract skill categories
  const categories = extractSkillCategories(section.content);
  
  if (categories.length > 0) {
    categories.forEach(category => {
      markdown += `**${category.name}:** ${category.skills.join(', ')}\n\n`;
    });
  } else {
    // Fallback to extracting paragraphs
    const paragraphs = extractParagraphs(section.content);
    if (paragraphs.length > 0) {
      paragraphs.forEach(p => {
        markdown += `${p}\n\n`;
      });
    } else {
      markdown += `${stripHtml(section.content)}\n\n`;
    }
  }
  
  return markdown;
};

/**
 * Process certifications section
 */
const processCertificationsSection = (section: ResumeSection): string => {
  let markdown = `## ${section.title}\n\n`;
  
  // Extract certification bullets
  const bullets = extractBulletPoints(section.content);
  
  if (bullets.length > 0) {
    bullets.forEach(bullet => {
      markdown += `- ${bullet}\n`;
    });
    markdown += '\n';
  } else {
    // Fallback to extracting paragraphs
    const paragraphs = extractParagraphs(section.content);
    if (paragraphs.length > 0) {
      paragraphs.forEach(p => {
        markdown += `${p}\n\n`;
      });
    } else {
      markdown += `${stripHtml(section.content)}\n\n`;
    }
  }
  
  return markdown;
};

/**
 * Process any generic section
 */
const processGenericSection = (section: ResumeSection): string => {
  let markdown = `## ${section.title}\n\n`;
  
  // Extract bullets first
  const bullets = extractBulletPoints(section.content);
  
  if (bullets.length > 0) {
    bullets.forEach(bullet => {
      markdown += `- ${bullet}\n`;
    });
    markdown += '\n';
  } else {
    // Fallback to extracting paragraphs
    const paragraphs = extractParagraphs(section.content);
    if (paragraphs.length > 0) {
      paragraphs.forEach(p => {
        markdown += `${p}\n\n`;
      });
    } else {
      markdown += `${stripHtml(section.content)}\n\n`;
    }
  }
  
  return markdown;
};

/**
 * Extract paragraphs from HTML content
 */
const extractParagraphs = (html: string): string[] => {
  const paragraphs: string[] = [];
  const matches = html.match(/<p[^>]*>(.*?)<\/p>/gi);
  
  if (matches) {
    matches.forEach(match => {
      const content = stripHtml(match);
      if (content.trim()) {
        paragraphs.push(content);
      }
    });
  }
  
  return paragraphs;
};

/**
 * Extract bullet points from HTML content
 */
const extractBulletPoints = (html: string): string[] => {
  const bullets: string[] = [];
  const matches = html.match(/<li[^>]*>(.*?)<\/li>/gi);
  
  if (matches) {
    matches.forEach(match => {
      const content = stripHtml(match);
      if (content.trim()) {
        bullets.push(content);
      }
    });
  }
  
  // If no li tags found, try detecting bullet markers in text
  if (bullets.length === 0) {
    const textBullets = html.match(/[•\-\*]\s+(.*?)(?=<br|<\/p|<\/div|$)/gi);
    if (textBullets) {
      textBullets.forEach(bullet => {
        // Remove the bullet character
        const content = bullet.replace(/^[•\-\*]\s+/, '');
        if (content.trim()) {
          bullets.push(stripHtml(content));
        }
      });
    }
  }
  
  return bullets;
};

/**
 * Extract education entries from HTML
 */
const extractEducationEntries = (html: string): { 
  institution: string;
  degree?: string;
  year?: string;
  details: string[];
}[] => {
  const entries: { 
    institution: string;
    degree?: string;
    year?: string;
    details: string[];
  }[] = [];
  
  // Try to find education entries with h3 headings
  const h3Matches = html.match(/<h3[^>]*>(.*?)<\/h3>[\s\S]*?(?=<h3|$)/gi);
  
  if (h3Matches && h3Matches.length > 0) {
    h3Matches.forEach(entry => {
      const titleMatch = entry.match(/<h3[^>]*>(.*?)<\/h3>/i);
      if (!titleMatch) return;
      
      const institution = stripHtml(titleMatch[1]);
      
      // Look for degree info in a paragraph
      const degreeMatch = entry.match(/<p[^>]*>(.*?)<\/p>/i);
      let degree;
      let year;
      
      if (degreeMatch) {
        const degreeText = stripHtml(degreeMatch[1]);
        // Try to split degree and year
        const parts = degreeText.split('|');
        if (parts.length > 1) {
          degree = parts[0].trim();
          year = parts[1].trim();
        } else {
          degree = degreeText;
        }
      }
      
      // Get bullet points as details
      const details = extractBulletPoints(entry);
      
      entries.push({
        institution,
        degree,
        year,
        details
      });
    });
  }
  
  return entries;
};

/**
 * Extract skill categories from HTML
 */
const extractSkillCategories = (html: string): {
  name: string;
  skills: string[];
}[] => {
  const categories: {
    name: string;
    skills: string[];
  }[] = [];
  
  // Try to find skill categories with strong or b tags
  const strongMatches = html.match(/(?:<strong[^>]*>|<b[^>]*>)(.*?)(?:<\/strong>|<\/b>)\s*:\s*(.*?)(?=<(?:strong|b|div|p|ul|h))/gi);
  
  if (strongMatches && strongMatches.length > 0) {
    strongMatches.forEach(match => {
      const categoryMatch = match.match(/(?:<strong[^>]*>|<b[^>]*>)(.*?)(?:<\/strong>|<\/b>)\s*:\s*(.*)/i);
      if (!categoryMatch) return;
      
      const name = stripHtml(categoryMatch[1]);
      const skillsText = stripHtml(categoryMatch[2]);
      
      // Split skills by commas
      const skills = skillsText.split(',').map(s => s.trim()).filter(s => s);
      
      categories.push({
        name,
        skills
      });
    });
  }
  
  // If no categories found with strong tags, try h3 sections
  if (categories.length === 0) {
    const h3Matches = html.match(/<h3[^>]*>(.*?)<\/h3>[\s\S]*?(?=<h3|$)/gi);
    
    if (h3Matches && h3Matches.length > 0) {
      h3Matches.forEach(entry => {
        const titleMatch = entry.match(/<h3[^>]*>(.*?)<\/h3>/i);
        if (!titleMatch) return;
        
        const name = stripHtml(titleMatch[1]);
        
        // Look for skills in a paragraph
        const skillsMatch = entry.match(/<p[^>]*>(.*?)<\/p>/i);
        let skills: string[] = [];
        
        if (skillsMatch) {
          const skillsText = stripHtml(skillsMatch[1]);
          // Split skills by commas
          skills = skillsText.split(',').map(s => s.trim()).filter(s => s);
        }
        
        categories.push({
          name,
          skills
        });
      });
    }
  }
  
  return categories;
};

/**
 * Strip HTML tags from a string
 */
const stripHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<\/?[^>]+(>|$)/g, "").trim();
};
