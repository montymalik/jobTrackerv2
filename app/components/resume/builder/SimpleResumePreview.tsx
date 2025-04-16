// app/components/resume/builder/SimpleResumePreview.tsx
'use client';

import React, { useState } from 'react';
import { ResumeSection } from '@/app/lib/types';
import './simple-preview.css';

interface SimpleResumePreviewProps {
  sections: ResumeSection[];
}

const SimpleResumePreview: React.FC<SimpleResumePreviewProps> = ({ sections }) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  
  // Extract header and contact info
  const headerSection = sections.find(section => 
    section.type === 'HEADER' || 
    section.title.toLowerCase().includes('header')
  );
  
  const getName = () => {
    if (!headerSection) return 'Your Full Name, BASc.';
    
    const nameMatch = headerSection.content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const name = nameMatch ? nameMatch[1] : 'Your Full Name';
    
    return name.includes('BASc') ? name : `${name}, BASc.`;
  };
  
  const getContactInfo = () => {
    if (!headerSection) return { email: '', phone: '', location: '' };
    
    const contactMatch = headerSection.content.match(/<p[^>]*>(.*?)<\/p>/i);
    if (!contactMatch) return { email: '', phone: '', location: '' };
    
    const parts = contactMatch[1].split('|').map(part => part.trim());
    return {
      email: parts[0] || '',
      phone: parts[1] || '',
      location: parts[2] || ''
    };
  };
  
  // Get summary section
  const summarySection = sections.find(section => 
    section.type === 'SUMMARY' || 
    section.title.toLowerCase().includes('summary')
  );
  
  // Get experience sections
  const experienceSections = sections.filter(section => 
    section.type === 'EXPERIENCE' || 
    section.title.toLowerCase().includes('experience')
  );
  
  // Get job roles
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
  
  // Format job role content to ensure right-aligned dates
  const formatJobRoleContent = (content: string) => {
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
    
    // Extract the rest of the content (likely bullets)
    let bulletContent = content;
    if (titleMatch) {
      bulletContent = bulletContent.replace(titleMatch[0], '');
    }
    if (companyMatch) {
      bulletContent = bulletContent.replace(companyMatch[0], '');
    }
    
    return (
      <div className="job-role">
        <div className="job-header">
          <div className="job-title">{title}</div>
          <div className="job-date">{dateRange}</div>
        </div>
        <div className="company-name">{company}</div>
        <div className="job-bullets" dangerouslySetInnerHTML={{ __html: bulletContent }} />
      </div>
    );
  };
  
  // Estimate content to split between pages
  const name = getName();
  const contactInfo = getContactInfo();
  
  // Determine if we need 2 pages
  const needSecondPage = jobRoleSections.length > 1 || educationSection || otherSections.length > 0;
  
  return (
    <div className="resume-preview">
      <div className="preview-controls">
        <h2>Preview</h2>
        <div className="zoom-controls">
          <button
            onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
            className="zoom-btn"
            disabled={zoomLevel <= 50}
          >
            -
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
      
      <div className="pages-container" style={{ transform: `scale(${zoomLevel / 100})` }}>
        {/* PAGE 1 */}
        <div className="resume-page">
          {/* Header */}
          <div className="resume-header">
            <h1>{name}</h1>
            <div className="contact-info">
              <span>{contactInfo.email}</span>
              <span>{contactInfo.phone}</span>
              <span>{contactInfo.location}</span>
            </div>
          </div>
          
          {/* Summary */}
          {summarySection && (
            <div className="resume-summary" dangerouslySetInnerHTML={{ __html: summarySection.content }} />
          )}
          
          {/* Experience */}
          {experienceSections.length > 0 && (
            <div className="experience-section">
              <div className="section-heading">{experienceSections[0].title}</div>
              
              {/* Just show the first job role on page 1 */}
              {getJobRoles(experienceSections[0].id).slice(0, 1).map(jobRole => (
                <div key={jobRole.id}>{formatJobRoleContent(jobRole.content)}</div>
              ))}
            </div>
          )}
          
          <div className="page-number">Page 1</div>
        </div>
        
        {/* PAGE 2 */}
        {needSecondPage && (
          <div className="resume-page">
            {/* Continuation Header */}
            <div className="continuation-header">
              <div className="name">{name.split(',')[0]}</div>
              <div className="continued">Continued</div>
            </div>
            
            {/* Continue Experience */}
            {experienceSections.length > 0 && getJobRoles(experienceSections[0].id).length > 1 && (
              <div className="experience-section">
                <div className="section-heading">{experienceSections[0].title}</div>
                
                {/* Show remaining job roles */}
                {getJobRoles(experienceSections[0].id).slice(1).map(jobRole => (
                  <div key={jobRole.id}>{formatJobRoleContent(jobRole.content)}</div>
                ))}
              </div>
            )}
            
            {/* Education */}
            {educationSection && (
              <div className="education-section">
                <div className="section-heading">{educationSection.title}</div>
                <div dangerouslySetInnerHTML={{ __html: educationSection.content }} />
              </div>
            )}
            
            {/* Other Sections */}
            {otherSections.map(section => (
              <div key={section.id} className="other-section">
                <div className="section-heading">{section.title}</div>
                <div dangerouslySetInnerHTML={{ __html: section.content }} />
              </div>
            ))}
            
            <div className="page-number">Page 2</div>
          </div>
        )}
      </div>
      
      <div className="print-controls">
        <button className="print-btn" onClick={() => window.print()}>
          Print Preview
        </button>
      </div>
    </div>
  );
};

export default SimpleResumePreview;
