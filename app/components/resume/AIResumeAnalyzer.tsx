// app/components/resume/AIResumeAnalyzer.tsx
import React, { useState } from 'react';
import { ResumeSection } from '@/app/lib/types';
import ReadOnlyEditor from './tiptap/ReadOnlyEditor';
import RichTextEditor from './tiptap/RichTextEditor';

interface AIResumeAnalyzerProps {
  resumeId: string | null;
  jobDescription: string;
  jobApplicationId?: string;
  resumeSections: ResumeSection[];
  onApplySuggestion: (sectionType: string, content: string, position?: string, company?: string, directRoleId?: string) => void;
}

interface AnalysisCheck {
  Score: string;
  Comments: string;
}

interface SuggestedRewrite {
  company: string;
  position: string;
  keyResponsibilities: string[];
  suggestedRewrite: string[];
}

interface AnalysisResult {
  "Candidate Name": string;
  "Mail ID": string;
  "Phone Number": string;
  "Address": string;
  "Job Role": string;
  "Nationality": string;
  "Contract Type": string;
  "Education": Array<{
    degree: string;
    institution: string;
    duration: string;
  }>;
  "Work Experience": SuggestedRewrite[];
  "ATS Score": number;
  "Missing Keywords": string[];
  "Profile Summary": {
    "Summary": string;
    "Scoring Breakdown": {
      "Impact": AnalysisCheck;
      "Brevity - Length & Depth": AnalysisCheck;
      "Use of Bullets": AnalysisCheck;
      "Style": AnalysisCheck;
      "Buzzwords": AnalysisCheck;
      "Readability": AnalysisCheck;
      "Skills": AnalysisCheck;
      "Grammar & Spelling": AnalysisCheck;
      "Formatting Consistency": AnalysisCheck;
      "Contact Information": AnalysisCheck;
      "Action Verbs Usage": AnalysisCheck;
      "Chronological Order": AnalysisCheck;
      "Relevance of Experience": AnalysisCheck;
      "ATS Keyword Optimization": AnalysisCheck;
      "Quantifiable Achievements": AnalysisCheck;
      "Customization for Role": AnalysisCheck;
    }
  };
  "Professional Summary"?: Array<{
    summary: string;
    suggestedRewrite: string[];
  }>;
}

