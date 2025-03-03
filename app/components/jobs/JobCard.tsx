import { JobApplication } from "@/app/lib/types";
import { PaperClipIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import { useDrag } from "react-dnd";

interface JobCardProps {
  job: JobApplication;
  onClick: (job: JobApplication) => void;
  disableDrag?: boolean;
  columnStatus?: string; // New prop to identify the column status
}

export function JobCard({
  job,
  onClick,
  disableDrag = false,
  columnStatus,
}: JobCardProps) {
  // Drag source setup
  const [{ isDragging }, dragRef] = useDrag({
    type: "JOB_CARD",
    item: job,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Determine if a compact view should be displayed for the "APPLIED" column
  const isCompactView = columnStatus === "APPLIED";

  // Dynamic card style based on dragging status
  const cardClasses = `
    relative cursor-pointer rounded-lg bg-white dark:bg-gray-800 p-4 shadow-lg transition-all 
    ${isDragging ? "opacity-50" : "opacity-100"} 
    hover:shadow-2xl
  `;

  return (
    <div
      ref={disableDrag ? null : dragRef}
      onClick={() => onClick(job)}
      className={cardClasses}
    >
      {/* Compact view for "APPLIED" column */}
      {isCompactView ? (
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-md font-semibold text-gray-900 dark:text-gray-100">
              {job.companyName}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {job.jobTitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {job.confirmationReceived && (
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            )}
            {job.files && job.files.length > 0 && (
              <PaperClipIcon className="h-4 w-4 text-purple-500" />
            )}
          </div>
        </div>
      ) : (
        // Full view for other columns
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {job.companyName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {job.jobTitle}
          </p>

          {/* Only show the link if jobUrl exists */}
          {job.jobUrl && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              <a
                href={job.jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-800 dark:hover:text-blue-200 no-underline"
              >
                View Job Posting
              </a>
            </p>
          )}

          <div className="flex justify-end items-center gap-2 mt-2">
            {job.confirmationReceived && (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            )}
            {job.files && job.files.length > 0 && (
              <PaperClipIcon className="h-5 w-5 text-purple-500" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

