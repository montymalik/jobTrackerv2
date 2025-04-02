import React from 'react';
import { 
  ContentType, 
  PdfExportOptions, 
  exportContentToPdf, 
  DocumentMetadata
} from './PdfExporter';
import { ResumeSection, ResumeSectionType } from './types';
interface EnhancedResumeExportOptions extends PdfExportOptions {
  includeBorders?: boolean;
  nameUnderlineColor?: string;
  headingUnderlineColor?: string;
  customFonts?: {
    name?: string;
    headings?: string;
    body?: string;
  };
  removeTitlesOnly?: string[]; // Titles to remove while keeping their content
  colors?: {
    name: string;
    headings: string;
    subheadings: string;
    body: string;
    bullet: string;
  };
  companyNameBeforeTitle?: boolean;
  lineSpacing?: number; // Control spacing between lines
  sectionSpacing?: number; // Control spacing between sections
  includeAllSections?: boolean; // Force include all sections
  removeSummaryTitle?: boolean; // Option to remove only the summary section title
}
export interface EnhancedResumeExportParams {
  content: string;
  contentType?: ContentType;
  metadata?: DocumentMetadata;
  options: EnhancedResumeExportOptions;
  resumeSections?: ResumeSection[]; // Optional sections data for better control
}
/**
 * Processes resume sections and respects the original section order
 * Modified to preserve the input ordering from ResumeEditor
 */
/**
 * Processes resume sections and respects the original section order
 * Modified to preserve the input ordering from ResumeEditor
 * Fixed to properly handle job role ordering and parent/child relationships
 */
