import React from 'react';
import { 
  ContentType, 
  PdfExportOptions, 
  exportContentToPdf, 
  DocumentMetadata
} from './PdfExporter';
export interface ResumeExportOptions extends PdfExportOptions {
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
}
export interface ResumeExportParams {
  content: string;
  contentType?: ContentType;
  metadata?: DocumentMetadata;
  options: ResumeExportOptions;
}
/**
 * Specialized function to export resume to PDF with proper styling
 */
export const exportResumeToPdf = async ({ 
  content, 
  contentType = 'markdown',
  metadata = {},
  options 
}: ResumeExportParams): Promise<void> => {
  // Clean up the content - remove markdown triple backticks if present
  const cleanedContent = content.replace(/^```markdown\s*/, '').replace(/```\s*$/, '');
  
  // Custom styling for resumes 
  const resumeStyles = `
    body {
      font-family: ${options.customFonts?.body || 'Arial'}, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: ${options.colors?.body || '#000000'} !important;
    }
    .container {
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.125in 0.25in 0.25in 0.25in; /* Reduced top padding to 0.125in */
    }
    h1 {
      font-family: ${options.customFonts?.headings || 'Arial'}, sans-serif;
      font-size: 22pt;
      font-weight: bold;
      text-align: center;
      margin-top: 0; /* Remove top margin */
      margin-bottom: 8px;
      padding-bottom: 8px;
      color: ${options.colors?.name || '#006655'} !important;
    }
    h2 {
      font-family: ${options.customFonts?.headings || 'Arial'}, sans-serif;
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      margin-top: 16pt;
      margin-bottom: 8pt;
      padding-bottom: 6pt;
      text-align: left;
      color: ${options.colors?.headings || '#006655'} !important;
    }
    h3 {
      font-family: ${options.customFonts?.headings || 'Arial'}, sans-serif;
      font-size: 11pt;
      font-weight: bold;
      margin-top: 12pt;
      margin-bottom: 6pt;
      padding-bottom: 0;
      border-bottom: none;
      color: ${options.colors?.subheadings || '#006655'} !important;
      position: relative;
      width: 100%;
      clear: both;
    }
    h4 {
      font-family: ${options.customFonts?.headings || 'Arial'}, sans-serif;
      font-size: 11pt;
      font-weight: normal;
      font-style: normal;
      margin-top: 4pt;
      margin-bottom: 4pt;
      color: ${options.colors?.body || '#000000'} !important;
    }
    ul {
      margin-top: 4pt;
      margin-bottom: 8pt;
      padding-left: 0;
      list-style-type: none;
    }
    li {
      margin-bottom: 8pt;
      padding-left: 15pt;
      text-indent: -15pt;
      font-size: 11pt;
      page-break-inside: avoid;
      color: ${options.colors?.body || '#000000'} !important;
      position: relative;
      line-height: 1.4;
    }
    li:before {
      content: "• ";
      font-size: 14pt;
      font-weight: bold;
      color: #000000;
      margin-right: 5pt;
      vertical-align: middle;
      position: relative;
      top: -3pt; /* Adjust bullet position upward */
      line-height: 1;
    }
    ul {
      margin-top: 4pt;
      margin-bottom: 8pt;
      padding-left: 20pt;
    }
    li {
      margin-bottom: 4pt;
      font-size: 11pt;
    }
    p {
      margin-bottom: 8pt;
      margin-top: 0;
      font-size: 11pt;
      page-break-inside: avoid;
      color: #000000 !important;
    }
    /* Keep paragraphs with impact statements together */
    p + p {
      margin-top: -4pt; /* Reduce spacing between consecutive paragraphs */
    }
    /* Ensure paragraphs containing "Quantifiable Impact:" stay with the previous paragraph */
    p:contains("Quantifiable Impact:") {
      page-break-before: avoid;
      break-before: avoid;
      margin-top: 0;
    }
    .contact-info {
      text-align: center;
      margin-bottom: 16pt;
      font-size: 11pt;
    }
    .header-line {
      border-bottom: 5pt solid #000;
      width: 100%;
      margin-bottom: 16pt;
    }
    .hidden {
      display: none;
    }
  `;
  
  // Create a custom renderer that handles resume-specific formatting
  const resumeRenderer = (content: string, element: HTMLElement) => {
    // Special preprocessing for skill entries
    content = content.replace(/^(\s*[\*-]\s+)\*\*([^:]+):\*\*(.*)$/gm, '$1__SKILL_START__$2__SKILL_MID__$3__SKILL_END__');
    
    const lines = content.split('\n');
    let htmlContent = '';
    let inList = false;
    
    // Find titles to remove (but keep their content)
    const titlesToRemoveOnly = options.removeTitlesOnly || ["PROFESSIONAL SUMMARY"];
    
    // Helper to parse job entries in the format:
    // ### Company Name | Date
    // #### Job Title
    const parseJobEntry = (line: string, i: number) => {
      if (!line.startsWith('### ')) return null;
      
      const headingText = line.substring(4);
      if (!headingText.includes(' | ')) return null;
      
      const parts = headingText.split(' | ');
      
      // If the next line starts with ####, it's the job title
      let jobTitle = '';
      if (i < lines.length - 1 && lines[i+1].startsWith('#### ')) {
        jobTitle = lines[i+1].substring(5);
        // Skip the next line as we've incorporated it
        lines[i+1] = '';
      }
      
      return {
        company: parts[0],
        date: parts[parts.length - 1],
        jobTitle
      };
    };
    
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
      
      // Handle headings
      if (line.startsWith('# ')) {
        htmlContent += `<h1 style="color:${options.colors?.name || '#006655'} !important">` + line.substring(2) + '</h1>';
      }
      else if (line.startsWith('## ')) {
        const headingText = line.substring(3);
        // Skip this heading if it's in the removeTitlesOnly list
        // but continue processing the content that follows
        if (titlesToRemoveOnly.some(title => headingText.toUpperCase() === title.toUpperCase())) {
          // Add some spacing instead of the heading
          htmlContent += '<div style="margin-top: 20px;"></div>';
          continue;
        }
        htmlContent += `<h2 style="color:${options.colors?.headings || '#006655'} !important">` + headingText + '</h2>';
      }
      else if (line.startsWith('### ')) {
        // Check for job entry pattern
        if (options.companyNameBeforeTitle) {
          const jobEntry = parseJobEntry(line, i);
          if (jobEntry) {
            htmlContent += `<h3 style="color:${options.colors?.subheadings || '#006655'} !important; margin-bottom: 0;">${jobEntry.company}<span style="float: right; font-weight: normal;">${jobEntry.date}</span></h3>`;
            if (jobEntry.jobTitle) {
              htmlContent += `<h4>${jobEntry.jobTitle}</h4>`;
            }
            continue;
          }
        }
        
        const headingText = line.substring(4);
        
        // Check if there's a date in the format | Date at the end
        if (headingText.includes(' | ')) {
          const parts = headingText.split(' | ');
          const title = parts[0];
          const date = parts[parts.length - 1]; // Last part is the date
          
          htmlContent += `<h3 style="color:${options.colors?.subheadings || '#006655'} !important">${title}<span style="float: right; font-weight: normal;">${date}</span></h3>`;
        } else {
          htmlContent += `<h3 style="color:${options.colors?.subheadings || '#006655'} !important">` + headingText + '</h3>';
        }
      }
      else if (line.startsWith('#### ')) {
        // This is handled in parseJobEntry for company-first format
        if (!options.companyNameBeforeTitle) {
          htmlContent += '<h4>' + line.substring(5) + '</h4>';
        }
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
          itemContent = `<b style="color:${options.colors?.subheadings || '#006655'} !important">${skillName}:</b> ${skillDescription}`;
        }
        // Handle ** at start and end of skill titles - special case for skills section
        // Pattern: ** Skill Name: ** Description
        else if (itemContent.match(/^\s*\*\*\s*([^:]+):\s*\*\*\s*(.*)/)) {
          const skillMatch = itemContent.match(/^\s*\*\*\s*([^:]+):\s*\*\*\s*(.*)/);
          if (skillMatch) {
            const skillName = skillMatch[1].trim();
            const skillDescription = skillMatch[2].trim();
            
            // Format with skill name in bold
            itemContent = `<b style="color:${options.colors?.subheadings || '#006655'} !important">${skillName}:</b> ${skillDescription}`;
          }
        } 
        // Check if the bullet point starts with a skill name followed by a colon
        else {
          const skillColonMatch = itemContent.match(/^([^:]+):(.*)/);
          if (skillColonMatch) {
            const skillName = skillColonMatch[1].trim();
            const skillDescription = skillColonMatch[2].trim();
            
            // Format with skill name in bold
            itemContent = `<b style="color:${options.colors?.subheadings || '#006655'} !important">${skillName}:</b> ${skillDescription}`;
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
      }
      // Handle regular paragraphs
      else {
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
          htmlContent += '<div class="contact-info">' + formattedLine + '</div>';
        } else {
          htmlContent += '<p style="color:#000000 !important">' + formattedLine + '</p>';
        }
      }
    }
    
    // Close any open list
    if (inList) {
      htmlContent += '</ul>';
    }
    
    element.innerHTML = htmlContent;
    
    // Post-processing: ensure all elements have proper styling
    const allElements = element.querySelectorAll('*');
    allElements.forEach(el => {
      (el as HTMLElement).style.color = '#000000';
    });
  };
  
  // Extend the options with our resume-specific settings
  const enhancedOptions: PdfExportOptions = {
    ...options,
    customStyles: resumeStyles + (options.customStyles || ''),
    customRenderer: resumeRenderer,
    margin: [0.25, 0.25, 0.25, 0.25], // 0.25" margins all around
    pageSize: 'letter',
    orientation: 'portrait',
  };
  
  // Call the generic PDF exporter with our specialized options
  await exportContentToPdf({
    content: cleanedContent,
    contentType,
    metadata,
    options: enhancedOptions
  });
};
/**
 * React component for exporting resume content to PDF
 */
