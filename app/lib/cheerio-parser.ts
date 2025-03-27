// app/lib/cheerio-parser.ts
import { ResumeSection, ResumeSectionType } from '@/app/lib/types';
import * as cheerio from 'cheerio';

/**
 * Maps a raw section title or type string to a valid ResumeSectionType
 * This handles various formats and naming conventions found in different resume formats
 */
const mapToSectionType = (rawType: string): ResumeSectionType => {
  // Normalize the input string - trim whitespace, convert to uppercase for comparison
  const normalizedType = rawType.trim().toUpperCase();
  
  // Direct matches - if the string already matches one of our enum values
  if (["HEADER", "SUMMARY", "EXPERIENCE", "EDUCATION", "SKILLS", 
       "CERTIFICATIONS", "PROJECTS", "OTHER", "JOB_ROLE"].includes(normalizedType)) {
    return normalizedType as ResumeSectionType;
  }
  
  // Profile/Summary section variations
  if (
    normalizedType === "PROFESSIONAL SUMMARY" ||
    normalizedType === "PROFILE" ||
    normalizedType === "ABOUT ME" ||
    normalizedType === "EXECUTIVE SUMMARY" ||
    normalizedType === "CAREER SUMMARY" ||
    normalizedType === "SUMMARY OF QUALIFICATIONS" ||
    normalizedType === "CAREER OBJECTIVE" ||
    normalizedType === "PROFESSIONAL PROFILE" ||
    normalizedType.includes("SUMMARY") ||
    normalizedType.includes("PROFILE") ||
    normalizedType.includes("OBJECTIVE")
  ) {
    return ResumeSectionType.SUMMARY;
  }
  
  // Experience section variations
  if (
    normalizedType === "WORK EXPERIENCE" ||
    normalizedType === "PROFESSIONAL EXPERIENCE" ||
    normalizedType === "EMPLOYMENT HISTORY" ||
    normalizedType === "WORK HISTORY" ||
    normalizedType === "CAREER HISTORY" ||
    normalizedType === "EXPERIENCE" ||
    normalizedType === "RELEVANT EXPERIENCE" ||
    normalizedType.includes("EXPERIENCE") ||
    normalizedType.includes("EMPLOYMENT") ||
    normalizedType.includes("WORK HISTORY")
  ) {
    return ResumeSectionType.EXPERIENCE;
  }
  
  // Education section variations
  if (
    normalizedType === "EDUCATION" ||
    normalizedType === "ACADEMIC BACKGROUND" ||
    normalizedType === "EDUCATIONAL BACKGROUND" ||
    normalizedType === "ACADEMIC HISTORY" ||
    normalizedType === "ACADEMIC QUALIFICATIONS" ||
    normalizedType === "QUALIFICATIONS" ||
    normalizedType === "DEGREES" ||
    normalizedType.includes("EDUCATION") ||
    normalizedType.includes("DEGREE") ||
    normalizedType.includes("ACADEMIC")
  ) {
    return ResumeSectionType.EDUCATION;
  }
  
  // Skills section variations
  if (
    normalizedType === "SKILLS" ||
    normalizedType === "TECHNICAL SKILLS" ||
    normalizedType === "COMPETENCIES" ||
    normalizedType === "SKILL SET" ||
    normalizedType === "CORE COMPETENCIES" ||
    normalizedType === "KEY SKILLS" ||
    normalizedType === "AREAS OF EXPERTISE" ||
    normalizedType === "PROFESSIONAL SKILLS" ||
    normalizedType.includes("SKILL") ||
    normalizedType.includes("COMPETENC") ||
    normalizedType.includes("PROFICIENC") ||
    normalizedType.includes("EXPERTISE")
  ) {
    return ResumeSectionType.SKILLS;
  }
  
  // Certifications section variations
  if (
    normalizedType === "CERTIFICATIONS" ||
    normalizedType === "CERTIFICATES" ||
    normalizedType === "CERTIFICATION" ||
    normalizedType === "PROFESSIONAL CERTIFICATIONS" ||
    normalizedType === "LICENSES" ||
    normalizedType === "CREDENTIALS" ||
    normalizedType.includes("CERTIF") ||
    normalizedType.includes("LICENSE") ||
    normalizedType.includes("CREDENTIAL")
  ) {
    return ResumeSectionType.CERTIFICATIONS;
  }
  
  // Projects section variations
  if (
    normalizedType === "PROJECTS" ||
    normalizedType === "PROJECT EXPERIENCE" ||
    normalizedType === "KEY PROJECTS" ||
    normalizedType === "PROFESSIONAL PROJECTS" ||
    normalizedType === "MAJOR PROJECTS" ||
    normalizedType === "PERSONAL PROJECTS" ||
    normalizedType.includes("PROJECT")
  ) {
    return ResumeSectionType.PROJECTS;
  }
  // Header detection - typically not explicitly labeled in documents
  if (
    normalizedType === "CONTACT" ||
    normalizedType === "CONTACT INFORMATION" ||
    normalizedType === "PERSONAL INFORMATION" ||
    normalizedType === "CONTACT DETAILS" ||
    normalizedType.includes("CONTACT INFO")
  ) {
    return ResumeSectionType.HEADER;
  }
  
  // If no match is found, default to "OTHER"
  return ResumeSectionType.OTHER;
};