const processResumeSections = (sections: ResumeSection[], options: EnhancedResumeExportOptions = {}): string => {
  // No internal sorting - use sections in the exact order they're provided
  let markdown = '';
  let experienceHeaderAdded = false;
  
  console.log("Processing sections in this order:", sections.map(s => ({
    id: s.id,
    title: s.title,
    type: s.type
  })));
  
  // Special handling for header section which should always be processed first
  const header = sections.find(s => s.type === ResumeSectionType.HEADER);
  if (header) {
    // Extract name from h1
    const nameMatch = header.content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (nameMatch && nameMatch[1]) {
      markdown += `# ${stripHtml(nameMatch[1])}\n\n`;
    }
    
    // Extract contact info - make sure it's included
    const contactMatch = header.content.match(/<p[^>]*>(.*?)<\/p>/i);
    if (contactMatch && contactMatch[1]) {
      markdown += `${stripHtml(contactMatch[1])}\n\n`;
      
      // Add a marker for the horizontal line to ensure it's created
      markdown += `<!--CONTACT_DIVIDER-->\n\n`;
    } else {
      // Fallback - look for any contact info in the header content
      const contactInfo = extractContactInfo(header.content);
      if (contactInfo) {
        markdown += `${contactInfo}\n\n`;
        
        // Add a marker for the horizontal line to ensure it's created
        markdown += `<!--CONTACT_DIVIDER-->\n\n`;
      }
    }
  }
  
  // Track sections we've already processed
  const processedSectionIds = new Set<string>();
  if (header) {
    processedSectionIds.add(header.id);
  }
  
  // Process all non-header sections in the exact order they were provided
  for (const section of sections) {
    // Skip if we've already processed this section
    if (processedSectionIds.has(section.id)) {
      continue;
    }
    
    // Mark as processed
    processedSectionIds.add(section.id);
    
    // Special case for summary section - handle title removal if needed
    if (section.type === ResumeSectionType.SUMMARY) {
      if (options.removeSummaryTitle !== true) {
        markdown += `## ${section.title}\n\n`;
      } else {
        // Add proper spacing before the summary content when we remove the title
        markdown += `<!--SUMMARY_START-->\n\n`;
      }
      
      // Extract paragraphs from summary content
      const paragraphs = extractParagraphs(section.content);
      if (paragraphs.length > 0) {
        paragraphs.forEach(p => {
          markdown += `${p}\n\n`;
        });
      } else {
        markdown += `${stripHtml(section.content)}\n\n`;
      }
      continue;
    }
    
    // Special case for experience section
    if (section.type === ResumeSectionType.EXPERIENCE) {
      // Only add the Professional Experience heading if it hasn't been added already
      if (!experienceHeaderAdded) {
        markdown += `## Professional Experience\n\n`;
        experienceHeaderAdded = true;
      }
      continue;
    }
    
    // Special case for job roles - handle job titles, company names, and bullet points
    if (section.type === ResumeSectionType.JOB_ROLE) {
      // Add Professional Experience heading if it hasn't been added yet
      if (!experienceHeaderAdded) {
        markdown += `## Professional Experience\n\n`;
        experienceHeaderAdded = true;
      }
      
      console.log(`Processing job role: ${section.title} (ID: ${section.id})`);
      
      // Extract job title, company, and date
      const jobTitleMatch = section.content.match(/<h3[^>]*>(.*?)<\/h3>/i);
      let jobTitle = jobTitleMatch ? stripHtml(jobTitleMatch[1]) : section.title;
      
      // Extract company and date info
      const companyMatch = section.content.match(/<p[^>]*>(.*?)<\/p>/i);
      let companyText = '';
      let dateRange = '';
      
      if (companyMatch && companyMatch[1]) {
        companyText = stripHtml(companyMatch[1]);
        
        // Try to extract dates separately
        const parts = companyText.split('|').map(p => p.trim());
        if (parts.length > 1) {
          companyText = parts[0];
          dateRange = parts[1];
        }
      }
      
      // Format job title with right-aligned dates on the same line
      markdown += `### ${jobTitle} ${dateRange ? `<span style="float:right">${dateRange}</span>` : ''}\n`;
      markdown += `${companyText}\n\n`;
      
      // Extract bullet points
      const bullets = extractBulletPoints(section.content);
      bullets.forEach(bullet => {
        markdown += `- ${bullet}\n`;
      });
      
      // Add spacing after job
      markdown += '\n';
      continue;
    }
    
    // All other section types - use standard section formatting with title
    markdown += `## ${section.title}\n\n`;
    
    // Handle different content formats based on section type
    if (section.type === ResumeSectionType.SKILLS) {
      // Try to extract skill categories (usually in h3 or strong tags)
      const skillCategories = section.content.match(/<h3[^>]*>(.*?)<\/h3>[\s\S]*?(?=<h3|$)/gi);
      
      if (skillCategories && skillCategories.length > 0) {
        skillCategories.forEach(category => {
          const titleMatch = category.match(/<h3[^>]*>(.*?)<\/h3>/i);
          if (titleMatch) {
            markdown += `**${stripHtml(titleMatch[1])}:** `;
          }
          
          // Extract skill list
          const paragraphs = extractParagraphs(category);
          if (paragraphs.length > 0) {
            markdown += `${paragraphs[0]}\n\n`;
          }
        });
      } else {
        // Try to extract skills with strong or b tags
        const strongMatches = section.content.match(/(?:<strong[^>]*>|<b[^>]*>)(.*?)(?:<\/strong>|<\/b>)\s*:\s*(.*?)(?=<(?:strong|b|div|p|ul|h))/gi);
        
        if (strongMatches && strongMatches.length > 0) {
          strongMatches.forEach(match => {
            const categoryMatch = match.match(/(?:<strong[^>]*>|<b[^>]*>)(.*?)(?:<\/strong>|<\/b>)\s*:\s*(.*)/i);
            if (categoryMatch) {
              const name = stripHtml(categoryMatch[1]);
              const skillsText = stripHtml(categoryMatch[2]);
              markdown += `**${name}:** ${skillsText}\n\n`;
            }
          });
        } else {
          // If no categories, just extract paragraphs
          const paragraphs = extractParagraphs(section.content);
          if (paragraphs.length > 0) {
            paragraphs.forEach(p => {
              markdown += `${p}\n\n`;
            });
          } else {
            markdown += `${stripHtml(section.content)}\n\n`;
          }
        }
      }
    } else if (section.type === ResumeSectionType.CERTIFICATIONS) {
      // Extract certification bullets
      const bullets = extractBulletPoints(section.content);
      if (bullets.length > 0) {
        bullets.forEach(bullet => {
          markdown += `- ${bullet}\n`;
        });
        markdown += '\n';
      } else {
        // Just extract paragraphs
        const paragraphs = extractParagraphs(section.content);
        if (paragraphs.length > 0) {
          paragraphs.forEach(p => {
            markdown += `${p}\n\n`;
          });
        } else {
          markdown += `${stripHtml(section.content)}\n\n`;
        }
      }
    } else if (section.type === ResumeSectionType.EDUCATION) {
      // Extract education details
      const paragraphs = extractParagraphs(section.content);
      if (paragraphs.length > 0) {
        paragraphs.forEach(p => {
          markdown += `${p}\n\n`;
        });
      } else {
        // Extract h3 sections if any
        const educationEntries = section.content.match(/<h3[^>]*>(.*?)<\/h3>[\s\S]*?(?=<h3|$)/gi);
        if (educationEntries && educationEntries.length > 0) {
          educationEntries.forEach(entry => {
            const titleMatch = entry.match(/<h3[^>]*>(.*?)<\/h3>/i);
            if (titleMatch) {
              markdown += `### ${stripHtml(titleMatch[1])}\n\n`;
            }
            
            const paragraphs = extractParagraphs(entry);
            paragraphs.forEach(p => {
              markdown += `${p}\n\n`;
            });
          });
        } else {
          markdown += `${stripHtml(section.content)}\n\n`;
        }
      }
    } else {
      // Default handling for other section types (PROJECTS, OTHER, etc.)
      // Extract section content
      const paragraphs = extractParagraphs(section.content);
      if (paragraphs.length > 0) {
        paragraphs.forEach(p => {
          markdown += `${p}\n\n`;
        });
      } else {
        markdown += `${stripHtml(section.content)}\n\n`;
      }
    }
  }
  
  return markdown;
};
/**
 * Attempt to extract contact information from header content
 */
