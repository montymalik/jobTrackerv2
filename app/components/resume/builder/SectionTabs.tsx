// app/components/resume/builder/SectionTabs.tsx
import React from 'react';
import { ResumeSection } from '@/app/lib/types';

interface SectionTabsProps {
  sections: ResumeSection[];
  activeSectionId: string | null;
  onSectionSelect: (sectionId: string) => void;
}

const SectionTabs: React.FC<SectionTabsProps> = ({
  sections,
  activeSectionId,
  onSectionSelect
}) => {
  // Sort sections in a logical order
  const sectionOrder: Record<string, number> = {
    'HEADER': 0,
    'SUMMARY': 1,
    'EXPERIENCE': 2,
    'JOB_ROLE': 3,
    'EDUCATION': 4,
    'SKILLS': 5,
    'CERTIFICATIONS': 6,
    'PROJECTS': 7,
    'OTHER': 8
  };
  
  // Get top-level sections (no parentId)
  const topLevelSections = sections
    .filter(section => !section.parentId)
    .sort((a, b) => (sectionOrder[a.type] || 999) - (sectionOrder[b.type] || 999));
  
  // Get child sections (job roles) for a given parent ID
  const getChildSections = (parentId: string) => {
    return sections
      .filter(section => section.parentId === parentId)
      .sort((a, b) => a.title.localeCompare(b.title));
  };
  
  return (
    <div className="mb-4 overflow-x-auto">
      <div className="flex flex-nowrap space-x-1 pb-2">
        {topLevelSections.map(section => (
          <React.Fragment key={section.id}>
            <button
              className={`px-3 py-2 whitespace-nowrap rounded-t-md text-sm ${
                activeSectionId === section.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              onClick={() => onSectionSelect(section.id)}
            >
              {section.title}
            </button>
            
            {/* Show child sections (job roles) for experience section */}
            {section.type === 'EXPERIENCE' && getChildSections(section.id).map(jobRole => (
              <button
                key={jobRole.id}
                className={`px-3 py-2 whitespace-nowrap rounded-t-md text-sm border-l-2 border-gray-300 dark:border-gray-600 ${
                  activeSectionId === jobRole.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                onClick={() => onSectionSelect(jobRole.id)}
              >
                <span className="opacity-70">→</span> {jobRole.title}
              </button>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default SectionTabs;
