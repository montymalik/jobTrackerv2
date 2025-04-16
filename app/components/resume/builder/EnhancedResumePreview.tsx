// app/components/resume/builder/EnhancedResumePreview.tsx
import React, { useState } from 'react';
import { ResumeSection } from '@/app/lib/types';
import JobRoleComponent from './JobRoleComponent';
import { parseExperienceSections, ParsedJobRole } from './utils/resumeParser';

interface EnhancedResumePreviewProps {
  sections: ResumeSection[];
}

const EnhancedResumePreview: React.FC<EnhancedResumePreviewProps> = ({ sections }) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  
  // Extract header section
  const headerSection = sections.find(section => 
    section.type === 'HEADER' || 
    section.type.toUpperCase() === 'HEADER' || 
    section.title.toLowerCase().includes('header')
  );
  
  // Extract summary section
  const summarySection = sections.find(section => 
    section.type === 'SUMMARY' || 
    section.type.toUpperCase() === 'SUMMARY' || 
    section.title.toLowerCase().includes('summary')
  );
  
  // Extract education section specifically
  const educationSection = sections.find(section => 
    section.type === 'EDUCATION' || 
    section.type.toUpperCase() === 'EDUCATION' || 
    section.title.toLowerCase().includes('education')
  );
  
  // Parse experience sections and job roles
  const { experienceSections, jobRolesByParent } = parseExperienceSections(sections);
  
  // Get all other non-job-role sections
  const otherSections = sections.filter(section => 
    section.type !== 'HEADER' && 
    section.type !== 'SUMMARY' && 
    section.type !== 'JOB_ROLE' &&
    section.type !== 'EDUCATION' &&
    section.type !== 'EXPERIENCE' &&
    !section.title.toLowerCase().includes('education') &&
    !section.title.toLowerCase().includes('experience') &&
    !section.parentId
  );
  
  // Extract name for second page header
  const extractName = () => {
    if (!headerSection) return 'Resume';
    
    const nameMatch = headerSection.content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    return nameMatch ? nameMatch[1] : 'Resume';
  };
  
  // Get name for possible second page header
  const resumeName = extractName();
  
  // Helper function to ensure dark text in the preview
  const ensureDarkText = (html: string): string => {
    return html.replace(/text-gray-[2-4]00/g, 'text-gray-800');
  };
  
  // Helper function to convert Markdown-style syntax to HTML
  const convertMarkdownToHtml = (content: string): string => {
    if (!content) return '';
    
    let processed = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    
    return processed;
  };
  
  // Process HTML content with proper styling
  const processContent = (content: string): string => {
    content = ensureDarkText(content);
    
    // Add proper styling to HTML elements
    return content
      .replace(/<h3[^>]*>/g, '<h3 style="font-family: Arial, sans-serif; font-size: 10.5pt; font-weight: bold; margin-bottom: 2px; margin-top: 10px; color: #000000;">')
      .replace(/<p[^>]*>/g, '<p style="font-family: Arial, sans-serif; font-size: 10pt; margin-top: 2px; margin-bottom: 3px; color: #000000;">')
      .replace(/<li[^>]*>/g, '<li style="font-family: Arial, sans-serif; font-size: 10pt; margin-bottom: 1px; color: #000000;">')
      .replace(/<ul[^>]*>/g, '<ul style="margin-top: 3px; padding-left: 20px; list-style-type: disc; margin-bottom: 5px;">');
  };
  
  // Render a section heading in the custom style (shaded area)
  const renderSectionHeading = (title: string) => {
    return (
      <div 
        className="section-heading"
        style={{
          backgroundColor: '#f0f0f0', 
          padding: 0,
          marginBottom: '8px',
          borderBottom: '1px solid #cccccc',
          width: '100%',
          textAlign: 'center',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
      >
        <h2 style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: '12pt',
          fontWeight: 'bold',
          margin: 0,
          padding: 0,
          color: '#000000',
          textTransform: 'uppercase'
        }}>
          {title}
        </h2>
      </div>
    );
  };
  
  // Render the header section
  const renderHeader = () => {
    if (!headerSection) return null;
    
    // Extract name and contact info
    const nameMatch = headerSection.content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const contactMatch = headerSection.content.match(/<p[^>]*>(.*?)<\/p>/i);
    
    const name = nameMatch ? nameMatch[1] : '';
    let contactParts: string[] = [];

    if (contactMatch && contactMatch[1]) {
      contactParts = contactMatch[1].split('|').map(part => part.trim());
    }
    
    // Determine contact items (email, phone, location)
    const email = contactParts[0] || '';
    const phone = contactParts[1] || '';
    const location = contactParts[2] || '';
    
    return (
      <div className="header-section" style={{ marginBottom: '10px' }}>
        <div style={{ 
          textAlign: 'center', 
          borderBottom: '1px solid #c2d1d9', 
          paddingBottom: '4px',
          marginBottom: '4px'
        }}>
          <h1 style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: '16pt',
            fontWeight: 'bold',
            margin: '0',
            color: '#1a4977'
          }}>
            {name.includes(', BASc.') ? name : `${name}, BASc.`}
          </h1>
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          borderBottom: '1px solid #c2d1d9',
          paddingBottom: '4px'
        }}>
          <div style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: '10pt',
            color: '#000000',
            flex: '1',
            textAlign: 'left'
          }}>
            {email}
          </div>
          <div style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: '10pt',
            color: '#000000',
            flex: '1',
            textAlign: 'center'
          }}>
            {phone}
          </div>
          <div style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: '10pt',
            color: '#000000',
            flex: '1',
            textAlign: 'right'
          }}>
            {location}
          </div>
        </div>
      </div>
    );
  };

  // Render the summary section (without heading)
  const renderSummary = () => {
    if (!summarySection) return null;
    
    // Extract summary text
    const summaryMatch = summarySection.content.match(/<p[^>]*>(.*?)<\/p>/i);
    const summaryText = summaryMatch ? summaryMatch[1] : '';
    
    return (
      <div className="summary-section" style={{ marginBottom: '15px' }}>
        <p style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: '10pt',
          margin: 0,
          lineHeight: '1.4',
          color: '#000000'
        }}>
          {summaryText}
        </p>
      </div>
    );
  };
  
  // Render experience sections with job roles
  const renderExperience = () => {
    if (experienceSections.length === 0) return null;
    
    return (
      <div className="experience-sections" style={{ marginBottom: '10px' }}>
        {experienceSections.map((expSection) => (
          <div key={expSection.id} className="experience-section" style={{ marginBottom: '8px' }}>
            {renderSectionHeading(expSection.title)}
            
            {/* Render job roles with explicit title, company, date, and bullets */}
            {jobRolesByParent[expSection.id]?.map((jobRole: ParsedJobRole) => (
              <JobRoleComponent
                key={jobRole.id}
                title={jobRole.title}
                company={jobRole.company}
                dateRange={jobRole.dateRange}
                bulletPoints={jobRole.bulletPoints}
              />
            ))}
          </div>
        ))}
      </div>
    );
  };
  
  // Render education section
  const renderEducation = () => {
    if (!educationSection) return null;
    
    return (
      <div className="education-section" style={{ marginBottom: '15px' }}>
        {renderSectionHeading(educationSection.title)}
        <div 
          className="education-content" 
          style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', color: '#000000' }}
          dangerouslySetInnerHTML={{ __html: processContent(educationSection.content) }} 
        />
      </div>
    );
  };
  
  // Render other sections
  const renderOtherSection = (section: ResumeSection) => {
    return (
      <div key={section.id} className="other-section" style={{ marginBottom: '15px' }}>
        {renderSectionHeading(section.title)}
        <div 
          className="section-content" 
          style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', color: '#000000' }}
          dangerouslySetInnerHTML={{ __html: processContent(section.content) }} 
        />
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6 h-full relative">
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10">
        <h2 className="text-lg font-semibold">Preview</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
            className="p-1 rounded hover:bg-gray-200"
            disabled={zoomLevel <= 50}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9" />
            </svg>
          </button>
          <span className="text-sm">{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
            className="p-1 rounded hover:bg-gray-200"
            disabled={zoomLevel >= 150}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0 0h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>
      
      <div 
        className="preview-container relative overflow-auto border rounded-lg bg-white"
        style={{ 
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxHeight: '80vh'
        }}
      >
        {/* First page */}
        <div 
          className="resume-page"
          style={{ 
            fontFamily: 'Arial, sans-serif', 
            color: '#000000',
            width: '8.5in',
            height: '11in',
            marginTop: '0',
            marginBottom: '20px',
            paddingTop: '0',
            paddingBottom: '0.25in',
            paddingLeft: '0.25in',
            paddingRight: '0.25in',
            boxSizing: 'border-box',
            position: 'relative',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            maxWidth: '100%',
            overflow: 'hidden'
          }}
        >
          {renderHeader()}
          {renderSummary()}
          
          {/* Only show the first few job roles on page 1 */}
          <div style={{ maxHeight: '9in', overflow: 'hidden' }}>
            {experienceSections.length > 0 && (
              <div className="experience-section" style={{ marginBottom: '8px' }}>
                {renderSectionHeading(experienceSections[0].title)}
                {/* Only include first job role to avoid cutoff */}
                {jobRolesByParent[experienceSections[0].id]?.slice(0, 1).map((jobRole: ParsedJobRole) => (
                  <JobRoleComponent
                    key={jobRole.id}
                    title={jobRole.title}
                    company={jobRole.company}
                    dateRange={jobRole.dateRange}
                    bulletPoints={jobRole.bulletPoints}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Page number indicator */}
          <div style={{
            position: 'absolute',
            bottom: '0.25in',
            right: '0.25in',
            fontSize: '9pt',
            color: '#777777'
          }}>
            Page 1
          </div>
        </div>
        
        {/* Second page */}
        <div 
          className="resume-page"
          style={{ 
            fontFamily: 'Arial, sans-serif', 
            color: '#000000',
            width: '8.5in',
            height: '11in',
            marginTop: '0',
            marginBottom: '0',
            paddingTop: '0.25in',
            paddingBottom: '0.25in',
            paddingLeft: '0.25in',
            paddingRight: '0.25in',
            boxSizing: 'border-box',
            position: 'relative',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
            maxWidth: '100%',
            overflow: 'hidden'
          }}
        >
          {/* Page 2 header */}
          <div style={{ 
            borderBottom: '1px solid #c2d1d9',
            paddingBottom: '4px',
            marginBottom: '10px',
            display: 'flex',
            justifyContent: 'space-between'
          }}>
            <div style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '10pt',
              color: '#1a4977',
              fontWeight: 'bold'
            }}>
              {resumeName}
            </div>
            <div style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '10pt',
              color: '#000000'
            }}>
              Continued
            </div>
          </div>
          
          {/* Remaining content */}
          <div>
            {experienceSections.length > 0 && jobRolesByParent[experienceSections[0].id]?.length > 1 && (
              <div className="experience-section" style={{ marginBottom: '8px' }}>
                {/* Repeat the experience heading on page 2 if needed */}
                {renderSectionHeading(experienceSections[0].title)}
                
                {/* Show remaining job roles starting from the second one */}
                {jobRolesByParent[experienceSections[0].id]?.slice(1).map((jobRole: ParsedJobRole) => (
                  <JobRoleComponent
                    key={jobRole.id}
                    title={jobRole.title}
                    company={jobRole.company}
                    dateRange={jobRole.dateRange}
                    bulletPoints={jobRole.bulletPoints}
                  />
                ))}
              </div>
            )}
            
            {renderEducation()}
            {otherSections.map((section) => renderOtherSection(section))}
          </div>
          
          {/* Page number indicator */}
          <div style={{
            position: 'absolute',
            bottom: '0.25in',
            right: '0.25in',
            fontSize: '9pt',
            color: '#777777'
          }}>
            Page 2
          </div>
        </div>
      </div>
      
      <div className="text-right mt-4">
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          onClick={() => window.print()}
        >
          Print Preview
        </button>
      </div>
    </div>
  );
};

export default EnhancedResumePreview;
