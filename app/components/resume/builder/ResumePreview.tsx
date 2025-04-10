// app/components/resume/builder/ResumePreview.tsx
import React, { useState } from 'react';
import { ResumeSection } from '@/app/lib/types';

interface ResumePreviewProps {
  sections: ResumeSection[];
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ sections }) => {
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

  // Helper function to ensure dark text in the preview
  const ensureDarkText = (html: string): string => {
    // Replace light gray text classes with dark gray
    return html
      .replace(/text-gray-200/g, 'text-gray-800')
      .replace(/text-gray-300/g, 'text-gray-800')
      .replace(/text-gray-400/g, 'text-gray-800');
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
            lines[i] = '<ul class="list-disc pl-5">' + lines[i];
          }
          
          // Convert the bullet point to <li>
          lines[i] = lines[i].replace(/^(\s*)[*-]\s+(.*)$/, '$1<li>$2</li>');
          
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
    // If no li elements, return content as is (already processed)
    if (!content.includes('<li') || !containsMarkdown(content)) {
      return content;
    }
    
    // Replace Markdown formatting in <li> elements
    return content.replace(/<li[^>]*>(.*?)<\/li>/g, (match, insideLi) => {
      // Process the inside of the <li> tag to convert Markdown
      const processed = insideLi
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^\*]+)\*/g, '<em>$1</em>');
      
      return `<li>${processed}</li>`;
    });
  };
  
  // Render a specific section based on its type
  const renderSection = (section: ResumeSection) => {
    // First check if we should handle this section as a header
    const isHeader = section.type === 'HEADER' || 
                     section.type.toUpperCase() === 'HEADER' || 
                     section.title.toLowerCase().includes('header');
    
    // Process the content
    let content = section.content;
    
    // Apply special processing for job roles that may have Markdown in bullets
    if (section.type === 'JOB_ROLE') {
      content = processJobRoleContent(content);
    } else if (containsMarkdown(content)) {
      // For other sections, convert Markdown if present
      content = convertMarkdownToHtml(content);
    }
    
    // Ensure dark text for all content
    content = ensureDarkText(content);
    
    if (isHeader) {
      return (
        <div className="mb-6 text-center" dangerouslySetInnerHTML={{ __html: content }} />
      );
    }
    
    switch (section.type) {
      case 'EXPERIENCE':
        return (
          <div className="mb-6">
            <h2 className="text-xl font-bold border-b pb-1 mb-4 text-gray-800">{section.title}</h2>
            {getJobRoles(section.id).map((jobRole) => {
              const processedJobContent = processJobRoleContent(ensureDarkText(jobRole.content));
              return (
                <div key={jobRole.id} className="mb-4 text-gray-800" 
                     dangerouslySetInnerHTML={{ __html: processedJobContent }} />
              );
            })}
          </div>
        );
        
      case 'JOB_ROLE':
        // Only render job roles that don't have a parent id (orphaned ones)
        // Others will be rendered within their parent experience section
        return !section.parentId ? (
          <div className="mb-4 text-gray-800" dangerouslySetInnerHTML={{ __html: content }} />
        ) : null;
        
      case 'EDUCATION':
        // Special handling for education sections
        return (
          <div className="mb-6">
            <h2 className="text-xl font-bold border-b pb-1 mb-4 text-gray-800">{section.title}</h2>
            <div className="text-gray-800" dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        );
        
      default:
        return (
          <div className="mb-6">
            <h2 className="text-xl font-bold border-b pb-1 mb-4 text-gray-800">{section.title}</h2>
            <div className="text-gray-800" dangerouslySetInnerHTML={{ __html: content }} />
          </div>
        );
    }
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
        className="preview-container relative overflow-auto border p-8 rounded-lg bg-white"
        style={{ 
          transform: `scale(${zoomLevel / 100})`, 
          transformOrigin: 'top left',
          width: `${10000 / zoomLevel}%`, // Adjust width to maintain right edge as we zoom
          maxHeight: '800px'
        }}
      >
        <div className="max-w-[816px] mx-auto text-gray-800">
          {/* Always render header first if it exists */}
          {headerSection && (
            <React.Fragment key={headerSection.id}>
              {renderSection(headerSection)}
            </React.Fragment>
          )}
          
          {/* Then render summary if it exists */}
          {summarySection && (
            <React.Fragment key={summarySection.id}>
              {renderSection(summarySection)}
            </React.Fragment>
          )}
          
          {/* Then render experience sections */}
          {experienceSections.map((section) => (
            <React.Fragment key={section.id}>
              {renderSection(section)}
            </React.Fragment>
          ))}
          
          {/* Then render education section if it exists */}
          {educationSection && (
            <React.Fragment key={educationSection.id}>
              {renderSection(educationSection)}
            </React.Fragment>
          )}
          
          {/* Then render all other sections */}
          {otherSections.map((section) => (
            <React.Fragment key={section.id}>
              {renderSection(section)}
            </React.Fragment>
          ))}
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

export default ResumePreview;
