"use client";

import { JobApplication } from "@/app/lib/types";
import { useDrag } from "react-dnd";
import { useRef } from "react";

interface JobCardProps {
  job: JobApplication;
  onClick: (job: JobApplication) => void;
  disableDrag?: boolean;
}

export function JobCard({ job, onClick, disableDrag = false }: JobCardProps) {
  const [{ isDragging }, dragRef] = disableDrag
    ? [{ isDragging: false }, null]
    : useDrag(() => ({
        type: "JOB_CARD",
        item: job,
        collect: (monitor) => ({
          isDragging: monitor.isDragging(),
        }),
      }));

  const attachDragRef = (node: HTMLDivElement | null) => {
    if (node && dragRef) {
      dragRef(node);
    }
  };

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    const adjusted = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
    const year = adjusted.getFullYear();
    const month = String(adjusted.getMonth() + 1).padStart(2, "0");
    const day = String(adjusted.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return (
    <div
      ref={attachDragRef}
      onClick={() => onClick(job)}
      className={`
        relative cursor-pointer rounded-lg 
        bg-white dark:bg-gray-800
        p-4
        shadow-lg 
        transition-all 
        hover:shadow-2xl 
        hover:-translate-y-1
        ${isDragging ? "opacity-50" : "opacity-100"}
      `}
    >
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          {job.companyName}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {job.jobTitle}
        </p>

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
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            onClick={(e) => e.stopPropagation()}
          >
            View Job Posting
          </a>
        )}
      </div>

      {(job.confirmationReceived || job.files.length > 0) && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {job.confirmationReceived && (
            <div className="h-2 w-2 rounded-full bg-green-500" />
          )}
          {job.files.length > 0 && (
            <div className="h-2 w-2 rounded-full bg-purple-500" />
          )}
        </div>
      )}
    </div>
  );
}

