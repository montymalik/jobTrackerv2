'use client';

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

function HomePage() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobApplication | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/jobs");
      if (!response.ok) throw new Error("Failed to fetch jobs");
      let data = await response.json();

      // Convert date strings to Date objects
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

  const handleSubmit = async (formData: FormData) => {
    try {
      setError(null);
      console.log("Submitting Form Data:", Object.fromEntries(formData.entries()));

      // When editing a job, preserve its current status.
      if (selectedJob) {
        formData.set("status", selectedJob.status);
      }

      const response = await fetch(
        selectedJob ? `/api/jobs/${selectedJob.id}` : "/api/jobs",
        {
          method: selectedJob ? "PUT" : "POST",
          body: formData,
        }
      );

      const responseText = await response.text();
      console.log("Response Text:", responseText);

      const data = JSON.parse(responseText);
      if (!response.ok) {
        throw new Error(data.error || "Failed to save job");
      }

      console.log("Job Saved Successfully:", data);

      // Convert any date strings to Date objects before updating local state.
      const updatedJob: JobApplication = {
        ...data,
        dateSubmitted: data.dateSubmitted ? new Date(data.dateSubmitted) : null,
        dateOfInterview: data.dateOfInterview ? new Date(data.dateOfInterview) : null,
      };

      if (selectedJob) {
        // If editing an existing job, update that job in the state.
        setJobs((prevJobs) =>
          prevJobs.map((job) => (job.id === updatedJob.id ? updatedJob : job))
        );
      } else {
        // If creating a new job, add it to the beginning of the job list.
        setJobs((prevJobs) => [updatedJob, ...prevJobs]);
      }

      setIsModalOpen(false);
      setSelectedJob(undefined);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save job");
      console.error("Error saving job:", error);
    }
  };

  const handleDropJob = async (job: JobApplication, newStatus: ApplicationStatus) => {
    try {
      setError(null);

      // Fetch the latest job data using GET
      const existingJobResponse = await fetch(`/api/jobs/${job.id}`, { method: "GET" });
      const existingJobData = await existingJobResponse.json();

      // Build formData preserving existing date and confirmation values
      const formData = new FormData();
      formData.append("status", newStatus);
      if (existingJobData.dateSubmitted) {
        formData.append("dateSubmitted", existingJobData.dateSubmitted);
      }
      if (existingJobData.dateOfInterview) {
        formData.append("dateOfInterview", existingJobData.dateOfInterview);
      }
      formData.append("confirmationReceived", String(existingJobData.confirmationReceived));

      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "PUT",
        body: formData,
      });

      const responseText = await response.text();
      console.log("Response Text:", responseText);

      if (!response.ok) {
        if (!responseText.trim()) {
          throw new Error(`Server responded with status ${response.status} but no error message.`);
        }
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.error || "Failed to update status");
        } catch (jsonError) {
          console.error("JSON Parse Error:", jsonError);
          console.error("Raw Response Text:", responseText);
          throw new Error(`Unexpected response: ${responseText}`);
        }
      }

      if (responseText.trim()) {
        const data = JSON.parse(responseText);
        console.log("Updated Job Data:", data);
      } else {
        console.warn("Empty response from server; assuming success.");
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

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8 transition-colors">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Job Application Tracker
          </h1>
          <div className="flex items-center gap-4">
            <DarkModeToggle />
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedJob(undefined);
          }}
          title={selectedJob ? "Edit Job" : "Add New Job"}
        >
          <JobForm
            job={selectedJob}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsModalOpen(false);
              setSelectedJob(undefined);
            }}
          />
        </Modal>
      </div>
    </DndProvider>
  );
}

export default HomePage;

