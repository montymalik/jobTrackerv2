// app/components/resume/resume-editor/SectionEditor.tsx
import React from 'react';
import { ResumeSection } from '@/app/lib/types';
import ResumeTemplatesPicker from '../ResumeHTMLTemplates';
import BulletPointFormatter from '../BulletPointFormatter';
import RichTextEditor from '../tiptap/RichTextEditor';

interface SectionEditorProps {
  activeSection: string | null;
  resumeSections: ResumeSection[];
  setResumeSections: React.Dispatch<React.SetStateAction<ResumeSection[]>>;
  handleContentEdit: (sectionId: string, newContent: string) => void;
  showTemplatePicker: boolean;
  setShowTemplatePicker: React.Dispatch<React.SetStateAction<boolean>>;
}

export const SectionEditor: React.FC<SectionEditorProps> = ({
  activeSection,
  resumeSections,
  setResumeSections,
  handleContentEdit,
  showTemplatePicker,
  setShowTemplatePicker
}) => {
  // Find the currently active section
  const activeResumeSection = activeSection 
    ? resumeSections.find(s => s.id === activeSection) 
    : null;

  // Handle template selection
  const handleTemplateSelect = (templateContent: string) => {
    if (activeSection) {
      handleContentEdit(activeSection, templateContent);
      setShowTemplatePicker(false);
    }
  };

  // Handle title change
  const handleTitleChange = (newTitle: string) => {
    if (activeSection) {
      setResumeSections(prevSections => 
        prevSections.map(section => 
          section.id === activeSection 
            ? { ...section, title: newTitle }
            : section
        )
      );
    }
  };

  // If no section is active, display a message
  if (!activeSection || !activeResumeSection) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-gray-400">
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"></path>
        </svg>
        <p className="text-lg">Select a section to edit</p>
        <p className="text-sm mt-2">Click on any section in your resume to edit it</p>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-lg font-bold mb-4">Section Editor</h2>
      <div className="mb-4">
        <label className="block text-sm mb-1">Section Title</label>
        <input
          type="text"
          value={activeResumeSection.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white"
        />
      </div>
      
      {/* Rich Text Editor */}
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
            content={activeResumeSection.content}
            onUpdate={(html) => handleContentEdit(activeSection, html)}
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
  );
};

export default SectionEditor;
