import React, { useState, useRef } from "react";
import { FormState } from "../types";
import html2pdf from 'html2pdf.js';
import ReactMarkdown from 'react-markdown';
import ReactDOMServer from 'react-dom/server';

interface ResumeGeneratorTabProps {
  formState: FormState;
  jobId?: string;
}

// Helper function to process resume content before rendering
const processResumeContent = (content: string): string => {
  if (!content) return '';
  
  // Remove XML tags but keep their content
  let processedContent = content
    .replace(/<(professional summary|key achievements|awards|relevant work experience|education and professional development)>/g, '')
    .replace(/<\/(professional summary|key achievements|awards|relevant work experience|education and professional development)>/g, '');
    
  return processedContent;
};

// Custom components for ReactMarkdown
const MarkdownComponents = {
  h1: (props: any) => <h1 className="text-2xl font-bold text-center text-blue-800 my-4">{props.children}</h1>,
  h2: (props: any) => <h2 className="text-xl font-semibold text-blue-700 border-b pb-1 mt-6 mb-3">{props.children}</h2>,
  h3: (props: any) => <h3 className="text-lg font-medium mt-4 mb-2">{props.children}</h3>,
  ul: (props: any) => <ul className="list-disc pl-5 my-3">{props.children}</ul>,
  li: (props: any) => <li className="mb-1">{props.children}</li>,
  strong: (props: any) => <strong className="font-semibold">{props.children}</strong>,
  p: (props: any) => <p className="mb-3">{props.children}</p>,
};

