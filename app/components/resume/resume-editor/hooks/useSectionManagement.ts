// app/components/resume/resume-editor/hooks/useSectionManagement.ts
import { useState, useCallback } from 'react';
import { ResumeSection, ResumeSectionType } from '@/app/lib/types';
import { preserveJobRoleHeaderAndUpdateBullets } from '../utils/resume-parsing-utils';

/**
 * Custom hook for managing resume sections
 * Handles operations like adding, editing, and deleting sections
 */
export function useSectionManagement(
  resumeSections: ResumeSection[],
  setResumeSections: React.Dispatch<React.SetStateAction<ResumeSection[]>>,
  sectionHierarchy: Record<string, string[]>,
  setSectionHierarchy: React.Dispatch<React.SetStateAction<Record<string, string[]>>>,
  setSaveSuccess?: (value: boolean) => void
) {
  // Track the currently active (selected) section
  const [activeSection, setActiveSection] = useState<string | null>(null);

  /**
   * Get the display order for section types
   * Used for sorting sections in a consistent order
   */
  const getSectionTypeOrder = useCallback((type: ResumeSectionType): number => {
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
  }, []);

  /**
   * Handle click on a section to make it active for editing
   */
  const handleSectionClick = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
  }, []);

  /**
   * Update section content
   */
  const handleContentEdit = useCallback((sectionId: string, newContent: string) => {
    setResumeSections(prevSections => 
      prevSections.map(section => 
        section.id === sectionId 
          ? { ...section, content: newContent }
          : section
      )
    );
  }, [setResumeSections]);

  /**
   * Delete a section
   */
  const handleDeleteSection = useCallback((sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Get the section to be deleted
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
  }, [resumeSections, sectionHierarchy, activeSection, setResumeSections, setSectionHierarchy]);

  /**
   * Add a new summary section if missing
   */
  const handleAddSummary = useCallback(() => {
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
  }, [resumeSections, setResumeSections]);

  /**
   * Add a new generic section
   */
  const handleAddSection = useCallback(() => {
    const newSection: ResumeSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      type: ResumeSectionType.OTHER,
      content: '<div class="mb-6"><p class="text-gray-200">Add your content here...</p></div>'
    };
    setResumeSections(prev => [...prev, newSection]);
    setActiveSection(newSection.id);
  }, [setResumeSections]);

  /**
   * Add a new job role with indented bullet points
   */
  const handleAddJobRole = useCallback(() => {
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
  }, [resumeSections, setResumeSections, setSectionHierarchy]);

  /**
   * Check if we should show "Add Job Role" button after this section
   */
  const shouldShowAddJobRoleButton = useCallback((section: ResumeSection): boolean => {
    // Show Add Job Role button after Experience section
    return section.type === ResumeSectionType.EXPERIENCE;
  }, []);

  /**
   * Handle applying suggested content from the analyzer
   * This function is passed to the AIResumeAnalyzer component as onApplySuggestion
   */
  const handleApplySuggestion = useCallback((
    sectionType: string, 
    content: string, 
    position?: string, 
    company?: string, 
    directRoleId?: string
  ) => {
    try {
      console.log(`Applying suggestion - Type: ${sectionType}, DirectRoleId: ${directRoleId || 'none'}`);
      
      // Function to show success message
      const showSuccess = () => {
        if (setSaveSuccess) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess && setSaveSuccess(false), 3000);
        }
      };
      
      if (sectionType.toLowerCase() === 'summary') {
        console.log("Attempting to apply summary suggestion");
        
        // First try using the direct role ID if provided
        if (directRoleId) {
          const directSection = resumeSections.find(s => s.id === directRoleId);
          if (directSection) {
            console.log(`Found section by directRoleId: ${directRoleId}`);
            handleContentEdit(directSection.id, content);
            showSuccess();
            return;
          }
        }
        
        // Next try to find by type
        const summarySection = resumeSections.find(s => s.type === ResumeSectionType.SUMMARY);
        if (summarySection) {
          console.log(`Found summary section by type: ${summarySection.id}`);
          handleContentEdit(summarySection.id, content);
          showSuccess();
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
          showSuccess();
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
        
        showSuccess();
      } else if (sectionType === 'experience') {
        // First try using the direct role ID if provided
        if (directRoleId) {
          const targetSection = resumeSections.find(s => s.id === directRoleId);
          if (targetSection) {
            console.log(`Updating section by directRoleId: ${directRoleId}`);
            // Preserve header and only update bullets
            const preservedContent = preserveJobRoleHeaderAndUpdateBullets(targetSection.content, content);
            handleContentEdit(targetSection.id, preservedContent);
            showSuccess();
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
              // Preserve header and only update bullets
              const preservedContent = preserveJobRoleHeaderAndUpdateBullets(role.content, content);
              handleContentEdit(role.id, preservedContent);
              showSuccess();
              return;
            }
          }
        }
        
        // Fallback: update the first job role if no match is found
        console.log('No matching job role found, updating the first one');
        const jobRoles = resumeSections.filter(s => s.type === ResumeSectionType.JOB_ROLE);
        if (jobRoles.length > 0) {
          // Preserve header and only update bullets
          const preservedContent = preserveJobRoleHeaderAndUpdateBullets(jobRoles[0].content, content);
          handleContentEdit(jobRoles[0].id, preservedContent);
          showSuccess();
        }
      }
    } catch (error) {
      console.error('Error applying suggestion:', error);
    }
  }, [resumeSections, handleContentEdit, setResumeSections, setSaveSuccess]);

  return {
    activeSection,
    setActiveSection,
    handleSectionClick,
    handleContentEdit,
    handleDeleteSection,
    handleAddSummary,
    handleAddSection,
    handleAddJobRole,
    shouldShowAddJobRoleButton,
    handleApplySuggestion,
    getSectionTypeOrder
  };
}

export default useSectionManagement;
