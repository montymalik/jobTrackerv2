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
  const [confirmationChecked, setConfirmationChecked] = useState(job?.confirmationReceived || false);
  const [rejectionChecked, setRejectionChecked] = useState(job?.rejectionReceived || false);

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
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-md bg-white p-4 dark:bg-gray-800 dark:text-gray-100 h-full max-h-[calc(90vh-40px)] overflow-hidden"
    >
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium">Company Name</label>
          <input
            type="text"
            name="companyName"
            defaultValue={job?.companyName}
            required
            className="mt-1 block w-full rounded-md border dark:border-gray-600 dark:bg-gray-700 p-1"
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium">Job Title</label>
          <input
            type="text"
            name="jobTitle"
            defaultValue={job?.jobTitle}
            required
            className="mt-1 block w-full rounded-md border dark:border-gray-600 dark:bg-gray-700 p-1"
          />
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium">Job URL</label>
          <input
            type="url"
            name="jobUrl"
            defaultValue={job?.jobUrl || ""}
            className="mt-1 block w-full rounded-md border dark:border-gray-600 dark:bg-gray-700 p-1"
          />
        </div>
      </div>

      <div className="flex-1">
        <label className="block text-sm font-medium">Job Description</label>
        <textarea
          name="jobDescription"
          defaultValue={job?.jobDescription || ""}
          rows={3}
          className="mt-1 block w-full rounded-md border dark:border-gray-600 dark:bg-gray-700 p-1"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium">Date Submitted</label>
          <input
            type="date"
            name="dateSubmitted"
            defaultValue={job?.dateSubmitted ? formatDate(job.dateSubmitted) : ""}
            className="mt-1 block w-full rounded-md border dark:border-gray-600 dark:bg-gray-700 p-1"
          />
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium">Date of Interview</label>
          <input
            type="date"
            name="dateOfInterview"
            defaultValue={job?.dateOfInterview ? formatDate(job.dateOfInterview) : ""}
            className="mt-1 block w-full rounded-md border dark:border-gray-600 dark:bg-gray-700 p-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={confirmationChecked}
            onChange={(e) => setConfirmationChecked(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 dark:bg-gray-700"
          />
          <span className="ml-2">Confirmation Received</span>
        </label>

        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={rejectionChecked}
            onChange={(e) => setRejectionChecked(e.target.checked)}
            className="rounded border-gray-300 text-red-600 dark:bg-gray-700"
          />
          <span className="ml-2">Rejection Received</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium">Upload Files</label>
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-300"
        />
      </div>

      <div className="flex justify-end gap-4 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md border dark:bg-gray-700 dark:text-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          {isSubmitting ? "Saving..." : job ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}

