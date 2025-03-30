// app/components/resume/SuggestionApplier.tsx
import React from 'react';
import { ResumeSection, ResumeSectionType } from '@/app/lib/types';

interface SuggestionApplierProps {
  resumeSections: ResumeSection[];
  onContentEdit: (sectionId: string, newContent: string) => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

/**
 * Utility component for applying suggestions to the correct resume sections
 */
const SuggestionApplier: React.FC<SuggestionApplierProps> = ({
  resumeSections,
  onContentEdit,
  onSuccess,
  onError
}) => {
  // This component doesn't render anything, it's just for encapsulating the logic
  
  /**
   * Apply a suggestion to the appropriate section
   */
  const applySuggestion = (
    sectionType: string, 
    content: string, 
    position?: string, 
    company?: string,
    targetIdentifier?: string
  ) => {
    try {
      if (sectionType === 'summary') {
        // Handle summary section
        const summarySection = resumeSections.find(s => s.type === ResumeSectionType.SUMMARY);
        if (summarySection) {
          console.log('Applying to summary section:', summarySection.id);
          onContentEdit(summarySection.id, content);
          onSuccess();
          return true;
        } else {
          onError('No summary section found');
          return false;
        }
      } else if (sectionType === 'experience') {
        // Handle job role section
        if (!position || !company) {
          onError('Position and company information is required to apply job suggestions');
          return false;
        }
        
        console.log(`Looking for job role: "${position}" at "${company}"`);
        
        // Get all job roles
        const jobRoles = resumeSections.filter(s => s.type === ResumeSectionType.JOB_ROLE);
        console.log(`Found ${jobRoles.length} job roles to search through`);
        
        // Search through job roles to find a matching one
        let matchFound = false;
        
        for (const role of jobRoles) {
          // Search for position and company in the role's content
          const roleContent = role.content.toLowerCase();
          const simplePosition = position.toLowerCase().replace(/\s+manager/g, '');
          const simpleCompany = company.toLowerCase();
          
          const hasPosition = roleContent.includes(simplePosition);
          const hasCompany = roleContent.includes(simpleCompany);
          
          // Debug logging for each role
          console.log(`Checking role: ${role.title}`);
          console.log(`- Content includes position "${simplePosition}": ${hasPosition}`);
          console.log(`- Content includes company "${simpleCompany}": ${hasCompany}`);
          
          if (hasPosition && hasCompany) {
            console.log('MATCH FOUND! Applying suggestion to role:', role.id);
            onContentEdit(role.id, content);
            onSuccess();
            matchFound = true;
            break;
          }
        }
        
        // If we still haven't found a match, try a title-based match
        if (!matchFound) {
          for (const role of jobRoles) {
            if (role.title.toLowerCase().includes(position.toLowerCase())) {
              console.log('Match found by title! Applying to:', role.id);
              onContentEdit(role.id, content);
              onSuccess();
              matchFound = true;
              break;
            }
          }
        }
        
        // Last resort - just pick the first job role
        if (!matchFound && jobRoles.length > 0) {
          console.log('No match found, using first job role as fallback');
          onContentEdit(jobRoles[0].id, content);
          onSuccess();
          return true;
        }
        
        if (!matchFound) {
          onError('Could not find a matching job role section');
          return false;
        }
        
        return true;
      }
      
      onError(`Unknown section type: ${sectionType}`);
      return false;
    } catch (error) {
      console.error('Error applying suggestion:', error);
      onError(`Failed to apply suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  };
  
  // This component doesn't render anything
  return null;
};

// Export an implementation of the applySuggestion function
export function applySuggestion(
  resumeSections: ResumeSection[],
  sectionType: string,
  content: string,
  position?: string,
  company?: string,
  onContentEdit?: (sectionId: string, newContent: string) => void,
  onSuccess?: () => void,
  onError?: (message: string) => void
) {
  // Create mock functions if not provided
  const mockOnContentEdit = onContentEdit || ((id, content) => {
    console.log(`Would edit section ${id} with new content`);
  });
  
  const mockOnSuccess = onSuccess || (() => {
    console.log('Suggestion applied successfully');
  });
  
  const mockOnError = onError || ((message) => {
    console.error('Error applying suggestion:', message);
  });
  
  // Instead of trying to instantiate the component, we'll implement the logic directly here
  try {
    if (sectionType === 'summary') {
      // Handle summary section
      const summarySection = resumeSections.find(s => s.type === ResumeSectionType.SUMMARY);
      if (summarySection) {
        console.log('Applying to summary section:', summarySection.id);
        mockOnContentEdit(summarySection.id, content);
        mockOnSuccess();
        return true;
      } else {
        mockOnError('No summary section found');
        return false;
      }
    } else if (sectionType === 'experience') {
      // Handle job role section
      if (!position || !company) {
        mockOnError('Position and company information is required to apply job suggestions');
        return false;
      }
      
      console.log(`Looking for job role: "${position}" at "${company}"`);
      
      // Get all job roles
      const jobRoles = resumeSections.filter(s => s.type === ResumeSectionType.JOB_ROLE);
      console.log(`Found ${jobRoles.length} job roles to search through`);
      
      // Search through job roles to find a matching one
      let matchFound = false;
      
      for (const role of jobRoles) {
        // Search for position and company in the role's content
        const roleContent = role.content.toLowerCase();
        const simplePosition = position.toLowerCase().replace(/\s+manager/g, '');
        const simpleCompany = company.toLowerCase();
        
        const hasPosition = roleContent.includes(simplePosition);
        const hasCompany = roleContent.includes(simpleCompany);
        
        // Debug logging for each role
        console.log(`Checking role: ${role.title}`);
        console.log(`- Content includes position "${simplePosition}": ${hasPosition}`);
        console.log(`- Content includes company "${simpleCompany}": ${hasCompany}`);
        
        if (hasPosition && hasCompany) {
          console.log('MATCH FOUND! Applying suggestion to role:', role.id);
          mockOnContentEdit(role.id, content);
          mockOnSuccess();
          matchFound = true;
          break;
        }
      }
      
      // If we still haven't found a match, try a title-based match
      if (!matchFound) {
        for (const role of jobRoles) {
          if (role.title.toLowerCase().includes(position.toLowerCase())) {
            console.log('Match found by title! Applying to:', role.id);
            mockOnContentEdit(role.id, content);
            mockOnSuccess();
            matchFound = true;
            break;
          }
        }
      }
      
      // Last resort - just pick the first job role
      if (!matchFound && jobRoles.length > 0) {
        console.log('No match found, using first job role as fallback');
        mockOnContentEdit(jobRoles[0].id, content);
        mockOnSuccess();
        return true;
      }
      
      if (!matchFound) {
        mockOnError('Could not find a matching job role section');
        return false;
      }
      
      return true;
    }
    
    mockOnError(`Unknown section type: ${sectionType}`);
    return false;
  } catch (error) {
    console.error('Error applying suggestion:', error);
    mockOnError(`Failed to apply suggestion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

export default SuggestionApplier;
