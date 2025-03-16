import { useState, useEffect, RefObject } from "react";
import { JobFormProps, NavigationItem } from "./types";
import { spinnerStyles } from "./styles";
import useJobForm from "./hooks/useJobForm";
import useFileManagement from "./hooks/useFileManagement";
import useLeftSidebar from "./hooks/useLeftSidebar";
// Tab components
import DetailsTab from "./tabs/DetailsTab";
import JobDescriptionTab from "./tabs/JobDescriptionTab";
import NotesTab from "./tabs/NotesTab";
import FilesTab from "./tabs/FilesTab";
import CoverLetterTab from "./tabs/CoverLetterTab";
import ResumeGeneratorTab from "./tabs/ResumeGeneratorTab";
import SavedResumesTab from "./tabs/SavedResumesTab";
import AIToolsTab from "./tabs/AIToolsTab";
// Sidebar component
import LeftSidebar from "./LeftSidebar";
// Define resume interface from types
import { GeneratedResume } from "./types";

export function JobForm({ job, onSubmit, onCancel }: JobFormProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedResume, setSelectedResume] = useState<GeneratedResume | null>(null);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  
  const { 
    formState, 
    handleChange, 
    skills, 
    setSkills, 
    isAnalyzing, 
    analyzeSkills 
  } = useJobForm(job);
  
  const { 
    files, 
    existingFiles, 
    handleFileUpload, 
    handleFileChange, 
    fileInputRef, 
    setFiles 
  } = useFileManagement(job);
  
  // Left navigation sidebar state
  const {
    isOpen: isLeftSidebarOpen,
    toggleSidebar: toggleLeftSidebar
  } = useLeftSidebar();
  
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
  
  // Handle when a resume is selected from the saved resumes tab
  const handleResumeSelect = (resume: GeneratedResume) => {
    setSelectedResume(resume);
    
    // Switch to the resume generator tab to show the selected resume
    setActiveTab('resumeGenerator');
  };

  // Handle when a resume is generated or updated
  const handleResumeGenerated = (resumeId: string | null) => {
    setCurrentResumeId(resumeId);
  };
  
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      // Append all fields including notes
      Object.entries(formState).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          formData.append(key, value ? 'true' : 'false');
        } else if (value !== null) {
          formData.append(key, String(value));
        }
      });
      
      // Add skills as a comma-separated string
      if (skills.length > 0) {
        formData.append("keySkills", skills.join(", "));
      }
      
      // Add files
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
  
  // Navigation items with icons
  const navItems: NavigationItem[] = [
    { id: "details", label: "Details", icon: "📋" },
    { id: "jobDescription", label: "Job Description", icon: "📝"},
    { id: "notes", label: "Notes", icon: "📓" },
    { id: "files", label: "Files", icon: "📎" },
    { id: "coverLetter", label: "AI Cover Letter", icon: "✉️" },
    { id: "resumeGenerator", label: "AI Resume", icon: "📄" },
    { id: "savedResumes", label: "Saved Resumes", icon: "📚" },
    { id: "aiTools", label: "AI Tools", icon: "🧠" },
  ];
  
  return (
    <>
      {/* Main content */}
      <div className="relative min-h-screen bg-white dark:bg-gray-800 dark:text-gray-100 pl-16">
        <form onSubmit={handleSubmit} className="h-full w-full p-4">
          {/* Content Area - Title removed to avoid duplication */}
          <div className="w-full">
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
                fileInputRef={fileInputRef as RefObject<HTMLInputElement>}
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
                onResumeGenerated={handleResumeGenerated}
                selectedResume={selectedResume}
              />
            )}
            
            {activeTab === "savedResumes" && (
              <SavedResumesTab 
                jobId={job?.id}
                onSelectResume={handleResumeSelect}
                onViewInEditor={handleResumeSelect}
                currentResumeId={currentResumeId}
              />
            )}
            
            {activeTab === "aiTools" && (
              <AIToolsTab 
                formState={formState}
                jobId={job?.id}
              />
            )}
          </div>
          
          {/* Action buttons for mobile */}
          <div className="mt-6 flex justify-end space-x-3 md:hidden">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
            >
              {isSubmitting && <span className="spinner mr-2"></span>}
              {isSubmitting ? "Saving..." : job ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
      
      {/* Left Navigation Sidebar */}
      <LeftSidebar 
        isOpen={isLeftSidebarOpen} 
        toggleSidebar={toggleLeftSidebar}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navItems={navItems}
        onCancel={onCancel}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        job={job}
      />
    </>
  );
}
export default JobForm;
