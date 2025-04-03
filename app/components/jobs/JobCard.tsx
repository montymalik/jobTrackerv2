"use client";

import { JobApplication } from "@/app/lib/types";
import { useDrag } from "react-dnd";
import { useRef, useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Modal } from "@/app/components/ui/Modal"; // Using your existing Modal component

interface JobCardProps {
  job: JobApplication;
  onClick: (job: JobApplication) => void;
  disableDrag?: boolean;
  columnStatus?: string;
  onDelete?: (jobId: string) => void; // New prop for delete handler
}

export function JobCard({
  job,
  onClick,
  disableDrag = false,
  columnStatus,
  onDelete,
}: JobCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Use drag only if dragging is enabled
  const [{ isDragging }, dragRef] = useDrag({
    type: "JOB_CARD",
    item: job,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [isHovered, setIsHovered] = useState(false);

  // Apply dragRef to cardRef if dragging is enabled
  useEffect(() => {
    if (!disableDrag && cardRef.current) {
      dragRef(cardRef);
    }
  }, [disableDrag, dragRef]);

  // Updated formatDate function to handle strings and Date objects
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "";
    const d = date instanceof Date ? date : new Date(date);
    const adjusted = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
    const year = adjusted.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(adjusted.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Determine if the card should be compact
  const isCompact = columnStatus === "APPLIED" && !isHovered;

  // Check if delete button should be shown (only in TO_APPLY column)
  const showDeleteButton = columnStatus === "TO_APPLY";

  // Handle delete button click
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    setIsDeleteDialogOpen(true);
  };

  // Handle confirmation of deletion
  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(job.id);
    }
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <div
        ref={cardRef}
        onClick={() => onClick(job)}
        className={`relative cursor-pointer rounded-lg bg-white dark:bg-gray-800 p-4 shadow-md transition-all ${
          isDragging ? "opacity-50" : "opacity-100"
        } ${isCompact ? "max-h-20 overflow-hidden" : "max-h-full"} ${
          isHovered ? "hover:bg-gray-100 dark:hover:bg-gray-700" : ""
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Delete button - only show for TO_APPLY column */}
        {showDeleteButton && (
          <button
            onClick={handleDeleteClick}
            className="absolute top-2 right-2 p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
            aria-label="Delete job application"
          >
            <Trash2 size={16} />
          </button>
        )}

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

      {/* Delete Confirmation Dialog using your existing Modal component */}
      <Modal
        show={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title="Confirm Delete"
      >
        <div className="p-4">
          <p className="mb-4">
            Are you sure you want to delete the job application for {job.companyName} - {job.jobTitle}? 
            This will permanently delete all associated data from the database.
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsDeleteDialogOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
