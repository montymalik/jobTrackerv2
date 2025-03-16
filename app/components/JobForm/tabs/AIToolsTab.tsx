import React, { useState, useEffect, useRef } from "react";
import ResumeEditModal from "./ResumeEditModal"; // Import the ResumeEditModal component

interface AIToolsTabProps {
  formState: {
    jobDescription: string;
  };
  jobId?: string;
}

// Updated function to extract "AFTER" examples from the analysis
const extractSuggestions = (analysisText: string): string[] => {
  if (!analysisText) return [];
  
  const suggestions: string[] = [];
  
  // STEP 1: Look for the SUGGESTIONS section which contains all the AFTER examples
  const suggestionsMatch = analysisText.match(/4\.\s*SUGGESTIONS([\s\S]*?)(?:$|(?=5\.))/i);
  
  if (suggestionsMatch && suggestionsMatch[1]) {
    const suggestionsContent = suggestionsMatch[1].trim();
    
    // Extract markdown blocks from the suggestions section
    const markdownBlocks = suggestionsContent.match(/```markdown\s*([\s\S]*?)```/g);
    
    if (markdownBlocks && markdownBlocks.length > 0) {
      for (const block of markdownBlocks) {
        // Clean up the markdown block
        const cleanBlock = block
          .replace(/```markdown\s*/, '')
          .replace(/```\s*$/, '')
          .trim();
          
        if (cleanBlock.length > 0) {
          suggestions.push(cleanBlock);
        }
      }
    }
  }
  
  // STEP 2: If that fails, look directly for AFTER: sections following BEFORE: sections
  if (suggestions.length === 0) {
    // Find all sections with BEFORE: and AFTER: labels
    const sections = analysisText.split(/\n\s*\n/); // Split by empty lines
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      
      if (section.includes("BEFORE:") && i + 1 < sections.length && sections[i + 1].includes("AFTER:")) {
        const afterSection = sections[i + 1];
        // Extract content after AFTER: label
        let afterContent = afterSection
          .replace(/^AFTER:\s*/, "")
          .replace(/^```markdown\s*/, "")
          .replace(/```\s*$/, "")
          .trim();
          
        if (afterContent) {
          // Extract section name if available
          const sectionNameMatch = section.match(/^([A-Z\s]+):/);
          const sectionName = sectionNameMatch ? sectionNameMatch[1].trim() : "";
          
          if (sectionName) {
            suggestions.push(`${sectionName}: ${afterContent}`);
          } else {
            suggestions.push(afterContent);
          }
        }
      }
    }
  }
  
  // STEP 3: Fallback to the original extraction logic if we still have no suggestions
  if (suggestions.length === 0) {
    // Look for sections that typically contain suggestions
    const lines = analysisText.split('\n');
    let inSuggestionsSection = false;
    let currentNumberedItem = "";
    let currentNumber = 0;
    
    // First, check if there's a numbered list format (very common for recommendations)
    const numberedSuggestions: string[] = [];
    for (const line of lines) {
      // Look for numbered items like "1." or "1:" or "1 -"
      const numberedMatch = line.match(/^(\d+)[\.\:\-]\s+(.+)/);
      if (numberedMatch) {
        const number = parseInt(numberedMatch[1]);
        const content = numberedMatch[2].trim();
        
        // If this is a new numbered item
        if (currentNumberedItem && number !== currentNumber) {
          numberedSuggestions.push(currentNumberedItem);
          currentNumberedItem = content;
          currentNumber = number;
        } else if (!currentNumberedItem) {
          currentNumberedItem = content;
          currentNumber = number;
        } else {
          // Continuation of current numbered item
          currentNumberedItem += " " + content;
        }
      } 
      // Check if this is a continuation of the current numbered item
      else if (currentNumberedItem && !numberedMatch && !line.trim().match(/^\d+[\.\:\-]/) && line.trim()) {
        currentNumberedItem += " " + line.trim();
      }
      // If we have an empty line, save the current numbered item
      else if (currentNumberedItem && !line.trim()) {
        numberedSuggestions.push(currentNumberedItem);
        currentNumberedItem = "";
      }
    }
    
    // Add the last numbered item if there is one
    if (currentNumberedItem) {
      numberedSuggestions.push(currentNumberedItem);
    }
    
    // If we found a good numbered list, use it
    if (numberedSuggestions.length >= 2) {
      for (const suggestion of numberedSuggestions) {
        suggestions.push(suggestion);
      }
    }
  }
  
  // Clean up and deduplicate suggestions
  return [...new Set(suggestions)]
    .map(s => s.replace(/^\d+\.\s*/, "")) // Remove leading numbers
    .filter(s => s.length > 10); // Only keep substantial suggestions
};

