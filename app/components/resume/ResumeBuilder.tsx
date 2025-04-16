// app/components/resume/ResumeBuilder.tsx
import React, { useState, useEffect } from 'react';
import ResumeForm from './builder/ResumeForm';
import IFrameResumePreview from './builder/IFrameResumePreview';
import { useResumeData } from './builder/hooks/useResumeData';
import { ResumeSection, ResumeSectionType } from '@/app/lib/types';

interface ResumeBuilderProps {
  jobApplicationId?: string;
  resumeId?: string;
}

const ResumeBuilder: React.FC<ResumeBuilderProps> = ({ 
  jobApplicationId, 
  resumeId 
}) => {
  const {
    sections,
    setSections,
    isLoading,
    error,
    isSaving,
    saveSuccess,
    handleSave,
    jobDescription
  } = useResumeData(resumeId, jobApplicationId);
  
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  
  // Set the first section as active when sections load
  useEffect(() => {
    if (sections.length > 0 && !activeSectionId) {
      setActiveSectionId(sections[0].id);
    }
  }, [sections, activeSectionId]);
  
  // Update a specific section
  const handleSectionUpdate = (updatedSection: any) => {
    setSections(prev => 
      prev.map(section => 
        section.id === updatedSection.id ? updatedSection : section
      )
    );
  };
  
  // Add a new section
  const handleAddSection = (sectionType: ResumeSectionType) => {
    const newSection : ResumeSection = {
      id: `section-${Date.now()}`,
      title: getSectionTitle(sectionType),
      type: sectionType,
      content: getDefaultContent(sectionType)
    };
    
    setSections(prev => [...prev, newSection]);
    setActiveSectionId(newSection.id);
  };
  
  // Add a new job role
  const handleAddJobRole = () => {
    // Find the experience section to attach this job role to
    const experienceSection = sections.find(section => 
      section.type === 'EXPERIENCE' || 
      section.title.toLowerCase().includes('experience')
    );
    
    // If no experience section exists, create one first
    if (!experienceSection) {
      const newExpSection = {
        id: `experience-${Date.now()}`,
        title: 'Professional Experience',
        type: ResumeSectionType.EXPERIENCE,
        content: '<h2>Professional Experience</h2>'
      };
      
      const newJobRole = {
        id: `job-role-${Date.now()}`,
        title: 'Job Title',
        type: ResumeSectionType.JOB_ROLE,
        parentId: newExpSection.id,
        content: `<h3>Job Title</h3>
                  <p>Company Name | Date Range</p>
                  <ul class="list-disc pl-5">
                    <li>Add your responsibilities and achievements here...</li>
                  </ul>`
      };
      
      setSections(prev => [...prev, newExpSection, newJobRole]);
      setActiveSectionId(newJobRole.id);
    } else {
      // If experience section exists, just add a new job role
      const newJobRole = {
        id: `job-role-${Date.now()}`,
        title: 'Job Title',
        type: ResumeSectionType.JOB_ROLE,
        parentId: experienceSection.id,
        content: `<h3>Job Title</h3>
                  <p>Company Name | Date Range</p>
                  <ul class="list-disc pl-5">
                    <li>Add your responsibilities and achievements here...</li>
                  </ul>`
      };
      
      setSections(prev => [...prev, newJobRole]);
      setActiveSectionId(newJobRole.id);
    }
  };
  
  // Handle section reordering
  const handleReorderSections = (reorderedSections: any[]) => {
    setSections(reorderedSections);
  };
  
  // Helper to get default section title
  const getSectionTitle = (sectionType: string): string => {
    switch (sectionType) {
      case 'HEADER': return 'Header';
      case 'SUMMARY': return 'Professional Summary';
      case 'EXPERIENCE': return 'Professional Experience';
      case 'EDUCATION': return 'Education';
      case 'SKILLS': return 'Skills';
      case 'CERTIFICATIONS': return 'Certifications';
      case 'PROJECTS': return 'Projects';
      default: return 'New Section';
    }
  };
  
  // Helper to get default content for new sections
  const getDefaultContent = (sectionType: string): string => {
    switch (sectionType) {
      case 'HEADER':
        return `<h1 class="text-2xl font-bold">Your Name</h1>
                <p class="text-gray-300">email@example.com | (555) 123-4567 | City, State</p>`;
      case 'SUMMARY':
        return `<p class="text-gray-200">Experienced professional with a track record of success in...</p>`;
      case 'SKILLS':
        return `<p class="text-gray-200">Skill 1, Skill 2, Skill 3, Skill 4, Skill 5</p>`;
      case 'EDUCATION':
        return `<h3>Degree Name</h3>
                <p>University Name | Graduation Year</p>`;
      case 'CERTIFICATIONS':
        return `<ul class="list-disc pl-5">
                  <li>Certification 1</li>
                  <li>Certification 2</li>
                </ul>`;
      case 'PROJECTS':
        return `<h3>Project Name</h3>
                <p>Brief description of the project and your role.</p>`;
      default:
        return `<p>Add your content here...</p>`;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error: {error}
      </div>
    );
  }
  
  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold dark:text-white">Resume Builder</h1>
          <div className="flex space-x-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-4 py-2 rounded ${
                isSaving 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : saveSuccess 
                    ? 'bg-green-500 hover:bg-green-600' 
                    : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Resume'}
            </button>
          </div>
        </div>
        
        <div className="lg:flex lg:space-x-6 space-y-6 lg:space-y-0">
          <div className="lg:w-1/2">
            <ResumeForm
              sections={sections}
              activeSectionId={activeSectionId}
              onSectionSelect={setActiveSectionId}
              onSectionUpdate={handleSectionUpdate}
              onAddSection={handleAddSection}
              onAddJobRole={handleAddJobRole}
              onReorderSections={handleReorderSections}
              jobDescription={jobDescription}
            />
          </div>
          <div className="lg:w-1/2">
            {/* Use the custom preview component instead of the standard one */}
            <IFrameResumePreview sections={sections} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
