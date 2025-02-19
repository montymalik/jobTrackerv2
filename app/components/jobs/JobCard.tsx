import { JobApplication } from "@/app/lib/types";
import { useDrag } from "react-dnd";

interface JobCardProps {
  job: JobApplication;
  onClick: (job: JobApplication) => void;
}

export function JobCard({ job, onClick }: JobCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "JOB_CARD",
    // Spread the job data so that the drop target receives the correct object.
    item: { ...job },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return "";
    // Adjust for timezone and format as YYYY-MM-DD
    const d = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return d.toISOString().split("T")[0];
  };

  return (
    <div
      ref={drag}
      onClick={() => onClick(job)}
      className={`relative cursor-pointer rounded-xl bg-white dark:bg-gray-800 shadow-md p-4 hover:shadow-lg transition ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {job.companyName}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">{job.jobTitle}</p>

        {job.dateSubmitted && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Submitted: {formatDate(job.dateSubmitted)}
          </p>
        )}

        {job.dateOfInterview && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Interview: {formatDate(job.dateOfInterview)}
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
                className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-300"
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

