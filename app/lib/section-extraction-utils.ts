// app/lib/section-extraction-utils.ts
import { ResumeSection, ResumeSectionType } from '@/app/lib/types';

/**
 * Special function to detect and protect bullet points in list items
 * from being misinterpreted as section headings
 */
export const preserveBulletPoints = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;
  
  // Find all list items with strong tags at the beginning
  const listItems = div.querySelectorAll('li > strong:first-child');
  
  listItems.forEach(strong => {
    const listItem = strong.parentElement;
    if (listItem) {
      // Add a special data attribute to prevent being parsed as section heading
      listItem.setAttribute('data-bullet-description', 'true');
      
      // Also add the attribute to the strong element
      strong.setAttribute('data-not-heading', 'true');
    }
  });
  
  return div.innerHTML;
};

/**
 * Extract sections from HTML content with improved section detection
 * @param html Resume HTML content
 * @returns Array of identified sections 
 */
export const extractSectionsFromHtml = (html: string): ResumeSection[] => {
  const sections: ResumeSection[] = [];
  
  // First preprocess to protect bullet points from being misinterpreted
  const preprocessedHtml = preserveBulletPoints(html);
  
  // Create a DOM parser to work with the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(preprocessedHtml, 'text/html');
  
  // Process the header section first
  const headerSection = processHeaderSection(doc);
  if (headerSection) {
    sections.push(headerSection);
  }
  
  // Extract the summary section that comes after the header
  const summarySection = processSummarySection(doc);
  if (summarySection) {
    sections.push(summarySection);
  }
  
  // Extract other sections based on h2 elements
  const sectionElements = doc.querySelectorAll('h2');
  sectionElements.forEach((sectionHeading, index) => {
    const sectionTitle = sectionHeading.textContent?.trim() || '';
    const sectionTypeResult = determineSectionType(sectionTitle);
    
    // Skip if this is determined not to be a real section heading
    if (sectionTypeResult === 'LIST_ITEM' || sectionTypeResult === 'JOB_DESCRIPTION') {
      return;
    }
    
    const sectionType = sectionTypeResult as ResumeSectionType;
    const sectionId = generateSectionId(sectionType, sectionTitle);
    
    // Get all content between this h2 and the next h2 (or end of document)
    let currentNode = sectionHeading.nextElementSibling;
    let sectionContent = '';
    
    while (currentNode && currentNode.tagName !== 'H2') {
      // Skip elements that have been marked as bullet descriptions
      if (currentNode.getAttribute('data-bullet-description') !== 'true') {
        sectionContent += currentNode.outerHTML || '';
      }
      currentNode = currentNode.nextElementSibling;
    }
    
    // Don't create empty sections
    if (sectionContent.trim()) {
      const section: ResumeSection = {
        id: sectionId,
        title: sectionTitle,
        type: sectionType,
        content: sectionContent
      };
      
      sections.push(section);
      
      // If this is the experience section, extract job roles
      if (sectionType === ResumeSectionType.EXPERIENCE) {
        const jobRoles = extractJobRolesImproved(doc, sectionHeading, currentNode);
        sections.push(...jobRoles);
      }
    }
  });
  
  return sections;
};

/**
 * Improved version of job role extraction that handles bullet points better
 */
const extractJobRolesImproved = (
  doc: Document, 
  startElement: Element, 
  endElement: Element | null
): ResumeSection[] => {
  const jobRoles: ResumeSection[] = [];
  
  // Find all h3 elements between startElement and endElement that are direct children
  // of the section, not nested within list items or other elements
  let currentNode: Element | null = startElement.nextElementSibling;
  
  while (currentNode && currentNode !== endElement) {
    // Only process h3 elements that are NOT within a list item
    // and are direct children of divs or the section
    if (currentNode.tagName === 'H3' && 
        !currentNode.closest('li') && 
        (currentNode.parentElement?.tagName === 'DIV' || 
         currentNode.parentElement?.tagName === 'SECTION')) {
      
      const jobTitle = currentNode.textContent?.trim() || '';
      
      // Start collecting all content for this job role
      let roleContent = currentNode.outerHTML || '';
      let roleNode = currentNode.nextElementSibling;
      
      // Find all content until the next h3 (that's not nested in a list item) or h2
      while (roleNode && 
            !(roleNode.tagName === 'H3' && 
              !roleNode.closest('li') && 
              (roleNode.parentElement?.tagName === 'DIV' || 
               roleNode.parentElement?.tagName === 'SECTION')) && 
            roleNode.tagName !== 'H2') {
        roleContent += roleNode.outerHTML || '';
        roleNode = roleNode.nextElementSibling;
      }
      
      // Create a job role section
      const roleId = `job-role-${Date.now()}-${jobRoles.length}`;
      jobRoles.push({
        id: roleId,
        title: jobTitle,
        type: ResumeSectionType.JOB_ROLE,
        content: roleContent
      });
    }
    
    currentNode = currentNode.nextElementSibling;
  }
  
  return jobRoles;
};

