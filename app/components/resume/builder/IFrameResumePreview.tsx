// app/components/resume/builder/IFrameResumePreview.tsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { ResumeSection } from '@/app/lib/types';
import './iframe-preview.css';

interface IFrameResumePreviewProps {
  sections: ResumeSection[];
}

const IFrameResumePreview: React.FC<IFrameResumePreviewProps> = ({ sections }) => {
  // Ref for the container used to determine available width (for scaling)
  const containerRef = useRef<HTMLDivElement>(null);
  // Ref for the iframe itself
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Scale state (defaults to 1, no scaling)
  const [scale, setScale] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Use a resize listener to set the scale such that the content fits the container better.
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        // Calculate the available space with minimal margins
        const availableWidth = containerWidth - 20; // Smaller margin for better fill
        const baseWidth = 816; // Standard letter width (8.5" × 96dpi)
        
        // Calculate scale to better fill the available width
        let newScale = Math.min(availableWidth / baseWidth, 1.2); // Allow up to 120% scaling
        
        // Apply a higher minimum scale for better visibility
        newScale = Math.max(newScale, 0.85);
        
        setScale(newScale);
      }
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Function to generate the resume's HTML (including page break markers)
  const generateResumeHTML = (sections: ResumeSection[]): string => {
    let html = '';

    // Extract header section
    const headerSection = sections.find(section =>
      section.type === 'HEADER' ||
      section.title.toLowerCase().includes('header')
    );

    if (headerSection) {
      const nameMatch = headerSection.content.match(/<h1[^>]*>(.*?)<\/h1>/i);
      const contactMatch = headerSection.content.match(/<p[^>]*>(.*?)<\/p>/i);
      const name = nameMatch ? nameMatch[1] : 'Your Name';
      // Only add BASc if it's not already included in the name
      const fullName = name.toLowerCase().includes('basc') ? name : `${name}, BASc.`;

      html += '<div class="resume-header no-break">';
      html += `<h1>${fullName}</h1>`;

      if (contactMatch) {
        const contactInfo = contactMatch[1];
        const parts = contactInfo.split('|').map(part => part.trim());
        html += '<div class="contact-info">';
        
        // Only add spans if the corresponding part exists
        for (let i = 0; i < 3; i++) {
          if (parts[i]) {
            html += `<span>${parts[i]}</span>`;
          }
        }
        
        html += '</div>';
      }
      html += '</div>';
    }

    // Extract summary section
    const summarySection = sections.find(section =>
      section.type === 'SUMMARY' ||
      section.title.toLowerCase().includes('summary')
    );

    if (summarySection) {
      const summaryMatch = summarySection.content.match(/<p[^>]*>(.*?)<\/p>/i);
      if (summaryMatch) {
        html += `<div class="resume-summary no-break"><p>${summaryMatch[1]}</p></div>`;
      } else {
        html += `<div class="resume-summary no-break">${summarySection.content}</div>`;
      }
    }

    // Extract experience sections and job roles
    const experienceSections = sections.filter(section =>
      section.type === 'EXPERIENCE' ||
      section.title.toLowerCase().includes('experience')
    );
    const jobRoleSections = sections.filter(section => section.type === 'JOB_ROLE');

    // Function to get job roles for a specific experience section
    const getJobRoles = (experienceId: string) => {
      return jobRoleSections.filter(section => section.parentId === experienceId);
    };

    // Process experience sections
    if (experienceSections.length > 0) {
      // Add the first experience section heading
      html += `<div class="section-heading no-break">${experienceSections[0].title}</div>`;
      
      // Get job roles for the first experience section
      const allJobRoles = getJobRoles(experienceSections[0].id);
      
      if (allJobRoles.length > 0) {
        // Format all job roles
        for (let i = 0; i < allJobRoles.length; i++) {
          // Add the job role
          html += formatJobRole(allJobRoles[i]);
        }
      }
    }

    // Education section
    const educationSection = sections.find(section =>
      section.type === 'EDUCATION' ||
      section.title.toLowerCase().includes('education')
    );
    
    if (educationSection) {
      html += `<div class="section-heading no-break">${educationSection.title}</div>`;
      html += `<div class="education-content no-break">${educationSection.content}</div>`;
    }

    // Other sections
    const otherSections = sections.filter(section =>
      section.type !== 'HEADER' &&
      section.type !== 'SUMMARY' &&
      section.type !== 'EXPERIENCE' &&
      section.type !== 'JOB_ROLE' &&
      section.type !== 'EDUCATION' &&
      !section.title.toLowerCase().includes('header') &&
      !section.title.toLowerCase().includes('summary') &&
      !section.title.toLowerCase().includes('experience') &&
      !section.title.toLowerCase().includes('education')
    );
    
    otherSections.forEach(section => {
      html += `<div class="section-heading no-break">${section.title}</div>`;
      html += `<div class="section-content no-break">${section.content}</div>`;
    });
    
    return html;
  };

  // Helper to format a job role
  const formatJobRole = (jobRole: ResumeSection): string => {
    const titleMatch = jobRole.content.match(/<h3[^>]*>(.*?)<\/h3>/i);
    const companyMatch = jobRole.content.match(/<p[^>]*>(.*?)<\/p>/i);
    let title = titleMatch ? titleMatch[1] : jobRole.title;
    let company = '';
    let dateRange = '';
    
    if (companyMatch && companyMatch[1]) {
      const parts = companyMatch[1].split('|');
      if (parts.length >= 2) {
        company = parts[0].trim();
        dateRange = parts[1].trim();
      } else {
        company = companyMatch[1];
      }
    }
    
    // Remove h3 and p tags from bullet content
    let bulletContent = jobRole.content;
    if (titleMatch) {
      bulletContent = bulletContent.replace(titleMatch[0], '');
    }
    if (companyMatch) {
      bulletContent = bulletContent.replace(companyMatch[0], '');
    }
    
    // Ensure bullet content is properly formatted with correct classes
    bulletContent = bulletContent.replace(/<ul/g, '<ul class="resume-bullets"');
    bulletContent = bulletContent.replace(/<li>/g, '<li class="resume-bullet-item">');
    
    // Add class to prevent breaking within a job role
    return `
      <div class="job-role no-break">
        <div class="job-header">
          <div class="job-title">${title}</div>
          <div class="job-date">${dateRange}</div>
        </div>
        <div class="company-name">${company}</div>
        <div class="job-bullets">${bulletContent}</div>
      </div>
    `;
  };

  const generateCSS = () => {
    return `
      /* Define page size and margins for printing */
      @page {
        size: letter;
        margin: 0.25in;
      }
      /* Base styles - standard letter size formatting */
      body {
        font-family: Arial, sans-serif;
        font-size: 10pt;
        line-height: 1.4;
        color: #000;
        margin: 0;
        padding: 0 0.25in 0.25in 0.25in; /* Remove top padding, keep sides and bottom */
        box-sizing: border-box;
        width: 8.5in;
        min-height: 11in;
        background-color: white;
        position: relative;
        overflow-x: hidden;
        overflow-y: visible; /* Allow vertical scrolling within iframe */
        height: auto; /* Allow body to expand with content */
      }
      /* Ensure all content fits horizontally */
      * {
        max-width: 100%;
        word-wrap: break-word;
      }
      /* Header styles */
      .resume-header {
        text-align: center;
        margin-top: 0; /* No top margin */
        margin-bottom: 1rem;
      }
      .resume-header h1 {
        font-size: 16pt;
        font-weight: bold;
        color: #1a4977;
        margin-top: 0; /* No top margin */
        margin-bottom: 0.5rem;
      }
      .contact-info {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid #c2d1d9;
        padding-bottom: 0.25rem;
        font-size: 10pt;
      }
      .contact-info span {
        margin-right: 10px;
      }
      /* Section styles */
      .section-heading {
        font-size: 12pt;
        font-weight: bold;
        text-transform: uppercase;
        background-color: #f0f0f0;
        text-align: center;
        padding: 0.25rem;
        margin: 1rem 0 0.5rem;
        border-bottom: 1px solid #ddd;
      }
      /* Job role styles */
      .job-role { 
        margin-bottom: 1rem;
        font-size: 10pt;
      }
      .job-header { 
        display: flex; 
        justify-content: space-between; 
        align-items: flex-start;
      }
      .job-title { 
        font-size: 10.5pt; 
        font-weight: bold;
        margin-right: 20px;
      }
      .job-date { 
        font-size: 10.5pt; 
        font-weight: bold;
        white-space: nowrap;
      }
      .company-name { 
        font-size: 10.5pt; 
        font-weight: normal;
        margin-bottom: 0.25rem;
      }
      .job-bullets ul { 
        margin-top: 0.25rem; 
        padding-left: 1.25rem; 
        list-style-type: disc;
        font-size: 10pt;
      }
      .job-bullets li { 
        margin-bottom: 0.125rem;
        font-size: 10pt;
      }
      /* Ensure resume bullet items have proper font size */
      .resume-bullet-item {
        font-size: 10pt;
      }
      /* Continuation header */
      .continuation-header {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid #c2d1d9;
        padding-bottom: 0.25rem;
        margin-bottom: 0.75rem;
      }
      .continuation-header .name { 
        font-weight: bold; 
        color: #1a4977;
        font-size: 10.5pt;
      }
      .continuation-header .continued { 
        font-style: italic;
        color: #666;
        font-size: 10pt;
      }
      /* Additional styles for education and other sections */
      .education-content, .section-content {
        margin-bottom: 1rem;
        font-size: 10pt;
      }
      /* Page break indicator */
      .page-break {
        border-top: 2px dashed #aaa;
        margin: 0.5in 0;
        position: relative;
        text-align: center;
        page-break-before: always; /* Force page break in print */
      }
      .page-break::before {
        content: 'Page Break';
        position: absolute;
        top: -0.5rem;
        left: 50%;
        transform: translateX(-50%);
        background-color: white;
        padding: 0 0.5rem;
        font-size: 9pt;
        color: #777;
      }
      /* Make sure content stays within proper dimensions */
      .page-content {
        box-sizing: border-box;
        max-width: 8in; /* Account for margins */
      }
      
      /* Fixed size page containers */
      .resume-page {
        width: 8.5in;
        height: 11in;
        padding: 0.25in;
        margin: 0 auto 0.5in auto; /* Add bottom margin between pages */
        position: relative;
        overflow: visible; /* Changed to visible */
        page-break-after: always;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        background-color: white;
        box-sizing: border-box;
      }
      
      /* Prevent page breaks inside elements unless explicitly allowed */
      .no-break {
        page-break-inside: avoid;
      }
      
      /* Special styling for forced page breaks */
      .forced-break {
        display: block;
        height: 2px;
        border-top: 2px dashed #aaa;
        margin: 0.25in 0;
        position: relative;
        text-align: center;
      }
      
      .forced-break::before {
        content: 'Page Break';
        position: absolute;
        top: -0.5rem;
        left: 50%;
        transform: translateX(-50%);
        background-color: white;
        padding: 0 0.5rem;
        font-size: 9pt;
        color: #777;
      }
      
      /* html element needs to expand to show all pages */
      html {
        height: auto;
        overflow: visible;
      }
      
      /* Print styles */
      @media print {
        body {
          width: 8.5in;
          height: 11in;
          padding: 0.25in;
          margin: 0;
          overflow: hidden;
        }
        .page-break { 
          display: block; 
          page-break-before: always; 
          border: none;
          margin: 0;
          height: 0;
        }
        .page-break::before {
          display: none;
        }
        
        .resume-page {
          box-shadow: none;
          margin-bottom: 0;
        }
        
        .forced-break {
          display: none;
        }
        
        /* Ensure proper page size for PDF export */
        @page {
          size: letter;
          margin: 0.25in;
        }
        
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `;
  };

  // Generate HTML and write to the iframe whenever sections change.
  useEffect(() => {
    const generateHTML = () => {
      if (iframeRef.current && iframeRef.current.contentDocument) {
        setIsLoading(true);
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>Resume Preview</title>
              <style>
                ${generateCSS()}
                /* Additional styles to ensure content is displayed properly */
                html, body {
                  width: 8.5in;
                  margin: 0 auto;
                  padding: 0 0.25in 0.25in 0.25in; /* No top padding */
                  overflow-x: hidden;
                  overflow-y: visible;
                }
                /* Ensure all elements maintain their original styling */
                * {
                  box-sizing: border-box;
                }
              </style>
              <script>
                // Script to calculate and enforce exact page breaks based on standard 8.5" x 11" pages
                window.addEventListener('load', function() {
                  // Page dimensions in pixels (8.5" x 11" at 96 DPI, minus margins)
                  const pageHeight = 10.5 * 96; // 10.5 inches at 96 DPI (accounting for margins)
                  
                  // Track current page height and create first page container
                  let currentPageHeight = 0;
                  let currentPage = document.createElement('div');
                  currentPage.className = 'resume-page';
                  
                  // Process each element in the body
                  const elements = Array.from(document.body.children);
                  const contentElements = elements.filter(el => !el.classList.contains('resume-page'));
                  
                  // First, add the currentPage to the body
                  document.body.appendChild(currentPage);
                  
                  // Process each element
                  contentElements.forEach(element => {
                    // Skip resume-page containers
                    if (element.classList.contains('resume-page')) {
                      return;
                    }
                    
                    // Remove element from the original flow
                    if (element.parentNode) {
                      element.parentNode.removeChild(element);
                    }
                    
                    // Get element height
                    const clone = element.cloneNode(true);
                    document.body.appendChild(clone);
                    const elementHeight = clone.offsetHeight;
                    document.body.removeChild(clone);
                    
                    // Check if the element would fit on the current page
                    const isNoBreak = element.classList.contains('no-break');
                    
                    if (currentPageHeight + elementHeight > pageHeight && currentPageHeight > 0 && !isNoBreak) {
                      // Element won't fit on current page, create a page break
                      const pageBreak = document.createElement('div');
                      pageBreak.className = 'forced-break';
                      currentPage.appendChild(pageBreak);
                      
                      // Create a new page
                      currentPage = document.createElement('div');
                      currentPage.className = 'resume-page';
                      document.body.appendChild(currentPage);
                      
                      // Reset current page height
                      currentPageHeight = 0;
                      
                      // If it's not the header section and we've already processed some content,
                      // add a continuation header
                      const isHeaderSection = element.classList.contains('resume-header');
                      if (!isHeaderSection && document.querySelector('.resume-header')) {
                        const headerContent = document.querySelector('.resume-header').cloneNode(true);
                        const continuationHeader = document.createElement('div');
                        continuationHeader.className = 'continuation-header';
                        
                        // Get the name from the header
                        const nameElement = headerContent.querySelector('h1');
                        const name = nameElement ? nameElement.textContent : 'Your Name';
                        
                        // Create continuation header with name and "Continued" text
                        continuationHeader.innerHTML = \`
                          <div class="name">\${name}</div>
                          <div class="continued">Continued</div>
                        \`;
                        
                        // Add continuation header to the new page
                        currentPage.appendChild(continuationHeader);
                        currentPageHeight += continuationHeader.offsetHeight;
                      }
                    }
                    
                    // Add element to current page
                    currentPage.appendChild(element);
                    currentPageHeight += elementHeight;
                  });
                  
                  // Remove any original content that's not in a page container
                  document.querySelectorAll('body > *:not(.resume-page)').forEach(el => {
                    el.parentNode.removeChild(el);
                  });
                });
              </script>
            </head>
            <body>
              ${generateResumeHTML(sections)}
            </body>
          </html>
        `;
        
        const doc = iframeRef.current.contentDocument;
        doc.open();
        doc.write(htmlContent);
        doc.close();
        
        // Add handlers to ensure scrolling works properly
        setTimeout(() => {
          try {
            if (iframeRef.current && iframeRef.current.contentWindow) {
              // Make sure scrolling works
              if (iframeRef.current.contentDocument && iframeRef.current.contentDocument.body) {
                iframeRef.current.contentDocument.body.style.overflow = 'visible';
              }
            }
          } catch (e) {
            console.error("Error setting up iframe:", e);
          }
          setIsLoading(false);
        }, 800); // Increased timeout to ensure page calculation completes
      }
    };
    generateHTML();
  }, [sections]);

  return (
    <div className="iframe-resume-preview">
      <div className="preview-controls">
        <h2>Preview</h2>
        <div className="preview-controls-buttons">
          <button
            className="print-button"
            onClick={() => {
              if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.print();
              }
            }}
          >
            Print Preview
          </button>
          <button
            className="export-pdf-button"
            onClick={() => {
              if (iframeRef.current) {
                // Get the iframe document
                const iframeDocument = iframeRef.current.contentDocument;
                if (!iframeDocument) return;
                
                // Create a temporary link element for downloading the PDF
                const link = document.createElement('a');
                link.style.display = 'none';
                
                // Set up the HTML content for PDF conversion
                const htmlContent = iframeDocument.documentElement.outerHTML;
                
                // Convert HTML to a data URL
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const htmlURL = URL.createObjectURL(blob);
                
                // Use print to PDF functionality
                const win = window.open(htmlURL, '_blank');
                if (win) {
                  setTimeout(() => {
                    win.document.title = "Resume.pdf";
                    win.print();
                    URL.revokeObjectURL(htmlURL);
                  }, 250);
                } else {
                  alert("Please allow popups to export the resume as PDF");
                }
              }
            }}
          >
            Export PDF
          </button>
        </div>
      </div>
      <div ref={containerRef} className="iframe-container">
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <div>Loading preview...</div>
          </div>
        )}
        {/* The scale-wrapper applies a dynamic transform for pure zoom effect */}
        <div
          className="scale-wrapper"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            width: '816px', // Standard letter width (8.5" × 96dpi)
            maxWidth: '100%'
          }}
        >
          <iframe
            ref={iframeRef}
            title="Resume Preview"
            className="resume-iframe"
            style={{ 
              width: '100%', 
              height: '100%', // Changed to full height to show all content
              minHeight: '700px',
              border: 'none',
              overflow: 'visible' // Changed to visible to show all content
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default IFrameResumePreview;
