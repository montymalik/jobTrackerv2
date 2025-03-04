import { JobApplication } from "@/app/lib/types";
import { useState, useEffect } from "react";

interface JobFormProps {
  job?: JobApplication;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

export function JobForm({ job, onSubmit, onCancel }: JobFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(
    job?.confirmationReceived || false
  );
  const [rejectionChecked, setRejectionChecked] = useState(
    job?.rejectionReceived || false
  );

  useEffect(() => {
    setConfirmationChecked(job?.confirmationReceived || false);
    setRejectionChecked(job?.rejectionReceived || false);
  }, [job]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      if (rejectionChecked) {
        formData.set("status", "ARCHIVED");
      } else if (!formData.get("status") && job?.status) {
        formData.set("status", job.status);
      }

      formData.set("confirmationReceived", String(confirmationChecked));
      formData.set("rejectionReceived", String(rejectionChecked));

      files.forEach((file) => {
        formData.append("files", file);
      });

      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return "";
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-2 gap-2 rounded-md bg-white p-2 dark:bg-gray-800 dark:text-gray-100 max-h-[calc(100vh-200px)] overflow-y-auto text-xs"
      style={{ fontSize: "12px" }}
    >
      {/* Company Name */}
      <div className="col-span-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Company Name
        </label>
        <input
          type="text"
          name="companyName"
          defaultValue={job?.companyName}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      {/* Job Title */}
      <div className="col-span-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Job Title
        </label>
        <input
          type="text"
          name="jobTitle"
          defaultValue={job?.jobTitle}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      {/* Job URL */}
      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Job URL
        </label>
        <input
          type="url"
          name="jobUrl"
          defaultValue={job?.jobUrl || ""}
          className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      {/* Job Description */}
      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Job Description
        </label>
        <textarea
          name="jobDescription"
          defaultValue={job?.jobDescription || ""}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      {/* Date Submitted and Interview */}
      <div className="col-span-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Date Submitted
        </label>
        <input
          type="date"
          name="dateSubmitted"
          defaultValue={job?.dateSubmitted ? formatDate(job.dateSubmitted) : ""}
          className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      <div className="col-span-1">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Date of Interview
        </label>
        <input
          type="date"
          name="dateOfInterview"
          defaultValue={job?.dateOfInterview ? formatDate(job.dateOfInterview) : ""}
          className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
        />
      </div>

      {/* Confirmation and Rejection Checkboxes */}
      <div className="col-span-1 flex items-center gap-2">
        <input
          type="checkbox"
          checked={confirmationChecked}
          onChange={(e) => setConfirmationChecked(e.target.checked)}
          className="h-4 w-4 rounded dark:bg-gray-700"
        />
        <label className="text-xs text-gray-700 dark:text-gray-300">
          Confirmation Received
        </label>
      </div>

      <div className="col-span-1 flex items-center gap-2">
        <input
          type="checkbox"
          checked={rejectionChecked}
          onChange={(e) => setRejectionChecked(e.target.checked)}
          className="h-4 w-4 rounded dark:bg-gray-700"
        />
        <label className="text-xs text-gray-700 dark:text-gray-300">
          Rejection Received
        </label>
      </div>

      {/* File Upload */}
      <div className="col-span-2">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Upload Files
        </label>
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="mt-1 block w-full text-xs text-gray-500 dark:text-gray-300"
        />
      </div>

      {/* Buttons */}
      <div className="col-span-2 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border bg-white dark:bg-gray-700 px-3 py-1 text-xs dark:text-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
        >
          {isSubmitting ? "Saving..." : job ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}

