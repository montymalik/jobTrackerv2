"use client";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useState, useEffect } from "react";
import { Column } from "./components/jobs/Column";
import { Modal } from "./components/ui/Modal";
import { JobForm } from "./components/jobs/JobForm";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import { ErrorMessage } from "./components/ui/ErrorMessage";
import { JobApplication, ApplicationStatus } from "./lib/types";
import DarkModeToggle from "./components/ui/DarkModeToggle";
import Link from "next/link";
import { ResumeUploadForm } from "./components/resume/ResumeUploadForm";

function HomePage() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobApplication | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [hasBaseResume, setHasBaseResume] = useState(false);
  const [resumeUploadSuccess, setResumeUploadSuccess] = useState(false);

  useEffect(() => {
    fetchJobs();
    checkBaseResume();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/jobs");
      if (!response.ok) throw new Error("Failed to fetch jobs");
      let data = await response.json();
      data = data.map((job: any) => ({
        ...job,
        dateSubmitted: job.dateSubmitted ? new Date(job.dateSubmitted) : null,
        dateOfInterview: job.dateOfInterview ? new Date(job.dateOfInterview) : null,
      }));
      setJobs(data);
    } catch (error) {
      setError("Failed to load jobs. Please try again.");
      console.error("Error fetching jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkBaseResume = async () => {
    try {
      const response = await fetch("/api/resume");
      setHasBaseResume(response.ok);
    } catch (error) {
      console.error("Error checking base resume:", error);
      setHasBaseResume(false);
    }
  };

  const handleDropJob = async (job: JobApplication, newStatus: ApplicationStatus) => {
    try {
      setError(null);
      const response = await fetch(`/api/jobs/${job.id}`);
      if (!response.ok) throw new Error("Failed to fetch job details");
      const existingJobData = await response.json();
      const updateResponse = await fetch(`/api/jobs/${job.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          dateSubmitted: existingJobData.dateSubmitted,
          dateOfInterview: existingJobData.dateOfInterview,
          confirmationReceived: existingJobData.confirmationReceived,
        }),
      });
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(errorText || `Server responded with status ${updateResponse.status}`);
      }
      await fetchJobs();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update job status");
      console.error("Error updating status:", error);
    }
  };

  const handleJobClick = (job: JobApplication) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleJobSubmit = async (formData: FormData) => {
    try {
      setError(null);
      let response;
      if (selectedJob && selectedJob.id) {
        response = await fetch(`/api/jobs/${selectedJob.id}`, {
          method: "PUT",
          body: formData,
        });
      } else {
        response = await fetch(`/api/jobs`, {
          method: "POST",
          body: formData,
        });
      }
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server responded with status ${response.status}`);
      }
      await fetchJobs();
      setIsModalOpen(false);
      setSelectedJob(undefined);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error saving job");
      console.error("Error submitting job:", error);
    }
  };

  const handleResumeUpload = async (formData: FormData) => {
    try {
      setError(null);
      const response = await fetch("/api/resume", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server responded with status ${response.status}`);
      }
      setResumeUploadSuccess(true);
      setHasBaseResume(true);
      
      // Close the modal after a brief delay to show success state
      setTimeout(() => {
        setIsResumeModalOpen(false);
        setResumeUploadSuccess(false);
      }, 1500);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Error uploading resume");
      console.error("Error uploading resume:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-0 transition-colors">
        <div className="mb-6 flex items-center justify-between p-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Job Application Tracker
          </h1>
          <div className="flex items-center gap-4">
            <DarkModeToggle />
            <button
              onClick={() => setIsResumeModalOpen(true)}
              className={`rounded-md ${hasBaseResume ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'} px-4 py-2 text-white transition`}
            >
              {hasBaseResume ? "Update Base Resume" : "Upload Base Resume"}
            </button>
            <button
              onClick={() => {
                setSelectedJob(undefined);
                setIsModalOpen(true);
              }}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition"
            >
              Add New Job
            </button>
          </div>
        </div>
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onRetry={fetchJobs} />
          </div>
        )}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 p-4">
          <Column
            title="To Apply"
            status="TO_APPLY"
            jobs={jobs.filter((job) => job.status === "TO_APPLY")}
            onJobClick={handleJobClick}
            onDropJob={handleDropJob}
          />
          <Column
            title="Applied"
            status="APPLIED"
            jobs={jobs.filter((job) => job.status === "APPLIED")}
            onJobClick={handleJobClick}
            onDropJob={handleDropJob}
          />
          <Column
            title="Interview Scheduled"
            status="INTERVIEW_SCHEDULED"
            jobs={jobs.filter((job) => job.status === "INTERVIEW_SCHEDULED")}
            onJobClick={handleJobClick}
            onDropJob={handleDropJob}
          />
        </div>
        <Modal
          show={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={selectedJob ? `Edit Job - ${selectedJob.companyName}` : "Add New Job"}
        >
          <JobForm
            job={selectedJob}
            onSubmit={handleJobSubmit}
            onCancel={() => setIsModalOpen(false)}
          />
        </Modal>
        <Modal
          show={isResumeModalOpen}
          onClose={() => {
            setIsResumeModalOpen(false);
            setResumeUploadSuccess(false);
          }}
          title="Upload Base Resume"
        >
          {resumeUploadSuccess ? (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                <svg className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">Resume Uploaded Successfully!</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Your base resume has been uploaded and will be used for job applications.
              </p>
            </div>
          ) : (
            <ResumeUploadForm
              onSubmit={handleResumeUpload}
              onCancel={() => setIsResumeModalOpen(false)}
            />
          )}
        </Modal>
      </div>
    </DndProvider>
  );
}

export default HomePage;