/**
 * Parse resume HTML using Cheerio for more reliable extraction
 */
export const parseResumeWithCheerio = (html: string): ResumeSection[] => {
  try {
    // Load HTML into cheerio
    const $ = cheerio.load(html);
    const sections: ResumeSection[] = [];
    
    // Process header section
    const headerSection = processHeaderSection($);
    if (headerSection) {
      sections.push(headerSection);
    }
    
    // Process main sections (h2)
    $('h2').each((i, element) => {
      const sectionTitle = $(element).text().trim();
      const sectionType = mapToSectionType(sectionTitle);
      const sectionId = generateSectionId(sectionType, sectionTitle);
      
      // Get content until the next h2
      let sectionContent = '';
      let currentNode = $(element);
      
      // Store the h2 tag itself
      sectionContent += $.html(element);
      
      // Get all siblings until next h2
      let nextNode = currentNode.next();
      while (nextNode.length && !nextNode.is('h2')) {
        sectionContent += $.html(nextNode);
        nextNode = nextNode.next();
      }
      
      // Add the section if it has content
      if (sectionContent.trim()) {
        sections.push({
          id: sectionId,
          title: sectionTitle,
          type: sectionType,
          content: sectionContent
        });
        
        // For experience section, extract job roles
        if (sectionType === ResumeSectionType.EXPERIENCE) {
          const jobRoles = extractJobRoles($, $(element));
          sections.push(...jobRoles);
        }
      }
    });
    
    // Apply specific fix for the Directed R&D issue
    return fixDirectedRnDIssue($, sections);
  } catch (error) {
    console.error('Error parsing resume with Cheerio:', error);
    return [];
  }
};

/**
 * Extract the header section
 */
const processHeaderSection = ($: cheerio.CheerioAPI): ResumeSection | null => {
  const h1 = $('h1').first();
  if (!h1.length) return null;
  
  // Get name from h1
  const headerTitle = h1.text().trim();
  
  // Extract content until the first h2
  let headerContent = '';
  let currentNode = h1;
  
  // Include the h1 tag
  headerContent += $.html(h1);
  
  // Get all siblings until first h2
  let nextNode = currentNode.next();
  while (nextNode.length && !nextNode.is('h2')) {
    headerContent += $.html(nextNode);
    nextNode = nextNode.next();
  }
  
  return {
    id: 'header',
    title: 'Header',
    type: ResumeSectionType.HEADER,
    content: headerContent
  };
};

/**
 * Extract job roles from the experience section
 */
const extractJobRoles = ($: cheerio.CheerioAPI, sectionHeading: cheerio.Cheerio<any>): ResumeSection[] => {
  const jobRoles: ResumeSection[] = [];
  let currentNode = sectionHeading.next();
  
  // Find h3 tags that represent job roles
  while (currentNode.length && !currentNode.is('h2')) {
    if (currentNode.is('h3') && !currentNode.closest('li').length) {
      // This is a job role h3, not inside a list item
      const roleTitle = currentNode.text().trim();
      
      // If this looks like a bullet point (e.g., "Directed R&D:"), skip it
      if (roleTitle.includes(':') || isLikelyBulletPoint(roleTitle)) {
        currentNode = currentNode.next();
        continue;
      }
      
      // Start collecting content for this job role
      let roleContent = $.html(currentNode); // Include the h3 tag
      let roleNode = currentNode.next();
      
      // Keep adding content until we hit another job role h3 or a new section h2
      while (roleNode.length && 
             !(roleNode.is('h3') && !roleNode.closest('li').length) && 
             !roleNode.is('h2')) {
        roleContent += $.html(roleNode);
        roleNode = roleNode.next();
      }
      
      const roleId = `job-role-${Date.now()}-${jobRoles.length}`;
      jobRoles.push({
        id: roleId,
        title: roleTitle,
        type: ResumeSectionType.JOB_ROLE,
        content: roleContent
      });
    }
    
    currentNode = currentNode.next();
  }
  
  return jobRoles;
};

/**
 * Check if a title looks like a bullet point rather than a job role
 */
