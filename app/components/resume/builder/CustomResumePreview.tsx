// app/components/resume/builder/CustomResumePreview.tsx
import React, { useState } from 'react';
import { ResumeSection } from '@/app/lib/types';

interface CustomResumePreviewProps {
  sections: ResumeSection[];
}

const CustomResumePreview: React.FC<CustomResumePreviewProps> = ({ sections }) => {
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
  
  // Get experience sections
  const experienceSections = sections.filter(section => 
    (section.type === 'EXPERIENCE' || section.title.toLowerCase().includes('experience')) &&
    section.type !== 'HEADER' && 
    section.type !== 'SUMMARY' && 
    section.type !== 'EDUCATION'
  );
  
  // Get all other non-job-role sections (maintaining their original order)
  // excluding header, summary, education, and experience which we'll handle separately
  const otherSections = sections.filter(section => 
    section.type !== 'HEADER' && 
    section.type !== 'SUMMARY' && 
    section.type !== 'JOB_ROLE' &&
    section.type !== 'EDUCATION' &&
    section.type !== 'EXPERIENCE' &&
    !section.title.toLowerCase().includes('education') &&
    !section.title.toLowerCase().includes('experience') &&
    !section.parentId // Ensure no child sections
  );
  
  // Get all job roles for an experience section
  const getJobRoles = (experienceId: string) => {
    return sections
      .filter(section => section.parentId === experienceId && section.type === 'JOB_ROLE')
      .sort((a, b) => {
        // Determine position based on array order to maintain manual ordering
        const indexA = sections.findIndex(s => s.id === a.id);
        const indexB = sections.findIndex(s => s.id === b.id);
        return indexA - indexB;
      });
  };

  // Helper function to ensure proper styling in the preview
  const processContentForCustomTemplate = (html: string): string => {
    // Ensure proper font styling while keeping any existing formatting
    // Make sure text is dark enough to be readable
    return html
      .replace(/<h3[^>]*>/g, '<h3 style="font-family: Arial, sans-serif; font-size: 10.5pt; font-weight: bold; margin-bottom: 2px; margin-top: 10px; color: #000000;">')
      .replace(/<p[^>]*>/g, '<p style="font-family: Arial, sans-serif; font-size: 10pt; margin-top: 2px; margin-bottom: 3px; color: #000000;">')
      .replace(/<li[^>]*>/g, '<li style="font-family: Arial, sans-serif; font-size: 10pt; margin-bottom: 1px; color: #000000;">')
      .replace(/<ul[^>]*>/g, '<ul style="margin-top: 3px; padding-left: 20px; list-style-type: disc; margin-bottom: 5px;">');
  };
  
  // Helper function to convert Markdown-style syntax to HTML
  const convertMarkdownToHtml = (content: string): string => {
    if (!content) return '';
    
    // Convert Markdown-style bold (**text**) to <strong>
    let processed = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert Markdown-style italic (*text*) to <em>
    processed = processed.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    
    // If the content has HTML ul/li tags, don't process bullet points
    if (!processed.includes('<ul') && !processed.includes('<li')) {
      const lines = processed.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* ')) {
          // If this is the first bullet point, add opening <ul>
          if (!lines[i-1]?.trim().startsWith('- ') && !lines[i-1]?.trim().startsWith('* ')) {
            lines[i] = '<ul style="margin-top: 3px; padding-left: 20px; list-style-type: disc; margin-bottom: 5px;">' + lines[i];
          }
          
          // Convert the bullet point to <li>
          lines[i] = lines[i].replace(
            /^(\s*)[*-]\s+(.*)$/, 
            '$1<li style="font-family: Arial, sans-serif; font-size: 10pt; margin-bottom: 1px; color: #000000;">$2</li>'
          );
          
          // If this is the last bullet point, add closing </ul>
          if (!lines[i+1]?.trim().startsWith('- ') && !lines[i+1]?.trim().startsWith('* ')) {
            lines[i] += '</ul>';
          }
        }
      }
      processed = lines.join('\n');
    }
    
    return processed;
  };
  
  // Helper function to check if content contains any Markdown formatting
  const containsMarkdown = (content: string): boolean => {
    return /\*\*.*?\*\*|\*[^\*]+\*|-\s|\*\s/.test(content);
  };
  
  // Process the HTML in job role content to handle Markdown in bullets
  const processJobRoleContent = (content: string): string => {
    if (!content) return '';
    
    // If no li elements, return content as is (already processed)
    if (!content.includes('<li') || !containsMarkdown(content)) {
      return processContentForCustomTemplate(content);
    }
    
    // First extract the job title and company/date for special formatting
    const titleMatch = content.match(/<h3[^>]*>(.*?)<\/h3>/i);
    const companyMatch = content.match(/<p[^>]*>(.*?)<\/p>/i);
    
    let title = '';
    let company = '';
    let dateRange = '';
    
    // Extract title
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
    
    // Extract company and date
    if (companyMatch && companyMatch[1]) {
      const parts = companyMatch[1].split('|');
      if (parts.length >= 2) {
        company = parts[0].trim();
        dateRange = parts[1].trim();
      } else {
        company = companyMatch[1].trim();
      }
    }
    
    // Replace Markdown formatting in <li> elements
    const liMatches = content.match(/<li[^>]*>(.*?)<\/li>/g) || [];
    const processedLis = liMatches.map(li => {
      const insideLi = li.replace(/<li[^>]*>(.*?)<\/li>/g, '$1');
      const processedInsideLi = insideLi
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^\*]+)\*/g, '<em>$1</em>');
      
      return `<li style="font-family: Arial, sans-serif; font-size: 10pt; margin-bottom: 1px; color: #000000;">${processedInsideLi}</li>`;
    }).join('');
    
    // Construct the processed content with proper layout for professional experience section
    const processedContent = `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 10px; margin-bottom: 0px;">
        <tr>
          <td align="left" style="font-family: Arial, sans-serif; font-size: 10.5pt; font-weight: bold; color: #000000; padding: 0;">
            ${title}
          </td>
          <td align="right" style="font-family: Arial, sans-serif; font-size: 10.5pt; font-weight: bold; color: #000000; padding: 0;">
            ${dateRange}
          </td>
        </tr>
        <tr>
          <td colspan="2" style="font-family: Arial, sans-serif; font-size: 10.5pt; font-weight: bold; color: #000000; padding: 0;">
            ${company}
          </td>
        </tr>
      </table>
      <ul style="margin-top: 2px; padding-left: 20px; list-style-type: disc; margin-bottom: 0;">
        ${processedLis}
      </ul>
    `;
    
    return processedContent;
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
          textAlign: 'center', // Center the heading text
          height: '24px', // Fixed height for consistent shading
          display: 'flex',
          alignItems: 'center', // Vertical centering
          justifyContent: 'center', // Horizontal centering
          // This ensures the background color prints properly
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
          color: '#000000', // Darker color for better readability
          textTransform: 'uppercase'  // Makes headings uppercase for emphasis
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
    let contactParts : string[] = [];
    
    if (contactMatch && contactMatch[1]) {
      contactParts = contactMatch[1].split('|').map(part => part.trim());
    }
    
    // Determine contact items (email, phone, location)
    const email = contactParts[0] || '';
    const phone = contactParts[1] || '';
    const location = contactParts[2] || '';
    
    return (
      <div className="header-section" style={{ marginBottom: '10px' }}>
        {/* Name with blue text and BASc suffix */}
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
            color: '#1a4977' // Blue color for the name
          }}>
            {name.includes(', BASc.') ? name : `${name}, BASc.`}
          </h1>
        </div>
        
        {/* Contact info in three columns with proper spacing */}
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
          color: '#000000' // Darker color for better readability
        }}>
          {summaryText}
        </p>
      </div>
    );
  };
  
  // Render job roles for an experience section
  const renderJobRoles = (experienceId: string) => {
    const jobRoles = getJobRoles(experienceId);
    
    if (jobRoles.length === 0) return null;
    
    return (
      <div className="job-roles" style={{ marginBottom: '15px' }}>
        {jobRoles.map((jobRole) => {
          const processedJobContent = processJobRoleContent(jobRole.content);
          return (
            <div 
              key={jobRole.id} 
              className="job-role" 
              style={{ marginBottom: '10px' }}
              dangerouslySetInnerHTML={{ __html: processedJobContent }} 
            />
          );
        })}
      </div>
    );
  };
  
  // Render the education section
  const renderEducation = () => {
    if (!educationSection) return null;
    
    return (
      <div className="education-section" style={{ marginBottom: '15px' }}>
        {renderSectionHeading(educationSection.title)}
        <div 
          className="education-content" 
          style={{ fontFamily: 'Arial, sans-serif', fontSize: '10pt', color: '#000000' }}
          dangerouslySetInnerHTML={{ __html: processContentForCustomTemplate(educationSection.content) }} 
        />
      </div>
    );
  };
  
  // Render experience sections with a direct approach for more control
  const renderExperience = () => {
    if (experienceSections.length === 0) return null;
    
    return (
      <div className="experience-sections" style={{ marginBottom: '10px' }}>
        {experienceSections.map((expSection) => (
          <div key={expSection.id} className="experience-section" style={{ marginBottom: '8px' }}>
            {renderSectionHeading(expSection.title)}
            {renderJobRoles(expSection.id)}
          </div>
        ))}
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
          dangerouslySetInnerHTML={{ __html: processContentForCustomTemplate(section.content) }} 
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
          transform: `scale(${zoomLevel / 100})`, 
          transformOrigin: 'top left',
          width: `${10000 / zoomLevel}%`, // Adjust width to maintain right edge as we zoom
          maxHeight: '800px'
        }}
      >
        <div 
          className="mx-auto" 
          style={{ 
            fontFamily: 'Arial, sans-serif', 
            color: '#000000',
            maxWidth: '816px',
            marginTop: '0', // 0 top margin
            marginBottom: '0.25in', // 0.25" bottom margin
            marginLeft: '0.25in', // 0.25" left margin
            marginRight: '0.25in', // 0.25" right margin
            paddingTop: '0'
          }}
        >
          {/* Header Section */}
          {renderHeader()}
          
          {/* Summary Section (no heading) */}
          {renderSummary()}
          
          {/* Experience Sections */}
          {renderExperience()}
          
          {/* Education Section */}
          {renderEducation()}
          
          {/* Other Sections */}
          {otherSections.map((section) => renderOtherSection(section))}
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

export default CustomResumePreview;
