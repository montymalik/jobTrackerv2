'use client';

import React, { useState } from 'react';
import { ResumeSection } from '@/app/lib/types';
import './direct-preview.css';

interface DirectHTMLResumePreviewProps {
  sections: ResumeSection[];
}

const DirectHTMLResumePreview: React.FC<DirectHTMLResumePreviewProps> = ({ sections }) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  
  // Extract header section
  const headerSection = sections.find(section => 
    section.type === 'HEADER' || 
    section.title.toLowerCase().includes('header')
  );
  
  // Extract summary section
  const summarySection = sections.find(section => 
    section.type === 'SUMMARY' || 
    section.title.toLowerCase().includes('summary')
  );
  
  // Get experience sections
  const experienceSections = sections.filter(section => 
    section.type === 'EXPERIENCE' || 
    section.title.toLowerCase().includes('experience')
  );
  
  // Get job role sections
  const jobRoleSections = sections.filter(section => 
    section.type === 'JOB_ROLE'
  );
  
  // Get job roles for an experience section
  const getJobRoles = (experienceId: string) => {
    return jobRoleSections.filter(section => section.parentId === experienceId);
  };
  
  // Get education section
  const educationSection = sections.find(section => 
    section.type === 'EDUCATION' || 
    section.title.toLowerCase().includes('education')
  );
  
  // Get other sections
  const otherSections = sections.filter(section => 
    section.type !== 'HEADER' && 
    section.type !== 'SUMMARY' && 
    section.type !== 'EXPERIENCE' && 
    section.type !== 'JOB_ROLE' && 
    section.type !== 'EDUCATION' && 
    !section.title.toLowerCase().includes('education') && 
    !section.title.toLowerCase().includes('experience') && 
    !section.title.toLowerCase().includes('header') && 
    !section.title.toLowerCase().includes('summary')
  );
  
  // Extract name from header
  const extractName = () => {
    if (!headerSection) return 'Your Full Name';
    
    const nameMatch = headerSection.content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    return nameMatch ? nameMatch[1] : 'Your Full Name';
  };
  
  // Ensure job role content has right-aligned dates
  const formatJobRole = (content: string) => {
    // Extract job title
    const titleMatch = content.match(/<h3[^>]*>(.*?)<\/h3>/i);
    const title = titleMatch ? titleMatch[1] : '';
    
    // Extract company and date
    const companyMatch = content.match(/<p[^>]*>(.*?)<\/p>/i);
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
    
    // Get the rest of the content (bullets)
    let bulletContent = content;
    if (titleMatch) {
      bulletContent = bulletContent.replace(titleMatch[0], '');
    }
    if (companyMatch) {
      bulletContent = bulletContent.replace(companyMatch[0], '');
    }
    
    return `
      <div style="margin-bottom: 1rem;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="font-family: Arial; font-size: 10.5pt; font-weight: bold; color: #000000; text-align: left; vertical-align: top; padding: 0;">
              ${title}
            </td>
            <td style="font-family: Arial; font-size: 10.5pt; font-weight: bold; color: #000000; text-align: right; vertical-align: top; padding: 0; width: 30%;">
              ${dateRange}
            </td>
          </tr>
        </table>
        <div style="font-family: Arial; font-size: 10.5pt; margin-bottom: 0.2rem;">
          ${company}
        </div>
        ${bulletContent}
      </div>
    `;
  };
  
  // Generate page content with formatting
  const generatePageContent = () => {
    // Page 1 content
    let page1Content = '';
    
    // Header
    if (headerSection) {
      const nameContent = headerSection.content.replace(/<h1[^>]*>(.*?)<\/h1>/i, 
        '<h1 style="font-family: Arial; font-size: 16pt; font-weight: bold; color: #1a4977; text-align: center; margin: 0 0 0.5rem;">$1, BASc.</h1>');
        
      const contactContent = nameContent.replace(/<p[^>]*>(.*?)<\/p>/i, (match, content) => {
        const parts = content.split('|').map((part: string) => part.trim());
        return `
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #c2d1d9; padding-bottom: 0.25rem;">
            <div style="font-family: Arial; font-size: 10pt; color: #000000;">${parts[0] || ''}</div>
            <div style="font-family: Arial; font-size: 10pt; color: #000000;">${parts[1] || ''}</div>
            <div style="font-family: Arial; font-size: 10pt; color: #000000;">${parts[2] || ''}</div>
          </div>
        `;
      });
      
      page1Content += `<div style="margin-bottom: 1rem;">${contactContent}</div>`;
    }
    
    // Summary
    if (summarySection) {
      const summaryContent = summarySection.content.replace(/<p[^>]*>(.*?)<\/p>/i, 
        '<p style="font-family: Arial; font-size: 10pt; color: #000000; margin-bottom: 1rem;">$1</p>');
      
      page1Content += summaryContent;
    }
    
    // Experience - first job role only
    if (experienceSections.length > 0) {
      page1Content += `
        <div style="background-color: #f0f0f0; padding: 0.25rem; margin-bottom: 0.5rem; text-align: center; border-bottom: 1px solid #cccccc;">
          <div style="font-family: Arial; font-size: 12pt; font-weight: bold; color: #000000; text-transform: uppercase;">
            ${experienceSections[0].title}
          </div>
        </div>
      `;
      
      const jobRoles = getJobRoles(experienceSections[0].id);
      if (jobRoles.length > 0) {
        page1Content += formatJobRole(jobRoles[0].content);
      }
    }
    
    // Page 2 content
    let page2Content = '';
    const name = extractName();
    
    // Continuation header
    page2Content += `
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #c2d1d9; padding-bottom: 0.25rem; margin-bottom: 0.75rem;">
        <div style="font-family: Arial; font-size: 10pt; font-weight: bold; color: #1a4977;">${name}</div>
        <div style="font-family: Arial; font-size: 10pt; color: #000000;">Continued</div>
      </div>
    `;
    
    // Remaining job roles
    if (experienceSections.length > 0) {
      const jobRoles = getJobRoles(experienceSections[0].id);
      if (jobRoles.length > 1) {
        page2Content += `
          <div style="background-color: #f0f0f0; padding: 0.25rem; margin-bottom: 0.5rem; text-align: center; border-bottom: 1px solid #cccccc;">
            <div style="font-family: Arial; font-size: 12pt; font-weight: bold; color: #000000; text-transform: uppercase;">
              ${experienceSections[0].title}
            </div>
          </div>
        `;
        
        for (let i = 1; i < jobRoles.length; i++) {
          page2Content += formatJobRole(jobRoles[i].content);
        }
      }
    }
    
    // Education
    if (educationSection) {
      page2Content += `
        <div style="background-color: #f0f0f0; padding: 0.25rem; margin-bottom: 0.5rem; text-align: center; border-bottom: 1px solid #cccccc;">
          <div style="font-family: Arial; font-size: 12pt; font-weight: bold; color: #000000; text-transform: uppercase;">
            ${educationSection.title}
          </div>
        </div>
        <div style="font-family: Arial; font-size: 10pt; color: #000000; margin-bottom: 1rem;">
          ${educationSection.content}
        </div>
      `;
    }
    
    // Other sections
    otherSections.forEach(section => {
      page2Content += `
        <div style="background-color: #f0f0f0; padding: 0.25rem; margin-bottom: 0.5rem; text-align: center; border-bottom: 1px solid #cccccc;">
          <div style="font-family: Arial; font-size: 12pt; font-weight: bold; color: #000000; text-transform: uppercase;">
            ${section.title}
          </div>
        </div>
        <div style="font-family: Arial; font-size: 10pt; color: #000000; margin-bottom: 1rem;">
          ${section.content}
        </div>
      `;
    });
    
    const needsSecondPage = jobRoleSections.length > 1 || educationSection || otherSections.length > 0;
    
    return {
      page1Content,
      page2Content,
      needsSecondPage
    };
  };
  
  const { page1Content, page2Content, needsSecondPage } = generatePageContent();
  
  return (
    <div className="direct-resume-preview">
      <div className="preview-controls">
        <h2>Preview</h2>
        <div className="zoom-controls">
          <button
            onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
            className="zoom-btn"
            disabled={zoomLevel <= 50}
          >
            −
          </button>
          <span>{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
            className="zoom-btn"
            disabled={zoomLevel >= 150}
          >
            +
          </button>
        </div>
      </div>
      
      <div 
        className="pages-container" 
        style={{ 
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'top center' 
        }}
      >
        {/* Page 1 */}
        <div className="resume-page">
          <div dangerouslySetInnerHTML={{ __html: page1Content }} />
          <div className="page-number">Page 1</div>
        </div>
        
        {/* Page 2 */}
        {needsSecondPage && (
          <div className="resume-page">
            <div dangerouslySetInnerHTML={{ __html: page2Content }} />
            <div className="page-number">Page 2</div>
          </div>
        )}
      </div>
      
      <div className="print-button-container">
        <button 
          className="print-button"
          onClick={() => window.print()}
        >
          Print Preview
        </button>
      </div>
    </div>
  );
};

export default DirectHTMLResumePreview;
