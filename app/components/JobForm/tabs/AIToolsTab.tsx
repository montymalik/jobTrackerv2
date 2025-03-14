import React, { useState, useEffect } from "react";

interface AIToolsTabProps {
  formState: {
    jobDescription: string;
  };
  jobId?: string;
}

// A simplified, direct approach to formatting the resume analysis
const formatAnalysisOutput = (text: string) => {
  if (!text) return "";
  
  // Basic HTML sanitization
  text = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  
  // Format percentage matches prominently
  text = text.replace(/(\d+)%/g, '<span class="text-blue-600 font-bold text-lg">$1%</span>');
  
  // Format headings first
  text = text.replace(/^##?\s+(.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>');
  
  // Format bold text
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Format italic text - only clear cases
  text = text.replace(/\*([^*]{3,})\*/g, '<em>$1</em>');
  
  // Simple preprocessing for bullet points
  text = text.replace(/^•/gm, "*");
  
  // Process the text line by line
  const lines = text.split('\n');
  let html = '';
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (line === '') {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      continue;
    }
    
    // Process bullet points
    if (line.startsWith('* ')) {
      const content = line.substring(2);
      
      // Check if this is a bullet with a title/heading
      const titleMatch = content.match(/^([^:]+):(.*)/);
      
      if (titleMatch) {
        const title = titleMatch[1];
        const description = titleMatch[2].trim();
        
        if (!inList) {
          html += '<ul class="list-disc pl-5 space-y-2">';
          inList = true;
        }
        
        if (description) {
          html += `<li><strong>${title}:</strong> ${description}</li>`;
        } else {
          html += `<li><strong>${title}:</strong></li>`;
        }
      } else {
        if (!inList) {
          html += '<ul class="list-disc pl-5 space-y-2">';
          inList = true;
        }
        
        html += `<li>${content}</li>`;
      }
      continue;
    }
    
    // Process numbered lists
    const numberMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numberMatch) {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      
      const number = numberMatch[1];
      const content = numberMatch[2];
      
      html += `<div class="flex ml-5 mb-2">
        <div class="mr-2 font-bold">${number}.</div>
        <div>${content}</div>
      </div>`;
      continue;
    }
    
    // Close any open list
    if (inList) {
      html += '</ul>';
      inList = false;
    }
    
    // Handle section titles that end with a colon
    if (line.match(/^[A-Z][\w\s]+:$/)) {
      const title = line.replace(/:$/, '');
      html += `<h3 class="text-lg font-semibold mt-4 mb-2">${title}:</h3>`;
      continue;
    }
    
    // Handle indented section titles
    if (line.match(/^\s{2,}[A-Z][\w\s]+:/)) {
      const title = line.trim().replace(/:$/, '');
      html += `<h4 class="text-base font-medium mt-3 mb-1 ml-4">${title}:</h4>`;
      continue;
    }
    
    // Regular paragraph
    html += `<p class="mb-3">${line}</p>`;
  }
  
  // Close any remaining list
  if (inList) {
    html += '</ul>';
  }
  
  return html;
};

const AIToolsTab: React.FC<AIToolsTabProps> = ({ formState, jobId }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [formattedResult, setFormattedResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<any>(null);
  const [primaryResume, setPrimaryResume] = useState<any>(null);

  // Format analysis result when it changes
  useEffect(() => {
    if (analysisResult) {
      setFormattedResult(formatAnalysisOutput(analysisResult));
    }
  }, [analysisResult]);

  // Fetch the base resume on component mount
  useEffect(() => {
    const fetchResumeData = async () => {
      try {
        const response = await fetch("/api/resume/get");
        if (response.ok) {
          const data = await response.json();
          setResumeData(data);
        } else {
          console.error("Failed to fetch base resume");
        }
      } catch (error) {
        console.error("Error fetching resume:", error);
      }
    };

    // Fetch job-specific resumes if we have a job ID
    const fetchJobResumes = async () => {
      if (!jobId) return;
      
      try {
        const response = await fetch(`/api/resume/get-for-job?jobId=${jobId}`);
        if (response.ok) {
          const resumes = await response.json();
          // Find primary resume if any
          const primary = resumes.find((r: any) => r.isPrimary);
          if (primary) {
            setPrimaryResume(primary);
          }
        }
      } catch (error) {
        console.error("Error fetching job resumes:", error);
      }
    };

    fetchResumeData();
    fetchJobResumes();
  }, [jobId]);

  const analyzeResumeMatch = async () => {
    if (!formState.jobDescription) {
      setError("Please provide a job description in the Job Description tab.");
      return;
    }

    if (!resumeData && !primaryResume) {
      setError("No resume found. Please upload a base resume or create a resume for this job.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setFormattedResult(null);

    try {
      // Use the job-specific resume if available, otherwise fall back to base resume
      const resumeToUse = primaryResume || resumeData;
      
      let resumeContent = "";
      if (primaryResume && primaryResume.markdownContent) {
        // If we have a job-specific resume with markdown content
        resumeContent = primaryResume.markdownContent;
      } else if (resumeData) {
        // Otherwise use the base resume JSON data
        resumeContent = JSON.stringify(resumeData);
      }

      const response = await fetch("/api/resume/resume-match-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: formState.jobDescription,
          resumeText: resumeContent,
          jobId: jobId || "temp-id"
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to analyze resume match: ${errorText}`);
      }

      const data = await response.json();
      setAnalysisResult(data.analysis);
    } catch (error) {
      console.error("Error analyzing resume match:", error);
      setError(`Failed to analyze resume: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
        AI Resume Analysis
      </h3>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border dark:border-gray-700">
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Use AI to analyze how well your resume matches this job description. The analysis will provide a compatibility score and suggestions for improvement.
        </p>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Resume Status:</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {primaryResume 
                ? "✅ Job-specific resume available" 
                : resumeData 
                  ? "⚠️ Using base resume (consider creating a tailored resume in the AI Resume tab)" 
                  : "❌ No resume found. Please upload a resume first."}
            </p>
          </div>
          <button
            type="button"
            onClick={analyzeResumeMatch}
            disabled={isAnalyzing || (!resumeData && !primaryResume)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center min-w-32"
          >
            {isAnalyzing ? (
              <>
                <span className="spinner mr-2"></span>
                Analyzing...
              </>
            ) : (
              "Analyze Resume Match"
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md mb-4">
            {error}
          </div>
        )}

        {!analysisResult && !isAnalyzing && !error && (
          <div className="bg-gray-50 dark:bg-gray-900 p-8 rounded-md text-center">
            <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-12 w-12 text-blue-600 dark:text-blue-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-lg">
              Click "Analyze Resume Match" to get insights on how your resume aligns with this job description.
            </p>
          </div>
        )}

        {formattedResult && (
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-md overflow-auto max-h-[650px] mt-4">
            <div 
              className="prose prose-blue dark:prose-invert max-w-none" 
              dangerouslySetInnerHTML={{ __html: formattedResult }} 
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AIToolsTab;
