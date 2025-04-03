import React, { useState, useRef, useEffect } from "react";
import { FormState } from "../types";
// Remove direct import of html2pdf
// import html2pdf from 'html2pdf.js';

interface CoverLetter {
  id: string;
  content: string;
  version: number;
  jobApplicationId: string;
  isPrimary: boolean;
  fileName: string | null;
  filePath: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CoverLetterTabProps {
  formState: FormState;
  jobId?: string;
  selectedCoverLetter: CoverLetter | null;
  onCoverLetterGenerated: (coverLetterId: string | null) => void;
}

const CoverLetterTab: React.FC<CoverLetterTabProps> = ({ formState, jobId }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [savedCoverLetters, setSavedCoverLetters] = useState<CoverLetter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentCoverLetterId, setCurrentCoverLetterId] = useState<string | null>(null);
  const [showSavedCoverLetters, setShowSavedCoverLetters] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  
  // Flag to check if we're running in browser
  const [isBrowser, setIsBrowser] = useState(false);
  
  // Set isBrowser to true once component mounts
  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Fetch saved cover letters when the jobId changes
  useEffect(() => {
    if (jobId) {
      fetchSavedCoverLetters();
    }
  }, [jobId]);

  // Clear success message after a delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch saved cover letters from the server
  const fetchSavedCoverLetters = async () => {
    if (!jobId) return;
    
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch(`/api/cover-letter/get-for-job?jobId=${jobId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch cover letters: ${errorText}`);
      }
      