interface ResumeExportButtonProps {
  content: string;
  contentType?: ContentType;
  filename?: string;
  metadata?: DocumentMetadata;
  customStyles?: string;
  onSuccess?: (filename: string, metadata?: DocumentMetadata) => void;
  onError?: (error: Error) => void;
  updateMetadata?: (metadata: DocumentMetadata, filename: string) => Promise<boolean>;
  saveAfterExport?: () => Promise<void>;
  buttonText?: string;
  buttonClassName?: string;
  iconClassName?: string;
  isDisabled?: boolean;
  includeBorders?: boolean;
  nameUnderlineColor?: string;
  headingUnderlineColor?: string;
  removeTitlesOnly?: string[];
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
  companyNameBeforeTitle?: boolean;
}

export const ResumeExportButton: React.FC<ResumeExportButtonProps> = ({
  content,
  contentType = 'markdown',
  filename = 'Resume.pdf',
  metadata,
  customStyles,
  onSuccess,
  onError,
  updateMetadata,
  saveAfterExport,
  buttonText = 'Export Resume to PDF',
  buttonClassName = 'px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center min-w-32',
  iconClassName,
  isDisabled = false,
  includeBorders = false,
  nameUnderlineColor = '#000000',
  headingUnderlineColor = '#000000',
  removeTitlesOnly = ["PROFESSIONAL SUMMARY"],
  customFonts,
  colors = {
    name: '#006655',
    headings: '#006655',
    subheadings: '#006655',
    body: '#000000',
    bullet: '#000000'  // Default bullet color is now black
  },
  companyNameBeforeTitle = false
}) => {
  // State to track if we're in a browser environment
  const [isBrowser, setIsBrowser] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  
  // Set isBrowser to true once component mounts
  React.useEffect(() => {
    setIsBrowser(true);
  }, []);
  
  const handleExport = async () => {
    if (!content || !isBrowser || isExporting) return;
    
    setIsExporting(true);
    
    try {
      await exportResumeToPdf({
        content,
        contentType,
        metadata,
        options: {
          filename,
          customStyles,
          onSuccess: (f, m) => {
            if (onSuccess) onSuccess(f, m);
            setIsExporting(false);
          },
          onError: (e) => {
            if (onError) onError(e);
            setIsExporting(false);
          },
          updateMetadata,
          saveAfterExport,
          includeBorders,
          nameUnderlineColor,
          headingUnderlineColor,
          removeTitlesOnly,
          customFonts,
          colors,
          companyNameBeforeTitle
        }
      });
    } catch (error) {
      console.error("Error exporting resume to PDF:", error);
      if (onError) {
        onError(error instanceof Error ? error : new Error('Unknown error during PDF export'));
      }
      setIsExporting(false);
    }
  };
  
  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isDisabled || !isBrowser || isExporting}
      className={buttonClassName}
    >
      {isExporting ? (
        <>
          <span className="spinner mr-2"></span>
          Processing...
        </>
      ) : (
        <>
          {iconClassName ? (
            <span className={iconClassName}></span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
            </svg>
          )}
          {buttonText}
        </>
      )}
    </button>
  );
};
