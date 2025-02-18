import { JobApplication } from "@/app/lib/types";
import { useState } from "react";

interface JobFormProps {
  job?: JobApplication;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

export function JobForm({ job, onSubmit, onCancel }: JobFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      // Log the form data for debugging
      console.log("Form Data to Submit:", Object.fromEntries(formData.entries()));

      // Add status if not present
      if (!formData.get("status")) {
        formData.set("status", "TO_APPLY");
      }

      // Append each file to formData
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
    if (!date) {
      return "";
    }
    return new Date(date).toISOString().split("T")[0];
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Company Name */}
      <div>
        <label
          htmlFor="companyName"
          className="block text-sm font-medium text-gray-700"
        >
          Company Name
        </label>
        <input
          type="text"
          id="companyName"
          name="companyName"
          defaultValue={job?.companyName}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      {/* Job Title */}
      <div>
        <label
          htmlFor="jobTitle"
          className="block text-sm font-medium text-gray-700"
        >
          Job Title
        </label>
        <input
          type="text"
          id="jobTitle"
          name="jobTitle"
          defaultValue={job?.jobTitle}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      {/* Job URL */}
      <div>
        <label
          htmlFor="jobUrl"
          className="block text-sm font-medium text-gray-700"
        >
          Job URL
        </label>
        <input
          type="url"
          id="jobUrl"
          name="jobUrl"
          defaultValue={job?.jobUrl || ""}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      {/* Job Description */}
      <div>
        <label
          htmlFor="jobDescription"
          className="block text-sm font-medium text-gray-700"
        >
          Job Description
        </label>
        <textarea
          id="jobDescription"
          name="jobDescription"
          defaultValue={job?.jobDescription || ""}
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      {/* Date Submitted */}
      <div>
        <label
          htmlFor="dateSubmitted"
          className="block text-sm font-medium text-gray-700"
        >
          Date Submitted
        </label>
        <input
          type="date"
          id="dateSubmitted"
          name="dateSubmitted"
          defaultValue={formatDate(job?.dateSubmitted)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      {/* Date of Interview */}
      <div>
        <label
          htmlFor="dateOfInterview"
          className="block text-sm font-medium text-gray-700"
        >
          Date of Interview
        </label>
        <input
          type="date"
          id="dateOfInterview"
          name="dateOfInterview"
          defaultValue={formatDate(job?.dateOfInterview)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      {/* Confirmation Received */}
      <div>
        <label
          htmlFor="confirmationReceived"
          className="block text-sm font-medium text-gray-700"
        >
          Confirmation Received
        </label>
        <input
          type="checkbox"
          id="confirmationReceived"
          name="confirmationReceived"
          defaultChecked={job?.confirmationReceived}
          className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Upload Files
        </label>
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {/* Buttons */}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : job ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}