const extractContactInfo = (html: string): string => {
  // Look for content that looks like contact info (emails, phone numbers, etc.)
  const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = html.match(/(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
  const locationMatch = html.match(/(?:City|Location|Address):\s*([^<>\n,]+(?:,[^<>\n]+)?)/i);
  
  let contactParts = [];
  
  if (emailMatch) contactParts.push(emailMatch[0]);
  if (phoneMatch) contactParts.push(phoneMatch[0]);
  if (locationMatch) contactParts.push(locationMatch[1]);
  
  // If we found at least one part, join them with separator
  if (contactParts.length > 0) {
    return contactParts.join(' | ');
  }
  
  // Fallback - look for any paragraph-like content that might be contact info
  const paragraphs = html.match(/<p[^>]*>(.*?)<\/p>/gi);
  if (paragraphs && paragraphs.length > 0) {
    for (const p of paragraphs) {
      const content = stripHtml(p);
      // Check if it looks like contact info (contains common separators)
      if (content.includes('|') || content.includes('•') || content.includes(',')) {
        return content;
      }
    }
  }
  
  return '';
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
 * Strip HTML tags from a string
 */
const stripHtml = (html: string): string => {
  if (!html) return '';
  return html.replace(/<\/?[^>]+(>|$)/g, "").trim();
};

/**
 * Enhanced function to export resume to PDF with better styling and complete content
 * Revised to fix job role formatting and header details
 */
// React component interface for the EnhancedResumeExporter
interface EnhancedResumeExporterProps {
  resumeSections: ResumeSection[];
  contentFallback?: string;
  contentType?: ContentType;
  filename?: string;
  metadata?: DocumentMetadata;
  buttonText?: string;
  buttonClassName?: string;
  customFonts?: {
    name?: string;
    headings?: string;
    body?: string;
  };
  colors?: {
    name: string;
    headings: string;
    subheadings: string;
    body: string;
    bullet: string;
  };
  lineSpacing?: number;
  sectionSpacing?: number;
  includeAllSections?: boolean;
  removeTitlesOnly?: string[];
  isDisabled?: boolean;
  companyNameBeforeTitle?: boolean;
  removeSummaryTitle?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

// Create the React component that wraps the export function
export const EnhancedResumeExporter: React.FC<EnhancedResumeExporterProps> = ({
  resumeSections,
  contentFallback = '',
  contentType = 'markdown',
  filename = `Resume_${new Date().toISOString().split('T')[0]}.pdf`,
  metadata = {},
  buttonText = 'Export PDF',
  buttonClassName = '',
  customFonts,
  colors,
  lineSpacing,
  sectionSpacing,
  includeAllSections = true,
  removeTitlesOnly = [],
  isDisabled = false,
  companyNameBeforeTitle = false,
  removeSummaryTitle = true, // Default to removing the summary title
  onSuccess,
  onError
}) => {
  const handleClick = async () => {
    try {
      const options: EnhancedResumeExportOptions = {
        filename,
        customFonts,
        colors: colors || {
          name: '#000000',
          headings: '#000000',
          subheadings: '#000000',
          body: '#000000',
          bullet: '#000000'
        },
        lineSpacing,
        sectionSpacing,
        includeAllSections,
        removeTitlesOnly,
        companyNameBeforeTitle,
        removeSummaryTitle: removeSummaryTitle === true
      };
      await exportEnhancedResumeToPdf({
        content: contentFallback,
        contentType,
        metadata,
        options,
        resumeSections
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  };
  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={buttonClassName || 'px-3 py-1 rounded text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50'}
    >
      {buttonText}
    </button>
  );
};

export const exportEnhancedResumeToPdf = async ({ 
  content, 
  contentType = 'markdown',
  metadata = {},
  options,
  resumeSections = []
}: EnhancedResumeExportParams): Promise<void> => {
  // Process resume sections if provided
  const processedContent = resumeSections.length > 0 
    ? processResumeSections(resumeSections, options)
    : content;
  
  // Add special handling for problematic job titles to ensure they don't break across pages
  let cleanedContent = processedContent
    .replace(/^```markdown\s*/, '')
    .replace(/```\s*$/, '')
    .replace(/\n{3,}/g, '\n\n'); // Normalize excessive line breaks
    
  // Replace the Professional Summary title with our marker if needed
  if (options.removeSummaryTitle === true) {
    cleanedContent = cleanedContent.replace(
      /## PROFESSIONAL SUMMARY\s*\n+/gi,
      '<!--SUMMARY_START-->\n\n'
    );
  }
  
  // Add extra spacing and reliable marker after contact info
  cleanedContent = cleanedContent.replace(
    /(your\.email@example\.com\s*\|\s*\d{3}\.\d{3}\.\d{4})\s*\n+/,
    '$1\n\n<!--CONTACT_DIVIDER-->\n\n'
  );
    
  // Add page break hints for specific positions that tend to break across pages
  cleanedContent = cleanedContent.replace(
    /(### Lab Manager, Transportation \& Electronics)/g, 
    '<!-- PAGE BREAK -->\n$1'
  );
  
  // Custom styling for resumes with enhanced spacing controls
  const lineSpacing = options.lineSpacing ?? 1.4;
  const sectionSpacing = options.sectionSpacing ?? 16;
  
  const resumeStyles = `
    body {
      font-family: ${options.customFonts?.body || 'Arial'}, sans-serif;
      font-size: 11pt;
      line-height: ${lineSpacing};
      color: ${options.colors?.body || '#000000'} !important;
    }
    .container {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in 0.5in 0.5in 0.5in;
    }
    h1 {
      font-family: ${options.customFonts?.name || 'Arial'}, sans-serif;
      font-size: 18pt;
      font-weight: bold;
      text-align: left;
      margin-bottom: 4px;
      color: ${options.colors?.name || '#000000'} !important;
    }
    h2 {
      font-family: ${options.customFonts?.headings || 'Arial'}, sans-serif;
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: ${sectionSpacing}pt;
      margin-bottom: 8pt;
      padding-bottom: 4pt;
      color: ${options.colors?.headings || '#000000'} !important;
      border-bottom: 1px solid #dddddd;
      page-break-before: auto;
      page-break-after: avoid;
      page-break-inside: avoid;
    }
    h3 {
      font-family: ${options.customFonts?.headings || 'Arial'}, sans-serif;
      font-size: 11pt;
      font-weight: bold;
      margin-top: 12pt;
      margin-bottom: 2pt;
      color: ${options.colors?.subheadings || '#000000'} !important;
      position: relative;
      width: 100%;
      page-break-inside: avoid;
      page-break-after: avoid;
    }
    h3 span {
      font-weight: normal;
      float: right;
      color: ${options.colors?.body || '#000000'} !important;
    }
    h4, .company-name {
      font-family: ${options.customFonts?.body || 'Arial'}, sans-serif;
      font-size: 11pt;
      font-weight: normal;
      margin-top: 0;
      margin-bottom: 4pt;
      color: ${options.colors?.body || '#000000'} !important;
      page-break-inside: avoid;
    }
    ul {
      margin-top: 4pt;
      margin-bottom: 8pt; /* Reduced from 10pt */
      padding-left: 0;
      list-style-type: none;
      page-break-inside: avoid;
    }
    li {
      margin-bottom: 3pt; /* Reduced from 5pt to 3pt for tighter bullet spacing */
      padding-left: 15pt;
      text-indent: -15pt;
      font-size: 11pt;
      page-break-inside: avoid;
      color: ${options.colors?.body || '#000000'} !important;
      position: relative;
      line-height: ${lineSpacing};
    }
    li:before {
      content: "• ";
      font-size: 12pt;
      color: ${options.colors?.bullet || '#000000'};
      margin-right: 5pt;
      vertical-align: middle;
      position: relative;
      top: -1pt;
    }
    p {
      margin-bottom: 5pt;
      margin-top: 0;
      font-size: 11pt;
      page-break-inside: avoid;
      color: #000000 !important;
    }
    .contact-info {
      text-align: left;
      margin-bottom: 4pt;
      font-size: 10pt;
      color: #000000;
    }
    .header-divider {
      display: block;
      border-bottom: 1px solid #dddddd;
      height: 1px;
      width: 100%;
      margin-top: 10px;
      margin-bottom: 10px;
      clear: both;
    }
    .summary-spacing {
      margin-top: 10px !important;
      display: block;
      height: 1px;
      width: 100%;
    }
    .hidden {
      display: none;
    }
    
    /* REMOVED the contact-info:after CSS rule that was causing the double line */
    
    /* Prevent section headings from splitting across pages */
    h2, h2 + p, h2 + ul {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    
    /* Prevent orphaned section content */
    h2:not(:first-of-type) {
      page-break-before: auto;
    }
    
    /* Prevent words from breaking across lines/pages */
    * {
      word-break: keep-all !important;
      word-wrap: normal !important;
      page-break-inside: avoid !important;
      overflow-wrap: normal !important;
      hyphens: none !important;
    }
    
    /* When a job is less than 20% of page from bottom, try to push to next page */
    @media print {
      .job-section {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        orphans: 4;  /* Require at least 4 lines at bottom of page */
        widows: 4;   /* Require at least 4 lines at top of page */
        display: block;
      }
      
      h3 {
        page-break-before: auto !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      }
      
      h2 {
        page-break-before: always !important;
        break-before: always !important;
      }
      
      h2:first-of-type {
        page-break-before: avoid !important;
        break-before: avoid !important;
      }
      
      /* Force specific job positions that are known to cause issues */
      .lab-manager-section {
        page-break-before: always !important;
        break-before: always !important;
      }
    }
    
    /* Keep job roles together */
    h3, h3 + .company-name, h3 + .company-name + ul {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      orphans: 4;
      widows: 4;
    }
  `;
  
  // Create a custom renderer that handles resume-specific formatting
  // Replace the resumeRenderer function with this updated version that doesn't add a duplicate divider
const resumeRenderer = (content: string, element: HTMLElement) => {
  // Special preprocessing for skill entries
  content = content.replace(/^(\s*[\*-]\s+)\*\*([^:]+):\*\*(.*)$/gm, '$1__SKILL_START__$2__SKILL_MID__$3__SKILL_END__');
  
  const lines = content.split('\n');
  let htmlContent = '';
  let inList = false;
  
  // Find titles to remove (but keep their content)
  const titlesToRemoveOnly = options.removeTitlesOnly || ["PROFESSIONAL SUMMARY"];
  
  // Keep track of open job sections
  let inJobSection = false;
  let isLastBulletProcessed = false;
  let contactInfoAdded = false;
  let summaryStarted = false;
  let dividerAdded = false; // Track if we've already added a divider
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      // Empty line
      if (inList) {
        htmlContent += '</ul>';
        inList = false;
      }
      continue;
    }
    
    // Process special markers
    if (line === '<!--CONTACT_DIVIDER-->') {
      // Add the horizontal line with proper spacing, but only if we haven't already added one
      if (!dividerAdded) {
        htmlContent += '<div class="header-divider" style="border-bottom: 1px solid #dddddd; margin-top: 10px; margin-bottom: 10px; height: 1px; width: 100%; display: block;"></div>';
        dividerAdded = true; // Mark that we've added a divider
      }
      continue;
    }
    
    if (line === '<!--SUMMARY_START-->') {
      // Add spacing before summary content
      htmlContent += '<div class="summary-spacing" style="margin-top: 30px;"></div>';
      summaryStarted = true;
      continue;
    }
    
    // Process special page break hints
    if (line === '<!-- PAGE BREAK -->') {
      htmlContent += '<div style="page-break-before: always;"></div>';
      continue;
    }
    
    // Handle headings
    if (line.startsWith('# ')) {
      htmlContent += `<h1 style="color:${options.colors?.name || '#000000'} !important">` + line.substring(2) + '</h1>';
    }
    else if (line.startsWith('## ')) {
      const headingText = line.substring(3);
      
      // Skip this heading if it's marked for removal
      if (headingText === '__REMOVE_THIS_HEADING__') {
        continue;
      }
      
      // Skip this heading if it's in the removeTitlesOnly list
      if (titlesToRemoveOnly.some(title => headingText.toUpperCase() === title.toUpperCase())) {
        // Add spacing instead of the heading
        htmlContent += '<div style="margin-top: 20px;"></div>';
        continue;
      }
      htmlContent += `<h2 style="color:${options.colors?.headings || '#000000'} !important">` + headingText + '</h2>';
    }
    else if (line.startsWith('### ')) {
      // Check if we need to close a previous job section
      if (inJobSection) {
        htmlContent += `</div><!-- end job-section -->`;
        inJobSection = false;
      }
      
      // FIX: Process h3 properly for job titles with right-aligned dates
      const headingText = line.substring(4);
      
      // Set the job section flag
      inJobSection = true;
      isLastBulletProcessed = false;
      
      // Check for span tags which indicate job title with aligned date
      if (headingText.includes('<span style="float:right">')) {
        const parts = headingText.split('<span style="float:right">');
        const jobTitle = parts[0].trim();
        const dateRange = parts[1].replace('</span>', '').trim();
        
        // Start a job section div to keep content together
        htmlContent += `<div class="job-section">`;
        htmlContent += `<h3 style="color:${options.colors?.subheadings || '#000000'} !important; margin-bottom: 0;">${jobTitle}<span style="float: right; font-weight: normal;">${dateRange}</span></h3>`;
        
        // Check if next line is the company (not starting with formatting)
        if (i < lines.length - 1 && !lines[i+1].startsWith('#') && !lines[i+1].startsWith('-')) {
          const companyLine = lines[i+1].trim();
          if (companyLine) {
            // Add the company name in non-bold text
            htmlContent += `<div class="company-name">${companyLine}</div>`;
            i++; // Skip the company line as we've incorporated it
          }
        }
      } else if (headingText.includes(' | ')) {
        // Handle the format "Title | Date" or "Company | Title"
        const parts = headingText.split(' | ');
        
        // Start a job section div to keep content together
        htmlContent += `<div class="job-section">`;
        
        if (options.companyNameBeforeTitle) {
          // Format: "Company | Date" with job title potentially on next line
          const company = parts[0];
          const date = parts.length > 1 ? parts[parts.length - 1] : '';
          
          htmlContent += `<h3 style="color:${options.colors?.subheadings || '#000000'} !important; margin-bottom: 0;">${company}<span style="float: right; font-weight: normal;">${date}</span></h3>`;
          
          // Check if next line is a job title
          if (i < lines.length - 1 && lines[i+1].startsWith('#### ')) {
            const jobTitle = lines[i+1].substring(5);
            htmlContent += `<div class="company-name">${jobTitle}</div>`;
            i++; // Skip the next line as we've incorporated it
          }
        } else {
          // Format: "Title | Date"
          const title = parts[0];
          const date = parts.length > 1 ? parts[parts.length - 1] : '';
          
          htmlContent += `<h3 style="color:${options.colors?.subheadings || '#000000'} !important">${title}<span style="float: right; font-weight: normal;">${date}</span></h3>`;
          
          // Check if next line is the company name
          if (i < lines.length - 1 && !lines[i+1].startsWith('#') && !lines[i+1].startsWith('-')) {
            const companyLine = lines[i+1].trim();
            if (companyLine) {
              // Add the company name in non-bold text
              htmlContent += `<div class="company-name">${companyLine}</div>`;
              i++; // Skip the company line as we've incorporated it
            }
          }
        }
      } else {
        // Regular h3 heading
        htmlContent += `<div class="job-section">`;
        htmlContent += `<h3 style="color:${options.colors?.subheadings || '#000000'} !important">` + headingText + '</h3>';
      }
    }
    else if (line.startsWith('#### ')) {
      htmlContent += `<div class="company-name">` + line.substring(5) + '</div>';
    }
    // Handle bullet points
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      const prefix = line.startsWith('- ') ? '- ' : '* ';
      
      if (!inList) {
        htmlContent += '<ul>';
        inList = true;
      }
      
      let itemContent = line.substring(prefix.length);
      
      // Handle special pre-processed skill entries
      const skillSpecialMatch = itemContent.match(/^__SKILL_START__([^_]+)__SKILL_MID__(.*)__SKILL_END__$/);
      if (skillSpecialMatch) {
        const skillName = skillSpecialMatch[1].trim();
        const skillDescription = skillSpecialMatch[2].trim();
        
        // Format with skill name in bold
        itemContent = `<b style="color:${options.colors?.subheadings || '#000000'} !important">${skillName}:</b> ${skillDescription}`;
      }
      // Handle ** at start and end of skill titles - special case for skills section
      else if (itemContent.match(/^\s*\*\*\s*([^:]+):\s*\*\*\s*(.*)/)) {
        const skillMatch = itemContent.match(/^\s*\*\*\s*([^:]+):\s*\*\*\s*(.*)/);
        if (skillMatch) {
          const skillName = skillMatch[1].trim();
          const skillDescription = skillMatch[2].trim();
          
          // Format with skill name in bold
          itemContent = `<b style="color:${options.colors?.subheadings || '#000000'} !important">${skillName}:</b> ${skillDescription}`;
        }
      } 
      // Check if the bullet point starts with a skill name followed by a colon
      else {
        const skillColonMatch = itemContent.match(/^([^:]+):(.*)/);
        if (skillColonMatch) {
          const skillName = skillColonMatch[1].trim();
          const skillDescription = skillColonMatch[2].trim();
          
          // Format with skill name in bold
          itemContent = `<b style="color:${options.colors?.subheadings || '#000000'} !important">${skillName}:</b> ${skillDescription}`;
        } else {
          // Handle regular bold text with ** markers (no spaces between asterisks)
          itemContent = itemContent.replace(/\*\*([^*]+)\*\*/g, `<b style="color:${options.colors?.body || '#000000'} !important">$1</b>`);
        }
      }
      
      // Handle italic text with * markers (single asterisk)
      itemContent = itemContent.replace(/(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)/g, `<i style="color:${options.colors?.body || '#000000'} !important">$1</i>`);
      
      // Handle links [text](url)
      itemContent = itemContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" style="color:#0000FF !important">$1</a>`);
      
      htmlContent += `<li>${itemContent}</li>`;
      
      // Mark that we've processed a bullet (to help with job section tracking)
      isLastBulletProcessed = true;
    }
    // Handle regular paragraphs
    else {
      // Check if we need to close a job section
      if (inJobSection && !line.startsWith('- ') && !line.startsWith('* ')) {
        htmlContent += `</div><!-- end job-section -->`;
        inJobSection = false;
      }
      
      if (inList) {
        htmlContent += '</ul>';
        inList = false;
      }
      
      // Process markdown formatting
      let formattedLine = line;
      // Bold with ** markers
      formattedLine = formattedLine.replace(/\*\*([^*]+)\*\*/g, '<b style="color:#000000 !important">$1</b>');
      // Italic with * markers (single asterisk)
      formattedLine = formattedLine.replace(/(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)/g, '<i style="color:#000000 !important">$1</i>');
      // Links [text](url)
      formattedLine = formattedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#000066 !important">$1</a>');
      
      // If this looks like a contact info line (right after name), format it specially
      if (i > 0 && lines[i-1].startsWith('# ')) {
        // Add contact info
        htmlContent += '<div class="contact-info">' + formattedLine + '</div>';
        contactInfoAdded = true;
      } else {
        htmlContent += '<p style="color:#000000 !important">' + formattedLine + '</p>';
      }
    }
  }
  
  // Close any open list or job section
  if (inList) {
    htmlContent += '</ul>';
  }
  
  if (inJobSection) {
    htmlContent += `</div><!-- end job-section -->`;
  }
  
  element.innerHTML = htmlContent;
  
  // Post-processing: Add horizontal line after contact info ONLY if we haven't added one already
  if (!dividerAdded) {
    const contactInfoWrapper = element.querySelector('.contact-info');
    if (contactInfoWrapper && 
        (!contactInfoWrapper.nextElementSibling || 
         !contactInfoWrapper.nextElementSibling.classList.contains('header-divider'))) {
      // Create a line element with styles
      const lineElement = document.createElement('div');
      lineElement.className = 'header-divider';
      lineElement.style.borderBottom = '1px solid #dddddd';
      lineElement.style.width = '100%';
      lineElement.style.display = 'block';
      lineElement.style.height = '1px';
      lineElement.style.marginTop = '10px';
      lineElement.style.marginBottom = '30px';
      lineElement.style.clear = 'both';
      
      // Insert after contact info
      contactInfoWrapper.after(lineElement);
    }
  }
  
  // Post-processing: fix any extraneous words or unwanted elements
  const unwantedWords = ['undefined', 'null', 'NaN', 'Specify Year'];
  const allTextNodes = getTextNodes(element);
  
  allTextNodes.forEach(node => {
    if (node.nodeValue) {
      unwantedWords.forEach(word => {
        // Replace the unwanted word with empty string
        node.nodeValue = node.nodeValue!.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
      });
    }
  });
  
  // Ensure proper styling
  const allElements = element.querySelectorAll('*');
  allElements.forEach(el => {
    (el as HTMLElement).style.color = '#000000';
  });
};
  // Helper to get all text nodes in an element (for text cleaning)
  const getTextNodes = (node: Node): Text[] => {
    const textNodes: Text[] = [];
    
    const walker = document.createTreeWalker(
      node, 
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let currentNode: Node | null;
    while (currentNode = walker.nextNode()) {
      textNodes.push(currentNode as Text);
    }
    
    return textNodes;
  };
  
  // Extend the options with our resume-specific settings
  const enhancedOptions: PdfExportOptions = {
    ...options,
    customStyles: resumeStyles + (options.customStyles || ''),
    customRenderer: resumeRenderer,
    margin: [0.25, 0.25, 0.25, 0.25], // 0.25" margins all around
    pageSize: 'letter',
    orientation: 'portrait',
    // Ensure our option is explicitly defined
    removeSummaryTitle: options.removeSummaryTitle === true,
    
    // Use special PDF settings to avoid breaking job sections
    extraCss: `
      @page {
        size: letter portrait;
        margin: 0.25in 0.25in 0.25in 0.25in;
      }
      .lab-manager-section {
        page-break-before: always !important;
      }
      .job-section {
        page-break-inside: avoid !important;
      }
      h2, h3 {
        page-break-after: avoid !important;
        page-break-inside: avoid !important;
      }
      h2 + p, h3 + p {
        page-break-inside: avoid !important;
      }
      p, li {
        page-break-inside: avoid !important;
      }
      /* Add this override to ensure the contact-info:after doesn't appear */
      .contact-info:after {
        display: none !important;
      }
      .contact-info + .header-divider {
        display: block !important;
        height: 1px !important;
        background-color: #dddddd !important;
        margin-top: 10px !important;
        margin-bottom: 10px !important;
        width: 100% !important;
      }
      .summary-spacing {
        margin-top: 10px !important;
      }
    `,
  };
  
  // Call the generic PDF exporter with our specialized options
  await exportContentToPdf({
    content: cleanedContent,
    contentType,
    metadata,
    options: enhancedOptions
  });
};