/**
 * Processes the header section from the document
 */
const processHeaderSection = (doc: Document): ResumeSection | null => {
  const nameElement = doc.querySelector('h1');
  if (!nameElement) return null;
  
  let headerContent = nameElement.outerHTML || '';
  
  // Get contact info paragraph if it exists (usually right after h1)
  let contactInfo = nameElement.nextElementSibling;
  if (contactInfo && contactInfo.tagName === 'P') {
    headerContent += contactInfo.outerHTML || '';
  }
  
  return {
    id: 'header',
    title: 'Header',
    type: ResumeSectionType.HEADER,
    content: headerContent
  };
};

/**
 * Extracts the summary section that typically comes after the header
 */
const processSummarySection = (doc: Document): ResumeSection | null => {
  const headerElement = doc.querySelector('h1');
  if (!headerElement) return null;
  
  // Find paragraphs after the header but before the first h2 that could be a summary
  let currentNode = headerElement.nextElementSibling;
  let summaryContent = '';
  
  // Skip the contact info paragraph if it exists
  if (currentNode && currentNode.tagName === 'P' && 
      currentNode.textContent?.includes('|')) {
    currentNode = currentNode.nextElementSibling;
  }
  
  // Collect paragraphs until we hit a section heading
  while (currentNode && currentNode.tagName !== 'H2') {
    if (currentNode.tagName === 'P' || 
        currentNode.tagName === 'DIV' && !currentNode.querySelector('h2, h3')) {
      summaryContent += currentNode.outerHTML || '';
    }
    currentNode = currentNode.nextElementSibling;
  }
  
  // Only create a summary if we found content
  if (summaryContent.trim()) {
    return {
      id: 'summary',
      title: 'Professional Summary',
      type: ResumeSectionType.SUMMARY,
      content: summaryContent
    };
  }
  
  return null;
};

/**
 * Extracts job roles from the experience section
 */
const extractJobRoles = (
  doc: Document, 
  startElement: Element, 
  endElement: Element | null
): ResumeSection[] => {
  const jobRoles: ResumeSection[] = [];
  
  // Find all h3 elements between startElement and endElement
  let currentNode: Element | null = startElement.nextElementSibling;
  
  while (currentNode && currentNode !== endElement) {
    if (currentNode.tagName === 'H3') {
      const jobTitle = currentNode.textContent?.trim() || '';
      let roleContent = currentNode.outerHTML || '';
      let roleNode = currentNode.nextElementSibling;
      
      // Collect all content until the next h3 or h2
      while (roleNode && roleNode.tagName !== 'H3' && roleNode.tagName !== 'H2') {
        roleContent += roleNode.outerHTML || '';
        roleNode = roleNode.nextElementSibling;
      }
      
      // Create a job role section
      const roleId = `job-role-${Date.now()}-${jobRoles.length}`;
      jobRoles.push({
        id: roleId,
        title: jobTitle,
        type: ResumeSectionType.JOB_ROLE,
        content: roleContent
      });
    }
    
    currentNode = currentNode.nextElementSibling;
  }
  
  return jobRoles;
};

/**
 * Determines section type based on the section title
 * Returns either a ResumeSectionType enum value or a special string
 * for non-section items (like list items or job descriptions)
 */
