import React from 'react';

// Types of content supported by the exporter
export type ContentType = 'markdown' | 'html' | 'text';

// Generic metadata interface that can be extended for specific use cases
export interface DocumentMetadata {
  id?: string;
  title?: string;
  author?: string;
  category?: string;
  tags?: string[];
  [key: string]: any; // Allow any additional metadata
}

export interface PdfExportOptions {
  filename?: string;
  customStyles?: string;
  contentType?: ContentType;
  metadata?: DocumentMetadata;
  onSuccess?: (filename: string, metadata?: DocumentMetadata) => void;
  onError?: (error: Error) => void;
  onBeforeRender?: (element: HTMLElement) => void;
  updateMetadata?: (metadata: DocumentMetadata, filename: string) => Promise<boolean>;
  saveAfterExport?: () => Promise<void>;
  // PDF generation options
  margin?: number | [number, number, number, number]; // [top, right, bottom, left]
  pageSize?: 'letter' | 'legal' | 'tabloid' | 'a4' | 'a3';
  orientation?: 'portrait' | 'landscape';
  customRenderer?: (content: string, element: HTMLElement, contentType: ContentType) => void;
  removeTitles?: string[]; // Array of section titles to remove
}

export interface ContentToPdfOptions {
  content: string;
  contentType?: ContentType;
  metadata?: DocumentMetadata;
  options: PdfExportOptions;
}

/**
 * Generic function to convert content to PDF
 */
