// app/components/resume/resume-editor/SectionList.tsx
import React from 'react';
import { ResumeSection, ResumeSectionType } from '@/app/lib/types';
import ReadOnlyEditor from '../tiptap/ReadOnlyEditor';

// Component for an individual section item
interface SectionItemProps {
  section: ResumeSection;
  isActive: boolean;
  onSectionClick: (sectionId: string) => void;
  onDeleteSection: (sectionId: string, e: React.MouseEvent) => void;
  onMoveUp: (sectionId: string, e: React.MouseEvent) => void;
  onMoveDown: (sectionId: string, e: React.MouseEvent) => void;
  canDelete: boolean;
  canMove: boolean;
  isFirstSection: boolean;
  isLastSection: boolean;
}

const SectionItem: React.FC<SectionItemProps> = ({ 
  section, 
  isActive, 
  onSectionClick, 
  onDeleteSection,
  onMoveUp,
  onMoveDown,
  canDelete,
  canMove,
  isFirstSection,
  isLastSection
}) => {
  return (
    <div 
      className={`border rounded-md p-4 ${
        isActive 
          ? 'border-blue-500 bg-blue-900/20' 
          : 'border-gray-700 hover:border-gray-500'
      } cursor-pointer transition duration-200`}
      onClick={() => onSectionClick(section.id)}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-lg text-white">
          {section.type === ResumeSectionType.JOB_ROLE 
            ? `${section.title} (Role)` 
            : section.title}
        </h3>
        <div className="flex space-x-2">
          {/* Position control buttons */}
          {canMove && (
            <div className="flex mr-2">
              <button 
                className={`text-xs px-2 py-1 rounded ${
                  isFirstSection 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent parent div's onClick from firing
                  if (!isFirstSection) onMoveUp(section.id, e);
                }}
                disabled={isFirstSection}
                aria-label="Move section up"
                title="Move section up"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                </svg>
              </button>
              <button 
                className={`text-xs px-2 py-1 rounded ml-1 ${
                  isLastSection 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent parent div's onClick from firing
                  if (!isLastSection) onMoveDown(section.id, e);
                }}
                disabled={isLastSection}
                aria-label="Move section down"
                title="Move section down"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
            </div>
          )}
          
          <button 
            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
            onClick={(e) => {
              e.stopPropagation();
              onSectionClick(section.id);
            }}
          >
            Edit
          </button>
          {canDelete && (
            <button 
              className="text-xs bg-red-900 hover:bg-red-800 px-2 py-1 rounded"
              onClick={(e) => onDeleteSection(section.id, e)}
              aria-label={`Delete ${section.title}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="prose prose-invert max-w-none">
        <ReadOnlyEditor content={section.content} />
      </div>
    </div>
  );
};

// Main SectionList component
interface SectionListProps {
  sections: ResumeSection[];
  topLevelSections: ResumeSection[];
  sectionHierarchy: Record<string, string[]>;
  activeSection: string | null;
  onSectionClick: (sectionId: string) => void;
  onDeleteSection: (sectionId: string, e: React.MouseEvent) => void;
  onMoveUp: (sectionId: string, e: React.MouseEvent) => void;
  onMoveDown: (sectionId: string, e: React.MouseEvent) => void;
  handleMoveChildUp?: (sectionId: string) => void;
  handleMoveChildDown?: (sectionId: string) => void;
  onAddJobRole: () => void;
  shouldShowAddJobRoleButton: (section: ResumeSection) => boolean;
  canMoveSection: (section: ResumeSection) => boolean;
}

export const SectionList: React.FC<SectionListProps> = ({
  sections,
  topLevelSections,
  sectionHierarchy,
  activeSection,
  onSectionClick,
  onDeleteSection,
  onMoveUp,
  onMoveDown,
  handleMoveChildUp,
  handleMoveChildDown,
  onAddJobRole,
  shouldShowAddJobRoleButton,
  canMoveSection
}) => {
  // Check if a section can be deleted
  const canDeleteSection = (section: ResumeSection): boolean => {
    // Core resume sections cannot be deleted
    if (section.type === ResumeSectionType.HEADER || 
        (section.type === ResumeSectionType.SUMMARY && section.id === 'summary') || 
        (section.type === ResumeSectionType.EXPERIENCE && section.id === 'experience') || 
        (section.type === ResumeSectionType.EDUCATION && section.id === 'education') || 
        (section.type === ResumeSectionType.SKILLS && section.id === 'skills')) {
      return false;
    }
    
    // For job roles, check if it's the only job role
    if (section.type === ResumeSectionType.JOB_ROLE) {
      const jobRoles = sections.filter(s => s.type === ResumeSectionType.JOB_ROLE);
      if (jobRoles.length <= 1) {
        return false;
      }
    }
    
    return true;
  };

  // Check if a section is a child section (has a parent)
  const isChildSection = (section: ResumeSection): boolean => {
    return Boolean(section.parentId);
  };

  // Handler for moving sections up with logic to handle both parent and child sections
  const handleMoveUpWithHierarchy = (sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // First, try to find the section in our list
    const section = sections.find(s => s.id === sectionId);
    if (!section) {
      console.error(`Section with ID ${sectionId} not found`);
      return;
    }
    
    // Debug what we know about this section
    console.log(`Handling move UP for section:`, {
      id: section.id,
      title: section.title,
      type: section.type,
      hasParent: Boolean(section.parentId),
      parentId: section.parentId,
      canMove: canMoveSection(section)
    });
    
    // For child sections with a parent, use handleMoveChildUp
    if (section.parentId && handleMoveChildUp) {
      console.log(`Using handleMoveChildUp for ${section.id}`);
      handleMoveChildUp(sectionId);
    } 
    // For top-level sections, use the regular onMoveUp
    else if (canMoveSection(section)) {
      console.log(`Using regular onMoveUp for ${section.id}`);
      onMoveUp(sectionId, e);
    }
    else {
      console.log(`Section ${section.id} cannot be moved`);
    }
  };

  // Handler for moving sections down with logic to handle both parent and child sections
  const handleMoveDownWithHierarchy = (sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // First, try to find the section in our list
    const section = sections.find(s => s.id === sectionId);
    if (!section) {
      console.error(`Section with ID ${sectionId} not found`);
      return;
    }
    
    // Debug what we know about this section
    console.log(`Handling move DOWN for section:`, {
      id: section.id,
      title: section.title,
      type: section.type,
      hasParent: Boolean(section.parentId),
      parentId: section.parentId,
      canMove: canMoveSection(section)
    });
    
    // For child sections with a parent, use handleMoveChildDown
    if (section.parentId && handleMoveChildDown) {
      console.log(`Using handleMoveChildDown for ${section.id}`);
      handleMoveChildDown(sectionId);
    } 
    // For top-level sections, use the regular onMoveDown
    else if (canMoveSection(section)) {
      console.log(`Using regular onMoveDown for ${section.id}`);
      onMoveDown(sectionId, e);
    }
    else {
      console.log(`Section ${section.id} cannot be moved`);
    }
  };

  // Display message if no sections exist
  if (topLevelSections.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No resume sections found. Click "Add Section" to create your resume.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {topLevelSections.map((section, index) => (
        <div key={section.id} className="relative">
          {/* Render top-level section */}
          <SectionItem 
            section={section}
            isActive={activeSection === section.id}
            onSectionClick={onSectionClick}
            onDeleteSection={onDeleteSection}
            onMoveUp={handleMoveUpWithHierarchy}
            onMoveDown={handleMoveDownWithHierarchy}
            canDelete={canDeleteSection(section)}
            canMove={canMoveSection(section)}
            isFirstSection={index === 0 || !canMoveSection(topLevelSections[index - 1])}
            isLastSection={index === topLevelSections.length - 1}
          />
          
          {/* Render child sections (e.g., job roles under experience) */}
          {sectionHierarchy[section.id] && sectionHierarchy[section.id].length > 0 && (
            <div className="ml-6 mt-2 space-y-4">
              {sectionHierarchy[section.id].map((childId, childIndex) => {
                const childSection = sections.find(s => s.id === childId);
                if (!childSection) return null;
                
                const childSections = sectionHierarchy[section.id]
                  .map(id => sections.find(s => s.id === id))
                  .filter(Boolean) as ResumeSection[];
                
                return (
                  <SectionItem
                    key={childSection.id}
                    section={childSection}
                    isActive={activeSection === childSection.id}
                    onSectionClick={onSectionClick}
                    onDeleteSection={onDeleteSection}
                    onMoveUp={handleMoveUpWithHierarchy}
                    onMoveDown={handleMoveDownWithHierarchy}
                    canDelete={canDeleteSection(childSection)}
                    canMove={canMoveSection(childSection)}
                    isFirstSection={childIndex === 0}
                    isLastSection={childIndex === childSections.length - 1}
                  />
                );
              })}
            </div>
          )}
          
          {/* Add Job Role button after Experience section */}
          {shouldShowAddJobRoleButton(section) && (
            <div className="mt-2 mb-4 ml-6">
              <button
                onClick={onAddJobRole}
                className="text-xs bg-indigo-800 hover:bg-indigo-700 text-gray-200 px-2 py-1 rounded flex items-center"
                aria-label="Add job role"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
                Add Job Role
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SectionList;