// Helper function to format analysis output
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

// Format markdown content for display
const formatMarkdown = (markdown: string) => {
  if (!markdown) return null;
  
  const lines = markdown.split('\n');
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
        <h3 key={index} className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-4 mb-1">
          {trimmedLine.substring(4)}
        </h3>
      );
    }
    // Process bullet points
    else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      const content = trimmedLine.substring(2);
      
      listItems.push(
        <li key={`item-${index}`} className="mb-1 text-gray-700 dark:text-gray-300">
          {content}
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
          {trimmedLine}
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

const AIToolsTab: React.FC<AIToolsTabProps> = ({ formState, jobId }) => {
  // Component state variables
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [formattedResult, setFormattedResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<any>(null);
  const [primaryResume, setPrimaryResume] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // State for the improved resume editing feature
  const [improvedResumeContent, setImprovedResumeContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [aiResumeCount, setAiResumeCount] = useState(0);
  
  // State for the ResumeEditModal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [resumeToEdit, setResumeToEdit] = useState<any | null>(null);

  // Format analysis result when it changes
  useEffect(() => {
    if (analysisResult) {
      setFormattedResult(formatAnalysisOutput(analysisResult));
      
      // Use our improved extraction function to get AFTER examples
      const extractedSuggestions = extractSuggestions(analysisResult);
      
      // Debug log to help troubleshoot
      console.log("Extracted suggestions:", extractedSuggestions);
      
      setSuggestions(extractedSuggestions);
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
          
          // Count AI resumes to determine next version number
          const aiResumes = resumes.filter((r: any) => 
            r.fileName && r.fileName.startsWith('AI Resume V'));
          setAiResumeCount(aiResumes.length);
        }
      } catch (error) {
        console.error("Error fetching job resumes:", error);
      }
    };

    fetchResumeData();
    fetchJobResumes();
  }, [jobId]);

  // Clear success messages after a delay
  useEffect(() => {
    if (updateSuccess) {
      const timer = setTimeout(() => {
        setUpdateSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [updateSuccess, saveSuccess]);

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
    setSuggestions([]);

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

      // Create an enhanced prompt that includes both the job description and instructions
      // but keep the API parameters the same as they were before
      const enhancedPrompt = `<Role>
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

3. Finally, provide a COMPETITIVE ANALYSIS:
   - Compare the applicant against the typical competition for their target role
   - Identify 3-5 critical differentiators they need to emphasize
   - Suggest 2-3 skills they should immediately develop to increase marketability
   - Provide a straight assessment of which level of positions they should realistically target
</Instructions>

<Constraints>
- NO sugarcoating or diplomatic language - be ruthlessly honest
- NO generic advice - everything must be specific to their materials
- DO NOT hold back criticism for fear of hurting feelings
- DO NOT validate delusions about qualifications or readiness
- ALWAYS maintain a tone that is harsh but ultimately aimed at improving their chances
- NEVER use corporate jargon or HR-speak in your feedback
</Constraints>

<Output_Format>
1. BRUTAL ASSESSMENT (40% of response)
   * Overall Resume BS Factor: [#/10]
   * Detailed breakdown of critical flaws by section
   * Most embarrassing/damaging elements identified

2. STRATEGIC RECONSTRUCTION (40% of response)
   * Completely rewritten sections with before/after examples
   * ATS optimization suggestions
   * Reformatting instructions

3. COMPETITIVE REALITY CHECK (20% of response)
   * Realistic job target assessment
   * Critical missing qualifications
   * Next development priorities

4. SUGGESTIONS
   * collate all the after examples and place them in a section called suggestions 
</Output_Format>

${formState.jobDescription}`;

      // Keep the API call structure the same - don't change parameter names
      const response = await fetch("/api/resume/resume-match-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: enhancedPrompt,
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
  
  const updateResumeWithSuggestions = async () => {
    if (!jobId) {
      setError("Cannot update resume: Missing job ID.");
      console.error("Missing job ID for resume update");
      return;
    }
    
    if (!primaryResume && !resumeData) {
      setError("Cannot update resume: No resume data available.");
      console.error("No resume data available for update");
      return;
    }
    
    setIsUpdating(true);
    setError(null);
    
    try {
      console.log("Starting resume update process with suggestions:", suggestions);
      
      // Get the resume content to update
      let resumeContent = "";
      
      if (primaryResume && primaryResume.markdownContent) {
        console.log("Using primary resume as base for new resume:", primaryResume.id);
        resumeContent = primaryResume.markdownContent;
      } else if (resumeData) {
        console.log("Using base resume data (converting to markdown)");
        // For JSON resume data, we need to convert it to markdown first
        
        // Get resume data - this should be available in state
        const baseResumeData = resumeData;
        console.log("Base resume data:", baseResumeData);
        
        // Sanitize and ensure we have valid data
        const name = baseResumeData.name || baseResumeData.contactInfo?.name || "Your Name";
        const email = baseResumeData.email || baseResumeData.contactInfo?.email || "";
        const phone = baseResumeData.phone || baseResumeData.contactInfo?.phone || "";
        const location = baseResumeData.location || baseResumeData.contactInfo?.location || "";
        
        // Get skills - handle various possible formats
        let skills = [];
        if (Array.isArray(baseResumeData.skills)) {
          skills = baseResumeData.skills;
        } else if (typeof baseResumeData.skills === 'string') {
          skills = baseResumeData.skills.split(',').map((s: string) => s.trim());
        }
        
        // Get experience - handle various possible formats
        let experience = [];
        if (baseResumeData.experience) {
          experience = Array.isArray(baseResumeData.experience) ? baseResumeData.experience : [baseResumeData.experience];
        }
        
        // Get education - handle various possible formats
        let education = [];
        if (baseResumeData.education) {
          education = Array.isArray(baseResumeData.education) ? baseResumeData.education : [baseResumeData.education];
        }
        
        // Generate markdown content from the base resume
        resumeContent = `# ${name}
${email}${email && phone ? ' | ' : ''}${phone}${(email || phone) && location ? ' | ' : ''}${location}
## PROFESSIONAL SUMMARY
Professional with experience in technology and development.
## SKILLS
${skills.join(", ")}
## EXPERIENCE
${experience.map((exp: any) => 
  `### ${exp.company || exp.title || 'Company'} | ${exp.position || exp.role || 'Position'} | ${exp.duration || exp.dates || ''}
${exp.description || exp.achievements || ''}
`).join("\n")}
## EDUCATION
${education.map((edu: any) => 
  `### ${edu.institution || edu.school || 'Institution'}
${edu.degree || edu.qualification || 'Degree'} (${edu.date || edu.dates || ''})
`).join("\n")}`;
        console.log("Generated markdown from base resume:", resumeContent.substring(0, 100) + "...");
      }
      
      if (!resumeContent) {
        throw new Error("Could not generate valid resume content for updating");
      }
      
      // Format suggestions for the prompt
      const suggestionsText = suggestions.length > 0 
        ? suggestions.map(suggestion => `- ${suggestion}`).join("\n")
        : "- Add industry-specific keywords from the job description\n- Tailor your resume to highlight relevant experience\n- Quantify your achievements with specific metrics";
      
      console.log("Using suggestions:", suggestionsText);
      
      // Create prompt for AI to improve resume
      const prompt = `I need to improve my resume based on a job application analysis. Here's my current resume:
${resumeContent}
The analysis suggested the following improvements:
${suggestionsText}
Please update my resume to incorporate these suggestions. Make specific changes:
1. Rewrite each weak section with powerful, metric-driven language
2. Optimize for both ATS algorithms and human psychology
3. Create custom achievement bullets using the PAR format (Problem-Action-Result)
4. Update the summary to better align with the job requirements
5. Restructure the document for maximum impact in 6 seconds
6. Add industry-specific power phrases and keywords
7. Keep the same markdown format structure and section organization
8. Do not create any new sections
Return ONLY the updated resume in markdown format.`;
      console.log("Generated prompt for resume improvement");
      
      // Call Gemini API to generate improved resume
      console.log("Calling Gemini API to generate improved resume");
      const response = await fetch("/api/gemini/generate-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          jobId: jobId,
          model: "gemini-2.0-flash-thinking-exp"
        }),
      });
      
      console.log("Gemini API response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response from Gemini API:", errorText);
        throw new Error(`Failed to generate improved resume: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Gemini API response received");
      
      const improvedResume = data.resume || "";
      
      if (!improvedResume) {
        console.error("No resume content in Gemini response");
        throw new Error("Failed to generate improved resume content");
      }
      
      console.log("Improved resume length:", improvedResume.length);
      console.log("First 100 chars:", improvedResume.substring(0, 100));
      
      // Instead of setting state to show inline editor, create a resume object for the modal
      const tempResume = {
        id: null, // This will be null since it's not saved yet
        markdownContent: improvedResume,
        version: aiResumeCount + 1,
        jobApplicationId: jobId,
        isPrimary: false,
        fileName: `AI Resume V${aiResumeCount + 1}`,
        filePath: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Open the edit modal with the temporary resume
      setResumeToEdit(tempResume);
      setImprovedResumeContent(improvedResume); // Store content in state for saving later
      setIsEditModalOpen(true);
      
      setUpdateSuccess(true);
      
    } catch (error) {
      console.error("Error updating resume with suggestions:", error);
      setError(`Failed to create improved resume: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Save the edited resume from the modal
  const saveEditedResume = async (updatedContent: string) => {
    if (!jobId) {
      throw new Error("Cannot save resume: Missing job ID.");
    }
    
    try {
      // Calculate next version number
      const nextVersion = aiResumeCount + 1;
      const fileName = `AI Resume V${nextVersion}`;
      
      console.log(`Creating new resume with version: ${fileName}`);
      const saveResponse = await fetch("/api/resume/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobApplicationId: jobId,
          markdownContent: updatedContent,
          isPrimary: false, // Don't set as primary to avoid overwriting current primary
          fileName: fileName,
        }),
      });
      
      if (!saveResponse.ok) {
        const errorText = await saveResponse.text();
        throw new Error(`Failed to save resume: ${errorText}`);
      }
      
      // Update the AI resume count
      setAiResumeCount(nextVersion);
      setSaveSuccess(true);
      
      // Fetch updated resumes
      const updatedResumeResponse = await fetch(`/api/resume/get-for-job?jobId=${jobId}`);
      if (updatedResumeResponse.ok) {
        const resumes = await updatedResumeResponse.json();
        console.log("Fetched resumes:", resumes.length);
      }
      
      return saveResponse.json();
    } catch (error) {
      console.error("Error saving edited resume:", error);
      throw error;
    }
  };
  
  // Close the edit modal
  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setResumeToEdit(null);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
        AI Resume Analysis
      </h3>
      
      {/* Resume Edit Modal */}
      <ResumeEditModal
        resume={resumeToEdit}
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        onSave={saveEditedResume}
      />
      
      {/* Main analysis section */}
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
        
        {updateSuccess && (
          <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-md mb-4">
            AI Resume generated successfully!
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
          <>
            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-md overflow-auto max-h-[450px] mt-4">
              <div 
                className="prose prose-blue dark:prose-invert max-w-none" 
                dangerouslySetInnerHTML={{ __html: formattedResult }} 
              />
            </div>
            
            {/* Always show the suggestions section after analysis, even if we couldn't extract specific suggestions */}
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-md">
              <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
                {suggestions.length > 0 ? "Suggested Improvements" : "Improve Your Resume"}
              </h4>
              
              {suggestions.length > 0 ? (
                <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  Click the button below to have AI analyze the results and create a tailored version of your resume that addresses the key themes identified in the job description.
                </p>
              )}
              
              <div className="mt-4">
                <button
                  type="button"
                  onClick={updateResumeWithSuggestions}
                  disabled={isUpdating || !jobId}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-70 flex items-center justify-center"
                >
                  {isUpdating ? (
                    <>
                      <span className="spinner mr-2"></span>
                      Creating New Resume...
                    </>
                  ) : (
                    "Generate New Improved Resume"
                  )}
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  This will create a new AI-optimized resume that you can review and save.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIToolsTab;