const determineSectionType = (title: string): ResumeSectionType | 'LIST_ITEM' | 'JOB_DESCRIPTION' => {
  const normalizedTitle = title.toUpperCase();
  
  // Don't classify these phrases as section headings when they appear in bullets or list items
  if (normalizedTitle.includes('BULLET') || normalizedTitle.includes('•') || 
      normalizedTitle.match(/^\s*\d+\.\s+/) || // Numbered bullet point
      normalizedTitle.match(/^\s*[-*]\s+/)) { // List item indicator
    return 'LIST_ITEM';
  }
  
  // Check if this is likely a job responsibility/bullet and not a section
  if (normalizedTitle.endsWith(':') || 
      normalizedTitle.includes('LEADERSHIP:') || 
      normalizedTitle.includes('MANAGEMENT:') ||
      normalizedTitle.includes('DEVELOPMENT:')) {
    return 'JOB_DESCRIPTION';
  }
  
  if (normalizedTitle.includes('SUMMARY') || normalizedTitle.includes('PROFILE')) {
    return ResumeSectionType.SUMMARY;
  } else if (normalizedTitle.includes('EXPERIENCE') || normalizedTitle.includes('EMPLOYMENT')) {
    return ResumeSectionType.EXPERIENCE;
  } else if (normalizedTitle.includes('EDUCATION')) {
    return ResumeSectionType.EDUCATION;
  } else if (normalizedTitle.includes('SKILLS')) {
    return ResumeSectionType.SKILLS;
  } else if (normalizedTitle.includes('CERTIFICATION')) {
    return ResumeSectionType.CERTIFICATIONS;
  } else if (normalizedTitle.includes('PROJECT')) {
    return ResumeSectionType.PROJECTS;
  } else {
    return ResumeSectionType.OTHER;
  }
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
 * Enhances a set of resume sections by ensuring proper structure and content
 */
export const enhanceResumeSections = (sections: ResumeSection[]): ResumeSection[] => {
  const enhancedSections = [...sections];
  
  // Ensure core sections exist
  const ensureCoreSection = (
    id: string, 
    title: string, 
    type: ResumeSectionType, 
    defaultContent: string
  ) => {
    if (!enhancedSections.some(s => s.type === type)) {
      enhancedSections.push({
        id,
        title,
        type,
        content: defaultContent
      });
    }
  };
  
  // Ensure all core sections exist with proper content
  ensureCoreSection(
    'header',
    'Header',
    ResumeSectionType.HEADER,
    '<h1 class="text-2xl font-bold">Your Name</h1>' +
    '<p class="text-gray-300">Your Phone | Your Email | Your LinkedIn Profile URL | Location</p>'
  );
  
  ensureCoreSection(
    'summary',
    'Professional Summary',
    ResumeSectionType.SUMMARY,
    '<div class="mb-6"><p class="text-gray-200">Professional summary highlighting your experience, skills, and career goals...</p></div>'
  );
  
  ensureCoreSection(
    'experience',
    'Professional Experience',
    ResumeSectionType.EXPERIENCE,
    '<div class="mb-6"><p class="text-gray-200">Your work experience goes here.</p></div>'
  );
  
  ensureCoreSection(
    'education',
    'Education',
    ResumeSectionType.EDUCATION,
    '<div class="mb-6"><p class="text-gray-200">Your education details go here.</p></div>'
  );
  
  ensureCoreSection(
    'skills',
    'Skills',
    ResumeSectionType.SKILLS,
    '<div class="mb-6"><p class="text-gray-200">Your key skills go here.</p></div>'
  );
  
  return enhancedSections;
};

/**
 * Formats section content for proper display
 */
export const formatSectionContent = (section: ResumeSection): ResumeSection => {
  let formattedContent = section.content;
  
  // Ensure paragraphs have proper styling
  formattedContent = formattedContent.replace(
    /<p(?![^>]*class=)/g,
    '<p class="text-gray-200"'
  );
  
  // Ensure bullet lists have proper styling
  formattedContent = formattedContent.replace(
    /<ul(?![^>]*class=)/g,
    '<ul class="list-disc mt-2 pl-5"'
  );
  
  // Ensure list items have proper styling
  formattedContent = formattedContent.replace(
    /<li(?![^>]*class=)/g,
    '<li class="text-gray-200 pl-2"'
  );
  
  return {
    ...section,
    content: formattedContent
  };
};
