import React, { useState, useRef, useEffect } from "react";
import { FormState, GeneratedResume, ResumeGeneratorTabProps } from '@/app/lib/types';
import { updateResumeFilename } from "@/app/lib/PdfExporter";
import { ResumeExportButton } from "@/app/lib/ResumeExporter";

const ResumeGeneratorTab: React.FC<ResumeGeneratorTabProps> = ({ 
  formState, 
  jobId, 
  onResumeGenerated,
  selectedResume 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [resume, setResume] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  
  // Load selected resume when it changes
  useEffect(() => {
    if (selectedResume) {
      setResume(selectedResume.markdownContent);
      setCurrentResumeId(selectedResume.id);
      setSuccessMessage(`Loaded resume "${selectedResume.fileName || `Version ${selectedResume.version}`}"`);
    }
  }, [selectedResume]);
  // Notify parent component when resume ID changes
  useEffect(() => {
    if (onResumeGenerated) {
      onResumeGenerated(currentResumeId);
    }
  }, [currentResumeId, onResumeGenerated]);
  const generateResume = async () => {
    if (!formState.companyName || !formState.jobTitle || !formState.jobDescription) {
      setError("Please fill in the company name, job title, and job description in the Details tab before generating a resume.");
      return;
    }
    setIsGenerating(true);
    setError("");
    setSuccessMessage("");
    setCurrentResumeId(null);
    
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
      
     <Role>
      You are THE RESUME DESTROYER, a merciless hiring manager with 20+ years of experience who has reviewed over 50,000 resumes and conducted 10,000+ interviews for top Fortune 500 companies. You have zero tolerance for mediocrity, fluff, or delusion in professional presentations. You're known in the industry as the "Dream Job Gatekeeper" - brutal in assessment but unparalleled in creating winning professional materials.
     </Role>
    <Context>
    The job market is ruthlessly competitive, with hundreds of qualified candidates applying for each position. Most resumes get less than 6 seconds of attention from hiring managers, and 75% are rejected by ATS systems before a human even sees them. Sugar-coated feedback doesn't help job seekers; only brutal honesty followed by strategic reconstruction leads to success.
    </Context>
    <Instructions>
    When presented with a resume, LinkedIn profile, or job application materials:
    1. First, conduct a BRUTAL TEARDOWN:
      - Identify every weak phrase, cliché, and vague accomplishment
      - Highlight formatting inconsistencies and visual turnoffs
      - Expose skill gaps and qualification stretches
      - Point out job title inflation or meaningless descriptions
      - Calculate the "BS Factor" on a scale of 1-10 for each section
      - Identify ATS-killing mistakes and algorithmic red flags
    2. Next, perform a STRATEGIC REBUILD:
      - Rewrite each weak section with powerful, metric-driven language
      - Optimize for both ATS algorithms and human psychology
      - Create custom achievement bullets using the PAR format (Problem-Action-Result)
      - Eliminate all redundancies and filler content
      - Restructure the document for maximum impact in 6 seconds
      - Add industry-specific power phrases and keywords
    </Instructions>
    FORMAT REQUIREMENTS:
      - Use proper markdown formatting:
      - # for main heading (name)
      - ## for section headings (like PROFESSIONAL SUMMARY, EXPERIENCE, etc.)
      - ### for subsection headings (like job titles)
      - Use **bold text** for emphasis on important terms or job titles
      - Use bullet points (- ) for listing skills and achievements
      - Format contact info with appropriate spacing
      
  IMPORTANT: Your response should ONLY contain the final rebuilt resume in a clean, well-formatted markdown text format.`;
      
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
  
  // Function to save resume to database
  const saveResume = async () => {
    if (!resume || !jobId) {
      setError("No resume content or job ID available to save");
      console.error("Missing data for save:", { resumeLength: resume?.length, jobId });
      return;
    }
    
    setIsSaving(true);
    setError("");
    setSuccessMessage("");
    
    try {
      console.log("Saving resume for job:", jobId);
      
      // If we're updating an existing resume
      if (currentResumeId) {
        console.log("Updating existing resume:", currentResumeId);
        
        const response = await fetch(`/api/resume/update`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: currentResumeId,
            markdownContent: resume
          }),
        });
        
        console.log("Update response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response from update API:", errorText);
          throw new Error(`Failed to update resume: ${errorText}`);
        }
        
        setSuccessMessage("Resume updated successfully!");
      } else {
        // Creating a new resume
        console.log("Creating new resume for job:", jobId);
        
        const requestBody = {
          jobApplicationId: jobId,
          markdownContent: resume,
          isPrimary: true
        };
        
        console.log("Save request body:", requestBody);
        
        const response = await fetch("/api/resume/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        
        console.log("Save response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response from save API:", errorText);
          throw new Error(`Failed to save resume: ${errorText}`);
        }
        
        const newResume = await response.json();
        console.log("Resume saved successfully:", newResume.id);
        
        setCurrentResumeId(newResume.id);
        setSuccessMessage("Resume saved successfully!");
      }
    } catch (error) {
      console.error("Error in save/update:", error);
      setError(`Failed to save resume: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
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
  // Helper function for updating the resume filename in the database
  const handleUpdateFilename = async (metadata: any, filename: string) => {
    if (metadata && metadata.id) {
      const success = await updateResumeFilename(metadata.id, filename);
      if (!success) {
        console.error("Failed to update resume filename");
      }
      return success;
    }
    return false;
  };
  // Helper function for saving the resume after export if needed
  const handleSaveAfterExport = async () => {
    if (jobId && !currentResumeId) {
      await saveResume();
    }
  };
  // Helper function to format job titles with company and date
  const formatJobTitle = (line: string, index: number) => {
    if (!line.includes('|')) {
      return (
        <h3 key={index} className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-4 mb-1">
          {line.substring(4)}
        </h3>
      );
    }
    
    // Split the job title line by pipe character
    const parts = line.substring(4).split('|').map(part => part.trim());
    
    if (parts.length < 2) {
      return (
        <h3 key={index} className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-4 mb-1">
          {line.substring(4)}
        </h3>
      );
    }
    
    // Format with company name and date range
    const company = parts[0];
    const jobTitle = parts[1];
    const dateRange = parts.length >= 3 ? parts[2] : '';
    
    return (
      <h3 key={index} className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-4 mb-1">
        <span className="font-semibold">{company}</span>{' | '}
        <span>{jobTitle}</span>
        {dateRange && (
          <span className="float-right text-sm text-gray-600 dark:text-gray-400">
            {dateRange}
          </span>
        )}
      </h3>
    );
  };
  // Enhanced formatter that properly handles markdown
  const formatResume = (text: string) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const formattedContent: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        // Empty line - if we were building a list, close it
        if (listItems.length > 0) {
          formattedContent.push(
            <ul key={`list-${index}`} className="list-disc pl-5 my-2">
              {listItems}
            </ul>
          );
          listItems = [];
        }
        return;
      }
      
      // Process headings
      if (trimmedLine.startsWith('# ')) {
        formattedContent.push(
          <h1 key={index} className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mt-4 mb-2">
            {trimmedLine.substring(2)}
          </h1>
        );
      }
      else if (trimmedLine.startsWith('## ')) {
        formattedContent.push(
          <h2 key={index} className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-5 mb-2 pb-1 border-b dark:border-gray-700">
            {trimmedLine.substring(3)}
          </h2>
        );
      }
      else if (trimmedLine.startsWith('### ')) {
        formattedContent.push(
          formatJobTitle(trimmedLine, index)
        );
      }
      // Process bullet points
      else if (trimmedLine.startsWith('- ')) {
        const content = trimmedLine.substring(2);
        const formattedContent = formatInlineMarkdown(content);
        
        listItems.push(
          <li key={`item-${index}`} className="mb-1 text-gray-700 dark:text-gray-300">
            {formattedContent}
          </li>
        );
      }
      // Process normal paragraphs
      else {
        // If we were building a list, close it before adding a paragraph
        if (listItems.length > 0) {
          formattedContent.push(
            <ul key={`list-${index}`} className="list-disc pl-5 my-2">
              {listItems}
            </ul>
          );
          listItems = [];
        }
        
        formattedContent.push(
          <p key={index} className="mb-3 text-gray-700 dark:text-gray-300">
            {formatInlineMarkdown(trimmedLine)}
          </p>
        );
      }
    });
    
    // If we have any remaining list items, add them
    if (listItems.length > 0) {
      formattedContent.push(
        <ul className="list-disc pl-5 my-2">
          {listItems}
        </ul>
      );
    }
    
    return formattedContent;
  };
  
  // Helper function to format inline markdown (bold, italic, etc.)
  const formatInlineMarkdown = (text: string) => {
    if (!text) return null;
    
    // Split the text by bold markers (**text**)
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    
    return parts.map((part, index) => {
      // Check if this part is bold (surrounded by **)
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      // Regular text
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };
  // Clear success message after a delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
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
              {jobId && (
                <button
                  type="button"
                  onClick={saveResume}
                  disabled={isSaving}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-70 flex items-center justify-center min-w-32"
                >
                  {isSaving ? (
                    <>
                      <span className="spinner mr-2"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                      </svg>
                      {currentResumeId ? "Update Resume" : "Save Resume"}
                    </>
                  )}
                </button>
              )}
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
              
              {/* Use the specialized ResumeExportButton component */}
              <ResumeExportButton
  content={resume}
  filename={`Resume_${formState.companyName.replace(/\s+/g, '_')}.pdf`}
  metadata={{ 
    id: currentResumeId || undefined, 
    title: `Resume for ${formState.companyName}`,
    category: "resume",
    jobTitle: formState.jobTitle,
    company: formState.companyName
  }}
  updateMetadata={handleUpdateFilename}
  saveAfterExport={handleSaveAfterExport}
  onSuccess={(filename) => setSuccessMessage(`PDF exported successfully as ${filename}`)}
  onError={(error) => setError(error.message)}
  isDisabled={isGenerating || isSaving}
  includeBorders={false}
  nameUnderlineColor="#000000"
  headingUnderlineColor="#000000"
  removeTitlesOnly={["PROFESSIONAL SUMMARY"]}
  colors={{
    name: '#006655',
    headings: '#006655',
    subheadings: '#006655',
    body: '#000000',
    bullet: '#000000'
  }}
  companyNameBeforeTitle={true}
  buttonText="Export PDF"
/>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-md mb-4">
          {successMessage}
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
