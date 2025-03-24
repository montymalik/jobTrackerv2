// app/components/resume/AddSectionModal.tsx
import React, { useState } from 'react';
import { ResumeSectionType } from '@/app/lib/types';
import { getSectionTemplate } from '@/app/lib/resumeTemplates';

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSection: (type: ResumeSectionType, title: string) => void;
}

const AddSectionModal: React.FC<AddSectionModalProps> = ({
  isOpen,
  onClose,
  onAddSection
}) => {
  const [selectedType, setSelectedType] = useState<ResumeSectionType>('SUMMARY');
  const [customTitle, setCustomTitle] = useState('');

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedType('SUMMARY');
      setCustomTitle('');
    }
  }, [isOpen]);

  // Get title based on selected type
  const getDefaultTitle = (): string => {
    return getSectionTemplate(selectedType).title;
  };

  // Handle section selection
  const handleTypeSelection = (type: ResumeSectionType) => {
    setSelectedType(type);
    // Update title field with default for this type
    setCustomTitle(getSectionTemplate(type).title);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Use custom title if provided, otherwise use default
    const title = customTitle.trim() || getDefaultTitle();
    
    onAddSection(selectedType, title);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Add New Section
          </h3>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Section Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => handleTypeSelection(e.target.value as ResumeSectionType)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="SUMMARY">Summary</option>
                <option value="EXPERIENCE">Experience</option>
                <option value="EDUCATION">Education</option>
                <option value="SKILLS">Skills</option>
                <option value="CERTIFICATIONS">Certifications</option>
                <option value="PROJECTS">Projects</option>
                <option value="OTHER">Custom Section</option>
              </select>
              
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {getSectionTemplate(selectedType).description}
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Section Title
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder={getDefaultTitle()}
              />
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preview Template:
              </h4>
              <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap break-words bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-32">
                {getSectionTemplate(selectedType).content}
              </pre>
            </div>
          </div>
          
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 flex justify-end space-x-3 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-white hover:bg-blue-700"
            >
              Add Section
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSectionModal;
