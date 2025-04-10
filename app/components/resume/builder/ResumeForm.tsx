// app/components/resume/builder/ResumeForm.tsx
import React, { useState } from 'react';
import { ResumeSection } from '@/app/lib/types';
import SectionTabs from './SectionTabs';
import SectionEditor from './SectionEditor';

interface ResumeFormProps {
  sections: ResumeSection[];
  activeSectionId: string | null;
  onSectionSelect: (sectionId: string) => void;
  onSectionUpdate: (section: ResumeSection) => void;
  onAddSection: (sectionType: string) => void;
  onAddJobRole: () => void;
  onReorderSections?: (reorderedSections: ResumeSection[]) => void;
  jobDescription?: string | null;
}

const ResumeForm: React.FC<ResumeFormProps> = ({
  sections,
  activeSectionId,
  onSectionSelect,
  onSectionUpdate,
  onAddSection,
  onAddJobRole,
  onReorderSections,
  jobDescription = null
}) => {
  const [showSectionTypeMenu, setShowSectionTypeMenu] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  
  // Available section types for adding
  const sectionTypes = [
    { type: 'SUMMARY', label: 'Summary' },
    { type: 'EXPERIENCE', label: 'Experience' },
    { type: 'EDUCATION', label: 'Education' },
    { type: 'SKILLS', label: 'Skills' },
    { type: 'CERTIFICATIONS', label: 'Certifications' },
    { type: 'PROJECTS', label: 'Projects' },
    { type: 'OTHER', label: 'Custom Section' }
  ];
  
  // Get currently active section
  const activeSection = sections.find(section => section.id === activeSectionId) || null;
  
  // Handle section content change
  const handleContentChange = (content: string) => {
    if (!activeSection) return;
    
    const updatedSection = {
      ...activeSection,
      content
    };
    
    onSectionUpdate(updatedSection);
  };
  
  // Handle section title change
  const handleTitleChange = (title: string) => {
    if (!activeSection) return;
    
    const updatedSection = {
      ...activeSection,
      title
    };
    
    onSectionUpdate(updatedSection);
  };

  // Function to handle opening the reorder modal
  const handleOpenReorderModal = () => {
    setShowReorderModal(true);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="mb-6">
        <SectionTabs 
          sections={sections}
          activeSectionId={activeSectionId}
          onSectionSelect={onSectionSelect}
        />
        
        <div className="flex mt-2">
          <div className="relative">
            <button
              onClick={() => setShowSectionTypeMenu(!showSectionTypeMenu)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Section
            </button>
            
            {showSectionTypeMenu && (
              <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-gray-700 shadow-lg rounded-md z-10">
                {sectionTypes.map(section => (
                  <button
                    key={section.type}
                    onClick={() => {
                      onAddSection(section.type);
                      setShowSectionTypeMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            onClick={onAddJobRole}
            className="ml-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Job Role
          </button>

          <button
            onClick={handleOpenReorderModal}
            className="ml-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            Reorder Sections
          </button>
        </div>
      </div>
      
      {activeSection ? (
        <SectionEditor
          section={activeSection}
          onContentChange={handleContentChange}
          onTitleChange={handleTitleChange}
          jobDescription={jobDescription}
        />
      ) : (
        <div className="text-center p-6 text-gray-500 dark:text-gray-400">
          Select a section to edit or add a new section to get started
        </div>
      )}

      {/* Reorder Modal */}
      {showReorderModal && (
        <ReorderModal 
          sections={sections} 
          onClose={() => setShowReorderModal(false)} 
          onSave={onReorderSections}
        />
      )}
    </div>
  );
};

// Reorder Modal Component
// Fixed ReorderModal component for ResumeForm.tsx

// Reorder Modal Component
interface ReorderModalProps {
  sections: ResumeSection[];
  onClose: () => void;
  onSave?: (reorderedSections: ResumeSection[]) => void;
}

const ReorderModal: React.FC<ReorderModalProps> = ({ sections, onClose, onSave }) => {
  // Create a deep copy of all sections to avoid mutation issues
  const allSections = [...sections];
  
  // Get the header section
  const headerSection = allSections.find(section => section.type === 'HEADER');
  
  // Get the summary section
  const summarySection = allSections.find(section => section.type === 'SUMMARY');
  
  // Get all main sections (not header, summary, or job roles)
  const initialMainSections = allSections.filter(
    section => section.type !== 'HEADER' && 
              section.type !== 'SUMMARY' && 
              section.type !== 'JOB_ROLE'
  );
  
  // Get all job roles by experience section
  const initialJobRoles = allSections.filter(section => section.type === 'JOB_ROLE');
  
  // Group job roles by their parent experience section
  const groupJobRolesByParent = () => {
    const grouped: Record<string, ResumeSection[]> = {};
    
    initialJobRoles.forEach(jobRole => {
      if (jobRole.parentId) {
        if (!grouped[jobRole.parentId]) {
          grouped[jobRole.parentId] = [];
        }
        grouped[jobRole.parentId].push({...jobRole});
      }
    });
    
    return grouped;
  };
  
  // State for reorderable sections
  const [mainSections, setMainSections] = useState<ResumeSection[]>(initialMainSections);
  const [jobRolesByParent, setJobRolesByParent] = useState<Record<string, ResumeSection[]>>(
    groupJobRolesByParent()
  );
  
  // Helper function to move a section up in the order
  const moveSectionUp = (index: number) => {
    if (index <= 0) return;
    
    setMainSections(prev => {
      const newOrder = [...prev];
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      return newOrder;
    });
  };

  // Helper function to move a section down in the order
  const moveSectionDown = (index: number) => {
    if (index >= mainSections.length - 1) return;
    
    setMainSections(prev => {
      const newOrder = [...prev];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      return newOrder;
    });
  };

  // Helper function to move a job role up within its experience section
  const moveJobRoleUp = (parentId: string, index: number) => {
    if (index <= 0) return;
    
    setJobRolesByParent(prev => {
      const newOrder = { ...prev };
      if (!newOrder[parentId]) return prev;
      
      const jobs = [...newOrder[parentId]];
      [jobs[index], jobs[index - 1]] = [jobs[index - 1], jobs[index]];
      newOrder[parentId] = jobs;
      return newOrder;
    });
  };

  // Helper function to move a job role down within its experience section
  const moveJobRoleDown = (parentId: string, index: number) => {
    if (!jobRolesByParent[parentId] || index >= jobRolesByParent[parentId].length - 1) return;
    
    setJobRolesByParent(prev => {
      const newOrder = { ...prev };
      const jobs = [...newOrder[parentId]];
      [jobs[index], jobs[index + 1]] = [jobs[index + 1], jobs[index]];
      newOrder[parentId] = jobs;
      return newOrder;
    });
  };

  // Handle saving the new order
  const handleSave = () => {
    if (!onSave) {
      onClose();
      return;
    }

    // Create the final ordered array of sections
    const finalOrder: ResumeSection[] = [];
    
    // Start with header and summary
    if (headerSection) finalOrder.push(headerSection);
    if (summarySection) finalOrder.push(summarySection);
    
    // Add all main sections in their new order
    mainSections.forEach(section => {
      finalOrder.push(section);
    });
    
    // Add all job roles in their new order
    mainSections.forEach(section => {
      // For each experience section, add its reordered job roles
      if (section.type === 'EXPERIENCE' && jobRolesByParent[section.id]) {
        jobRolesByParent[section.id].forEach(jobRole => {
          finalOrder.push(jobRole);
        });
      }
    });
    
    // Add any orphaned job roles that might not have been handled
    const handledJobRoleIds = finalOrder
      .filter(section => section.type === 'JOB_ROLE')
      .map(section => section.id);
    
    const orphanedJobRoles = initialJobRoles.filter(
      jobRole => !handledJobRoleIds.includes(jobRole.id)
    );
    
    // Add these to the end
    orphanedJobRoles.forEach(jobRole => finalOrder.push(jobRole));
    
    // Save the final order
    onSave(finalOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Reorder Resume Sections</h2>
        
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Drag or use the arrows to reorder sections. The Header and Professional Summary will always appear at the top.
          </p>
          
          {/* Main sections reordering */}
          <div className="border rounded-lg overflow-hidden">
            <h3 className="bg-gray-100 dark:bg-gray-700 p-3 font-medium">Main Sections</h3>
            <ul className="divide-y">
              {mainSections.map((section, index) => (
                <li 
                  key={section.id} 
                  className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <span className="font-medium">{section.title}</span>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => moveSectionUp(index)}
                      disabled={index === 0}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => moveSectionDown(index)}
                      disabled={index === mainSections.length - 1}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Job roles reordering */}
          <div className="mt-6 border rounded-lg overflow-hidden">
            <h3 className="bg-gray-100 dark:bg-gray-700 p-3 font-medium">
              Job Roles in Professional Experience
            </h3>
            {mainSections
              .filter(section => section.type === 'EXPERIENCE')
              .map(expSection => (
                <div key={expSection.id} className="divide-y border-t">
                  <div className="p-2 bg-gray-50 dark:bg-gray-750 font-medium pl-4">
                    {expSection.title}
                  </div>
                  {jobRolesByParent[expSection.id]?.length > 0 ? (
                    <ul className="divide-y">
                      {jobRolesByParent[expSection.id].map((jobRole, index) => (
                        <li 
                          key={jobRole.id} 
                          className="p-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 pl-8"
                        >
                          <span className="font-medium">{jobRole.title}</span>
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => moveJobRoleUp(expSection.id, index)}
                              disabled={index === 0}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button 
                              onClick={() => moveJobRoleDown(expSection.id, index)}
                              disabled={index === jobRolesByParent[expSection.id].length - 1}
                              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-3 pl-8 text-gray-500 dark:text-gray-400 italic">
                      No job roles for this experience section
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Save Order
          </button>
        </div>
      </div>
    </div>
  );
};
export default ResumeForm;
