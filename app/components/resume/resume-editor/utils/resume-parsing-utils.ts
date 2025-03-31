// app/components/resume/resume-editor/utils/resume-parsing-utils.ts
import { ResumeSection } from '@/app/lib/types';

/**
 * Attempts to extract and parse JSON from various formats
 * @param content The content to parse
 * @returns Parsed JSON object or null if not valid JSON
 */
export function parseJsonContent(content: string) {
  try {
    // Check for JSON in markdown code blocks
    if (content.includes('```json')) {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1].trim());
      }
    }
    
    // Check for direct JSON content
    if (content.startsWith('{') && content.endsWith('}')) {
      return JSON.parse(content);
    }
    
    return null;
  } catch (error) {
    console.error("Error parsing JSON content:", error);
    return null;
  }
}

/**
 * Process HTML content using Cheerio
 * @param content HTML content to parse
 * @param fallbackData Original data object for fallback
 * @param cheerioNormalizeHtml Function to normalize HTML
 * @param parseResumeWithCheerio Function to parse with Cheerio
 * @param resumeDataToSections Function to convert data to sections
 * @returns Array of resume sections
 */
export function processHtmlContent(
  content: string, 
  fallbackData: any,
  cheerioNormalizeHtml: (html: string) => string,
  parseResumeWithCheerio: (html: string) => ResumeSection[] | null,
  resumeDataToSections: (data: any) => ResumeSection[]
): ResumeSection[] {
  try {
    // Normalize and parse the HTML
    const normalizedHtml = cheerioNormalizeHtml(content);
    const cheerioSections = parseResumeWithCheerio(normalizedHtml);
    
    if (cheerioSections && cheerioSections.length > 0) {
      console.log("Successfully parsed with Cheerio:", cheerioSections.length, "sections");
      return cheerioSections;
    }
  } catch (error) {
    console.error("Error parsing HTML content:", error);
  }
  
  // Fallback to default parser
  console.log("Falling back to default resume parser");
  return resumeDataToSections(fallbackData);
}

/**
 * Build section hierarchy (parent-child relationships)
 * Identifies which sections are children of other sections (like job roles under experience)
 * 
 * @param sections Array of resume sections
 * @returns Object mapping parent IDs to arrays of child IDs
 */
export function buildSectionHierarchy(sections: ResumeSection[]): Record<string, string[]> {
  const hierarchy: Record<string, string[]> = {};
  
  sections.forEach(section => {
    if (section.parentId) {
      if (!hierarchy[section.parentId]) {
        hierarchy[section.parentId] = [];
      }
      hierarchy[section.parentId].push(section.id);
    }
  });
  
  return hierarchy;
}

/**
 * Preserve job role headers while updating the bullet points
 * Used when applying AI suggestions to job roles
 * 
 * @param originalContent Original HTML content
 * @param newBulletContent New HTML content with updated bullets
 * @returns Combined HTML content with original header and new bullets
 */
export function preserveJobRoleHeaderAndUpdateBullets(originalContent: string, newBulletContent: string): string {
  try {
    // Parse the original content
    const originalDiv = document.createElement('div');
    originalDiv.innerHTML = originalContent;
    
    // Parse the new bullet content
    const newContentDiv = document.createElement('div');
    newContentDiv.innerHTML = newBulletContent;
    
    // Extract the heading (job title, company, date)
    const heading = originalDiv.querySelector('h3, h4, h5');
    
    // Extract paragraphs that might appear between heading and bullets
    const paragraphs: Element[] = [];
    let currentElement = heading?.nextElementSibling;
    
    while (currentElement && currentElement.tagName !== 'UL') {
      if (currentElement.tagName === 'P') {
        paragraphs.push(currentElement.cloneNode(true) as Element);
      }
      currentElement = currentElement.nextElementSibling;
    }
    
    // Extract the new bullet points (ul and its li children)
    const newBulletList = newContentDiv.querySelector('ul');
    
    // Create a new combined content
    const resultDiv = document.createElement('div');
    
    // Add the original heading if found
    if (heading) {
      resultDiv.appendChild(heading.cloneNode(true));
    }
    
    // Add any paragraphs that were between the heading and list
    paragraphs.forEach(p => {
      resultDiv.appendChild(p);
    });
    
    // Add the new bullet list
    if (newBulletList) {
      resultDiv.appendChild(newBulletList.cloneNode(true));
    } else {
      // If no new bullet list found, add the entire new content
      resultDiv.innerHTML += newBulletContent;
    }
    
    return resultDiv.innerHTML;
  } catch (error) {
    console.error('Error preserving job role header:', error);
    // Fall back to the new content if any error occurs
    return newBulletContent;
  }
}

/**
 * Tests if a section exists in the list of sections
 * Useful for checking if required sections exist
 * 
 * @param sections Array of resume sections
 * @param type The section type to check for
 * @param id Optional specific ID to check for
 * @returns Boolean indicating if the section exists
 */
export function sectionExists(
  sections: ResumeSection[], 
  type: string, 
  id?: string
): boolean {
  return sections.some(section => 
    section.type === type && (id ? section.id === id : true)
  );
}

/**
 * Extract plain text content from HTML
 * Useful for generating summaries or for search indexing
 * 
 * @param htmlContent HTML content to extract text from
 * @returns Plain text with preserved paragraph breaks
 */
export function extractPlainText(htmlContent: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Replace common elements with text + linebreaks
  const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach(heading => {
    const text = heading.textContent?.trim();
    if (text) {
      heading.replaceWith(`${text}\n\n`);
    }
  });
  
  const paragraphs = tempDiv.querySelectorAll('p');
  paragraphs.forEach(p => {
    const text = p.textContent?.trim();
    if (text) {
      p.replaceWith(`${text}\n\n`);
    }
  });
  
  const listItems = tempDiv.querySelectorAll('li');
  listItems.forEach(li => {
    const text = li.textContent?.trim();
    if (text) {
      li.replaceWith(`• ${text}\n`);
    }
  });
  
  // Get text content and clean up extra whitespace
  let text = tempDiv.textContent || '';
  text = text.replace(/\n{3,}/g, '\n\n'); // Replace multiple line breaks with just two
  
  return text.trim();
}
