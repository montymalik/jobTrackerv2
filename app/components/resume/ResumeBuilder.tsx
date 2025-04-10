// app/components/resume/ResumeBuilder.tsx
"use client";
import { ResumeSection, ResumeSectionType } from '@/app/lib/types';
import React, { useState } from 'react';
import ResumeForm from './builder/ResumeForm';
import ResumePreview from './builder/ResumePreview';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';
import { useResumeData } from './builder/hooks/useResumeData';
import { parseJsonContent } from './resume-editor/utils/resume-parsing-utils';
import { jsonResumeToSections } from '@/app/lib/json-resume-processor';

interface ResumeBuilderProps {
  jobApplicationId?: string;
  resumeId?: string;
}

const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ 
  jobApplicationId,
  resumeId 
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Use the custom hook to handle resume data loading and management
  const {
    sections,
    setSections,
    isLoading,
    error,
    setError,
    isSaving,
    saveSuccess,
    setSaveSuccess,
    currentResumeId,
    jobDescription,
    handleSave
  } = useResumeData(resumeId, jobApplicationId);

  // Set the first section as active when sections change
  React.useEffect(() => {
    if (sections.length > 0 && !activeSectionId) {
      setActiveSectionId(sections[0].id);
    }
  }, [sections, activeSectionId]);

  // Handle section update
  const handleSectionUpdate = (updatedSection: any) => {
    setSections(prevSections => 
      prevSections.map(section => 
        section.id === updatedSection.id ? updatedSection : section
      )
    );
  };
  
  // Handle adding a new section
  const handleAddSection = (sectionType: string) => {
    const newId = `section-${Date.now()}`;
    let newTitle = 'New Section';
    let content = '<p>Add content here...</p>';
    
    switch (sectionType) {
      case 'SUMMARY':
        newTitle = 'Professional Summary';
        content = '<p class="text-gray-200">Add your professional summary here...</p>';
        break;
      case 'EXPERIENCE':
        newTitle = 'Professional Experience';
        content = '<h2>Professional Experience</h2>';
        break;
      case 'EDUCATION':
        newTitle = 'Education';
        content = '<p class="text-gray-200">Add your education details here...</p>';
        break;
      case 'SKILLS':
        newTitle = 'Skills';
        content = '<p class="text-gray-200">Add your skills here, separated by commas...</p>';
        break;
      case 'CERTIFICATIONS':
        newTitle = 'Certifications';
        content = '<ul class="list-disc pl-5"><li>Add your certifications here...</li></ul>';
        break;
    }
    
    const newSection: any = {
      id: newId,
      title: newTitle,
      type: sectionType,
      content
    };
    
    setSections(prevSections => [...prevSections, newSection]);
    setActiveSectionId(newId);
  };
  
  // Handle adding a new job role
  const handleAddJobRole = () => {
    // First, ensure we have an experience section
    let experienceSection = sections.find(s => s.type === 'EXPERIENCE');
    
    if (!experienceSection) {
      // Create experience section if it doesn't exist
      experienceSection = {
        id: 'experience',
        title: 'Professional Experience',
        type: ResumeSectionType.EXPERIENCE,
        content: '<h2>Professional Experience</h2>'
      };
      
      setSections(prevSections => [...prevSections, experienceSection!]);
    }
    
    const newJobId = `job-role-${Date.now()}`;
    const newJobRole = {
      id: newJobId,
      title: 'New Position',
      type: ResumeSectionType.JOB_ROLE,
      parentId: experienceSection.id,
      content: `<h3>New Position</h3>
                <p>Company Name | Start Date - End Date</p>
                <ul class="list-disc pl-5">
                  <li>Add job responsibilities here...</li>
                </ul>`
    };
    
    setSections(prevSections => [...prevSections, newJobRole]);
    setActiveSectionId(newJobId);
  };

  // Handle reordering sections
  const handleReorderSections = (reorderedSections: any[]) => {
    setSections(reorderedSections);
    
    // Optionally set the active section to the first reordered section
    if (reorderedSections.length > 0) {
      setActiveSectionId(reorderedSections[0].id);
    }
    
    // Show success message
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Show loading state
  if (isLoading) {
    return <LoadingSpinner message="Loading resume data..." />;
  }

  // Show no data state
  if (!isLoading && sections.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Resume Builder - No Data Found</h2>
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md">
          <p className="text-yellow-800 dark:text-yellow-200 mb-2">
            ⚠️ No resume sections were loaded. This might be due to:
          </p>
          <ul className="list-disc pl-5 text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>API endpoint not returning data correctly</li>
            <li>No primary resume found for this job</li>
            <li>Error in data processing</li>
          </ul>
          <div className="mt-4">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Resume Builder</h1>
        <div className="space-x-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Resume"}
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
          >
            Back
          </button>
        </div>
      </div>
      
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
      
      {saveSuccess && (
        <div className="mb-4 p-2 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded">
          Resume saved successfully!
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ResumeForm
          sections={sections}
          activeSectionId={activeSectionId}
          onSectionSelect={setActiveSectionId}
          onSectionUpdate={handleSectionUpdate}
          onAddSection={handleAddSection}
          onAddJobRole={handleAddJobRole}
          onReorderSections={handleReorderSections}
          jobDescription={jobDescription || ''}
        />
        
        <ResumePreview sections={sections} />
      </div>
    </div>
  );
};

export default ResumeBuilder;
