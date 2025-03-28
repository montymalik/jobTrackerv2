import React, { useState, useRef, useEffect } from "react";
import { FormState, GeneratedResume, ResumeGeneratorTabProps } from '@/app/lib/types';
import { updateResumeFilename } from "@/app/lib/PdfExporter";
import { ResumeExportButton } from "@/app/lib/ResumeExporter";

// Define resume data structure interfaces
interface ResumeHeader {
  name: string;
  location: string;
  phone: string;
  email: string;
}

interface ResumeJob {
  id: string;
  title: string;
  company: string;
  dateRange: string;
  type: string;
  bullets: string[];
}

interface ResumeEducation {
  degree: string;
  institution: string;
  year?: string;
}

interface ResumeCertification {
  name: string;
  issuer: string;
  year?: string;
}

interface ResumeSkills {
  [category: string]: string[];
}

interface ResumeData {
  header?: ResumeHeader;
  summary?: string;
  experience?: ResumeJob[];
  skills?: ResumeSkills;
  education?: ResumeEducation[];
  certifications?: ResumeCertification[];
}

// Helper function to check if a string is valid JSON
const isJsonString = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

// Helper function to clean JSON to ensure it's valid
const cleanJsonString = (text: string): string => {
  // Try to extract JSON if it might be wrapped in code blocks
  if (text.includes("```json") || text.includes("```")) {
    const jsonMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      const extractedJson = jsonMatch[1].trim();
      // Verify it's valid JSON
      if (isJsonString(extractedJson)) {
        return extractedJson;
      }
    }
  }
  return text;
};

