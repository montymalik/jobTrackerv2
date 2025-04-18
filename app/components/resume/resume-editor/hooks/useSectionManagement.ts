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
   * Check if a section can be moved
   * Header and Professional Summary should be fixed
   */
  const canMoveSection = useCallback((section: ResumeSection): boolean => {
    return (
      section.type !== ResumeSectionType.HEADER && 
      !(section.type === ResumeSectionType.SUMMARY && section.id === 'summary')
    );
  }, []);
  /**
   * Move a section up in the order
   */
  const handleMoveUp = useCallback((sectionId: string) => {
    console.log('Move up clicked for section:', sectionId);
    
    setResumeSections(prevSections => {
      // Make a copy of the array first
      let newSections = [...prevSections];
      
      // Find the current index of the section
      const sectionIndex = newSections.findIndex(s => s.id === sectionId);
      console.log('Current section index:', sectionIndex);
      
      if (sectionIndex <= 0) {
        console.log('Already at top, cannot move up');
        return prevSections; // Can't move up if it's the first section
      }
      
      const section = newSections[sectionIndex];
      if (!canMoveSection(section)) {
        console.log('Section cannot be moved (fixed section)');
        return prevSections; // Can't move fixed sections
      }
      
      // Get the section above
      const prevSection = newSections[sectionIndex - 1];
      
      // Don't move past Header or Summary sections
      if (prevSection.type === ResumeSectionType.HEADER || 
          (prevSection.type === ResumeSectionType.SUMMARY && prevSection.id === 'summary')) {
        console.log('Cannot move past fixed section');
        return prevSections;
      }
      
      console.log('Moving section up:', section.title);
      console.log('Before:', newSections.map(s => s.title));
      
      // Swap the two sections
      newSections.splice(sectionIndex - 1, 2, section, prevSection);
      
      console.log('After:', newSections.map(s => s.title));
      return newSections;
    });
  }, [canMoveSection]);
  /**
   * Move a section down in the order
   */
  const handleMoveDown = useCallback((sectionId: string) => {
    console.log('Move down clicked for section:', sectionId);
    
    setResumeSections(prevSections => {
      // Make a copy of the array first
      let newSections = [...prevSections];
      
      // Find the current index of the section
      const sectionIndex = newSections.findIndex(s => s.id === sectionId);
      console.log('Current section index:', sectionIndex);
      
      if (sectionIndex === -1 || sectionIndex >= newSections.length - 1) {
        console.log('Already at bottom, cannot move down');
        return prevSections; // Can't move down if it's the last section
      }
      
      const section = newSections[sectionIndex];
      if (!canMoveSection(section)) {
        console.log('Section cannot be moved (fixed section)');
        return prevSections; // Can't move fixed sections
      }
      
      // Get the section below
      const nextSection = newSections[sectionIndex + 1];
      
      console.log('Moving section down:', section.title);
      console.log('Before:', newSections.map(s => s.title));
      
      // Swap the two sections
      newSections.splice(sectionIndex, 2, nextSection, section);
      
      console.log('After:', newSections.map(s => s.title));
      return newSections;
    });
  }, [canMoveSection]);
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
      
      // Function to show success message safely
      const showSuccess = () => {
        if (setSaveSuccess) {
          setSaveSuccess(true);
          setTimeout(() => {
            if (setSaveSuccess) setSaveSuccess(false);
          }, 3000);
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
  
  /**
   * Move a child section up within its parent's children
   * Updated to also modify the main resumeSections array
   */
  const handleMoveChildUp = useCallback((sectionId: string) => {
    setResumeSections(prevSections => {
      // Find the section
      const section = prevSections.find(s => s.id === sectionId);
      if (!section || !section.parentId) return prevSections;
      
      // Find all sections with the same parent
      const siblingIds = sectionHierarchy[section.parentId] || [];
      const currentIndex = siblingIds.indexOf(sectionId);
      
      if (currentIndex <= 0) return prevSections;
      
      // Get the sibling above
      const prevSiblingId = siblingIds[currentIndex - 1];
      
      // Create a new array of sibling IDs with the order changed
      const newSiblingIds = [...siblingIds];
      newSiblingIds[currentIndex] = prevSiblingId;
      newSiblingIds[currentIndex - 1] = sectionId;
      
      // Update the hierarchy with type assertion to fix TypeScript error
      setSectionHierarchy(prev => ({
        ...prev,
        [section.parentId as string]: newSiblingIds
      }));
      
      // NEW: Also update the main resumeSections array to match the hierarchy
      const newSections = [...prevSections];
      const childSection = newSections.find(s => s.id === sectionId);
      const aboveChildSection = newSections.find(s => s.id === prevSiblingId);
      
      if (childSection && aboveChildSection) {
        // Get the indexes in the main array
        const childSectionIndex = newSections.indexOf(childSection);
        const aboveChildSectionIndex = newSections.indexOf(aboveChildSection);
        
        console.log(`Moving section ${childSection.title} above ${aboveChildSection.title}`);
        console.log('Before move in main array:', newSections.map(s => s.title));
        
        // Swap positions in the main resumeSections array
        const temp = newSections[childSectionIndex];
        newSections[childSectionIndex] = newSections[aboveChildSectionIndex];
        newSections[aboveChildSectionIndex] = temp;
        
        console.log('After move in main array:', newSections.map(s => s.title));
        
        // Return the updated sections
        return newSections;
      }
      
      // If we couldn't update the main array, return the original sections
      return prevSections;
    });
    
    // Mark as needing to save
    if (setSaveSuccess) setSaveSuccess(false);
  }, [sectionHierarchy, setSectionHierarchy, setSaveSuccess]);
  
  /**
   * Move a child section down within its parent's children
   * Updated to also modify the main resumeSections array
   */
  const handleMoveChildDown = useCallback((sectionId: string) => {
    setResumeSections(prevSections => {
      // Find the section
      const section = prevSections.find(s => s.id === sectionId);
      if (!section || !section.parentId) return prevSections;
      
      // Find all sections with the same parent
      const siblingIds = sectionHierarchy[section.parentId] || [];
      const currentIndex = siblingIds.indexOf(sectionId);
      
      if (currentIndex === -1 || currentIndex >= siblingIds.length - 1) return prevSections;
      
      // Get the sibling below
      const nextSiblingId = siblingIds[currentIndex + 1];
      
      // Create a new array of sibling IDs with the order changed
      const newSiblingIds = [...siblingIds];
      newSiblingIds[currentIndex] = nextSiblingId;
      newSiblingIds[currentIndex + 1] = sectionId;
      
      // Update the hierarchy with type assertion to fix TypeScript error
      setSectionHierarchy(prev => ({
        ...prev,
        [section.parentId as string]: newSiblingIds
      }));
      
      // NEW: Also update the main resumeSections array to match the hierarchy
      const newSections = [...prevSections];
      const childSection = newSections.find(s => s.id === sectionId);
      const belowChildSection = newSections.find(s => s.id === nextSiblingId);
      
      if (childSection && belowChildSection) {
        // Get the indexes in the main array
        const childSectionIndex = newSections.indexOf(childSection);
        const belowChildSectionIndex = newSections.indexOf(belowChildSection);
        
        console.log(`Moving section ${childSection.title} below ${belowChildSection.title}`);
        console.log('Before move in main array:', newSections.map(s => s.title));
        
        // Swap positions in the main resumeSections array
        const temp = newSections[childSectionIndex];
        newSections[childSectionIndex] = newSections[belowChildSectionIndex];
        newSections[belowChildSectionIndex] = temp;
        
        console.log('After move in main array:', newSections.map(s => s.title));
        
        // Return the updated sections
        return newSections;
      }
      
      // If we couldn't update the main array, return the original sections
      return prevSections;
    });
    
    // Mark as needing to save
    if (setSaveSuccess) setSaveSuccess(false);
  }, [sectionHierarchy, setSectionHierarchy, setSaveSuccess]);

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
    getSectionTypeOrder,
    canMoveSection,
    handleMoveUp,
    handleMoveDown,
    handleMoveChildUp,
    handleMoveChildDown
  };
}
export default useSectionManagement;
