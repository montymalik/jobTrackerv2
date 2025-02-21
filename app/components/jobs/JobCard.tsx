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
  // If dragging is disabled, we won't use react-dnd's dragRef.
  const [{ isDragging }, dragRef] = disableDrag
    ? [{ isDragging: false }, null]
    : useDrag(() => ({
        type: "JOB_CARD",
        item: job,
        collect: (monitor) => ({
          isDragging: monitor.isDragging(),
        }),
      }));

  // A small helper for the ref
  // - If drag is disabled, do nothing
  // - Otherwise, call dragRef(node)
  const attachDragRef = (node: HTMLDivElement | null) => {
    if (!node || !dragRef) return;
    // react-dnd's "dragRef" is a function that attaches to the node
    dragRef(node);
  };

  // Format date for display
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
      // Instead of ref={disableDrag ? null : dragRef}, use a callback ref
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

