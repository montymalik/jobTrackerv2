"use client";

import { useEffect, useState } from "react";
import { JobCard } from "@/app/components/jobs/JobCard";
import { JobApplication } from "@/app/lib/types";
import  { Modal } from "@/app/components/ui/Modal";

export default function ArchivedJobsPage() {
  const [archivedJobs, setArchivedJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null);

  useEffect(() => {
    async function fetchArchivedJobs() {
      try {
        const response = await fetch("/api/jobs?archived=true");
        if (!response.ok) throw new Error("Failed to fetch archived jobs");
        const jobs: JobApplication[] = await response.json();
        console.log("Archived jobs fetched:", jobs);
        setArchivedJobs(jobs);
      } catch (error) {
        console.error("Error fetching archived jobs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchArchivedJobs();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Archived Jobs</h1>
      {loading ? (
        <p>Loading...</p>
      ) : archivedJobs.length === 0 ? (
        <p>No archived jobs found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {archivedJobs.map((job) => (
            <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} disableDrag={true} />
          ))}
        </div>
      )}
      {selectedJob && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedJob(null)}
          title={`Job Details - ${selectedJob.jobTitle}`}
        >
          <div className="space-y-2">
            <p>
              <strong>Company:</strong> {selectedJob.companyName}
            </p>
            <p>
              <strong>Job Title:</strong> {selectedJob.jobTitle}
            </p>
            <p>
              <strong>Description:</strong> {selectedJob.jobDescription || "N/A"}
            </p>
            <p>
              <strong>Date Submitted:</strong>{" "}
              {selectedJob.dateSubmitted
                ? new Date(selectedJob.dateSubmitted).toLocaleDateString()
                : "N/A"}
            </p>
            <p>
              <strong>Date of Interview:</strong>{" "}
              {selectedJob.dateOfInterview
                ? new Date(selectedJob.dateOfInterview).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

