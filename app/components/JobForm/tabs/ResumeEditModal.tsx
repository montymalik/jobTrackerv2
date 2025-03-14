import React, { useState, useEffect, useRef } from "react";

interface GeneratedResume {
  id: string;
  markdownContent: string;
  version: number;
  jobApplicationId: string;
  isPrimary: boolean;
  fileName: string | null;
  filePath: string | null;
  createdAt: string;
  updatedAt: string;
}

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
      setContent(resume.markdownContent);
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

  // Format markdown for preview
  const formatMarkdown = (text: string) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const formattedContent: React.ReactNode[] = [];
    let listItems: React.ReactNode[] = [];
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        // Empty line - if we were building a list, close it
        if (listItems.length > 0) {
          formattedContent.push(
            <ul key={`list-${index}`} className="list-disc pl-5 my-2">
              {listItems}
            </ul>
          );
          listItems = [];
        }
        return;
      }
      
      // Process headings
      if (trimmedLine.startsWith('# ')) {
        formattedContent.push(
          <h1 key={index} className="text-2xl font-bold text-center text-gray-800 dark:text-gray-200 mt-4 mb-2">
            {trimmedLine.substring(2)}
          </h1>
        );
      }
      else if (trimmedLine.startsWith('## ')) {
        formattedContent.push(
          <h2 key={index} className="text-xl font-semibold text-gray-800 dark:text-gray-200 mt-5 mb-2 pb-1 border-b dark:border-gray-700">
            {trimmedLine.substring(3)}
          </h2>
        );
      }
      else if (trimmedLine.startsWith('### ')) {
        formattedContent.push(
          <h3 key={index} className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-4 mb-1">
            {trimmedLine.substring(4)}
          </h3>
        );
      }
      // Process bullet points
      else if (trimmedLine.startsWith('- ')) {
        const content = trimmedLine.substring(2);
        
        listItems.push(
          <li key={`item-${index}`} className="mb-1 text-gray-700 dark:text-gray-300">
            {formatInlineMarkdown(content)}
          </li>
        );
      }
      // Process normal paragraphs
      else {
        // If we were building a list, close it before adding a paragraph
        if (listItems.length > 0) {
          formattedContent.push(
            <ul key={`list-${index}`} className="list-disc pl-5 my-2">
              {listItems}
            </ul>
          );
          listItems = [];
        }
        
        formattedContent.push(
          <p key={index} className="mb-3 text-gray-700 dark:text-gray-300">
            {formatInlineMarkdown(trimmedLine)}
          </p>
        );
      }
    });
    
    // If we have any remaining list items, add them
    if (listItems.length > 0) {
      formattedContent.push(
        <ul className="list-disc pl-5 my-2">
          {listItems}
        </ul>
      );
    }
    
    return formattedContent;
  };
  
  // Helper function to format inline markdown (bold, italic, etc.)
  const formatInlineMarkdown = (text: string) => {
    if (!text) return null;
    
    // Split the text by bold markers (**text**)
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    
    return parts.map((part, index) => {
      // Check if this part is bold (surrounded by **)
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      // Regular text
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

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
                {formatMarkdown(content)}
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
                <span className="spinner mr-2"></span>
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
