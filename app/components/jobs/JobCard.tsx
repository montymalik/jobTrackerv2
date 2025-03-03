"use client";

import { JobApplication } from "@/app/lib/types";
import { useDrag } from "react-dnd";
import { useRef, useState } from "react";

interface JobCardProps {
  job: JobApplication;
  onClick: (job: JobApplication) => void;
  disableDrag?: boolean;
  columnStatus?: string; // New prop to identify column status
}

export function JobCard({
  job,
  onClick,
  disableDrag = false,
  columnStatus,
}: JobCardProps) {
  const [{ isDragging }, dragRef] = disableDrag
    ? [{ isDragging: false }, useRef(null)]
    : useDrag(() => ({
        type: "JOB_CARD",
        item: job,
        collect: (monitor) => ({
          isDragging: monitor.isDragging(),
        }),
      }));

  const [isHovered, setIsHovered] = useState(false);

  // Updated formatDate function to handle strings and Date objects
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    const adjusted = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
    const year = adjusted.getFullYear();
    const month = String(adjusted.getMonth() + 1).padStart(2, "0");
    const day = String(adjusted.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Determine if the card should be compact
  const isCompact = columnStatus === "APPLIED" && !isHovered;

  return (
    <div
      ref={disableDrag ? null : dragRef}
      onClick={() => onClick(job)}
      className={`relative cursor-pointer rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm transition-all hover:shadow-md ${
        isDragging ? "opacity-50" : "opacity-100"
      } ${isCompact ? "max-h-20 overflow-hidden" : "max-h-full"} ${
        isHovered ? "hover:bg-gray-100 dark:hover:bg-gray-700" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          {job.companyName}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {job.jobTitle}
        </p>

        {!isCompact && job.dateSubmitted && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Submitted: {formatDate(job.dateSubmitted)}
          </p>
        )}

        {!isCompact && job.dateOfInterview && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Interview: {formatDate(job.dateOfInterview)}
          </p>
        )}

        {job.jobUrl && (
          <a
            href={job.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-500 no-underline"
            onClick={(e) => e.stopPropagation()}
          >
            View Job Posting
          </a>
        )}
      </div>

      <div className="absolute bottom-2 right-2 flex gap-1">
        {job.files.length > 0 && (
          <div className="h-2 w-2 rounded-full bg-purple-500" />
        )}
        {job.confirmationReceived && (
          <div className="h-2 w-2 rounded-full bg-green-500" />
        )}
      </div>
    </div>
  );
}

