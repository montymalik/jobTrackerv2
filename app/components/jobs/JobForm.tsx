import { JobApplication } from "@/app/lib/types";
import { useState, useEffect } from "react";

interface JobFormProps {
  job?: JobApplication;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

export function JobForm({ job, onSubmit, onCancel }: JobFormProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [formState, setFormState] = useState({
    companyName: job?.companyName || "",
    jobTitle: job?.jobTitle || "",
    jobUrl: job?.jobUrl || "",
    jobDescription: job?.jobDescription || "",
    confirmationReceived: job?.confirmationReceived || false,
    rejectionReceived: job?.rejectionReceived || false,
  });

  useEffect(() => {
    if (job) {
      setFormState({
        companyName: job.companyName || "",
        jobTitle: job.jobTitle || "",
        jobUrl: job.jobUrl || "",
        jobDescription: job.jobDescription || "",
        confirmationReceived: job.confirmationReceived || false,
        rejectionReceived: job.rejectionReceived || false,
      });
    }
  }, [job]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(formState).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
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

  const analyzeSkills = async () => {
    if (!formState.jobDescription.trim()) return;

    try {
      const response = await fetch("/api/gemini/analyze-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription: formState.jobDescription }),
      });

      if (!response.ok) throw new Error("Failed to analyze skills");

      const data = await response.json();
      setSkills(data.skills || []);
    } catch (error) {
      console.error("Error analyzing skills:", error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-md bg-white p-4 dark:bg-gray-800 dark:text-gray-100"
    >
      {/* Tab Navigation */}
      <div className="flex border-b mb-4 dark:border-gray-700">
        <button
          type="button"
          className={`px-4 py-2 border-b-2 ${
            activeTab === "details"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("details")}
        >
          Details
        </button>
        <button
          type="button"
          className={`px-4 py-2 border-b-2 ${
            activeTab === "jobDescription"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("jobDescription")}
        >
          Job Description
        </button>
      </div>

      {/* Details Tab */}
      {activeTab === "details" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium dark:text-gray-300">Company Name</label>
            <input
              type="text"
              name="companyName"
              value={formState.companyName}
              onChange={handleChange}
              className="w-full rounded-md border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
            />
            <label className="block text-sm font-medium dark:text-gray-300 mt-4">Job Title</label>
            <input
              type="text"
              name="jobTitle"
              value={formState.jobTitle}
              onChange={handleChange}
              className="w-full rounded-md border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
            />
            <label className="block text-sm font-medium dark:text-gray-300 mt-4">Job URL</label>
            <input
              type="url"
              name="jobUrl"
              value={formState.jobUrl}
              onChange={handleChange}
              className="w-full rounded-md border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div>
            {/* Right column for future use */}
          </div>
        </div>
      )}

      {/* Job Description Tab */}
      {activeTab === "jobDescription" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium dark:text-gray-300">Job Description</label>
            <textarea
              name="jobDescription"
              value={formState.jobDescription}
              onChange={handleChange}
              className="w-full h-40 rounded-md border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={analyzeSkills}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Analyze Skills
            </button>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Key Skills</h3>
            {skills.length > 0 ? (
              <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
                {skills.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No skills analyzed yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Bottom-right buttons */}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md border bg-gray-700 text-white px-4 py-2 hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {isSubmitting ? "Saving..." : job ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}