      const data = await response.json();
      setSavedCoverLetters(data);
    } catch (error) {
      console.error("Error fetching cover letters:", error);
      setError(`Failed to fetch cover letters: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCoverLetter = async () => {
    if (!formState.companyName || !formState.jobTitle) {
      setError("Please fill in the company name and job title in the Details tab before generating a cover letter.");
      return;
    }
    setIsGenerating(true);
    setError("");
    setSuccessMessage("");
    setCurrentCoverLetterId(null);
    
    try {
      // Get resume data for cover letter generation
      const resumeResponse = await fetch("/api/resume/get");
      if (!resumeResponse.ok) {
        throw new Error("Failed to fetch resume data");
      }
      
      const resumeJson = await resumeResponse.json();
      
      // Create prompt for Gemini
      const prompt = `I need your help creating a customized cover letter for a specific job opportunity. Please tailor it to maximize my chances of success.
      JOB DETAILS:
      Title: ${formState.jobTitle}
      Company: ${formState.companyName}
      Description: ${formState.jobDescription || "Not provided"}
      MY RESUME DETAILS:
      ${JSON.stringify(resumeJson, null, 2)}
      COVER LETTER CUSTOMIZATION:
      Please help me by:
      1. Creating a cover letter that specifically addresses this position
      2. using my resume, write a very professional cover letter with no flowery or boastful language. only respond with the body of the letter formatted into paragraphs. do not add a greeting or a signature
      3. Ensuring the overall tone is professional yet conversational
      4. No more than 300 words
      IMPORTANT: Your response should ONLY contain the final cover letter`;
      
      // Make API call to Gemini
      const response = await fetch("/api/gemini/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          jobId: jobId || "temp-id",
          model: "gemini-flash-2.0"
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate cover letter: ${errorText}`);
      }
      
      const data = await response.json();
      setCoverLetter(data.coverLetter || "");
    } catch (error) {
      console.error("Error generating cover letter:", error);
      setError(`Failed to generate cover letter: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save the current cover letter to the database
  const saveCoverLetter = async () => {
    if (!coverLetter || !jobId) {
      setError("No cover letter content or job ID available to save");
      return;
    }
    
    setIsSaving(true);
    setError("");
    setSuccessMessage("");
    
    try {
      if (currentCoverLetterId) {
        // Update existing cover letter
        const response = await fetch(`/api/cover-letter/update`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: currentCoverLetterId,
            content: coverLetter
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update cover letter: ${errorText}`);
        }
        
        setSuccessMessage("Cover letter updated successfully!");
      } else {
        // Create new cover letter
        const response = await fetch("/api/cover-letter/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobApplicationId: jobId,
            content: coverLetter,
            isPrimary: savedCoverLetters.length === 0 // Make primary if it's the first one
          }),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to save cover letter: ${errorText}`);
        }
        
        const newCoverLetter = await response.json();
        setCurrentCoverLetterId(newCoverLetter.id);
        setSuccessMessage("Cover letter saved successfully!");
      }
      
      // Refresh the list of saved cover letters
      fetchSavedCoverLetters();
    } catch (error) {
      console.error("Error saving cover letter:", error);
      setError(`Failed to save cover letter: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Load a saved cover letter into the editor
  const loadCoverLetter = (coverLetterData: CoverLetter) => {
    setCoverLetter(coverLetterData.content);
    setCurrentCoverLetterId(coverLetterData.id);
    setSuccessMessage(`Loaded cover letter "${coverLetterData.fileName || `Version ${coverLetterData.version}`}"`);
    setShowSavedCoverLetters(false);
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
    if (!coverLetter || !isBrowser) return;
    
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
            .date {
              text-align: right;
              margin-bottom: 30px;
              color: #000000;
            }
            .content {
              color: #000000;
            }
            p {
              margin-bottom: 16px;
              color: #000000;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="date">
              <p>${new Date().toLocaleDateString()}</p>
            </div>
            <div class="content">
              ${coverLetter.split('\n\n').map(para => `<p>${para}</p>`).join('')}
            </div>
          </div>
        </body>
        </html>
      `;
      
      document.body.appendChild(element);
      
      // Create filename
      const filename = `Cover_Letter_${formState.companyName.replace(/\s+/g, '_')}.pdf`;
      
      // Fix: Explicitly define orientation as 'portrait' to match the type declaration
      const opt = {
        margin: 1,
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
          format: 'letter', 
          orientation: 'portrait' as 'portrait' // Type assertion to explicitly set as 'portrait'
        }
      };
      
      // Process PDF creation
      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(async () => {
          document.body.removeChild(element);
          
          // Update filename in database if cover letter is saved
          if (currentCoverLetterId) {
            try {
              const response = await fetch(`/api/cover-letter/update-filename`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: currentCoverLetterId,
                  fileName: filename
                }),
              });
              
              if (response.ok) {
                // Refresh the list of saved cover letters
                fetchSavedCoverLetters();
              }
            } catch (error) {
              console.error("Error updating filename:", error);
            }
          }
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

  const formatCoverLetter = (text: string) => {
    // Simple formatting: Split paragraphs and preserve whitespace
    return text.split('\n\n').map((paragraph, index) => (
      <p key={index} className="mb-4">{paragraph}</p>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          AI Cover Letter Generator
        </h3>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={generateCoverLetter}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center min-w-32"
          >
            {isGenerating ? (
              <>
                <span className="spinner mr-2"></span>
                Generating...
              </>
            ) : (
              "Generate Cover Letter"
            )}
          </button>
          
          {jobId && savedCoverLetters.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSavedCoverLetters(!showSavedCoverLetters)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center min-w-32"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              {showSavedCoverLetters ? "Hide Saved Letters" : "Show Saved Letters"}
            </button>
          )}
          
          {coverLetter && (
            <>
              {jobId && (
                <button
                  type="button"
                  onClick={saveCoverLetter}
                  disabled={isSaving}
                  className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:opacity-70 flex items-center justify-center min-w-32"
                >
                  {isSaving ? (
                    <>
                      <span className="spinner mr-2"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293z" />
                      </svg>
                      {currentCoverLetterId ? "Update Letter" : "Save Letter"}
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
      
      {successMessage && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-md mb-4">
          {successMessage}
        </div>
      )}
      
      {/* Dropdown panel for saved cover letters */}
      {showSavedCoverLetters && (
        <div className="bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 p-4 mb-4">
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
            Saved Cover Letters
          </h4>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="spinner mr-3"></div>
              <span>Loading saved cover letters...</span>
            </div>
          ) : savedCoverLetters.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 py-2">No saved cover letters found.</p>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      PDF
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {savedCoverLetters.map((letter) => (
                    <tr key={letter.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${letter.id === currentCoverLetterId ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(letter.createdAt).toLocaleDateString()} {new Date(letter.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {letter.isPrimary ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Primary
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            Secondary
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {letter.fileName ? (
                          <span className="text-blue-600 dark:text-blue-400">
                            {letter.fileName}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">
                            No PDF
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => loadCoverLetter(letter)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                        >
                          Load
                        </button>
                        {!letter.isPrimary && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const response = await fetch('/api/cover-letter/set-primary', {
                                  method: 'POST',
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ coverLetterId: letter.id }),
                                });
                                
                                if (response.ok) {
                                  fetchSavedCoverLetters();
                                  setSuccessMessage("Primary cover letter updated");
                                } else {
                                  setError("Failed to set primary cover letter");
                                }
                              } catch (err) {
                                console.error('Error setting primary cover letter:', err);
                                setError("Failed to set primary cover letter");
                              }
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                          >
                            Set Primary
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm("Are you sure you want to delete this cover letter?")) {
                              try {
                                const response = await fetch(`/api/cover-letter/delete`, {
                                  method: "DELETE",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ id: letter.id }),
                                });
                                
                                if (response.ok) {
                                  fetchSavedCoverLetters();
                                  
                                  // If we're currently viewing this cover letter, clear it
                                  if (currentCoverLetterId === letter.id) {
                                    setCoverLetter("");
                                    setCurrentCoverLetterId(null);
                                  }
                                  
                                  setSuccessMessage("Cover letter deleted successfully");
                                } else {
                                  setError("Failed to delete cover letter");
                                }
                              } catch (err) {
                                console.error('Error deleting cover letter:', err);
                                setError("Failed to delete cover letter");
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      
      <div className="h-[calc(100vh-240px)]">
        {!coverLetter && !isGenerating && (
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
                Create a customized cover letter with AI
              </p>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Click the "Generate Cover Letter" button to create a tailored cover letter based on this job posting and your resume.
              </p>
            </div>
          </div>
        )}
        
        {coverLetter && (
          <div className="flex flex-row h-full space-x-4">
            {/* Editable textarea */}
            <div className="w-1/2 flex flex-col">
              <h4 className="text-md font-medium mb-2 text-gray-700 dark:text-gray-300">
                Edit Cover Letter
              </h4>
              <textarea
                ref={textAreaRef}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="flex-1 p-4 rounded-md border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 font-mono resize-none"
                placeholder="Make any desired edits to your cover letter here..."
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
                {formatCoverLetter(coverLetter)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoverLetterTab;
