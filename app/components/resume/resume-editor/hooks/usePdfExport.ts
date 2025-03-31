// app/components/resume/resume-editor/hooks/usePdfExport.ts
import { useState, useEffect, useCallback } from 'react';
import { ResumeSection, ResumeSectionType } from '@/app/lib/types';

/**
 * Custom hook for handling PDF export functionality
 * Converts resume sections into a format suitable for PDF export
 * 
 * @param resumeSections Array of resume sections to be exported
 * @param getSectionTypeOrder Function to determine section display order
 * @returns Object containing PDF export content and update function
 */
export function usePdfExport(
  resumeSections: ResumeSection[],
  getSectionTypeOrder: (type: ResumeSectionType) => number
) {
  // State to store the formatted content for PDF export
  const [pdfExportContent, setPdfExportContent] = useState<string>('');

  /**
   * Converts resume sections to a format suitable for PDF export
   * Creates a markdown structure that the PDF exporter can process
   */
  const updatePdfExportContent = useCallback(() => {
    if (resumeSections.length === 0) {
      setPdfExportContent('');
      return;
    }

    // First, sort sections in the proper order
    const sortedSectionsForExport = [...resumeSections].sort((a, b) => {
      const orderA = getSectionTypeOrder(a.type);
      const orderB = getSectionTypeOrder(b.type);
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return resumeSections.indexOf(a) - resumeSections.indexOf(b);
    });
    
    // Create a markdown structure for the resume
    let markdownContent = '';
    
    // Add header section (name) if it exists
    const headerSection = sortedSectionsForExport.find(s => s.type === ResumeSectionType.HEADER);
    if (headerSection) {
      // Extract name from HTML content using a temporary element
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = headerSection.content;
      const nameElement = tempDiv.querySelector('h1, h2, h3, h4') || tempDiv;
      markdownContent += `# ${nameElement.textContent?.trim()}\n\n`;
      
      // Add contact info if present
      const contactElements = tempDiv.querySelectorAll('p, div:not(:has(h1,h2,h3,h4))');
      if (contactElements.length) {
        contactElements.forEach(element => {
          const text = element.textContent?.trim();
          if (text) markdownContent += `${text}\n`;
        });
        markdownContent += '\n';
      }
    }
    
    // Process each section, converting HTML to markdown-like format
    sortedSectionsForExport.forEach(section => {
      if (section.type === ResumeSectionType.HEADER) return; // Skip header as it's already processed
      
      // Only process top-level sections (non-job roles)
      if (section.parentId) return;
      
      // Add section title as markdown heading
      markdownContent += `## ${section.title.toUpperCase()}\n\n`;
      
      // For experience section, also include its child job roles
      if (section.type === ResumeSectionType.EXPERIENCE) {
        // Process each job role that belongs to this experience section
        const jobRoles = resumeSections.filter(s => s.parentId === section.id);
        jobRoles.forEach(jobRole => {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = jobRole.content;
          
          // Extract job title and company/date
          const titleElement = tempDiv.querySelector('h3') || tempDiv.querySelector('h4');
          if (titleElement) {
            // Assume format is "Job Title, Company | Date Range" or "Company | Date Range"
            const titleText = titleElement.textContent?.trim() || '';
            if (titleText.includes('|')) {
              markdownContent += `### ${titleText}\n\n`;
            } else {
              markdownContent += `### ${titleText} | Present\n\n`;
            }
          }
          
          // Extract paragraphs
          const paragraphs = tempDiv.querySelectorAll('p');
          paragraphs.forEach(p => {
            const text = p.textContent?.trim();
            if (text) markdownContent += `${text}\n\n`;
          });
          
          // Extract bullet points
          const listItems = tempDiv.querySelectorAll('li');
          if (listItems.length) {
            listItems.forEach(li => {
              const text = li.textContent?.trim();
              if (text) markdownContent += `* ${text}\n`;
            });
            markdownContent += '\n';
          }
        });
      } else {
        // For other sections, do a simpler conversion
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = section.content;
        
        // Extract all text content, preserving basic structure
        Array.from(tempDiv.childNodes).forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text) markdownContent += `${text}\n\n`;
          } else if (node.nodeName === 'P') {
            const text = node.textContent?.trim();
            if (text) markdownContent += `${text}\n\n`;
          } else if (node.nodeName === 'UL') {
            const items = (node as Element).querySelectorAll('li');
            items.forEach(item => {
              const text = item.textContent?.trim();
              if (text) markdownContent += `* ${text}\n`;
            });
            markdownContent += '\n';
          } else if (node.nodeName === 'H3' || node.nodeName === 'H4') {
            const text = node.textContent?.trim();
            if (text) markdownContent += `### ${text}\n\n`;
          }
        });
      }
    });
    
    setPdfExportContent(markdownContent);
  }, [resumeSections, getSectionTypeOrder]);

  // Update PDF export content whenever resumeSections change
  useEffect(() => {
    updatePdfExportContent();
  }, [resumeSections, updatePdfExportContent]);

  return {
    pdfExportContent,
    updatePdfExportContent
  };
}

export default usePdfExport;
