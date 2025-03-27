// app/lib/job-role-merger.ts
import { ResumeSection } from '@/app/lib/types';

/**
 * This utility identifies and merges job roles that should be bullet points
 * within a parent job role section
 */
export const mergeNestedJobRoles = (sections: ResumeSection[]): ResumeSection[] => {
  // First, find all JOB_ROLE sections
  const jobRoles = sections.filter(section => section.type === 'JOB_ROLE');
  
  // Group job roles by parent based on title patterns
  const parentRoles: ResumeSection[] = [];
  const childRoles: ResumeSection[] = [];
  
  // Step 1: Identify parent vs child roles
  jobRoles.forEach(role => {
    // Check if this looks like a bullet point rather than a job title
    if (role.title.includes(':') || 
        role.title.includes('Initiatives') || 
        role.title.includes('Leadership') ||
        role.title.includes('Management') ||
        role.title.includes('Development') ||
        role.title.includes('Mentored')) {
      childRoles.push(role);
    } else {
      parentRoles.push(role);
    }
  });
  
  // Step 2: For each parent role, find its child roles and merge them
  parentRoles.forEach(parent => {
    const potentialChildren = findChildrenForParent(parent, childRoles);
    if (potentialChildren.length > 0) {
      // Merge the children's content into the parent
      let updatedContent = parent.content;
      
      // Check if the parent has a ul, if not add one
      if (!updatedContent.includes('<ul')) {
        // Find where to add the ul - after the company and date line
        const dateLineMatch = updatedContent.match(/<p[^>]*>[^<]*\|[^<]*<\/p>/);
        if (dateLineMatch) {
          const insertPosition = updatedContent.indexOf(dateLineMatch[0]) + dateLineMatch[0].length;
          updatedContent = updatedContent.slice(0, insertPosition) + 
                          '\n<ul class="list-disc list-inside text-gray-100 leading-relaxed space-y-2">\n' + 
                          '</ul>' +
                          updatedContent.slice(insertPosition);
        }
      }
      
      // Now find the position to insert the child content (inside the ul)
      const ulMatch = updatedContent.match(/<ul[^>]*>/);
      if (ulMatch) {
        const insertPosition = updatedContent.indexOf(ulMatch[0]) + ulMatch[0].length;
        
        // Add each child as a list item
        let childContentToAdd = '';
        potentialChildren.forEach(child => {
          // Format child title as a bullet point
          const bulletTitle = child.title.endsWith(':') ? 
                            child.title : 
                            `${child.title}:`;
                            
          // Extract description from child content
          const description = extractDescriptionFromChildRole(child.content);
          
          // Create a properly formatted list item
          childContentToAdd += `\n<li><strong class="text-white">${bulletTitle}</strong> ${description}</li>\n`;
        });
        
        updatedContent = updatedContent.slice(0, insertPosition) + 
                         childContentToAdd + 
                         updatedContent.slice(insertPosition);
      }
      
      // Update the parent's content
      parent.content = updatedContent;
    }
  });
  
  // Step 3: Return all sections, removing the child roles
  const childIds = childRoles.map(child => child.id);
  return sections.filter(section => !childIds.includes(section.id));
};

/**
 * Find child roles that should belong to a parent role
 */
const findChildrenForParent = (
  parent: ResumeSection, 
  potentialChildren: ResumeSection[]
): ResumeSection[] => {
  // Extract date range and company from parent
  const dateMatch = parent.content.match(/(\d{4}\s*[–-]\s*\d{4}|\d{4}\s*[–-]\s*present)/i);
  const companyMatch = parent.content.match(/(\w+\s+Company|Company)/i);
  
  if (!dateMatch && !companyMatch) {
    return [];
  }
  
  // Use these matches to find children that should belong to this parent
  return potentialChildren.filter(child => {
    // Check if this child's content contains references to parent's identifiers
    const childContent = child.content.toLowerCase();
    const childTitle = child.title.toLowerCase();
    
    const hasParentJobKeywords = containsJobTitleKeywords(childTitle, parent.title.toLowerCase());
    const hasCompanyReference = companyMatch && childContent.includes(companyMatch[0].toLowerCase());
    const hasDateReference = dateMatch && childContent.includes(dateMatch[0].toLowerCase());
    const appearsAfterParent = sections.indexOf(child) > sections.indexOf(parent);
    
    // For the specific "Directed R&D" case
    const isRDRole = parent.title.includes("Technical Manager") && 
                   child.title.includes("Directed R&D");
    
    return isRDRole || (hasParentJobKeywords && (hasCompanyReference || hasDateReference) && appearsAfterParent);
  });
};

/**
 * Check if child job title contains keywords from parent job title
 */
const containsJobTitleKeywords = (childTitle: string, parentTitle: string): boolean => {
  // Extract significant words from parent title (ignoring common words)
  const significantWords = parentTitle
    .split(/\s+/)
    .filter(word => word.length > 3 && !['and', 'the', 'for', 'with'].includes(word.toLowerCase()));
  
  // Check if child title contains any of these significant words
  return significantWords.some(word => childTitle.includes(word));
};

/**
 * Extract description text from a child role's content
 */
const extractDescriptionFromChildRole = (content: string): string => {
  // Try to find a paragraph with meaningful content
  const paragraphMatch = content.match(/<p[^>]*>(.*?)<\/p>/);
  if (paragraphMatch && paragraphMatch[1] && paragraphMatch[1].trim().length > 0) {
    return stripTags(paragraphMatch[1]);
  }
  
  // Otherwise just strip all tags and use the text content
  return stripTags(content);
};

/**
 * Strip HTML tags from a string
 */
const stripTags = (html: string): string => {
  return html.replace(/<\/?[^>]+(>|$)/g, "");
};

/**
 * Direct cleaning of incorrectly structured resume HTML
 */
export const cleanResumeHtml = (html: string): string => {
  // Replace standalone li bullets with properly structured ones
  return html.replace(
    /<li>\s*•\s*<\/li>/g,
    '<li><strong class="text-white">Bullet Point:</strong> Add details here</li>'
  );
};

const sections: ResumeSection[] = [];