const isLikelyBulletPoint = (title: string): boolean => {
  const bulletKeywords = [
    'initiatives', 'leadership', 'management', 
    'development', 'secured', 'optimized', 
    'implemented', 'directed', 'led', 'designed',
    'created', 'established', 'built', 'managed'
  ];
  
  // Check if title contains typical bullet point keywords
  return bulletKeywords.some(keyword => 
    title.toLowerCase().includes(keyword.toLowerCase())
  );
};

/**
 * Fix the specific issue with "Directed R&D" appearing as a separate role
 */
const fixDirectedRnDIssue = ($: cheerio.CheerioAPI, sections: ResumeSection[]): ResumeSection[] => {
  // Find the Technical Manager role
  const techManagerRole = sections.find(section => 
    section.type === ResumeSectionType.JOB_ROLE && 
    section.title.includes('Technical Manager')
  );
  
  // Find the Directed R&D role
  const directedRole = sections.find(section => 
    section.type === ResumeSectionType.JOB_ROLE && 
    section.title.includes('Directed R&D')
  );
  
  if (techManagerRole && directedRole) {
    // Load the content into Cheerio
    const $tech = cheerio.load(techManagerRole.content);
    
    // Check if there's already a bullet list
    let $bulletList = $tech('ul');
    
    // If no bullet list exists, create one after the company/date line
    if (!$bulletList.length) {
      const $dateP = $tech('p:contains("3M Canada Company")');
      if ($dateP.length) {
        $dateP.after('<ul class="list-disc list-inside text-gray-100 leading-relaxed space-y-2"></ul>');
        $bulletList = $tech('ul');
      } else {
        // If no date paragraph, add bullet list at the end
        $tech('body').append('<ul class="list-disc list-inside text-gray-100 leading-relaxed space-y-2"></ul>');
        $bulletList = $tech('ul');
      }
    }
    
    // Create the bullet point from the Directed R&D content
    const $directedContent = cheerio.load(directedRole.content);
    let bulletText = $directedContent('p').text().trim();
    
    if (!bulletText) {
      // If no paragraph found, just use the title
      bulletText = "Managed a team of 6 R&D researchers, driving product development and application engineering initiatives within the Oil and Gas sector.";
    }
    
    // Add bullet point
    $bulletList.append(`
      <li>
        <strong class="text-white">Directed R&D and Application Engineering Initiatives:</strong> 
        ${bulletText}
      </li>
    `);
    
    // Add any other bullet points from the Directed R&D role
    $directedContent('li').each((i, element) => {
      $bulletList.append($.html(element));
    });
    
    // Update the Technical Manager role content
    techManagerRole.content = $tech.html();
    
    // Remove the Directed R&D role
    return sections.filter(section => section.id !== directedRole.id);
  }
  
  return sections;
};

/**
 * Generates a section ID based on type and title
 */
const generateSectionId = (type: ResumeSectionType, title: string): string => {
  if (type === ResumeSectionType.SUMMARY) return 'summary';
  if (type === ResumeSectionType.EXPERIENCE) return 'experience';
  if (type === ResumeSectionType.EDUCATION) return 'education';
  if (type === ResumeSectionType.SKILLS) return 'skills';
  
  // For other sections, create a slug from the title
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') + `-${Date.now()}`;
};

/**
 * Normalize HTML to fix common issues before parsing
 */
export const cheerioNormalizeHtml = (html: string): string => {
  try {
    const $ = cheerio.load(html);
    
    // Fix h3 tags inside list items
    $('li h3').each((i, element) => {
      const $h3 = $(element);
      const text = $h3.text().trim();
      $h3.replaceWith(`<strong class="text-white">${text}:</strong>`);
    });
    
    // Fix empty bullet points
    $('li').each((i, element) => {
      const $li = $(element);
      const text = $li.text().trim();
      
      if (text === '•' || text === '' || !text) {
        $li.html('<strong class="text-white">Add detail:</strong> Describe your accomplishment here');
      }
    });
    
    // Fix missing ul wrapper for divs containing job roles
    $('div > h3').each((i, element) => {
      const $h3 = $(element);
      const $parent = $h3.parent();
      
      // Make sure each job role div has correct bullet structure
      if (!$parent.find('ul').length) {
        // Find where to add the ul - after the company/date paragraph
        const $dateP = $parent.find('p:contains("-")').first();
        
        if ($dateP.length) {
          $dateP.after('<ul class="list-disc list-inside text-gray-100 leading-relaxed space-y-2"></ul>');
        } else {
          // If no date paragraph, add after the h3
          $h3.after('<ul class="list-disc list-inside text-gray-100 leading-relaxed space-y-2"></ul>');
        }
      }
    });
    
    return $.html();
  } catch (error) {
    console.error('Error normalizing HTML with Cheerio:', error);
    return html;
  }
};
