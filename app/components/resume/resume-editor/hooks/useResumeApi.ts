// app/components/resume/resume-editor/hooks/useResumeApi.ts
import { useState, useCallback } from 'react';
import { ResumeSection } from '@/app/lib/types';
import { sectionsToHtml } from '@/app/lib/resume-utils';
import { sectionsToJsonResume } from '@/app/lib/json-resume-processor';

interface FetchResumeOptions {
  resumeId?: string;
  jobApplicationId?: string;
}

interface SaveResumeOptions {
  resumeId: string;
  sections: ResumeSection[];
}

/**
 * Custom hook for Resume API operations
 * Handles fetching, saving, and API-related state management
 */
export function useResumeApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /**
   * Fetch base resume when no specific resume is found
   */
  const fetchBaseResume = useCallback(async () => {
    try {
      console.log("Attempting to fetch base resume");
      const response = await fetch('/api/resume/get');
      if (response.ok) {
        const data = await response.json();
        console.log("Successfully fetched base resume");
        return data;
      }
      throw new Error('Failed to fetch base resume');
    } catch (error) {
      console.error("Error fetching base resume:", error);
      setError('Could not load any resume data');
      return null;
    }
  }, []);

  /**
   * Fetch resume data with various fallback strategies
   * Exactly matching the original implementation
   */
  const fetchResumeData = useCallback(async ({ resumeId, jobApplicationId }: FetchResumeOptions) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching resume data with params:", { resumeId, jobApplicationId });
      let resumeData = null;
      let jobDescription = '';
      let currentResumeId = null;
      
      // If we have a specific resumeId, that's the one we're editing
      if (resumeId) {
        console.log(`Specific resume requested with ID: ${resumeId}`);
        
        if (jobApplicationId) {
          // Check if this is a valid resume for this job
          const jobResumesResponse = await fetch(`/api/resume/get-for-job?jobApplicationId=${jobApplicationId}`);
          
          if (jobResumesResponse.ok) {
            const allJobResumes = await jobResumesResponse.json();
            console.log(`Found ${allJobResumes.length} resumes for job`);
            
            // Find the specific resume
            const targetResume = allJobResumes.find((r: any) => r.id === resumeId);
            
            if (targetResume) {
              console.log("Found specific resume in job's resumes");
              resumeData = targetResume;
              currentResumeId = targetResume.id;
            }
          }
        } else {
          // No job ID, try to get the specific resume directly
          const resumeResponse = await fetch(`/api/resume/${resumeId}`);
          
          if (resumeResponse.ok) {
            resumeData = await resumeResponse.json();
            currentResumeId = resumeId;
          }
        }
      }
      
      // If no specific resume was found, look for primary resume
      if (!resumeData && jobApplicationId) {
        console.log("Looking for primary resume for job");
        const jobResumesResponse = await fetch(`/api/resume/get-for-job?jobApplicationId=${jobApplicationId}`);
        
        if (jobResumesResponse.ok) {
          const allJobResumes = await jobResumesResponse.json();
          console.log(`Found ${allJobResumes.length} resumes for job application`);
          
          // Find the primary resume
          const primaryResume = allJobResumes.find((r: any) => r.isPrimary === true);
          
          if (primaryResume) {
            console.log("Found primary resume:", primaryResume.id);
            resumeData = primaryResume;
            currentResumeId = primaryResume.id;
          } else if (allJobResumes.length > 0) {
            // No primary resume, use the first one
            console.log("No primary resume found, using first resume:", allJobResumes[0].id);
            resumeData = allJobResumes[0];
            currentResumeId = allJobResumes[0].id;
          }
        }
      }
      
      // If still no resume data, use base resume
      if (!resumeData) {
        console.log("No resume found, using base resume");
        resumeData = await fetchBaseResume();
        if (resumeData && resumeData.id) {
          currentResumeId = resumeData.id;
        }
      }
      
      // Fetch job description if we have a job application ID
      if (jobApplicationId) {
        try {
          // First try with the job application endpoint
          const jobAppResponse = await fetch(`/api/jobs/${jobApplicationId}`);
          if (jobAppResponse.ok) {
            const jobData = await jobAppResponse.json();
            if (jobData.description) {
              jobDescription = jobData.description;
              console.log("Found job description in job data");
            } else if (jobData.jobDescription) {
              jobDescription = jobData.jobDescription;
              console.log("Found jobDescription in job data");
            } else {
              console.warn('No job description found in job data, trying jobApplication endpoint');
              
              // Try with the jobApplication endpoint as fallback
              try {
                const jobResponse = await fetch(`/api/jobApplications/${jobApplicationId}`);
                if (jobResponse.ok) {
                  const jobAppData = await jobResponse.json();
                  if (jobAppData.description) {
                    jobDescription = jobAppData.description;
                    console.log("Found description in jobApplication data");
                  } else if (jobAppData.jobDescription) {
                    jobDescription = jobAppData.jobDescription;
                    console.log("Found jobDescription in jobApplication data");
                  } else {
                    console.warn('No job description found in any API response');
                  }
                }
              } catch (fallbackError) {
                console.error('Error fetching from jobApplication endpoint:', fallbackError);
              }
            }
          } else {
            console.warn('Job endpoint returned non-OK response, trying jobApplication endpoint');
            // Try with the jobApplication endpoint as fallback
            try {
              const jobResponse = await fetch(`/api/jobApplications/${jobApplicationId}`);
              if (jobResponse.ok) {
                const jobAppData = await jobResponse.json();
                if (jobAppData.description) {
                  jobDescription = jobAppData.description;
                } else if (jobAppData.jobDescription) {
                  jobDescription = jobAppData.jobDescription;
                }
              }
            } catch (fallbackError) {
              console.error('Error fetching from jobApplication endpoint:', fallbackError);
            }
          }
        } catch (jobError) {
          console.error('Error fetching job description:', jobError);
        }
      }
      
      console.log("Resume data fetch complete:", resumeData ? "✅ Found" : "❌ Not found");
      
      return {
        resumeData,
        jobDescription,
        currentResumeId
      };
    } catch (err) {
      console.error('Error fetching resume:', err);
      setError('Could not load resume data');
      return {
        resumeData: null,
        jobDescription: '',
        currentResumeId: null
      };
    } finally {
      setIsLoading(false);
    }
  }, [fetchBaseResume]);

  /**
   * Save resume data
   */
  const saveResume = useCallback(async ({ resumeId, sections }: SaveResumeOptions) => {
    if (!resumeId) {
      setError('No resume ID available to save changes');
      return false;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Convert the resume sections back to HTML
      const combinedHtml = sectionsToHtml(sections);
      
      // Generate JSON data for better storage
      const jsonResume = sectionsToJsonResume(sections);
      
      // Create clean JSON string without markdown formatting
      const jsonString = JSON.stringify(jsonResume, null, 2);
      
      console.log(`Saving resume changes to resume ID: ${resumeId}`);
      const response = await fetch(`/api/resume/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: resumeId,
          markdownContent: jsonString, // Store JSON string for backward compatibility
          content: combinedHtml, // Keep HTML for display
          rawJson: jsonResume // Store structured JSON data
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update resume: ${errorText}`);
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      return true;
    } catch (error) {
      console.error('Error saving resume:', error);
      setError(`Failed to save resume: ${error instanceof Error ? error.message : "Unknown error"}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    fetchResumeData,
    saveResume,
    isLoading,
    isSaving,
    error,
    setError,
    saveSuccess,
    setSaveSuccess
  };
}

export default useResumeApi;
