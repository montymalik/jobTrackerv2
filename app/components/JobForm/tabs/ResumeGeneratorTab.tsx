import React, { useState, useRef, useEffect } from "react";
import { FormState } from "../types";
// Remove direct import
// import html2pdf from 'html2pdf.js';

interface ResumeGeneratorTabProps {
  formState: FormState;
  jobId?: string;
}

const ResumeGeneratorTab: React.FC<ResumeGeneratorTabProps> = ({ formState, jobId }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [resume, setResume] = useState("");
  const [error, setError] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  
  // Flag to check if we're running in browser
  const [isBrowser, setIsBrowser] = useState(false);
  
  // Set isBrowser to true once component mounts
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  const generateResume = async () => {
    if (!formState.companyName || !formState.jobTitle || !formState.jobDescription) {
      setError("Please fill in the company name, job title, and job description in the Details tab before generating a resume.");
      return;
    }
    setIsGenerating(true);
    setError("");
    
    try {
      // Get base resume data
      const resumeResponse = await fetch("/api/resume/get");
      if (!resumeResponse.ok) {
        throw new Error("Failed to fetch resume data");
      }
      
      const resumeJson = await resumeResponse.json();
      
      // Create prompt for Gemini
      const prompt = `I need a customized resume for a job application. Please tailor my resume for this specific role:
      
      JOB DETAILS:
      Title: ${formState.jobTitle}
      Company: ${formState.companyName}
      Description: ${formState.jobDescription}
      
      MY EXISTING RESUME:
      ${JSON.stringify(resumeJson, null, 2)}
      
      INSTRUCTIONS:
      1. Create a concise, ATS-friendly resume that highlights relevant skills and experiences for this job
      2. Include a tailored summary/objective statement at the top
      3. Prioritize experiences, skills, and achievements most relevant to this position
      4. Use industry-specific keywords from the job description where applicable
      5. Maintain a clean, professional format
      6. Keep the resume to one or two pages maximum
      
      IMPORTANT: Your response should ONLY contain the final resume in a clean, well-formatted text format.`;
      
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
      setResume(data.resume || "");
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

  const exportToPDF = async () => {
    if (!resume || !isBrowser) return;
    
    try {
      // Dynamically import html2pdf only on the client side
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default;
      
      // Use a simpler approach with direct rendering
      const element = document.createElement('div');
      element.innerHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #000000;
              line-height: 1.6;
              margin: 0;
              padding: 20px;
              background-color: #ffffff;
            }
            .container {
              max-width: 8.5in;
              margin: 0 auto;
            }
            .content {
              color: #000000;
            }
            h1, h2, h3 {
              color: #2c3e50;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            p {
              margin-bottom: 16px;
              color: #000000;
            }
            ul {
              margin-bottom: 16px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              ${resume.split('\n\n').map(para => {
                // Check if this paragraph is a heading
                if (para.startsWith('# ')) {
                  return `<h1>${para.slice(2)}</h1>`;
                } else if (para.startsWith('## ')) {
                  return `<h2>${para.slice(3)}</h2>`;
                } else if (para.startsWith('### ')) {
                  return `<h3>${para.slice(4)}</h3>`;
                } else {
                  return `<p>${para}</p>`;
                }
              }).join('')}
            </div>
          </div>
        </body>
        </html>
      `;
      
      document.body.appendChild(element);
      
      const opt = {
        margin: 0.5,
        filename: `Resume_${formState.companyName.replace(/\s+/g, '_')}.pdf`,
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
          format: 'letter', 
          orientation: 'portrait' as 'portrait'
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
    } catch (error) {
      console.error("Error loading html2pdf:", error);
      setError("Failed to load PDF generation library. Please try again.");
    }
  };

  const formatResume = (text: string) => {
    // Simple formatting for resume text
    return text.split('\n\n').map((paragraph, index) => {
      // Check if this paragraph is a heading
      if (paragraph.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold mt-6 mb-4">{paragraph.slice(2)}</h1>;
      } else if (paragraph.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-bold mt-5 mb-3">{paragraph.slice(3)}</h2>;
      } else if (paragraph.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-bold mt-4 mb-2">{paragraph.slice(4)}</h3>;
      } else {
        return <p key={index} className="mb-4">{paragraph}</p>;
      }
    });
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
              "Generate Resume"
            )}
          </button>
          
          {resume && (
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
        {!resume && !isGenerating && (
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
                Click the "Generate Resume" button to create a customized resume targeted to this specific job posting.
              </p>
            </div>
          </div>
        )}
        
        {resume && (
          <div className="flex flex-row h-full space-x-4">
            {/* Editable textarea */}
            <div className="w-1/2 flex flex-col">
              <h4 className="text-md font-medium mb-2 text-gray-700 dark:text-gray-300">
                Edit Resume
              </h4>
              <textarea
                ref={textAreaRef}
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                className="flex-1 p-4 rounded-md border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 font-mono resize-none"
                placeholder="Make any desired edits to your resume here..."
              />
            </div>
            {/* Formatted display view */}
            <div 
              ref={pdfContainerRef}
              className="w-1/2 overflow-y-auto bg-white dark:bg-gray-800 p-6 rounded-md border dark:border-gray-700"
            >
              <h4 className="text-md font-medium mb-4 text-gray-700 dark:text-gray-300">
                Preview
              </h4>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                {formatResume(resume)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeGeneratorTab;
