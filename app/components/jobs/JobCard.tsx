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
  // If dragging is enabled, use the useDrag hook.
  const [{ isDragging }, dragRef] = disableDrag
    ? [{ isDragging: false }, null]
    : useDrag(() => ({
        type: "JOB_CARD",
        item: job,
        collect: (monitor) => ({
          isDragging: monitor.isDragging(),
        }),
      }));

  // A callback ref that attaches dragRef if dragging is enabled
  const attachDragRef = (node: HTMLDivElement | null) => {
    if (node && dragRef) {
      dragRef(node);
    }
  };

  // Updated formatDate function to handle strings and Date objects
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "";
    // Convert to Date if it's not already a Date object
    const d = date instanceof Date ? date : new Date(date);
    // Adjust for timezone and format as YYYY-MM-DD
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
      className={`relative cursor-pointer rounded-lg bg-white p-4 shadow-sm transition-all hover:shadow-md ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-gray-900">{job.companyName}</h3>
        <p className="text-sm text-gray-600">{job.jobTitle}</p>

        {job.dateSubmitted && (
          <p className="text-xs text-gray-500">
            Submitted: {formatDate(job.dateSubmitted)}
          </p>
        )}

        {job.dateOfInterview && (
          <p className="text-xs text-gray-500">
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
      </div>

      {/* 
        Bottom-right dots:
        - If confirmationReceived, show green dot on left
        - If job.files exist, show purple dot on far right
      */}
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

