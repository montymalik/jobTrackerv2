// app/components/resume/resume-editor/hooks/useResumeData.ts
import { useState, useEffect, useCallback } from 'react';
import { ResumeSection, ResumeSectionType } from '@/app/lib/types';
import { useResumeApi } from './useResumeApi';
import { parseJsonContent, processHtmlContent, buildSectionHierarchy } from '../utils/resume-parsing-utils';
import { enhanceResumeSections, formatSectionContent } from '@/app/lib/section-extraction-utils';
import { parseResumeWithCheerio, cheerioNormalizeHtml } from '@/app/lib/cheerio-parser';
import { jsonResumeToSections, resumeDataToSections } from '@/app/lib/json-resume-processor';

/**
 * Custom hook to manage resume data state
 * Combines API interactions with data processing
 * 
 * @param resumeId Optional ID of a specific resume to load
 * @param jobApplicationId Optional ID of a job application to fetch related resumes
 */
export function useResumeData(resumeId?: string, jobApplicationId?: string) {
  // State
  const [resumeSections, setResumeSections] = useState<ResumeSection[]>([]);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [jobDescription, setJobDescription] = useState<string>('');
  const [sectionHierarchy, setSectionHierarchy] = useState<Record<string, string[]>>({});
  
  // Get API methods from useResumeApi hook
  const {
    fetchResumeData,
    saveResume,
    isLoading,
    isSaving,
    error,
    setError,
    saveSuccess,
    setSaveSuccess
  } = useResumeApi();

  /**
   * Process resume data from API response
   * Extracts resume sections from various formats (JSON, HTML)
   */
  const processResumeData = useCallback((resumeData: any) => {
    console.log("Processing resume data:", resumeData ? resumeData.id : 'no data');
    
    if (!resumeData) {
      console.error("No resume data to process");
      setError("No resume data received from API");
      return;
    }
    
    try {
      let sections: ResumeSection[] = [];
      
      // Check all possible sources for JSON data
      let jsonData = null;
      
      // Check rawJson (structured object)
      if (resumeData.rawJson) {
        console.log("Using rawJson data");
        jsonData = resumeData.rawJson;
      }
      // Check markdownContent (string)
      else if (resumeData.markdownContent && resumeData.markdownContent.trim()) {
        console.log("Checking markdownContent for JSON");
        jsonData = parseJsonContent(resumeData.markdownContent);
      }
      // Check content field (string)
      else if (resumeData.content && resumeData.content.trim()) {
        console.log("Checking content field for JSON");
        jsonData = parseJsonContent(resumeData.content);
      }
      
      // If we found valid JSON, use it
      if (jsonData) {
        console.log("Successfully parsed JSON data");
        sections = jsonResumeToSections(jsonData);
      } 
      // Otherwise fall back to HTML parsing
      else {
        console.log("No JSON found, trying HTML parsing");
        const contentToUse = resumeData.markdownContent || resumeData.content || '';
        
        try {
          // First try Cheerio parsing
          const normalizedHtml = cheerioNormalizeHtml(contentToUse);
          const cheerioSections = parseResumeWithCheerio(normalizedHtml);
          
          if (cheerioSections && cheerioSections.length > 0) {
            console.log("Successfully parsed with Cheerio:", cheerioSections.length, "sections");
            sections = cheerioSections;
          } else {
            throw new Error("Cheerio parsing returned no sections");
          }
        } catch (cheerioError) {
          console.warn("Cheerio parsing failed, using default resume parser:", cheerioError);
          // Fall back to default parser
          sections = resumeDataToSections(resumeData);
        }
      }
      
      console.log(`Processing produced ${sections.length} initial sections`);
      
      if (sections.length === 0) {
        console.warn("No sections found, creating default sections");
        sections = resumeDataToSections(resumeData); // Last resort fallback
      }
      
      // Ensure all required sections exist
      sections = enhanceResumeSections(sections);
      
      // Format each section's content
      sections = sections.map(formatSectionContent);
      
      // Build section hierarchy
      const hierarchy = buildSectionHierarchy(sections);
      
      console.log("Final processed sections:", sections.length);
      console.log("Section hierarchy:", Object.keys(hierarchy).length, "parent sections");
      
      if (resumeData.id) {
        setCurrentResumeId(resumeData.id);
      }
      
      setSectionHierarchy(hierarchy);
      setResumeSections(sections);
    } catch (error) {
      console.error("Error during resume processing:", error);
      setError("Failed to process resume data");
      
      // Fallback to simple section generation
      try {
        const fallbackSections = resumeDataToSections(resumeData);
        console.log("Using fallback section generation:", fallbackSections.length, "sections");
        setResumeSections(fallbackSections);
      } catch (fallbackError) {
        console.error("Fallback section generation failed:", fallbackError);
        
        // Create at least a header section as absolute last resort
        const defaultHeader: ResumeSection = {
          id: 'header',
          title: 'Header',
          type: ResumeSectionType.HEADER,
          content: '<h1 class="text-3xl font-bold">Your Name</h1><p>Email • Phone • Location</p>'
        };
        
        setResumeSections([defaultHeader]);
      }
    }
  }, [setError]);

  // Fetch resume data on component mount or when IDs change
  useEffect(() => {
    const loadResumeData = async () => {
      console.log("🔄 Starting to load resume data...");
      const { resumeData, jobDescription, currentResumeId: apiResumeId } = 
        await fetchResumeData({ resumeId, jobApplicationId });
      
      console.log("📄 Resume data loaded:", resumeData ? "✅ Found" : "❌ Not found");
      
      if (resumeData) {
        processResumeData(resumeData);
        if (apiResumeId) {
          setCurrentResumeId(apiResumeId);
        }
      } else {
        console.warn("No resume data returned from API");
        setError("Failed to load resume data from server");
      }
      
      if (jobDescription) {
        setJobDescription(jobDescription);
      }
    };
    
    loadResumeData();
  }, [resumeId, jobApplicationId, fetchResumeData, processResumeData, setError]);

  /**
   * Handle saving the resume
   */
  const handleSave = useCallback(async () => {
    if (!currentResumeId) {
      setError('No resume ID available to save changes');
      return;
    }
    
    await saveResume({
      resumeId: currentResumeId,
      sections: resumeSections
    });
  }, [currentResumeId, resumeSections, saveResume, setError]);

  return {
    resumeSections,
    setResumeSections,
    isLoading,
    error,
    setError,
    isSaving,
    saveSuccess,
    setSaveSuccess,
    currentResumeId,
    jobDescription,
    sectionHierarchy,
    setSectionHierarchy,
    handleSave
  };
}

export default useResumeData;
