import React, { useState, useEffect } from "react";
import Link from "next/link";
import ResumeEditModal from "./ResumeEditModal";
import { GeneratedResume, SavedResumesTabProps } from "../types";

// Updated WYSIWYGEditorButton component with correct parameter names
const WYSIWYGEditorButton = ({ jobId, resumes }: { jobId: string, resumes: GeneratedResume[] }) => {
  // Find the primary resume
  const primaryResume = resumes.find(resume => resume.isPrimary);
  
  // If no primary resume is found, we can't navigate to the editor
  if (!primaryResume) {
    return (
      <button 
        disabled
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-400 cursor-not-allowed"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 mr-2" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
          />
        </svg>
        No Primary Resume
      </button>
    );
  }
  
  // Use jobApplicationId instead of jobId for consistency with the database schema
  const editorUrl = `/api/resume/resume-editor/${primaryResume.id}?jobApplicationId=${jobId}`;
  
  // Add console log to debug URL generation
  console.log(`Editor URL generated: ${editorUrl}, jobApplicationId: ${jobId}, resumeId: ${primaryResume.id}`);
  
  return (
    <Link
      href={editorUrl}
      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-5 w-5 mr-2" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
        />
      </svg>
      Advanced WYSIWYG Resume Editor
    </Link>
  );
};

const SavedResumesTab: React.FC<SavedResumesTabProps> = ({ 
  jobId, 
  onSelectResume, 
  onViewInEditor, 
  currentResumeId 
}) => {
  const [resumes, setResumes] = useState<GeneratedResume[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [resumeToEdit, setResumeToEdit] = useState<GeneratedResume | null>(null);

  // Function to fetch resumes
  const fetchResumes = async () => {
    if (!jobId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Debug log to verify jobId is available when fetching
      console.log(`Fetching resumes for jobApplicationId: ${jobId}`);
      
      // Use jobApplicationId in query parameter for consistency
      const response = await fetch(`/api/resume/get-for-job?jobId=${jobId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch resumes: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Fetched ${data.length} resumes for job ${jobId}`);
      setResumes(data);
    } catch (error) {
      console.error("Error fetching resumes:", error);
      setError(`Failed to fetch resumes: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch resumes when component mounts or jobId changes
  useEffect(() => {
    if (jobId) {
      fetchResumes();
    }
  }, [jobId]);

  // Clear success message after a delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle selecting a resume
  const handleSelectResume = (resume: GeneratedResume) => {
    if (onSelectResume) {
      onSelectResume(resume);
    }
    
    // Show success message
    setSuccessMessage(`Resume "${resume.fileName || `Version ${resume.version}`}" selected`);
  };

  // Handle viewing a resume in the editor
  const handleViewInEditor = (resume: GeneratedResume) => {
    if (onViewInEditor) {
      onViewInEditor(resume);
      setSuccessMessage(`Resume opened in editor`);
    }
  };
  
  // Open edit modal for a resume
  const handleOpenEditModal = (resume: GeneratedResume, event: React.MouseEvent) => {
    // Prevent default behavior and stop propagation
    event.preventDefault();
    event.stopPropagation();
    
    setResumeToEdit(resume);
    setIsEditModalOpen(true);
  };
  
  // Close edit modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setResumeToEdit(null);
  };
  
  // Save edited resume
  const handleSaveEditedResume = async (updatedContent: string) => {
    if (!resumeToEdit) return;
    
    try {
      const response = await fetch(`/api/resume/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: resumeToEdit.id,
          markdownContent: updatedContent
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update resume: ${errorText}`);
      }
      
      // Refresh resumes after update
      fetchResumes();
      setSuccessMessage("Resume updated successfully");
    } catch (error) {
      console.error("Error updating resume:", error);
      throw error; // Rethrow to be caught by the modal
    }
  };

  // Handle setting a resume as primary
  const handleSetAsPrimary = async (resumeId: string, event: React.MouseEvent) => {
    // Prevent default behavior and stop propagation
    event.preventDefault();
    event.stopPropagation();

    if (!jobId) return;
    
    try {
      const response = await fetch("/api/resume/set-primary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId,
          jobId
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to set primary resume: ${response.status}`);
      }
      
      // Refresh resumes after setting primary
      fetchResumes();
      setSuccessMessage("Primary resume updated successfully");
    } catch (error) {
      console.error("Error setting primary resume:", error);
      setError(`Failed to set primary resume: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Handle deleting a resume
  const handleDeleteResume = async (resumeId: string, event: React.MouseEvent) => {
    // Prevent default behavior and stop propagation
    event.preventDefault();
    event.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this resume? This action cannot be undone.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/resume/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resumeId }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete resume: ${response.status}`);
      }
      
      // Refresh resumes after deletion
      fetchResumes();
      setSuccessMessage("Resume deleted successfully");
    } catch (error) {
      console.error("Error deleting resume:", error);
      setError(`Failed to delete resume: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Saved Resumes
        </h3>
        
        {/* Only display button if we have both jobId and at least one resume */}
        {jobId && resumes.length > 0 && (
          <WYSIWYGEditorButton jobId={jobId} resumes={resumes} />
        )}
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-md mb-4">
          {successMessage}
        </div>
      )}
      
      {jobId ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200">
              Resume Versions
            </h4>
            <button 
              onClick={fetchResumes}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Refresh
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="spinner mr-3"></div>
              <span className="text-gray-600 dark:text-gray-300">Loading resumes...</span>
            </div>
          ) : resumes.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium mb-1">No resumes found</p>
              <p>Generate a resume in the Resume Generator tab to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Version
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {resumes.map((resume) => (
                    <tr key={resume.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${resume.id === currentResumeId ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {resume.fileName || `Resume ${resume.version}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Version {resume.version}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(resume.createdAt).toLocaleDateString()} {new Date(resume.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {resume.isPrimary ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Primary
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            Regular
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleSelectResume(resume)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Select Resume"
                            type="button"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          
                          <button
                            onClick={(e) => handleOpenEditModal(resume, e)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Edit Resume"
                            type="button"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          
                          {!resume.isPrimary && (
                            <button
                              onClick={(e) => handleSetAsPrimary(resume.id, e)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              title="Set as Primary"
                              type="button"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                          
                          <button
                            onClick={(e) => handleDeleteResume(resume.id, e)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete Resume"
                            type="button"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
            No Job Selected
          </h4>
          <p className="text-gray-600 dark:text-gray-400">
            Please select a job to view associated resumes
          </p>
        </div>
      )}
      
      {/* Edit Modal */}
      <ResumeEditModal
        resume={resumeToEdit}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveEditedResume}
      />
    </div>
  );
};

export default SavedResumesTab;
