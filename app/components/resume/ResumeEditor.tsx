// app/components/resume/ResumeEditor.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { ResumeSection, ResumeSectionType } from '@/app/lib/types';
import { resumeDataToSections, sectionsToHtml } from '@/app/lib/resume-utils';
import { enhanceResumeSections, formatSectionContent } from '@/app/lib/section-extraction-utils';
import { parseResumeWithCheerio, cheerioNormalizeHtml } from '@/app/lib/cheerio-parser';
import { jsonResumeToSections, sectionsToJsonResume } from '@/app/lib/json-resume-processor';
import ResumeTemplatesPicker from './ResumeHTMLTemplates';
import BulletPointFormatter from './BulletPointFormatter';
import ReadOnlyEditor from './tiptap/ReadOnlyEditor';
import RichTextEditor from './tiptap/RichTextEditor';
import { ResumeExportButton } from '@/app/lib/ResumeExporter';
import AIResumeAnalyzer from './AIResumeAnalyzer';

interface ResumeEditorProps {
  resumeId?: string;
  jobApplicationId?: string;
  onSave?: (sections: ResumeSection[]) => Promise<void>;
}

/**
 * Attempts to extract and parse JSON from various formats
 * @param content The content to parse
 * @returns Parsed JSON object or null if not valid JSON
 */
function parseJsonContent(content: string) {
  try {
    // Check for JSON in markdown code blocks
    if (content.includes('```json')) {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1].trim());
      }
    }
    
    // Check for direct JSON content
    if (content.startsWith('{') && content.endsWith('}')) {
      return JSON.parse(content);
    }
    
    return null;
  } catch (error) {
    console.error("Error parsing JSON content:", error);
    return null;
  }
}

/**
 * Process HTML content using Cheerio
 * @param content HTML content to parse
 * @param fallbackData Original data object for fallback
 * @returns Array of resume sections
 */
function processHtmlContent(content: string, fallbackData: any): ResumeSection[] {
  try {
    // Normalize and parse the HTML
    const normalizedHtml = cheerioNormalizeHtml(content);
    const cheerioSections = parseResumeWithCheerio(normalizedHtml);
    
    if (cheerioSections && cheerioSections.length > 0) {
      console.log("Successfully parsed with Cheerio:", cheerioSections.length, "sections");
      return cheerioSections;
    }
  } catch (error) {
    console.error("Error parsing HTML content:", error);
  }
  
  // Fallback to default parser
  console.log("Falling back to default resume parser");
  return resumeDataToSections(fallbackData);
}

/**
 * Build section hierarchy (parent-child relationships)
 * @param sections Array of resume sections
 * @returns Object mapping parent IDs to arrays of child IDs
 */
