import { JobApplication } from "@/app/lib/types";
import { useState, useEffect, useRef } from "react";

interface JobFormProps {
  job?: JobApplication;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

export function JobForm({ job, onSubmit, onCancel }: JobFormProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [skills, setSkills] = useState<string[]>(
    job && job.keySkills ? job.keySkills.split(",").map((s) => s.trim()) : []
  );
  
  // Include notes in the form state.
  const [formState, setFormState] = useState({
    companyName: job?.companyName || "",
    jobTitle: job?.jobTitle || "",
    jobUrl: job?.jobUrl || "",
    jobDescription: job?.jobDescription || "",
    confirmationReceived: job?.confirmationReceived || false,
    rejectionReceived: job?.rejectionReceived || false,
    notes: job?.notes || "",
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
        notes: job.notes || "",
      });
      if (job.keySkills) {
        setSkills(job.keySkills.split(",").map((skill) => skill.trim()));
      }
      if (job.files) {
        setExistingFiles(job.files);
      }
    }
  }, [job]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
      // Append all fields including notes.
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

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const analyzeSkills = async () => {
    if (!formState.jobDescription.trim()) {
      console.error("Job description is missing!");
      return;
    }
    if (!job?.id) {
      console.error("Job ID is missing!");
      return;
    }
    try {
      const response = await fetch("/api/gemini/analyze-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: formState.jobDescription,
          jobId: job?.id,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to analyze skills:", errorText);
        return;
      }
      const data = await response.json();
      setSkills(data.skills || []);
    } catch (error) {
      console.error("Error analyzing skills:", error);
    }
  };

  // Split skills into two columns for display.
  const mid = Math.ceil(skills.length / 2);
  const skillsCol1 = skills.slice(0, mid);
  const skillsCol2 = skills.slice(mid);

  // Format file size for display
  const formatFileSize = (sizeInBytes: number) => {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
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
        <button
          type="button"
          className={`px-4 py-2 border-b-2 ${
            activeTab === "notes"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("notes")}
        >
          Notes
        </button>
        <button
          type="button"
          className={`px-4 py-2 border-b-2 ${
            activeTab === "files"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 dark:text-gray-400"
          }`}
          onClick={() => setActiveTab("files")}
        >
          Files
        </button>
      </div>
      
      {/* Details Tab */}
      {activeTab === "details" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium dark:text-gray-300">
              Company Name
            </label>
            <input
              type="text"
              name="companyName"
              value={formState.companyName}
              onChange={handleChange}
              className="w-full rounded-md border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
            />
            <label className="block text-sm font-medium dark:text-gray-300 mt-4">
              Job Title
            </label>
            <input
              type="text"
              name="jobTitle"
              value={formState.jobTitle}
              onChange={handleChange}
              className="w-full rounded-md border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
            />
            <label className="block text-sm font-medium dark:text-gray-300 mt-4">
              Job URL
            </label>
            <input
              type="url"
              name="jobUrl"
              value={formState.jobUrl}
              onChange={handleChange}
              className="w-full rounded-md border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
            />
            <label className="block text-sm font-medium dark:text-gray-300 mt-4">
              Confirmation
            </label>
            <input
              type="checkbox"
              name="confirmationReceived"
              checked={formState.confirmationReceived}
              onChange={handleChange}
              className="h-5 w-5 rounded dark:border-gray-700 dark:bg-gray-700"
            />
            <label className="block text-sm font-medium dark:text-gray-300 mt-4">
              Rejection
            </label>
            <input
              type="checkbox"
              name="rejectionReceived"
              checked={formState.rejectionReceived}
              onChange={handleChange}
              className="h-5 w-5 rounded dark:border-gray-700 dark:bg-gray-700"
            />
            {/* Bottom-right buttons for Details Tab */}
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
          </div>
          <div>{/* Right column for future use */}</div>
        </div>
      )}
      
      {/* Job Description Tab */}
      {activeTab === "jobDescription" && (
        <div className="grid grid-cols-2 gap-4 h-[400px]">
          {/* Left Column: Job Description Field */}
          <div className="flex flex-col h-full">
            <label className="block text-sm font-medium dark:text-gray-300">
              Job Description
            </label>
            <textarea
              name="jobDescription"
              value={formState.jobDescription}
              onChange={handleChange}
              className="w-full h-full rounded-md border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 resize-none"
            />
            <button
              type="button"
              onClick={analyzeSkills}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Analyze Skills
            </button>
          </div>
          {/* Right Column: Key Skills */}
          <div className="flex flex-col h-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Key Skills
            </h3>
            {skills.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 flex-grow">
                <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
                  {skillsCol1.map((skill, index) => (
                    <li key={index}>{skill}</li>
                  ))}
                </ul>
                <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
                  {skillsCol2.map((skill, index) => (
                    <li key={index}>{skill}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                No skills analyzed yet.
              </p>
            )}
            {/* Bottom-right buttons for Job Description Tab */}
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
          </div>
        </div>
      )}
      
      {/* Notes Tab */}
      {activeTab === "notes" && (
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col">
            <label className="block text-sm font-medium dark:text-gray-300">
              Notes
            </label>
            <textarea
              name="notes"
              value={formState.notes}
              onChange={handleChange}
              className="w-full h-40 rounded-md border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 resize-none"
            />
          </div>
          {/* Bottom-right buttons for Notes Tab */}
          <div className="flex justify-end gap-2">
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
        </div>
      )}
      
      {/* Files Tab */}
      {activeTab === "files" && (
        <div className="grid grid-cols-1 gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Uploaded Files
            </h3>
            <button
              type="button"
              onClick={handleFileUpload}
              className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Display existing files */}
            {existingFiles.map((file, index) => (
              <div key={`existing-${index}`} className="p-4 border rounded-md dark:border-gray-700">
                <div 
                  className="flex flex-col items-center cursor-pointer" 
                  onClick={() => window.open(file.nextcloudPath, '_blank')}
                >
                  <div className="w-24 h-32 flex items-center justify-center border rounded-md mb-2 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="text-center p-2 bg-gray-100 dark:bg-gray-700 text-red-400 rounded-md">
                      PDF
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-medium truncate w-40">{file.fileName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      PDF - {formatFileSize(file.fileSize || 43600)} {/* Default size if not available */}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Uploaded {file.createdAt ? new Date(file.createdAt).toLocaleString() : "previously"}
                  </div>
                </div>
                <div className="mt-2 flex justify-between">
                  <button 
                    type="button" 
                    className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                  >
                    {file.fileType === 'application/pdf' ? 'Resume' : 'Cover Letter'}
                  </button>
                  <button 
                    type="button" 
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            
            {/* Display newly uploaded files (not yet saved) */}
            {files.map((file, index) => (
              <div key={`new-${index}`} className="p-4 border rounded-md dark:border-gray-700">
                <div className="flex flex-col items-center cursor-pointer" 
                  onClick={() => {
                    // Create a URL for the file
                    const fileUrl = URL.createObjectURL(file);
                    window.open(fileUrl, '_blank');
                  }}
                >
                  <div className="w-24 h-32 flex items-center justify-center border rounded-md mb-2 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="text-center p-2 bg-gray-100 dark:bg-gray-700 text-red-400 rounded-md">
                      {file.type.includes('pdf') ? 'PDF' : file.type.includes('doc') ? 'DOC' : 'FILE'}
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="font-medium truncate w-40">{file.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {file.type.split('/')[1]?.toUpperCase() || 'FILE'} - {formatFileSize(file.size)}
                    </p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Just now (not saved yet)
                  </div>
                </div>
                <div className="mt-2 flex justify-between">
                  <button 
                    type="button" 
                    className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                  >
                    {file.name.toLowerCase().includes('resume') ? 'Resume' : 'Cover Letter'}
                  </button>
                  <button 
                    type="button" 
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent opening the file when clicking the delete button
                      setFiles(files.filter((_, i) => i !== index));
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            
            {/* Empty state if no files */}
            {existingFiles.length === 0 && files.length === 0 && (
              <div className="col-span-2 p-8 border rounded-md text-center dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">
                  No files uploaded yet. Click the + button to upload files.
                </p>
              </div>
            )}
          </div>
          
          {/* Bottom-right buttons for Files Tab */}
          <div className="flex justify-end gap-2 mt-4">
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
        </div>
      )}
    </form>
  );
}