export const exportContentToPdf = async ({ 
  content, 
  contentType = 'markdown',
  metadata = {},
  options 
}: ContentToPdfOptions): Promise<void> => {
  if (!content) {
    throw new Error("No content provided for PDF generation");
  }
  
  try {
    // Dynamically import html2pdf only on the client side
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default;
    
    // Create a clean HTML template for the PDF
    const element = document.createElement('div');
    element.innerHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            color: #000000 !important;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
          }
          .container {
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.75in 0.75in;
            color: #000000 !important;
          }
          /* Generic headings */
          h1 {
            font-size: 24px;
            margin-bottom: 10px;
            color: #000000 !important;
            font-weight: bold;
          }
          h2 {
            font-size: 18px;
            color: #000000 !important;
            margin-top: 20px;
            margin-bottom: 10px;
            font-weight: bold;
          }
          h3 {
            font-size: 16px;
            margin-bottom: 5px;
            margin-top: 15px;
            color: #000000 !important;
            font-weight: bold;
          }
          /* List styles */
          ul {
            margin-top: 8px;
            margin-bottom: 16px;
            padding-left: 20px;
            color: #000000 !important;
          }
          li {
            margin-bottom: 6px;
            page-break-inside: avoid;
            color: #000000 !important;
          }
          p {
            margin-bottom: 10px;
            margin-top: 0;
            color: #000000 !important;
          }
          /* Page settings */
          @page {
            margin: 0;
          }
          /* Custom styling extension point */
          ${options.customStyles || ''}
        </style>
      </head>
      <body>
        <div class="container" id="content-container">
        </div>
      </body>
      </html>
    `;
    
    document.body.appendChild(element);
    
    const contentContainer = element.querySelector('#content-container');
    if (contentContainer) {
      // Use custom renderer if provided
      if (options.customRenderer) {
        options.customRenderer(content, contentContainer as HTMLElement, contentType);
      } else {
        // Default rendering based on content type
        switch (contentType) {
          case 'html':
            contentContainer.innerHTML = content;
            break;
            
          case 'text':
            // Simple text with line breaks preserved
            contentContainer.innerHTML = content
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/\n/g, '<br />');
            break;
            
          case 'markdown':
          default:
            contentContainer.innerHTML = renderMarkdownToHtml(content);
            break;
        }
      }
    }
    
    // Allow for modifications before rendering
    if (options.onBeforeRender) {
      options.onBeforeRender(element);
    }
    
    const filename = options.filename || 'Document.pdf';
    
    const pdfOptions = {
      margin: options.margin || 0,
      filename: filename,
      image: { 
        type: 'jpeg', 
        quality: 1 
      },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        allowTaint: true
      },
      jsPDF: { 
        unit: 'in', 
        format: options.pageSize || 'letter', 
        orientation: options.orientation || 'portrait' as 'portrait' | 'landscape'
      }
    };
    
    // Process PDF creation
    await html2pdf()
      .set(pdfOptions)
      .from(element)
      .save();
    
    document.body.removeChild(element);
    
    // If we have metadata and updateMetadata function, update the metadata
    if (metadata.id && options.updateMetadata) {
      await options.updateMetadata(metadata, filename);
    } 
    // Or if we have a saveAfterExport function, call it
    else if (options.saveAfterExport) {
      await options.saveAfterExport();
    }
    
    // Call success callback if provided
    if (options.onSuccess) {
      options.onSuccess(filename, metadata);
    }
  } catch (error) {
    console.error("PDF generation error:", error);
    if (options.onError) {
      options.onError(error instanceof Error ? error : new Error("Unknown error in PDF generation"));
    }
  }
};

/**
 * Convert markdown to HTML
 */
export const renderMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  
  const lines = markdown.split('\n');
  let htmlContent = '';
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      // Empty line
      if (inList) {
        htmlContent += '</ul>';
        inList = false;
      }
      htmlContent += '<br />';
      continue;
    }
    
    // Handle headings
    if (line.startsWith('# ')) {
      htmlContent += '<h1>' + line.substring(2) + '</h1>';
    }
    else if (line.startsWith('## ')) {
      htmlContent += '<h2>' + line.substring(3) + '</h2>';
    }
    else if (line.startsWith('### ')) {
      htmlContent += '<h3>' + line.substring(4) + '</h3>';
    }
    // Handle bullet points
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      const prefix = line.startsWith('- ') ? '- ' : '* ';
      if (!inList) {
        htmlContent += '<ul>';
        inList = true;
      }
      
      let itemContent = line.substring(prefix.length);
      // Handle bold text with ** markers
      itemContent = itemContent.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
      // Handle italic text with * markers (single asterisk)
      itemContent = itemContent.replace(/(?<!\*)\*(?!\*)([^*]+)(?<!\*)\*(?!\*)/g, '<i>$1</i>');
      // Handle links [text](url)
      itemContent = itemContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
      
      htmlContent += '<li>' + itemContent + '</li>';
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
      
      htmlContent += '<p style="color:#000000 !important">' + formattedLine + '</p>';
    }
  }
  
  // Close any open list
  if (inList) {
    htmlContent += '</ul>';
  }
  
  return htmlContent;
};

/**
 * React component for exporting content to PDF
 */
interface PdfExportButtonProps {
  content: string;
  contentType?: ContentType;
  filename?: string;
  metadata?: DocumentMetadata;
  customStyles?: string;
  onSuccess?: (filename: string, metadata?: DocumentMetadata) => void;
  onError?: (error: Error) => void;
  updateMetadata?: (metadata: DocumentMetadata, filename: string) => Promise<boolean>;
  saveAfterExport?: () => Promise<void>;
  margin?: number | [number, number, number, number];
  pageSize?: 'letter' | 'legal' | 'tabloid' | 'a4' | 'a3';
  orientation?: 'portrait' | 'landscape';
  buttonText?: string;
  buttonClassName?: string;
  iconClassName?: string;
  isDisabled?: boolean;
  customRenderer?: (content: string, element: HTMLElement, contentType: ContentType) => void;
}

export const PdfExportButton: React.FC<PdfExportButtonProps> = ({
  content,
  contentType = 'markdown',
  filename = 'Document.pdf',
  metadata,
  customStyles,
  onSuccess,
  onError,
  updateMetadata,
  saveAfterExport,
  margin,
  pageSize = 'letter',
  orientation = 'portrait',
  buttonText = 'Export PDF',
  buttonClassName = 'px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center min-w-32',
  iconClassName,
  isDisabled = false,
  customRenderer
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
      await exportContentToPdf({
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
          margin,
          pageSize,
          orientation,
          customRenderer
        }
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
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

// Example utility for resume-specific metadata update
export const updateResumeFilename = async (resumeId: string, fileName: string): Promise<boolean> => {
  try {
    const response = await fetch("/api/resume/update-filename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeId, fileName })
    });
    
    if (!response.ok) {
      console.error("Failed to update resume filename. Status:", response.status);
      const errorText = await response.text();
      console.error("Error details:", errorText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to update resume filename:", error);
    return false;
  }
};

// Example utility for updating any document metadata
export const updateDocumentMetadata = async (endpoint: string, metadata: DocumentMetadata, fileName: string): Promise<boolean> => {
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...metadata, fileName })
    });
    
    if (!response.ok) {
      console.error("Failed to update document metadata. Status:", response.status);
      const errorText = await response.text();
      console.error("Error details:", errorText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to update document metadata:", error);
    return false;
  }
};
