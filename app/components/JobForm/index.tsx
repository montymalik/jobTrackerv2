import { useState, useEffect } from "react";
import { JobFormProps } from "./types";
import { spinnerStyles } from "./styles";
import useJobForm from "./hooks/useJobForm";
import useFileManagement from "./hooks/useFileManagement";
// Tab components
import DetailsTab from "./tabs/DetailsTab";
import JobDescriptionTab from "./tabs/JobDescriptionTab";
import NotesTab from "./tabs/NotesTab";
import FilesTab from "./tabs/FilesTab";
import CoverLetterTab from "./tabs/CoverLetterTab";
import ResumeGeneratorTab from "./tabs/ResumeGeneratorTab";

export function JobForm({ job, onSubmit, onCancel }: JobFormProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { formState, skills, handleChange, setSkills, isAnalyzing, analyzeSkills } = useJobForm(job);
  const { files, existingFiles, handleFileUpload, handleFileChange, fileInputRef, setFiles } = useFileManagement(job);

  useEffect(() => {
    // Add the spinner styles to the document head
    const styleElement = document.createElement('style');
    styleElement.innerHTML = spinnerStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      // Clean up when component unmounts
      if (styleElement.parentNode) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      // Append all fields including notes.
      Object.entries(formState).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
      files.forEach((file) => {
        formData.append("files", file);
      });
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigation items - Now includes the Resume Generator tab
  const navItems = [
    { id: "details", label: "Details", icon: "📋" },
    { id: "jobDescription", label: "Job Description", icon: "📝"},
    { id: "notes", label: "Notes", icon: "📓" },
    { id: "files", label: "Files", icon: "📎" },
    { id: "coverLetter", label: "AI Cover Letter", icon: "✉️" },
    { id: "resumeGenerator", label: "AI Resume", icon: "📄" },
  ];
  
  return (
    <form
      onSubmit={handleSubmit}
      className="flex rounded-md bg-white dark:bg-gray-800 dark:text-gray-100 overflow-hidden h-full"
    >
      {/* Full-height sidebar with icons only - matching main form background with active indicator */}
      <div className="w-14 bg-white dark:bg-gray-800 h-full flex flex-col justify-between relative border-r border-gray-200 dark:border-gray-700">
        <div>
          <div className="flex justify-center items-center h-14 border-b border-gray-200 dark:border-gray-700">
            <span className="text-base font-bold text-gray-800 dark:text-gray-200">
              {job ? "✏️" : "➕"}
            </span>
          </div>
          <ul className="py-2">
            {navItems.map((item) => (
              <li key={item.id} className="mb-5 relative">
                {/* Active indicator - left highlight bar */}
                {activeTab === item.id && (
                  <div className="absolute left-0 top-0 w-1 h-full bg-blue-500 rounded-r"></div>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`w-full flex justify-center items-center p-1 relative ${
                    activeTab === item.id
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {/* Subtle background for active item */}
                  {activeTab === item.id && (
                    <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900 dark:bg-opacity-20 opacity-30 rounded-md"></div>
                  )}
                  <span className="text-sm relative z-10">{item.icon}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Action Buttons positioned at bottom of sidebar - icons only */}
        <div className="pb-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            title="Cancel"
            className="w-full flex justify-center text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-1"
          >
            <span className="text-sm">❌</span>
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            title={isSubmitting ? "Saving..." : job ? "Update" : "Create"}
            className="w-full flex justify-center text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 p-1"
          >
            <span className="text-sm">{isSubmitting ? "⏳" : job ? "💾" : "✅"}</span>
          </button>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 p-4 overflow-y-auto h-full">
        {activeTab === "details" && (
          <DetailsTab 
            formState={formState} 
            handleChange={handleChange} 
          />
        )}
        
        {activeTab === "jobDescription" && (
          <JobDescriptionTab 
            formState={formState}
            handleChange={handleChange}
            skills={skills}
            isAnalyzing={isAnalyzing}
            analyzeSkills={analyzeSkills}
          />
        )}
        
        {activeTab === "notes" && (
          <NotesTab 
            formState={formState} 
            handleChange={handleChange} 
          />
        )}
        
        {activeTab === "files" && (
          <FilesTab 
            files={files}
            existingFiles={existingFiles}
            fileInputRef={fileInputRef}
            handleFileUpload={handleFileUpload}
            handleFileChange={handleFileChange}
            setFiles={setFiles}
          />
        )}
        
        {activeTab === "coverLetter" && (
          <CoverLetterTab 
            formState={formState}
            jobId={job?.id}
          />
        )}
        
        {activeTab === "resumeGenerator" && (
          <ResumeGeneratorTab 
            formState={formState}
            jobId={job?.id}
          />
        )}
      </div>
    </form>
  );
}

export default JobForm;