// Helper function to format text with bold markers
const formatText = (text: string): React.ReactNode => {
  if (!text) return null;
  
  // Split the text by bold markers (**text**)
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part: string, index: number) => {
    // Check if this part is bold (surrounded by **)
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    // Regular text
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

// Render JSON resume to React components
const renderJsonResume = (jsonStr: string): React.ReactNode[] => {
  try {
    const resumeData: ResumeData = JSON.parse(jsonStr);
    const components: React.ReactNode[] = [];
    
    // Header section
    if (resumeData.header) {
      components.push(
        <h1 key="header-name" className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mt-4 mb-2">
          {resumeData.header.name}
        </h1>
      );
      
      components.push(
        <p key="header-contact" className="text-center text-gray-700 dark:text-gray-300 mb-4">
          {resumeData.header.location} | {resumeData.header.phone} | {resumeData.header.email}
        </p>
      );
    }
    
    // Summary section
    if (resumeData.summary) {
      components.push(
        <h2 key="summary-header" className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-5 mb-2 pb-1 border-b dark:border-gray-700">
          PROFESSIONAL SUMMARY
        </h2>
      );
      
      components.push(
        <p key="summary-content" className="mb-3 text-gray-700 dark:text-gray-300">
          {resumeData.summary}
        </p>
      );
    }
    
    // Experience section
    if (resumeData.experience && resumeData.experience.length > 0) {
      components.push(
        <h2 key="experience-header" className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-5 mb-2 pb-1 border-b dark:border-gray-700">
          PROFESSIONAL EXPERIENCE
        </h2>
      );
      
      resumeData.experience.forEach((job: ResumeJob, jobIndex: number) => {
        components.push(
          <h3 key={`job-${jobIndex}`} className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-4 mb-1">
            <span className="font-semibold">{job.company}</span>{' | '}
            <span>{job.title}</span>
            <span className="float-right text-sm text-gray-600 dark:text-gray-400">
              {job.dateRange}
            </span>
          </h3>
        );
        
        if (job.bullets && job.bullets.length > 0) {
          const bulletItems: React.ReactNode[] = job.bullets.map((bullet: string, bulletIndex: number) => (
            <li key={`bullet-${jobIndex}-${bulletIndex}`} className="mb-1 text-gray-700 dark:text-gray-300">
              {formatText(bullet)}
            </li>
          ));
          
          components.push(
            <ul key={`bullets-${jobIndex}`} className="list-disc pl-5 my-2">
              {bulletItems}
            </ul>
          );
        }
      });
    }
    
    // Skills section
    if (resumeData.skills) {
      components.push(
        <h2 key="skills-header" className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-5 mb-2 pb-1 border-b dark:border-gray-700">
          SKILLS & COMPETENCIES
        </h2>
      );
      
      Object.entries(resumeData.skills).forEach(([category, skills]: [string, string[]], categoryIndex: number) => {
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        
        components.push(
          <h3 key={`skill-category-${categoryIndex}`} className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-3 mb-1">
            {categoryName}
          </h3>
        );
        
        if (Array.isArray(skills)) {
          components.push(
            <p key={`skills-${categoryIndex}`} className="mb-3 text-gray-700 dark:text-gray-300">
              {skills.join(", ")}
            </p>
          );
        }
      });
    }
    
    // Education section
    if (resumeData.education && resumeData.education.length > 0) {
      components.push(
        <h2 key="education-header" className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-5 mb-2 pb-1 border-b dark:border-gray-700">
          EDUCATION
        </h2>
      );
      
      resumeData.education.forEach((edu: ResumeEducation, eduIndex: number) => {
        components.push(
          <h3 key={`education-${eduIndex}`} className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-3 mb-1">
            {edu.degree}
          </h3>
        );
        
        components.push(
          <p key={`institution-${eduIndex}`} className="mb-3 text-gray-700 dark:text-gray-300">
            {edu.institution}{edu.year ? ` | ${edu.year}` : ''}
          </p>
        );
      });
    }
    
    // Certifications section
    if (resumeData.certifications && resumeData.certifications.length > 0) {
      components.push(
        <h2 key="certifications-header" className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-5 mb-2 pb-1 border-b dark:border-gray-700">
          CERTIFICATIONS
        </h2>
      );
      
      const certItems: React.ReactNode[] = resumeData.certifications.map((cert: ResumeCertification, certIndex: number) => (
        <li key={`cert-${certIndex}`} className="mb-1 text-gray-700 dark:text-gray-300">
          <strong className="font-semibold">{cert.name}</strong> | {cert.issuer}{cert.year ? ` | ${cert.year}` : ''}
        </li>
      ));
      
      components.push(
        <ul key="cert-list" className="list-disc pl-5 my-2">
          {certItems}
        </ul>
      );
    }
    
    return components;
  } catch (error) {
    console.error("Error rendering JSON resume:", error);
    return [
      <div key="error" className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
        Error rendering resume. Please check the JSON structure.
      </div>
    ];
  }
};

const ResumeGeneratorTab: React.FC<ResumeGeneratorTabProps> = ({ 
  formState, 
  jobId, 
  onResumeGenerated,
  selectedResume 
}) => {
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [resumeJson, setResumeJson] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  
  // Helper function to update resume content and validate JSON
  const updateResumeContent = (content: string): void => {
    // Clean JSON from any code blocks
    const cleanContent: string = cleanJsonString(content);
    
    // Check if the content is valid JSON
    const isValid: boolean = isJsonString(cleanContent);
    if (isValid) {
      setResumeJson(cleanContent);
    } else {
      // If not valid JSON, keep the content but show an error
      setResumeJson(content);
      setError("Invalid JSON format. Please check your resume structure.");
    }
  };
  
  // Load selected resume when it changes
  useEffect(() => {
    if (selectedResume) {
      // Parse the content to ensure it's valid JSON
      const content: string = cleanJsonString(selectedResume.markdownContent);
      
      // Update resume content
      updateResumeContent(content);
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
  
  const generateResume = async (): Promise<void> => {
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
      
      const resumeData = await resumeResponse.json();
      
      const prompt = `I need a customized resume for a job application. Please tailor my resume for this specific role:
JOB DETAILS:
Title: ${formState.jobTitle}
Company: ${formState.companyName}
Description: ${formState.jobDescription}
MY EXISTING RESUME:
${JSON.stringify(resumeData, null, 2)}
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
Your response must be ONLY valid JSON data following this exact structure:
{
  "header": {
    "name": "Full Name, Credentials",
    "location": "City, State",
    "phone": "123.456.7890",
    "email": "email@example.com"
  },
  "summary": "Professional summary paragraph highlighting experience, skills, etc.",
  "experience": [
    {
      "id": "job1",
      "title": "Job Title",
      "company": "Company Name",
      "dateRange": "YYYY to Present",
      "type": "JOB_ROLE",
      "bullets": [
        "Achievement 1 with metrics highlighted",
        "Achievement 2 with metrics highlighted",
        "Achievement 3 with metrics highlighted"
      ]
    },
    {
      "id": "job2",
      "title": "Previous Job Title",
      "company": "Previous Company Name",
      "dateRange": "YYYY to YYYY",
      "type": "JOB_ROLE",
      "bullets": [
        "Achievement 1 with metrics highlighted",
        "Achievement 2 with metrics highlighted",
        "Achievement 3 with metrics highlighted"
      ]
    }
  ],
  "skills": {
    "technical": ["Skill 1", "Skill 2", "Skill 3"],
    "soft": ["Skill 1", "Skill 2", "Skill 3"],
    "tools": ["Tool 1", "Tool 2", "Tool 3"]
  },
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University Name",
      "year": "YYYY"
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "year": "YYYY"
    }
  ]
}
IMPORTANT NOTES:
1. Your response must be ONLY the JSON data - no explanations, comments, or markdown
2. Ensure the JSON is valid and properly formatted
3. For each job role, provide 3-5 powerful bullet points with metrics and achievements
4. Ensure skills are categorized appropriately
5. For every achievement, highlight specific metrics and results
6. Use appropriate keywords for ATS optimization
Please create a resume for a [ROLE/POSITION] with experience in [INDUSTRY/FIELD]. Your response should ONLY contain the JSON data for the rebuilt resume.`;

      const response = await fetch("/api/gemini/generate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          jobId: jobId || "temp-id",
          model: "gemini-2.5-pro-exp-03-25"
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate resume: ${errorText}`);
      }
      
      const data = await response.json();
      
      // Update the resume content
      updateResumeContent(data.resume || "");
    } catch (error) {
      console.error("Error generating resume:", error);
      setError(`Failed to generate resume: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle content changes in the textarea
  const handleResumeContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const newContent: string = e.target.value;
    setResumeJson(newContent);
    
    // Clear any error messages when user starts typing
    if (error.includes("Invalid JSON")) {
      setError("");
    }
  };
  
  // Function to save resume to database
  const saveResume = async (): Promise<void> => {
    if (!resumeJson || !jobId) {
      setError("No resume content or job ID available to save");
      console.error("Missing data for save:", { resumeLength: resumeJson?.length, jobId });
      return;
    }
    
    // Validate JSON before saving
    if (!isJsonString(cleanJsonString(resumeJson))) {
      setError("Cannot save invalid JSON. Please fix the format errors first.");
      return;
    }
    
    setIsSaving(true);
    setError("");
    setSuccessMessage("");
    
    try {
      console.log("Saving resume for job:", jobId);
      
      // Ensure we're saving clean JSON
      const contentToSave: string = cleanJsonString(resumeJson);
      const parsedContent: any = JSON.parse(contentToSave);
      
      // If we're updating an existing resume
      if (currentResumeId) {
        console.log("Updating existing resume:", currentResumeId);
        
        const response = await fetch(`/api/resume/update`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: currentResumeId,
            markdownContent: contentToSave, // Store JSON content in markdownContent field
            rawJson: parsedContent // Add structured JSON data
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
          markdownContent: contentToSave, // Store JSON content in markdownContent field
          isPrimary: true,
          rawJson: parsedContent // Add structured JSON data
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
  
  const copyToClipboard = (): void => {
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
  const handleUpdateFilename = async (metadata: any, filename: string): Promise<boolean> => {
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
  const handleSaveAfterExport = async (): Promise<void> => {
    if (jobId && !currentResumeId) {
      await saveResume();
    }
  };
  
  // Format the JSON for pretty display in the textarea
  const formatJsonForDisplay = (jsonStr: string): string => {
    try {
      if (isJsonString(jsonStr)) {
        return JSON.stringify(JSON.parse(jsonStr), null, 2);
      }
      return jsonStr;
    } catch (e) {
      return jsonStr;
    }
  };
  
  // Format the JSON for PDF export
  const prepareJsonForExport = (): string => {
    try {
      // Check if the JSON is valid
      if (isJsonString(cleanJsonString(resumeJson))) {
        const parsedJson: ResumeData = JSON.parse(cleanJsonString(resumeJson));
        
        // Create a formatted version for PDF export - simulating what jsonToMarkdown used to do
        let exportText = "";
        
        // Header section
        if (parsedJson.header) {
          exportText += `# ${parsedJson.header.name}\n`;
          exportText += `${parsedJson.header.location} | ${parsedJson.header.phone} | ${parsedJson.header.email}\n\n`;
        }
        
        // Summary section
        if (parsedJson.summary) {
          exportText += `## PROFESSIONAL SUMMARY\n`;
          exportText += `${parsedJson.summary}\n\n`;
        }
        
        // Experience section
        if (parsedJson.experience && parsedJson.experience.length > 0) {
          exportText += `## PROFESSIONAL EXPERIENCE\n\n`;
          
          parsedJson.experience.forEach((job: ResumeJob) => {
            exportText += `### ${job.company} | ${job.title} | ${job.dateRange}\n`;
            
            // Add job bullets
            if (job.bullets && job.bullets.length > 0) {
              job.bullets.forEach((bullet: string) => {
                exportText += `- ${bullet}\n`;
              });
            }
            
            exportText += "\n";
          });
        }
        
        // Skills section
        if (parsedJson.skills) {
          exportText += `## SKILLS & COMPETENCIES\n\n`;
          
          Object.entries(parsedJson.skills).forEach(([category, skills]: [string, string[]]) => {
            const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
            exportText += `### ${categoryName}\n`;
            
            if (Array.isArray(skills)) {
              exportText += skills.join(", ") + "\n\n";
            }
          });
        }
        
        // Education section
        if (parsedJson.education && parsedJson.education.length > 0) {
          exportText += `## EDUCATION\n\n`;
          
          parsedJson.education.forEach((edu: ResumeEducation) => {
            exportText += `### ${edu.degree}\n`;
            exportText += `${edu.institution}${edu.year ? ` | ${edu.year}` : ''}\n\n`;
          });
        }
        
        // Certifications section
        if (parsedJson.certifications && parsedJson.certifications.length > 0) {
          exportText += `## CERTIFICATIONS\n\n`;
          
          parsedJson.certifications.forEach((cert: ResumeCertification) => {
            exportText += `- **${cert.name}** | ${cert.issuer}${cert.year ? ` | ${cert.year}` : ''}\n`;
          });
          
          exportText += "\n";
        }
        
        return exportText;
      }
      
      // If not valid JSON, return the raw content
      return resumeJson;
    } catch (e) {
      console.error("Error preparing JSON for export:", e);
      return resumeJson;
    }
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
  
  // Format JSON on component mount or when resumeJson changes
  useEffect(() => {
    if (resumeJson && isJsonString(cleanJsonString(resumeJson))) {
      const formattedJson = formatJsonForDisplay(cleanJsonString(resumeJson));
      if (formattedJson !== resumeJson) {
        setResumeJson(formattedJson);
      }
    }
  }, []);
  
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
          
          {resumeJson && (
            <>
              {jobId && (
                <button
                  type="button"
                  onClick={saveResume}
                  disabled={isSaving || !isJsonString(cleanJsonString(resumeJson))}
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
                content={prepareJsonForExport()} // Convert JSON to markdown for export
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
                isDisabled={isGenerating || isSaving || !isJsonString(cleanJsonString(resumeJson))}
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
      
      <div className="p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-md mb-4">
        <span className="font-semibold">JSON Format:</span> Your resume is stored in structured JSON format for better compatibility with the resume system.
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
        {!resumeJson && !isGenerating && (
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
        
        {resumeJson && (
          <div className="flex flex-row h-full space-x-4">
            {/* Editable JSON textarea */}
            <div className="w-1/2 flex flex-col">
              <h4 className="text-md font-medium mb-2 text-gray-700 dark:text-gray-300">
                Edit Resume JSON
              </h4>
              <textarea
                ref={textAreaRef}
                value={resumeJson}
                onChange={handleResumeContentChange}
                className="flex-1 p-4 rounded-md border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 font-mono resize-none"
                placeholder="Make any desired edits to your resume JSON here..."
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
                {isJsonString(cleanJsonString(resumeJson)) 
                  ? renderJsonResume(cleanJsonString(resumeJson))
                  : <p className="text-red-500">Invalid JSON format. Please fix the errors to see a preview.</p>
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeGeneratorTab;