function buildSectionHierarchy(sections: ResumeSection[]): Record<string, string[]> {
  const hierarchy: Record<string, string[]> = {};
  
  sections.forEach(section => {
    if (section.parentId) {
      if (!hierarchy[section.parentId]) {
        hierarchy[section.parentId] = [];
      }
      hierarchy[section.parentId].push(section.id);
    }
  });
  
  return hierarchy;
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ 
  resumeId, 
  jobApplicationId 
}) => {
  const [resumeSections, setResumeSections] = useState<ResumeSection[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [pdfExportContent, setPdfExportContent] = useState<string>('');
  const [sectionHierarchy, setSectionHierarchy] = useState<Record<string, string[]>>({});
  const [jobDescription, setJobDescription] = useState<string>('');
  const [showAnalyzer, setShowAnalyzer] = useState(false);

  // Process resume data from API response
  const processResumeData = (resumeData: any) => {
    console.log("Processing resume data:", resumeData);
    
    let sections: ResumeSection[] = [];
    
    try {
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
        sections = processHtmlContent(contentToUse, resumeData);
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
      const fallbackSections = resumeDataToSections(resumeData);
      setResumeSections(fallbackSections);
    }
  };

  // Fetch resume data
  useEffect(() => {
    const fetchResumeData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("Fetching resume data with params:", { resumeId, jobApplicationId });
        
        // Define helper function for base resume
        const fetchBaseResume = async () => {
          try {
            const response = await fetch('/api/resume/get');
            if (response.ok) {
              return await response.json();
            }
            throw new Error('Failed to fetch base resume');
          } catch (error) {
            console.error("Error fetching base resume:", error);
            setError('Could not load any resume data');
            return null;
          }
        };
        
        let resumeData = null;
        
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
                setCurrentResumeId(targetResume.id);
              }
            }
          } else {
            // No job ID, try to get the specific resume directly
            const resumeResponse = await fetch(`/api/resume/${resumeId}`);
            
            if (resumeResponse.ok) {
              resumeData = await resumeResponse.json();
              setCurrentResumeId(resumeId);
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
              console.log("Found primary resume");
              resumeData = primaryResume;
              setCurrentResumeId(primaryResume.id);
            } else if (allJobResumes.length > 0) {
              // No primary resume, use the first one
              console.log("No primary resume found, using first resume");
              resumeData = allJobResumes[0];
              setCurrentResumeId(allJobResumes[0].id);
            }
          }
        }
        
        // If still no resume data, use base resume
        if (!resumeData) {
          console.log("No resume found, using base resume");
          resumeData = await fetchBaseResume();
        }
        
        // Process the resume data if found
        if (resumeData) {
          processResumeData(resumeData);
        }
        
        // Fetch job description if we have a job application ID
        if (jobApplicationId) {
          try {
            // First try with the job application endpoint
            const jobAppResponse = await fetch(`/api/jobs/${jobApplicationId}`);
            if (jobAppResponse.ok) {
              const jobData = await jobAppResponse.json();
              if (jobData.description) {
                setJobDescription(jobData.description);
                console.log("Found job description in job data:", jobData.description.substring(0, 50) + "...");
              } else if (jobData.jobDescription) {
                setJobDescription(jobData.jobDescription);
                console.log("Found jobDescription in job data:", jobData.jobDescription.substring(0, 50) + "...");
              } else {
                console.warn('No job description found in job data, trying jobApplication endpoint');
                
                // Try with the jobApplication endpoint as fallback
                try {
                  const jobResponse = await fetch(`/api/jobApplications/${jobApplicationId}`);
                  if (jobResponse.ok) {
                    const jobAppData = await jobResponse.json();
                    if (jobAppData.description) {
                      setJobDescription(jobAppData.description);
                      console.log("Found description in jobApplication data");
                    } else if (jobAppData.jobDescription) {
                      setJobDescription(jobAppData.jobDescription);
                      console.log("Found jobDescription in jobApplication data");
                    } else {
                      console.warn('No job description found in any API response');
                      setJobDescription('');
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
                    setJobDescription(jobAppData.description);
                  } else if (jobAppData.jobDescription) {
                    setJobDescription(jobAppData.jobDescription);
                  } else {
                    setJobDescription('');
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
      } catch (err) {
        console.error('Error fetching resume:', err);
        setError('Could not load resume data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResumeData();
  }, [resumeId, jobApplicationId]);

  // Handle section click to activate editing
  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    setShowTemplatePicker(false);
  };

  // Sort sections by type for display
  const getSectionTypeOrder = (type: ResumeSectionType): number => {
    const order: Record<string, number> = {
      [ResumeSectionType.HEADER]: 0,
      [ResumeSectionType.SUMMARY]: 1,
      [ResumeSectionType.EXPERIENCE]: 2,
      [ResumeSectionType.JOB_ROLE]: 3,
      [ResumeSectionType.EDUCATION]: 4,
      [ResumeSectionType.SKILLS]: 5,
      [ResumeSectionType.CERTIFICATIONS]: 6,
      [ResumeSectionType.PROJECTS]: 7,
      [ResumeSectionType.OTHER]: 8
    };
    return order[type] ?? 999;
  };

  // Update section content - now handles HTML content from TipTap
  const handleContentEdit = useCallback((sectionId: string, newContent: string) => {
    setResumeSections(prevSections => 
      prevSections.map(section => 
        section.id === sectionId 
          ? { ...section, content: newContent }
          : section
      )
    );
  }, []);

  // Delete a section
  const handleDeleteSection = (sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Get the section
    const section = resumeSections.find(s => s.id === sectionId);
    
    // Check if the section can be deleted
    if (!section || section.type === ResumeSectionType.HEADER || 
        (section.type === ResumeSectionType.SUMMARY && sectionId === 'summary') || 
        (section.type === ResumeSectionType.EXPERIENCE && sectionId === 'experience') || 
        (section.type === ResumeSectionType.EDUCATION && sectionId === 'education') || 
        (section.type === ResumeSectionType.SKILLS && sectionId === 'skills')) {
      alert('Core resume sections cannot be deleted.');
      return;
    }
    
    // For job roles, check if it's the only job role
    if (section.type === ResumeSectionType.JOB_ROLE) {
      const jobRoles = resumeSections.filter(s => s.type === ResumeSectionType.JOB_ROLE);
      if (jobRoles.length <= 1) {
        alert('You must have at least one job role in your resume.');
        return;
      }
    }
    
    if (window.confirm('Are you sure you want to delete this section?')) {
      // Remove the section
      setResumeSections(prev => prev.filter(s => s.id !== sectionId));
      
      // Remove from hierarchy if needed
      if (section.parentId && sectionHierarchy[section.parentId]) {
        setSectionHierarchy(prev => {
          const updated = {...prev};
          updated[section.parentId!] = updated[section.parentId!].filter(id => id !== sectionId);
          return updated;
        });
      }
      
      // Clear active section if deleted
      if (activeSection === sectionId) {
        setActiveSection(null);
      }
    }
  };

  // Add a new summary section if missing
  const handleAddSummary = () => {
    // Check if summary already exists
    if (resumeSections.some(s => s.type === ResumeSectionType.SUMMARY)) {
      return;
    }
    
    const newSummary: ResumeSection = {
      id: 'summary',
      title: 'Professional Summary',
      type: ResumeSectionType.SUMMARY,
      content: '<div class="mb-6"><p class="text-gray-200">Professional summary highlighting your experience, skills, and career goals...</p></div>'
    };
    
    // Find index after HEADER to insert the summary
    const headerIndex = resumeSections.findIndex(s => s.type === ResumeSectionType.HEADER);
    const insertIndex = headerIndex !== -1 ? headerIndex + 1 : 0;
    
    setResumeSections(prev => [
      ...prev.slice(0, insertIndex),
      newSummary,
      ...prev.slice(insertIndex)
    ]);
    
    setActiveSection(newSummary.id);
  };
  
  // Add a new section
  const handleAddSection = () => {
    const newSection: ResumeSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      type: ResumeSectionType.OTHER,
      content: '<div class="mb-6"><p class="text-gray-200">Add your content here...</p></div>'
    };
    setResumeSections(prev => [...prev, newSection]);
    setActiveSection(newSection.id);
  };

  // Add a new job role with indented bullet points
  const handleAddJobRole = () => {
    // Find experience section - create it if it doesn't exist
    let experienceSection = resumeSections.find(s => s.type === ResumeSectionType.EXPERIENCE);
    if (!experienceSection) {
      experienceSection = {
        id: 'experience',
        title: 'Professional Experience',
        type: ResumeSectionType.EXPERIENCE,
        content: '<h2 class="text-xl font-semibold text-white">Professional Experience</h2>'
      };
      setResumeSections(prev => [...prev, experienceSection!]);
    }
    
    const newJobRoleId = `job-role-${Date.now()}`;
    const newJobRole: ResumeSection = {
      id: newJobRoleId,
      title: 'New Job Role',
      type: ResumeSectionType.JOB_ROLE,
      parentId: experienceSection.id,
      content: `
<h3>Job Title, Company | Date Range</h3>
<p class="text-gray-200">Job description goes here.</p>
<ul class="list-none mt-2">
  <li class="text-gray-200"><span style="display:inline-block; margin-left:5em;">• Add your responsibilities and achievements here</span></li>
  <li class="text-gray-200"><span style="display:inline-block; margin-left:5em;">• Describe your key accomplishments and impact</span></li>
  <li class="text-gray-200"><span style="display:inline-block; margin-left:5em;">• Highlight specific metrics and results</span></li>
</ul>`
    };
    
    setResumeSections(prev => [...prev, newJobRole]);
    
    // Update hierarchy
    setSectionHierarchy(prev => {
      const updated = {...prev};
      if (!updated[experienceSection!.id]) {
        updated[experienceSection!.id] = [];
      }
      updated[experienceSection!.id].push(newJobRoleId);
      return updated;
    });
    
    setActiveSection(newJobRoleId);
  };

  // Handle template selection - converts template HTML to content for TipTap
  const handleTemplateSelect = (templateContent: string) => {
    if (activeSection) {
      handleContentEdit(activeSection, templateContent);
      setShowTemplatePicker(false);
    }
  };

  // Save the resume
  const handleSave = async () => {
    if (!currentResumeId) {
      setError('No resume ID available to save changes');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      // Convert the resume sections back to HTML
      const combinedHtml = sectionsToHtml(resumeSections);
      
      // Generate JSON data for better storage
      const jsonResume = sectionsToJsonResume(resumeSections);
      
      // Create clean JSON string without markdown formatting
      const jsonString = JSON.stringify(jsonResume, null, 2);
      
      // Update the PDF export content
      updatePdfExportContent();
      
      console.log(`Saving resume changes to resume ID: ${currentResumeId}`);
      const response = await fetch(`/api/resume/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentResumeId,
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
    } catch (error) {
      console.error('Error saving resume:', error);
      setError(`Failed to save resume: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Convert resume sections to a format suitable for PDF export
  const updatePdfExportContent = useCallback(() => {
    // First, sort sections in the proper order
    const sortedSectionsForExport = [...resumeSections].sort((a, b) => {
      const orderA = getSectionTypeOrder(a.type);
      const orderB = getSectionTypeOrder(b.type);
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return resumeSections.indexOf(a) - resumeSections.indexOf(b);
    });
    
    // Create a markdown structure for the resume
    let markdownContent = '';
    
    // Add header section (name) if it exists
    const headerSection = sortedSectionsForExport.find(s => s.type === ResumeSectionType.HEADER);
    if (headerSection) {
      // Extract name from HTML content using a temporary element
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = headerSection.content;
      const nameElement = tempDiv.querySelector('h1, h2, h3, h4') || tempDiv;
      markdownContent += `# ${nameElement.textContent?.trim()}\n\n`;
      
      // Add contact info if present
      const contactElements = tempDiv.querySelectorAll('p, div:not(:has(h1,h2,h3,h4))');
      if (contactElements.length) {
        contactElements.forEach(element => {
          const text = element.textContent?.trim();
          if (text) markdownContent += `${text}\n`;
        });
        markdownContent += '\n';
      }
    }
    
    // Process each section, converting HTML to markdown-like format
    sortedSectionsForExport.forEach(section => {
      if (section.type === ResumeSectionType.HEADER) return; // Skip header as it's already processed
      
      // Only process top-level sections (non-job roles)
      if (section.parentId) return;
      
      // Add section title as markdown heading
      markdownContent += `## ${section.title.toUpperCase()}\n\n`;
      
      // For experience section, also include its child job roles
      if (section.type === ResumeSectionType.EXPERIENCE) {
        // Process each job role that belongs to this experience section
        const jobRoles = resumeSections.filter(s => s.parentId === section.id);
        jobRoles.forEach(jobRole => {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = jobRole.content;
          
          // Extract job title and company/date
          const titleElement = tempDiv.querySelector('h3') || tempDiv.querySelector('h4');
          if (titleElement) {
            // Assume format is "Job Title, Company | Date Range" or "Company | Date Range"
            const titleText = titleElement.textContent?.trim() || '';
            if (titleText.includes('|')) {
              markdownContent += `### ${titleText}\n\n`;
            } else {
              markdownContent += `### ${titleText} | Present\n\n`;
            }
          }
          
          // Extract paragraphs
          const paragraphs = tempDiv.querySelectorAll('p');
          paragraphs.forEach(p => {
            const text = p.textContent?.trim();
            if (text) markdownContent += `${text}\n\n`;
          });
          
          // Extract bullet points
          const listItems = tempDiv.querySelectorAll('li');
          if (listItems.length) {
            listItems.forEach(li => {
              const text = li.textContent?.trim();
              if (text) markdownContent += `* ${text}\n`;
            });
            markdownContent += '\n';
          }
        });
      } else {
        // For other sections, do a simpler conversion
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = section.content;
        
        // Extract all text content, preserving basic structure
        Array.from(tempDiv.childNodes).forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text) markdownContent += `${text}\n\n`;
          } else if (node.nodeName === 'P') {
            const text = node.textContent?.trim();
            if (text) markdownContent += `${text}\n\n`;
          } else if (node.nodeName === 'UL') {
            const items = (node as Element).querySelectorAll('li');
            items.forEach(item => {
              const text = item.textContent?.trim();
              if (text) markdownContent += `* ${text}\n`;
            });
            markdownContent += '\n';
          } else if (node.nodeName === 'H3' || node.nodeName === 'H4') {
            const text = node.textContent?.trim();
            if (text) markdownContent += `### ${text}\n\n`;
          }
        });
      }
    });
    
    setPdfExportContent(markdownContent);
  }, [resumeSections, getSectionTypeOrder]);
  
  // Handle applying suggested content from the analyzer
 // Handle applying suggested content from the analyzer
  const handleApplySuggestion = (sectionType: string, content: string, position?: string, company?: string, directRoleId?: string) => {
    try {
      console.log(`Applying suggestion - Type: ${sectionType}, DirectRoleId: ${directRoleId || 'none'}`);
      
      if (sectionType.toLowerCase() === 'summary') {
        console.log("Attempting to apply summary suggestion");
        
        // First try using the direct role ID if provided
        if (directRoleId) {
          const directSection = resumeSections.find(s => s.id === directRoleId);
          if (directSection) {
            console.log(`Found section by directRoleId: ${directRoleId}`);
            handleContentEdit(directSection.id, content);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            return; // Exit early if found
          }
        }
        
        // Next try to find by type
        const summarySection = resumeSections.find(s => s.type === ResumeSectionType.SUMMARY);
        if (summarySection) {
          console.log(`Found summary section by type: ${summarySection.id}`);
          handleContentEdit(summarySection.id, content);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
          return;
        }
        
        // Try by title as fallback
        const summaryByTitle = resumeSections.find(s => 
          s.title.toLowerCase().includes('summary') || 
          s.title.toLowerCase().includes('profile')
        );
        if (summaryByTitle) {
          console.log(`Found summary section by title: ${summaryByTitle.id}`);
          handleContentEdit(summaryByTitle.id, content);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
          return;
        }
        
        // Create a new summary section if not found
        console.log("No summary section found, creating new one");
        const newSummary: ResumeSection = {
          id: 'summary',
          title: 'Professional Summary',
          type: ResumeSectionType.SUMMARY,
          content: content
        };
        
        // Find index after HEADER to insert the summary
        const headerIndex = resumeSections.findIndex(s => s.type === ResumeSectionType.HEADER);
        const insertIndex = headerIndex !== -1 ? headerIndex + 1 : 0;
        
        setResumeSections(prev => [
          ...prev.slice(0, insertIndex),
          newSummary,
          ...prev.slice(insertIndex)
        ]);
        
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else if (sectionType === 'experience') {
        // First try using the direct role ID if provided
        if (directRoleId) {
          const targetSection = resumeSections.find(s => s.id === directRoleId);
          if (targetSection) {
            console.log(`Updating section by directRoleId: ${directRoleId}`);
            handleContentEdit(targetSection.id, content);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            return;
          }
        }
        
        // Next try matching by position and company names
        if (position || company) {
          const jobRoles = resumeSections.filter(s => s.type === ResumeSectionType.JOB_ROLE);
          for (const role of jobRoles) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = role.content;
            const heading = tempDiv.querySelector('h3, h4, h5')?.textContent || '';
            
            const hasPosition = position && (
              heading.toLowerCase().includes(position.toLowerCase()) || 
              role.title.toLowerCase().includes(position.toLowerCase())
            );
            
            const hasCompany = company && (
              heading.toLowerCase().includes(company.toLowerCase()) || 
              role.content.toLowerCase().includes(company.toLowerCase())
            );
            
            if ((position && company && hasPosition && hasCompany) || 
                (position && !company && hasPosition) || 
                (!position && company && hasCompany)) {
              console.log(`Found matching role: ${role.id} - ${role.title}`);
              handleContentEdit(role.id, content);
              setSaveSuccess(true);
              setTimeout(() => setSaveSuccess(false), 3000);
              return;
            }
          }
        }
        
        // Fallback: update the first job role if no match is found
        console.log('No matching job role found, updating the first one');
        const jobRoles = resumeSections.filter(s => s.type === ResumeSectionType.JOB_ROLE);
        if (jobRoles.length > 0) {
          handleContentEdit(jobRoles[0].id, content);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      }
    } catch (error) {
      console.error('Error applying suggestion:', error);
      setError('Failed to apply suggested content');
    }
  }; // Update PDF export content whenever resumeSections change
  useEffect(() => {
    if (resumeSections.length > 0) {
      updatePdfExportContent();
    }
  }, [resumeSections, updatePdfExportContent]);

  // Check if we should show "Add Job Role" button after this section
  const shouldShowAddJobRoleButton = (section: ResumeSection): boolean => {
    // Show Add Job Role button after Experience section
    return section.type === ResumeSectionType.EXPERIENCE;
  };

  // Prepare sections for display with proper hierarchical order
  const prepareDisplaySections = useCallback(() => {
    // First filter out only top-level sections (those without a parent or those that are parents)
    const topLevelSections = resumeSections.filter(section => 
      !section.parentId || Object.keys(sectionHierarchy).includes(section.id)
    );
    
    // Sort top-level sections by type order
    return [...topLevelSections].sort((a, b) => {
      const orderA = getSectionTypeOrder(a.type);
      const orderB = getSectionTypeOrder(b.type);
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // For same section types, preserve original order
      return resumeSections.indexOf(a) - resumeSections.indexOf(b);
    });
  }, [resumeSections, sectionHierarchy, getSectionTypeOrder]);

  // Toggle the AI Resume Analyzer visibility
  const toggleAnalyzer = () => {
    setShowAnalyzer(!showAnalyzer);
  };

  // Display loading indicator
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Display error message
  if (error && !resumeSections.length) {
    return (
      <div className="text-center py-8 text-red-500">
        Error: {error}
      </div>
    );
  }

  const sortedTopLevelSections = prepareDisplaySections();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column (2/3): Resume Content with Read-Only TipTap */}
      <div className="lg:col-span-2 bg-gray-900 rounded-lg p-6 text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Resume Editor</h2>
          <div className="flex space-x-2">
            <button 
              onClick={handleAddSection}
              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm mr-2"
            >
              Add Section
            </button>
            {!resumeSections.some(s => s.type === ResumeSectionType.SUMMARY) && (
              <button 
                onClick={handleAddSummary}
                className="bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded text-sm mr-2"
              >
                Add Summary
              </button>
            )}
            <button
              onClick={toggleAnalyzer}
              className={`px-3 py-1 rounded text-sm mr-2 ${
                showAnalyzer 
                  ? 'bg-purple-800 hover:bg-purple-900' 
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {showAnalyzer ? 'Hide Analyzer' : 'ATS Analyzer'}
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm disabled:opacity-50 mr-2"
            >
              {isSaving ? "Saving..." : "Save Resume"}
            </button>
            <ResumeExportButton
              content={pdfExportContent}
              contentType="markdown"
              filename={`Resume_${new Date().toISOString().split('T')[0]}.pdf`}
              metadata={{ id: currentResumeId ?? undefined }}
              buttonText="Export PDF"
              buttonClassName="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
              customFonts={{
                name: 'Arial',
                headings: 'Arial',
                body: 'Arial'
              }}
              colors={{
                name: '#000000',
                headings: '#000000',
                subheadings: '#000000',
                body: '#000000',
                bullet: '#000000'
              }}
              isDisabled={resumeSections.length === 0}
              onSuccess={() => {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
              }}
              onError={(error) => {
                console.error('PDF Export error:', error);
                setError(`Failed to export PDF: ${error.message}`);
              }}
            />
          </div>
        </div>
        
        {/* Resume Sections with Read-Only TipTap */}
        <div className="space-y-4">
          {sortedTopLevelSections.length > 0 ? (
            sortedTopLevelSections.map((section) => (
              <div key={section.id} className="relative">
                <div 
                  className={`border rounded-md p-4 ${
                    activeSection === section.id 
                      ? 'border-blue-500 bg-blue-900/20' 
                      : 'border-gray-700 hover:border-gray-500'
                  } cursor-pointer transition duration-200`}
                  onClick={() => handleSectionClick(section.id)}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-lg text-white">
                      {section.title}
                    </h3>
                    <div className="flex space-x-2">
                      <button 
                        className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSectionClick(section.id);
                        }}
                      >
                        Edit
                      </button>
                      {/* Only allow deleting non-essential sections */}
                      {(section.type !== ResumeSectionType.HEADER && 
                         !['summary', 'experience', 'education', 'skills'].includes(section.id)) && (
                        <button 
                          className="text-xs bg-red-900 hover:bg-red-800 px-2 py-1 rounded"
                          onClick={(e) => handleDeleteSection(section.id, e)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Display section content using ReadOnlyEditor */}
                  <div className="prose prose-invert max-w-none">
                    <ReadOnlyEditor content={section.content} />
                  </div>
                </div>
                
                {/* Render child sections (e.g., job roles under experience) */}
                {sectionHierarchy[section.id] && sectionHierarchy[section.id].length > 0 && (
                  <div className="ml-6 mt-2 space-y-4">
                    {sectionHierarchy[section.id].map(childId => {
                      const childSection = resumeSections.find(s => s.id === childId);
                      if (!childSection) return null;
                      
                      return (
                        <div key={childSection.id} className="relative">
                          <div 
                            className={`border rounded-md p-4 ${
                              activeSection === childSection.id 
                                ? 'border-blue-500 bg-blue-900/20' 
                                : 'border-gray-700 hover:border-gray-500'
                            } cursor-pointer transition duration-200`}
                            onClick={() => handleSectionClick(childSection.id)}
                          >
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="font-semibold text-lg text-white">
                                {childSection.type === ResumeSectionType.JOB_ROLE ? `${childSection.title} (Role)` : childSection.title}
                              </h3>
                              <div className="flex space-x-2">
                                <button 
                                  className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSectionClick(childSection.id);
                                  }}
                                >
                                  Edit
                                </button>
                                {/* Allow deleting job roles except when it's the only one */}
                                <button 
                                  className="text-xs bg-red-900 hover:bg-red-800 px-2 py-1 rounded"
                                  onClick={(e) => handleDeleteSection(childSection.id, e)}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                  </svg>
                                </button>
                              </div>
                            </div>
                            
                            <div className="prose prose-invert max-w-none">
                              <ReadOnlyEditor content={childSection.content} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Add Job Role button after Experience section */}
                {shouldShowAddJobRoleButton(section) && (
                  <div className="mt-2 mb-4 ml-6">
                    <button
                      onClick={handleAddJobRole}
                      className="text-xs bg-indigo-800 hover:bg-indigo-700 text-gray-200 px-2 py-1 rounded flex items-center"
                    >
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                      </svg>
                      Add Job Role
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p>No resume sections found. Click "Add Section" to create your resume.</p>
            </div>
          )}
        </div>
        
        {/* Status Messages */}
        <div className="mt-6">
          {saveSuccess && (
            <div className="p-2 bg-green-900/20 text-green-400 rounded">
              {isSaving ? "Resume saved successfully!" : "Action completed successfully!"}
            </div>
          )}
          {error && (
            <div className="p-2 bg-red-900/20 text-red-400 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
      
      {/* Right Column (1/3): Either Section Editor or AI Resume Analyzer */}
      <div className="bg-gray-900 rounded-lg p-6 text-white">
        {showAnalyzer ? (
          <>
            {/* Job description functionality maintained but input box hidden */}
            <AIResumeAnalyzer 
              resumeId={currentResumeId}
              jobDescription={jobDescription}
              jobApplicationId={jobApplicationId}
              resumeSections={resumeSections}
              onApplySuggestion={handleApplySuggestion}
            />
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold mb-4">Section Editor</h2>
            {activeSection ? (
              <>
                <div className="mb-4">
                  <label className="block text-sm mb-1">Section Title</label>
                  <input
                    type="text"
                    value={resumeSections.find(s => s.id === activeSection)?.title || ''}
                    onChange={(e) => {
                      setResumeSections(prevSections => 
                        prevSections.map(section => 
                          section.id === activeSection 
                            ? { ...section, title: e.target.value }
                            : section
                        )
                      );
                    }}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                  />
                </div>
                
                {/* TipTap Editor instead of textarea */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm">Content</label>
                    <div>
                      <button
                        onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        {showTemplatePicker ? 'Hide Templates' : 'Show Templates'}
                      </button>
                    </div>
                  </div>
                  
                  {showTemplatePicker && (
                    <div className="mb-4">
                      <ResumeTemplatesPicker onSelectTemplate={handleTemplateSelect} />
                    </div>
                  )}
                  
                  {/* TipTap Editor */}
                  <div className="bg-gray-800 border border-gray-700 rounded-md">
                    <RichTextEditor 
                      content={resumeSections.find(s => s.id === activeSection)?.content || ''}
                      onUpdate={(html) => {
                        if (activeSection) {
                          handleContentEdit(activeSection, html);
                        }
                      }}
                    />
                  </div>
                </div>
                
                {/* BulletPointFormatter for job roles */}
                <BulletPointFormatter
                  currentSection={activeSection}
                  sections={resumeSections}
                  onUpdateContent={handleContentEdit}
                />
                
                {/* Editor Tips */}
                <div className="mt-4 bg-gray-800 p-3 rounded-md text-xs text-gray-300">
                  <h4 className="font-bold mb-1">Editor Tips:</h4>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Use the toolbar to format your text (bold, italic, headings, etc.)</li>
                    <li>Create bullet points using the list icon in the toolbar</li>
                    <li>Indent text using the tab key or the indent button</li>
                    <li>Use the "Format Bullet Points" button to automatically align bullet points</li>
                    <li>Tables can be added for structured data such as skills or certifications</li>
                  </ul>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path>
                </svg>
                <p className="text-lg">Select a section to edit</p>
                <p className="text-sm mt-2">Click on any section in your resume to edit it</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ResumeEditor;
