import React, { useState, useEffect, useRef } from "react";
import { GeneratedResume } from "../types";
import { markdownToHtml } from "@/app/lib/markdown-utils";

interface ResumeEditModalProps {
  resume: GeneratedResume | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedContent: string) => Promise<void>;
}

const ResumeEditModal: React.FC<ResumeEditModalProps> = ({
  resume,
  isOpen,
  onClose,
  onSave
}) => {
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Set content when resume changes
  useEffect(() => {
     if (resume) {
    // Use jsonContent, fall back to markdownContent only for legacy data
    const contentToUse = resume.jsonContent || resume.markdownContent || "";
    console.log('ResumeEditModal loading content:', {
      source: resume.jsonContent ? 'jsonContent' : 'markdownContent',
      contentLength: contentToUse.length
    });
    setContent(contentToUse);
  }
  }, [resume]);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle clicking outside modal to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    } else {
      document.removeEventListener("keydown", handleEscKey);
    }
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  const handleSave = async () => {
    if (!resume) return;
    
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      await onSave(content);
      setSuccess("Resume updated successfully!");
      
      // Close the modal after a delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error saving resume:", err);
      setError("Failed to save resume. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Customize the HTML styling for this specific component
  const markdownHtmlOptions = {
    headingClass: {
      h1: "text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mt-4 mb-2",
      h2: "text-xl font-semibold text-gray-800 dark:text-gray-200 mt-5 mb-2 pb-1 border-b dark:border-gray-700",
      h3: "text-lg font-medium text-gray-800 dark:text-gray-200 mt-4 mb-1"
    },
    paragraphClass: "mb-3 text-gray-700 dark:text-gray-300",
    listClass: "list-disc pl-5 my-2",
    listItemClass: "mb-1 text-gray-700 dark:text-gray-300"
  };

  if (!isOpen || !resume) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div 
        ref={modalRef} 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-11/12 max-w-7xl flex flex-col my-4"
        style={{ height: "auto", maxHeight: "90vh" }}
      >
        {/* Modal Header */}
        <div className="px-6 py-3 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Edit Resume: {resume.fileName || `Version ${resume.version}`}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Error/Success messages */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mx-6 mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
            {success}
          </div>
        )}
        
        {/* Modal Body */}
        <div className="flex flex-col md:flex-row p-3 gap-4">
          {/* Editor Section */}
          <div className="w-full md:w-1/2 flex flex-col">
            <h4 className="text-md font-medium mb-1 text-gray-700 dark:text-gray-300">
              Edit Resume
            </h4>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-md font-mono"
              style={{ 
                height: "500px",
                fontSize: "16px",
                lineHeight: "1.6",
                resize: "vertical" 
              }}
              placeholder="Edit your resume here..."
            />
          </div>
          
          {/* Preview Section */}
          <div className="w-full md:w-1/2 flex flex-col">
            <h4 className="text-md font-medium mb-1 text-gray-700 dark:text-gray-300">
              Preview
            </h4>
            <div 
              className="w-full overflow-y-auto bg-white dark:bg-gray-800 p-6 rounded-md border dark:border-gray-700" 
              style={{ 
                height: "500px"
              }}
            >
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <div 
                  dangerouslySetInnerHTML={{ 
                    __html: markdownToHtml(content, markdownHtmlOptions) 
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="px-6 py-3 border-t dark:border-gray-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-70 flex items-center"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              "Update Resume"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeEditModal;
