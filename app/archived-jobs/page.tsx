"use client";

import { useEffect, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { JobApplication } from "@/app/lib/types";
import { Modal } from "@/app/components/ui/Modal";
import { JobForm } from "@/app/components/JobForm";

// Create a simplified job card component without DnD functionality
const ArchivedJobCard = ({ job, onClick }: { job: JobApplication; onClick: (job: JobApplication) => void }) => {
  // Format date function
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    const adjusted = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
    const year = adjusted.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(adjusted.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <div
      onClick={() => onClick(job)}
      className="cursor-pointer rounded-lg bg-white dark:bg-gray-800 p-4 shadow-md transition-colors duration-300 hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300">
          {job.companyName}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
          {job.jobTitle}
        </p>

        {job.dateSubmitted && (
          <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
            Submitted: {formatDate(job.dateSubmitted)}
          </p>
        )}

        {job.dateOfInterview && (
          <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors duration-300">
            Interview: {formatDate(job.dateOfInterview)}
          </p>
        )}

        {job.jobUrl && (
          <a
            href={job.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-500 no-underline transition-colors duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            View Job Posting
          </a>
        )}
      </div>

      {/* Indicators */}
      <div className="mt-2 flex gap-2">
        {job.files.length > 0 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 transition-colors duration-300">
            Files: {job.files.length}
          </span>
        )}
        {job.confirmationReceived && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 transition-colors duration-300">
            Confirmed
          </span>
        )}
        {job.rejectionReceived && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 transition-colors duration-300">
            Rejected
          </span>
        )}
      </div>
    </div>
  );
};

export default function ArchivedJobsPage() {
  const [archivedJobs, setArchivedJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize dark mode from localStorage
  useEffect(() => {
    // Check for dark mode preference in localStorage
    const isDarkMode = localStorage.getItem('theme') === 'dark';
    
    // Apply dark mode class to html element if needed
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // For debugging
    console.log("ArchivedJobsPage: Dark mode initialized from localStorage:", isDarkMode);
  }, []);

  useEffect(() => {
    async function fetchArchivedJobs() {
      try {
        setLoading(true);
        const response = await fetch("/api/jobs?archived=true");
        if (!response.ok) throw new Error("Failed to fetch archived jobs");
        const jobs: JobApplication[] = await response.json();
        
        // Ensure dates are properly converted to Date objects
        const processedJobs = jobs.map(job => ({
          ...job,
          dateSubmitted: job.dateSubmitted ? new Date(job.dateSubmitted) : null,
          dateOfInterview: job.dateOfInterview ? new Date(job.dateOfInterview) : null,
          createdAt: new Date(job.createdAt),
          updatedAt: new Date(job.updatedAt)
        }));
        
        console.log("Archived jobs fetched:", processedJobs);
        setArchivedJobs(processedJobs);
      } catch (error) {
        console.error("Error fetching archived jobs:", error);
        setError("Failed to load archived jobs. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchArchivedJobs();
  }, []);

  const handleJobClick = (job: JobApplication) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleJobUpdate = async (formData: FormData) => {
    try {
      if (!selectedJob) return;
      
      const response = await fetch(`/api/jobs/${selectedJob.id}`, {
        method: "PUT",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to update job");
      }
      
      // Refresh jobs after update
      const updatedResponse = await fetch("/api/jobs?archived=true");
      if (!updatedResponse.ok) throw new Error("Failed to refresh jobs");
      
      const updatedJobs: JobApplication[] = await updatedResponse.json();
      
      // Process dates
      const processedJobs = updatedJobs.map(job => ({
        ...job,
        dateSubmitted: job.dateSubmitted ? new Date(job.dateSubmitted) : null,
        dateOfInterview: job.dateOfInterview ? new Date(job.dateOfInterview) : null,
        createdAt: new Date(job.createdAt),
        updatedAt: new Date(job.updatedAt)
      }));
      
      setArchivedJobs(processedJobs);
      
      // Close modal
      setIsModalOpen(false);
      setSelectedJob(null);
    } catch (error) {
      console.error("Error updating job:", error);
      setError("Failed to update job");
    }
  };

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100 transition-colors duration-300">Archived Jobs</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400"></div>
        </div>
      ) : archivedJobs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center shadow transition-colors duration-300">
          <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">No archived jobs found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {archivedJobs.map((job) => (
            <ArchivedJobCard
              key={job.id}
              job={job}
              onClick={handleJobClick}
            />
          ))}
        </div>
      )}
      
      {/* Wrap only the modal content in DndProvider, as JobForm uses DnD */}
      {selectedJob && isModalOpen && (
        <DndProvider backend={HTML5Backend}>
          <Modal
            show={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedJob(null);
            }}
            title={`Job Details - ${selectedJob.jobTitle}`}
          >
            <JobForm
              job={selectedJob}
              onSubmit={handleJobUpdate}
              onCancel={() => {
                setIsModalOpen(false);
                setSelectedJob(null);
              }}
            />
          </Modal>
        </DndProvider>
      )}
    </div>
  );
}
