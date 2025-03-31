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
  canDelete: boolean;
}

const SectionItem: React.FC<SectionItemProps> = ({ 
  section, 
  isActive, 
  onSectionClick, 
  onDeleteSection,
  canDelete
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
  onAddJobRole: () => void;
  shouldShowAddJobRoleButton: (section: ResumeSection) => boolean;
}

export const SectionList: React.FC<SectionListProps> = ({
  sections,
  topLevelSections,
  sectionHierarchy,
  activeSection,
  onSectionClick,
  onDeleteSection,
  onAddJobRole,
  shouldShowAddJobRoleButton
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
      {topLevelSections.map((section) => (
        <div key={section.id} className="relative">
          {/* Render top-level section */}
          <SectionItem 
            section={section}
            isActive={activeSection === section.id}
            onSectionClick={onSectionClick}
            onDeleteSection={onDeleteSection}
            canDelete={canDeleteSection(section)}
          />
          
          {/* Render child sections (e.g., job roles under experience) */}
          {sectionHierarchy[section.id] && sectionHierarchy[section.id].length > 0 && (
            <div className="ml-6 mt-2 space-y-4">
              {sectionHierarchy[section.id].map(childId => {
                const childSection = sections.find(s => s.id === childId);
                if (!childSection) return null;
                
                return (
                  <SectionItem
                    key={childSection.id}
                    section={childSection}
                    isActive={activeSection === childSection.id}
                    onSectionClick={onSectionClick}
                    onDeleteSection={onDeleteSection}
                    canDelete={canDeleteSection(childSection)}
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