const ResumeGeneratorTab: React.FC<ResumeGeneratorTabProps> = ({ formState, jobId }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState("");
  const [error, setError] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);

  const generateResume = async () => {
    if (!formState.companyName || !formState.jobTitle) {
      setError("Please fill in the company name and job title in the Details tab before generating a resume.");
      return;
    }
    setIsGenerating(true);
    setError("");
    
    try {
      // Get resume data for resume generation
      const resumeResponse = await fetch("/api/resume/get");
      if (!resumeResponse.ok) {
        throw new Error("Failed to fetch resume data");
      }
      
      const resumeJson = await resumeResponse.json();
      
      // Enhanced prompt with better formatting instructions
      const prompt = `I need your help optimizing my resume for a specific job opportunity. Please tailor it to maximize my chances of success.
      JOB DETAILS:
      Title: ${formState.jobTitle}
      Company: ${formState.companyName}
      Description: ${formState.jobDescription || "Not provided"}
      MY CURRENT RESUME:
      ${JSON.stringify(resumeJson, null, 2)}
      
      RESUME OPTIMIZATION:
      Please help me by:
      1. Identifying key keywords and phrases from the job description that should appear in my resume
      2. Reformatting my work experience bullets using the STAR method, but as single concise statements. Each bullet should flow naturally while incorporating:
         - The Situation/challenge I faced
         - The Task I was responsible for
         - The Action I took to address it
         - The Results achieved (with metrics when possible)
         
         For example, instead of separate bullets, create statements like:
         "Resolved persistent customer complaints (Situation) by leading a cross-functional team (Task) to redesign the returns process (Action), reducing return processing time by 45% and improving customer satisfaction scores from 3.2 to 4.8/5 (Result)."
      
      3. Suggesting a revised professional summary that aligns with the job requirements
      4. Recommending skills to highlight based on the job description
      5. Suggesting any formatting improvements for ATS optimization
      6. Reorganizing content to prioritize the most relevant experience
      
      FORMAT INSTRUCTIONS:
      Please use proper markdown formatting for better readability:
      - Use # for the resume title (my name)
      - Use ## for section headings like "PROFESSIONAL SUMMARY", "SKILLS", "EXPERIENCE", etc.
      - Use ### for job titles or company names
      - Use **bold text** for emphasis on important skills, company names, or job titles
      - Use proper bullet points with - or * for listing skills and achievements
      - Format content in this structure:
      
      # FULL NAME
      **Email:** email@example.com | **Phone:** (123) 456-7890 | **Location:** City, State | **LinkedIn:** linkedin.com/in/username
      
      ## PROFESSIONAL SUMMARY
      A concise 3-4 line summary highlighting relevant experience and skills for this specific role.
      
      ## TECHNICAL SKILLS
      - Skill category 1: Specific skills
      - Skill category 2: Specific skills
      
      ## PROFESSIONAL EXPERIENCE
      ### **Job Title** | Company Name | MM/YYYY - MM/YYYY
      - Achievement using STAR format
      - Another achievement using STAR format
      
      ## EDUCATION
      ### **Degree**, University Name, Graduation Year
      
      7. Separate the sections with the following tags: 
          <professional summary>...</professional summary>
          <key achievements>...</key achievements>
          <awards>...</awards>
          <relevant work experience>...</relevant work experience>
          <education and professional development>...</education and professional development>
          
      IMPORTANT: Your response should ONLY contain the final resume in markdown format starting with "# RESUME" or my name. Do not include any explanations, notes, or commentary. Do not use phrases like "Here is your optimized resume" or "I've tailored your resume". Just provide the clean resume content that begins with the resume heading.`;
      
      // Make API call to Gemini
      const response = await fetch("/api/gemini/generate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          jobId: jobId || "temp-id",
          model: "gemini-2.0-flash-thinking-exp"
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate resume: ${errorText}`);
      }
      
      const data = await response.json();
      setGeneratedResume(data.resume || "");
    } catch (error) {
      console.error("Error generating resume:", error);
      setError(`Failed to generate resume: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (textAreaRef.current) {
      navigator.clipboard.writeText(textAreaRef.current.value)
        .then(() => {
          // Show temporary success message
          const originalText = textAreaRef.current!.placeholder;
          textAreaRef.current!.placeholder = "Copied to clipboard!";
          setTimeout(() => {
            if (textAreaRef.current) {
              textAreaRef.current.placeholder = originalText;
            }
          }, 1500);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          setError("Failed to copy to clipboard. Please try again.");
        });
    }
  };

  const exportToPDF = () => {
    if (!generatedResume) return;
    
    // Create a clean HTML template for the PDF
    const element = document.createElement('div');
    element.innerHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            color: #333333;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
          }
          .container {
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.75in 0.75in;
          }
          h1 {
            text-align: center;
            font-size: 24px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
            color: #2c3e50;
            font-weight: bold;
          }
          .contact-info {
            text-align: center;
            margin-bottom: 20px;
            font-size: 12px;
            color: #555;
            line-height: 1.4;
          }
          h2 {
            font-size: 14px;
            color: #2c3e50;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
            margin-top: 25px;
            margin-bottom: 12px;
            text-transform: uppercase;
            font-weight: bold;
          }
          h3 {
            font-size: 14px;
            margin-bottom: 5px;
            margin-top: 15px;
            font-weight: normal;
          }
          .custom-list {
            margin-top: 0;
            margin-bottom: 0;
            padding-left: 0;
            list-style-type: none;
          }
          .custom-list li {
            position: relative;
            padding-left: 15px;
            margin-bottom: 6px;
            page-break-inside: avoid;
            color: #555;
            line-height: 1.4;
          }
          .custom-list li:before {
            content: "•";
            position: absolute;
            left: 0;
            color: #555;
            font-weight: bold;
          }
          p {
            margin-bottom: 10px;
            margin-top: 0;
            color: #555;
            line-height: 1.4;
          }
          strong {
            font-weight: 600;
            color: #333;
          }
          .job-title {
            font-weight: bold;
          }
          .company-name {
            font-style: normal;
          }
          .date-range {
            float: right;
            font-size: 12px;
            color: #555;
          }
          .section-content {
            margin-bottom: 15px;
          }
          .skills-category {
            font-weight: bold;
            color: #333;
          }
          .experience-item {
            margin-bottom: 15px;
          }
          .experience-header {
            margin-bottom: 5px;
          }
          .job-bullets {
            padding-top: 2px;
          }
          .summary-text {
            color: #555;
            line-height: 1.4;
          }
          @page {
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="container" id="resume-content">
        </div>
      </body>
      </html>
    `;
    
    document.body.appendChild(element);
    
    // Process the markdown content to clean HTML
    const processedContent = processResumeContent(generatedResume);
    
    // Convert markdown to HTML manually with specific formatting
    let htmlContent = '';
    
    // Process the content line by line
    const lines = processedContent.split('\n');
    let inList = false;
    let currentSection = '';
    let inExperience = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Handle headings
      if (line.startsWith('# ')) {
        htmlContent += '<h1>' + line.substring(2) + '</h1>';
      }
      // Handle section headings
      else if (line.startsWith('## ')) {
        const sectionTitle = line.substring(3);
        currentSection = sectionTitle.toLowerCase().replace(/\\s+/g, '-');
        
        // Close previous section if needed
        if (i > 0 && (lines[i-1].startsWith('## ') || lines[i-1].trim() === '')) {
          if (inList) {
            htmlContent += '</ul>';
            inList = false;
          }
          htmlContent += '</div>'; // Close previous section
        }
        
        htmlContent += '<h2>' + sectionTitle + '</h2><div class="section-content" id="' + currentSection + '">';
      }
      // Handle job titles or education
      else if (line.startsWith('### ')) {
        if (inList) {
          htmlContent += '</ul>';
          inList = false;
        }
        
        // Check if this is a job title with company and date
        const content = line.substring(4);
        if (content.includes('|')) {
          inExperience = true;
          const parts = content.split('|').map(part => part.trim());
          
          if (parts.length >= 3) {
            const jobTitle = parts[0].replace(/\\*\\*/g, '').trim();
            const company = parts[1].trim();
            const dateRange = parts[2].trim();
            
            htmlContent += '<div class="experience-item">' +
                           '<div class="experience-header">' +
                           '<strong>' + jobTitle + '</strong> | ' + company + ' | ' +
                           '<span class="date-range">' + dateRange + '</span>' +
                           '</div>';
          } else {
            htmlContent += '<div class="experience-item">' +
                           '<div class="experience-header">' + content + '</div>';
          }
        } else {
          inExperience = false;
          htmlContent += '<h3>' + content + '</h3>';
        }
      }
      // Handle bullet points
      else if (line.startsWith('- ')) {
        if (!inList) {
          htmlContent += '<ul class="custom-list' + (inExperience ? ' job-bullets' : '') + '">';
          inList = true;
        }
        
        // Replace bold text markers
        let itemContent = line.substring(2);
        itemContent = itemContent.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
        
        htmlContent += '<li>' + itemContent + '</li>';
      }
      // Handle contact info line
      else if (line !== '' && line.includes('**Email:**')) {
        const contactLine = line.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
        htmlContent += '<div class="contact-info">' + contactLine + '</div>';
      }
      // Handle regular paragraphs
      else if (line !== '') {
        if (inList) {
          htmlContent += '</ul>';
          inList = false;
        }
        
        // Replace bold text markers
        let paraContent = line;
        paraContent = paraContent.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
        
        // Add special class for summary text
        if (currentSection.includes('summary')) {
          htmlContent += '<p class="summary-text">' + paraContent + '</p>';
        } else {
          htmlContent += '<p>' + paraContent + '</p>';
        }
      }
      // Handle empty line after job title to close the experience item div
      else if (line === '' && inExperience && i > 0 && !lines[i-1].startsWith('- ') && i+1 < lines.length && !lines[i+1].startsWith('- ')) {
        if (inList) {
          htmlContent += '</ul>';
          inList = false;
        }
        htmlContent += '</div>'; // Close experience-item
        inExperience = false;
      }
    }
    
    // Close any open list
    if (inList) {
      htmlContent += '</ul>';
    }
    
    // Close experience item if open
    if (inExperience) {
      htmlContent += '</div>';
    }
    
    // Close any open section
    if (currentSection !== '') {
      htmlContent += '</div>';
    }
    
    // Set the content
    const resumeContent = element.querySelector('#resume-content');
    if (resumeContent) {
      resumeContent.innerHTML = htmlContent;
    }
    
    const opt = {
      margin: 0,
      filename: `Resume_${formState.companyName.replace(/\\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        allowTaint: true
      },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait'
      }
    };
    
    // Process PDF creation
    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        document.body.removeChild(element);
      })
      .catch(err => {
        console.error("PDF generation error:", err);
        setError("Failed to generate PDF. Please try again.");
        document.body.removeChild(element);
      });
  };

  // Enhanced Markdown to HTML converter
  const convertMarkdownToHTML = (markdown: string) => {
    let html = markdown
      // Headers
      .replace(/# (.+)/g, '<h1>$1</h1>')
      .replace(/## (.+)/g, '<h2>$1</h2>')
      .replace(/### (.+)/g, '<h3>$1</h3>')
      
      // Bold and italic - improved regex to handle multi-word formatting
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      
      // Lists - improved to handle multi-line bullet points
      .replace(/^[\s]*[-*+][\s]+(.+)$/gm, '<li>$1</li>')
      
      // Ordered lists
      .replace(/^[\s]*(\d+)\.[\s]+(.+)$/gm, '<li>$2</li>')
      
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      
      // Horizontal rules
      .replace(/^\s*[-*_]{3,}\s*$/gm, '<hr />')
      
      // Paragraphs
      .replace(/\n\n/g, '</p><p>');
    
    // Better list handling
    let listOpen = false;
    const lines = html.split('\n');
    html = '';
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('<li>')) {
        if (!listOpen) {
          html += '<ul>';
          listOpen = true;
        }
        html += lines[i];
      } else {
        if (listOpen) {
          html += '</ul>';
          listOpen = false;
        }
        html += lines[i];
      }
    }
    
    if (listOpen) {
      html += '</ul>';
    }
    
    // Wrap in paragraphs if needed
    if (!html.startsWith('<h1>') && !html.startsWith('<p>') && !html.startsWith('<ul>')) {
      html = '<p>' + html + '</p>';
    }
    
    // Fix for any XML tags in the prompt
    html = html.replace(/<(professional summary|key achievements|awards|relevant work experience|education and professional development)>/g, '<div class="section-$1"><h2 class="section-heading">$1</h2>');
    html = html.replace(/<\/(professional summary|key achievements|awards|relevant work experience|education and professional development)>/g, '</div>');
    
    return html;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          AI Resume Generator
        </h3>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={generateResume}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center min-w-32"
          >
            {isGenerating ? (
              <>
                <span className="spinner mr-2"></span>
                Generating...
              </>
            ) : (
              "Generate Tailored Resume"
            )}
          </button>
          
          {generatedResume && (
            <>
              <button
                type="button"
                onClick={copyToClipboard}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center min-w-32"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
                Copy
              </button>
              <button
                type="button"
                onClick={exportToPDF}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center min-w-32"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                </svg>
                Export PDF
              </button>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <div className="h-[calc(100vh-240px)]">
        {!generatedResume && !isGenerating && (
          <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8 rounded-md text-center">
            <div>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-12 w-12 mx-auto text-gray-400 mb-4" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-300 mb-2 text-lg font-medium">
                Create a tailored resume with AI
              </p>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Click the "Generate Tailored Resume" button to create a customized resume based on this job posting and your base resume.
              </p>
            </div>
          </div>
        )}
        
        {generatedResume && (
          <div className="flex flex-row h-full space-x-4">
            {/* Editable textarea */}
            <div className="w-1/2 flex flex-col">
              <h4 className="text-md font-medium mb-2 text-gray-700 dark:text-gray-300">
                Edit Resume
              </h4>
              <textarea
                ref={textAreaRef}
                value={generatedResume}
                onChange={(e) => setGeneratedResume(e.target.value)}
                className="flex-1 p-4 rounded-md border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 font-mono resize-none"
                placeholder="Make any desired edits to your resume here..."
              />
            </div>
            
            {/* Enhanced formatted display view with custom components */}
            <div 
              ref={pdfContainerRef}
              className="w-1/2 overflow-y-auto bg-white dark:bg-gray-800 p-6 rounded-md border dark:border-gray-700"
            >
              <h4 className="text-md font-medium mb-4 text-gray-700 dark:text-gray-300">
                Preview
              </h4>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <ReactMarkdown components={MarkdownComponents}>
                  {processResumeContent(generatedResume)}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeGeneratorTab;