const AIResumeAnalyzer: React.FC<AIResumeAnalyzerProps> = ({
  resumeId,
  jobDescription,
  jobApplicationId,
  resumeSections,
  onApplySuggestion
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [openCheckId, setOpenCheckId] = useState<string | null>(null);
  const [openRewriteId, setOpenRewriteId] = useState<string | null>(null);
  const [editableContent, setEditableContent] = useState<Record<string, string>>({});

  // Helper function to format array of strings as bulleted list HTML
  const formatBulletedList = (items: string[] | string): string => {
    if (typeof items === 'string') {
      return `<ul class="list-disc ml-5"><li>${items}</li></ul>`;
    }
    
    if (Array.isArray(items) && items.length > 0) {
      return `<ul class="list-disc ml-5 space-y-2">
        ${items.map(item => `<li>${item}</li>`).join('')}
      </ul>`;
    }
    
    return '<ul class="list-disc ml-5"><li>No suggestions available</li></ul>';
  };

  // Function to analyze the resume
  const analyzeResume = async () => {
    if (!resumeId) {
      setError("No resume ID available for analysis");
      return;
    }

    // Warn if job description is minimal
    if (jobDescription.length < 10) {
      setError("Warning: Using a minimal job description may result in less accurate analysis. Consider adding more details about the job.");
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Add debugging to verify job roles are passed correctly
      console.log("RESUME SECTIONS BEFORE ANALYSIS:");
      resumeSections.forEach((section, i) => {
        if (section.type === 'JOB_ROLE') {
          console.log(`Job Role #${i+1}: ID=${section.id}, Title=${section.title}`);
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = section.content;
          const heading = tempDiv.querySelector('h3, h4, h5')?.textContent || 'No heading';
          console.log(`Heading: "${heading}"`);
        }
      });

      // Convert resume sections to a format suitable for analysis
      const resumeContent = sectionsToAnalysisFormat(resumeSections);

      // Create the prompt
      const prompt = await getAtsPrompt();

      // Send to API
      const response = await fetch('/api/gemini/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId,
          resumeContent,
          jobDescription,
          jobApplicationId,
          prompt
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.analysis) {
        throw new Error('No analysis result returned');
      }

      // Parse the analysis result
      let parsedResult: AnalysisResult;
      try {
        if (typeof result.analysis === 'string') {
          // Try to extract JSON from string (handles markdown code blocks)
          const jsonMatch = result.analysis.match(/```json\n([\s\S]*?)\n```/) || 
                           result.analysis.match(/```\n([\s\S]*?)\n```/);
          
          if (jsonMatch && jsonMatch[1]) {
            parsedResult = JSON.parse(jsonMatch[1].trim());
          } else if (result.analysis.includes('{') && result.analysis.includes('}')) {
            // Try to find JSON object in text
            const jsonStr = result.analysis.substring(
              result.analysis.indexOf('{'),
              result.analysis.lastIndexOf('}') + 1
            );
            parsedResult = JSON.parse(jsonStr);
          } else {
            throw new Error('Could not parse JSON from response');
          }
        } else {
          // Assume it's already JSON
          parsedResult = result.analysis;
        }
        
        setAnalysisResult(parsedResult);
        initializeEditableContent(parsedResult);
      } catch (parseError) {
        console.error('Error parsing analysis result:', parseError);
        throw new Error('Failed to parse analysis result');
      }
    } catch (err) {
      console.error('Resume analysis error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error during analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Initialize editable content from analysis result
  const initializeEditableContent = (result: AnalysisResult) => {
    const content: Record<string, string> = {};
    
    // Handle Professional Summary
    if (result["Professional Summary"] && Array.isArray(result["Professional Summary"]) && result["Professional Summary"].length > 0) {
      // Get the first professional summary suggestion
      const profSummary = result["Professional Summary"][0];
      
      if (profSummary.suggestedRewrite && Array.isArray(profSummary.suggestedRewrite) && profSummary.suggestedRewrite.length > 0) {
        // Join all suggested rewrites with paragraph breaks
        const suggestionText = profSummary.suggestedRewrite.join('\n\n');
        
        // Format as a proper HTML paragraph
        content['summary'] = `<p>${suggestionText.replace(/\n\n/g, '</p><p>')}</p>`;
        console.log("Found Professional Summary suggested rewrite");
      }
    }
    
    // Add work experience sections - format as bulleted list
    if (result["Work Experience"] && Array.isArray(result["Work Experience"])) {
      result["Work Experience"].forEach((exp, index) => {
        if (exp.suggestedRewrite && Array.isArray(exp.suggestedRewrite) && exp.suggestedRewrite.length > 0) {
          // Convert array to HTML bulleted list for the editor
          content[`work-${index}`] = formatBulletedList(exp.suggestedRewrite);
        } else if (exp.suggestedRewrite && typeof exp.suggestedRewrite === 'string') {
          // Handle case where suggestedRewrite might be a single string
          content[`work-${index}`] = formatBulletedList(exp.suggestedRewrite);
        }
      });
    }
    
    setEditableContent(content);
  };

  // Convert resume sections to a format for analysis
  const sectionsToAnalysisFormat = (sections: ResumeSection[]): string => {
    // This could be more sophisticated, but for now we'll just concatenate the content
    let content = '';
    
    // Process header first
    const header = sections.find(s => s.type === 'HEADER');
    if (header) {
      content += `${header.title}:\n${stripHtml(header.content)}\n\n`;
    }
    
    // Process other sections
    sections.filter(s => s.type !== 'HEADER').forEach(section => {
      content += `${section.title}:\n${stripHtml(section.content)}\n\n`;
    });
    
    return content;
  };

  // Strip HTML from content
  const stripHtml = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  // Get ATS prompt from the server or use the one provided
  const getAtsPrompt = async (): Promise<string> => {
    try {
      const response = await fetch('/api/gemini/ats-prompt');
      if (response.ok) {
        const data = await response.json();
        return data.prompt;
      }
    } catch (error) {
      console.warn('Failed to fetch ATS prompt, using default', error);
    }
    
    // Default prompt from the upload
    return `You are acting as an advanced ATS (Applicant Tracking System) to evaluate resumes against specific job descriptions...`;
  };

  // Handle applying a suggestion to the resume
  const handleApplySuggestion = (sectionType: string, index: number = 0) => {
    const contentKey = sectionType === 'summary' ? 'summary' : `work-${index}`;
    const content = editableContent[contentKey];
    
    if (content) {
      if (sectionType === 'experience' && analysisResult?.["Work Experience"]?.[index]) {
        const exp = analysisResult["Work Experience"][index];
        
        // Check if we have job titles with exact matches for debugging
        const exactMatchJobRoleTitle = resumeSections.find(
          s => s.type === 'JOB_ROLE' && 
          s.title.toLowerCase() === exp.position.toLowerCase()
        );
        
        if (exactMatchJobRoleTitle) {
          console.log(`🎯 EXACT MATCH FOUND BY TITLE: ${exactMatchJobRoleTitle.id} - ${exactMatchJobRoleTitle.title}`);
        }
        
        // Additional debugging Information
        console.log("Current resume sections:", resumeSections);

        console.log(`===== APPLYING SUGGESTION =====`);
        console.log(`Content length: ${content.length} characters`);
        console.log(`Position: "${exp.position}"`);
        console.log(`Company: "${exp.company}"`);
        console.log(`Sample content: ${content.substring(0, 50)}...`);
        
        // Debug resume sections just before applying
        console.log("RESUME SECTIONS AT TIME OF APPLYING:");
        let matchingRoleId = null;
        
        resumeSections.forEach((section, i) => {
          if (section.type === 'JOB_ROLE') {
            console.log(`Job Role #${i+1}: ID=${section.id}, Title=${section.title}`);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = section.content;
            const heading = tempDiv.querySelector('h3, h4, h5')?.textContent || 'No heading';
            console.log(`- Heading: "${heading}"`);
            
            // Check if heading or title contains position
            const hasPosition = 
              heading.toLowerCase().includes(exp.position.toLowerCase()) || 
              section.title.toLowerCase().includes(exp.position.toLowerCase());
              
            const hasCompany = 
              heading.toLowerCase().includes(exp.company.toLowerCase()) || 
              section.content.toLowerCase().includes(exp.company.toLowerCase());
            
            console.log(`- Contains position: ${hasPosition ? 'YES' : 'NO'}`);
            console.log(`- Contains company: ${hasCompany ? 'YES' : 'NO'}`);
            
            if (hasPosition) {
              console.log(`*** THIS SECTION SHOULD BE UPDATED: ${section.id} - ${section.title} ***`);
              matchingRoleId = section.id;
            }
          }
        });
        
        // If we have a direct match, try to use it
        if (matchingRoleId && matchingRoleId === 'job2') {
          console.log(`🚧 DEBUG OVERRIDE: Sending explicit directRoleId=${matchingRoleId}`);
          onApplySuggestion(sectionType, content, exp.position, exp.company, matchingRoleId);
        } else {
          // Call the parent handler with position and company
          console.log(`📣 Calling parent onApplySuggestion with position="${exp.position}", company="${exp.company}"`);
          onApplySuggestion(sectionType, content, exp.position, exp.company);
        }
      } else {
        console.log(`Applying summary suggestion with content length: ${content.length}`);
        onApplySuggestion(sectionType, content);
      }
      
      // Close the twistie after applying
      setOpenRewriteId(null);
      
      // Show success message
      setError(`Suggestion applied! Check the console logs for details.`);
      setTimeout(() => setError(null), 3000);
    }
  };

  // Get score color based on value
  const getScoreColor = (score: number | string): string => {
    const numScore = typeof score === 'string' ? parseInt(score, 10) : score;
    
    if (numScore <= 50) return 'text-red-500 bg-red-200';
    if (numScore <= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-700 bg-green-100';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">AI Resume Analyzer</h3>
        <button
          onClick={analyzeResume}
          disabled={isAnalyzing || !resumeId}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {isAnalyzing ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyzing...
            </span>
          ) : (
            'Analyze Resume'
          )}
        </button>
      </div>

      {error && (
        <div className={`p-3 ${error.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} rounded-md`}>
          {error}
        </div>
      )}

      {analysisResult && (
        <div className="space-y-6 mt-4">
          {/* ATS Score */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-md font-semibold">ATS Score</h4>
              <span className={`px-2 py-1 rounded-md font-medium ${getScoreColor(analysisResult["ATS Score"])}`}>
                {analysisResult["ATS Score"]}/100
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-4">
              <div 
                className={`h-4 rounded-full ${
                  analysisResult["ATS Score"] <= 50 ? 'bg-red-500' :
                  analysisResult["ATS Score"] <= 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${analysisResult["ATS Score"]}%` }}
              ></div>
            </div>
          </div>

          {/* Summary Section - READ ONLY VIEW */}
          {analysisResult["Profile Summary"] && analysisResult["Profile Summary"]["Summary"] && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setOpenCheckId(openCheckId === 'summary-text' ? null : 'summary-text')}
              >
                <h4 className="text-md font-semibold">Summary</h4>
                <svg 
                  className={`w-5 h-5 transition-transform ${openCheckId === 'summary-text' ? 'transform rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
              
              {openCheckId === 'summary-text' && (
                <div className="mt-3 border-t border-gray-700 pt-3">
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">
                    {analysisResult["Profile Summary"]["Summary"]}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Checks Section */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="text-md font-semibold mb-4">Resume Checks</h4>
            <div className="space-y-2">
              {analysisResult["Profile Summary"] && analysisResult["Profile Summary"]["Scoring Breakdown"] && 
                Object.entries(analysisResult["Profile Summary"]["Scoring Breakdown"]).map(([checkName, check]) => (
                  <div key={checkName} className="border border-gray-700 rounded-md overflow-hidden">
                    <div 
                      className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-700"
                      onClick={() => setOpenCheckId(openCheckId === checkName ? null : checkName)}
                    >
                      <span className="font-medium">{checkName}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-md text-sm font-medium ${getScoreColor(check.Score)}`}>
                          {check.Score}/100
                        </span>
                        <svg 
                          className={`w-5 h-5 transition-transform ${openCheckId === checkName ? 'transform rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>
                    {openCheckId === checkName && (
                      <div className="p-3 bg-gray-900 border-t border-gray-700">
                        <p className="text-sm text-gray-300">{check.Comments}</p>
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
          </div>

          {/* Suggested Rewrites */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="text-md font-semibold mb-4">Suggested Rewrites</h4>
            
            {/* Professional Summary Rewrite - Added back with the "Apply to Resume" functionality */}
            {analysisResult["Profile Summary"] && editableContent['summary'] && (
              <div className="border border-gray-700 rounded-md overflow-hidden mb-4">
                <div 
                  className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-700"
                  onClick={() => setOpenRewriteId(openRewriteId === 'summary' ? null : 'summary')}
                >
                  <span className="font-medium">Professional Summary</span>
                  <svg 
                    className={`w-5 h-5 transition-transform ${openRewriteId === 'summary' ? 'transform rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                {openRewriteId === 'summary' && (
                  <div className="p-3 bg-gray-900 border-t border-gray-700">
                    <p className="text-sm mb-3 text-gray-400">Suggested professional summary based on job requirements:</p>
                    <div className="mb-3">
                      <RichTextEditor 
                        content={editableContent['summary']}
                        onUpdate={(html) => setEditableContent(prev => ({ ...prev, 'summary': html }))}
                      />
                    </div>
                    <button
                      onClick={() => handleApplySuggestion('summary')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
                    >
                      Apply to Resume
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Work Experience Rewrites */}
            {analysisResult["Work Experience"] && analysisResult["Work Experience"].map((exp, index) => {
              if (!exp.suggestedRewrite || exp.suggestedRewrite.length === 0) return null;
              
              const rewriteKey = `work-${index}`;
              return (
                <div key={rewriteKey} className="border border-gray-700 rounded-md overflow-hidden mb-4">
                  <div 
                    className="flex justify-between items-center p-3 cursor-pointer hover:bg-gray-700"
                    onClick={() => setOpenRewriteId(openRewriteId === rewriteKey ? null : rewriteKey)}
                  >
                    <span className="font-medium">{exp.position} at {exp.company}</span>
                    <svg 
                      className={`w-5 h-5 transition-transform ${openRewriteId === rewriteKey ? 'transform rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                  {openRewriteId === rewriteKey && (
                    <div className="p-3 bg-gray-900 border-t border-gray-700">
                      <p className="text-sm mb-3 text-gray-400">Suggested bullets for improved impact:</p>
                      <div className="mb-3">
                        <RichTextEditor 
                          content={editableContent[rewriteKey] || formatBulletedList(exp.suggestedRewrite)}
                          onUpdate={(html) => setEditableContent(prev => ({ ...prev, [rewriteKey]: html }))}
                        />
                      </div>
                      <button
                        onClick={() => handleApplySuggestion('experience', index)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm"
                      >
                        Apply to Resume
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Missing Keywords */}
            {analysisResult["Missing Keywords"] && analysisResult["Missing Keywords"].length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium mb-2">Missing Keywords</h5>
                <div className="bg-gray-900 p-3 rounded-md">
                  <div className="flex flex-wrap gap-2">
                    {analysisResult["Missing Keywords"].map((keyword, idx) => (
                      <span key={idx} className="bg-red-900/30 text-red-300 px-2 py-1 rounded-sm text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIResumeAnalyzer;
