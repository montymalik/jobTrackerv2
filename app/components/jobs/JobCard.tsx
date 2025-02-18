import { JobApplication } from "@/app/lib/types";
import { useDrag } from "react-dnd";

interface JobCardProps {
  job: JobApplication;
  onClick: (job: JobApplication) => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "JOB_CARD",
    item: job,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // Safely convert dateSubmitted and dateOfInterview to Date objects if they exist
  const submittedDate = job.dateSubmitted ? new Date(job.dateSubmitted) : null;
  const interviewDate = job.dateOfInterview ? new Date(job.dateOfInterview) : null;

  return (
    <div
      ref={drag}
      onClick={() => onClick(job)}
      className={`relative cursor-pointer rounded-lg bg-white p-4 shadow-sm transition-all hover:shadow-md
        ${isDragging ? "opacity-50" : "opacity-100"}`}
    >
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-gray-900">{job.companyName}</h3>
        <p className="text-sm text-gray-600">{job.jobTitle}</p>

        {submittedDate && (
          <p className="text-xs text-gray-500">
            Submitted: {submittedDate.toLocaleDateString()}
          </p>
        )}

        {interviewDate && (
          <p className="text-xs text-gray-500">
            Interview: {interviewDate.toLocaleDateString()}
          </p>
        )}

        {job.jobUrl && (
          <a
            href={job.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800"
            onClick={(e) => e.stopPropagation()}
          >
            View Job Posting
          </a>
        )}

        {job.files.length > 0 && (
          <div className="mt-2 flex gap-2">
            {job.files.map((file) => (
              <span
                key={file.id}
                className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
              >
                {file.fileName}
              </span>
            ))}
          </div>
        )}
      </div>

      {job.confirmationReceived && (
        <div className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-green-500" />
      )}
    </div>
  );
}

