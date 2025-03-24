// app/components/resume/ResumeList.tsx
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface GeneratedResume {
  id: string;
  markdownContent: string;
  version: number;
  jobApplicationId: string;
  isPrimary: boolean;
  fileName: string | null;
  filePath: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ResumeListProps {
  jobId: string;
  onCreateNew?: () => void;
}

const ResumeList: React.FC<ResumeListProps> = ({ jobId, onCreateNew }) => {
  const [resumes, setResumes] = useState<GeneratedResume[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  // Function to fetch resumes
  const fetchResumes = async () => {
    if (!jobId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/resume/get-for-job?jobId=${jobId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch resumes: ${response.status}`);
      }
      
      const data = await response.json();
      setResumes(data);
    } catch (error) {
      console.error("Error fetching resumes:", error);
      setError(`Failed to fetch resumes: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch resumes when component mounts or jobId changes
  useEffect(() => {
    if (jobId) {
      fetchResumes();
    }
  }, [jobId]);

  // Clear success message after a delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Navigate to the editor page for a new resume
  const handleCreateNewResume = () => {
    if (onCreateNew) {
      onCreateNew();
    } else {
      router.push(`/resume-editor/${jobId}`);
    }
  };

  // Navigate to the editor page for an existing resume
  const handleEditResume = (resumeId: string) => {
    router.push(`/resume-editor/${jobId}?resumeId=${resumeId}`);
  };

  // Handle setting a resume as primary
  const handleSetAsPrimary = async (resumeId: string) => {
    if (!jobId) return;
    
    try {
      const response = await fetch("/api/resume/set-primary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to set primary resume: ${response.status}`);
      }
      
      // Refresh resumes after setting primary
      fetchResumes();
      setSuccessMessage("Primary resume updated successfully");
    } catch (error) {
      console.error("Error setting primary resume:", error);
      setError(`Failed to set primary resume: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Handle downloading a resume as PDF
  const handleDownloadPDF = async (resume: GeneratedResume) => {
    try {
      // Dynamically import html2pdf for client-side only
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = html2pdfModule.default;

      // Create a container for the PDF content
      const container = document.createElement('div');
      
      // Convert markdown to HTML - this is a very basic conversion
      // In a real app, you'd use a proper markdown parser
      const htmlContent = resume.markdownContent
        .replace(/^# (.*?)$/gm, '<h1 style="font-size: 24px; text-align: center; margin-bottom: 10px;">$1</h1>')
        .replace(/^## (.*?)$/gm, '<h2 style="font-size: 18px; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-top: 20px; margin-bottom: 10px;">$1</h2>')
        .replace(/^### (.*?)$/gm, '<h3 style="font-size: 16px; margin-top: 15px; margin-bottom: 5px;">$1</h3>')
        .replace(/^- (.*?)$/gm, '<li style="margin-bottom: 5px;">$1</li>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Wrap lists in ul tags
        .replace(/(<li.*?>[\s\S]*?<\/li>)\s*<li/g, '$1</ul><ul><li')
        .replace(/^<li/m, '<ul><li')
        .replace(/<\/li>$/m, '</li></ul>')
        // Handle paragraphs
        .replace(/^([^<].*?)$/gm, '<p>$1</p>');

      container.innerHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #333;
              line-height: 1.5;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 8.5in;
              margin: 0 auto;
              padding: 0.5in;
            }
            ul {
              padding-left: 20px;
              margin-top: 5px;
              margin-bottom: 10px;
            }
            p {
              margin-bottom: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${htmlContent}
          </div>
        </body>
        </html>
      `;

      document.body.appendChild(container);
      container.style.position = 'absolute';
      container.style.left = '-9999px';

      // Set PDF options
      const options = {
        margin: 1,
        filename: resume.fileName || `Resume_${resume.version}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as 'portrait' }
      };

      // Generate PDF
      html2pdf().set(options).from(container).save().then(() => {
        document.body.removeChild(container);
        setSuccessMessage("PDF downloaded successfully");
      });
    } catch (error) {
      console.error("Error downloading PDF:", error);
      setError(`Failed to download PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Handle deleting a resume
  const handleDeleteResume = async (resumeId: string) => {
    if (!window.confirm("Are you sure you want to delete this resume? This action cannot be undone.")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/resume/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: resumeId }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete resume: ${response.status}`);
      }
      
      // Refresh resumes after deletion
      fetchResumes();
      setSuccessMessage("Resume deleted successfully");
    } catch (error) {
      console.error("Error deleting resume:", error);
      setError(`Failed to delete resume: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Your Resumes
        </h2>
        <button
          onClick={handleCreateNewResume}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          {resumes.length > 0 ? "Create New Resume" : "Create Resume"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}

      {resumes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No Resumes Created Yet
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Create your first tailored resume for this job application
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Resume
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {resumes.map((resume) => (
                <tr key={resume.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {resume.fileName || `Resume v${resume.version}`}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Version {resume.version}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(resume.createdAt).toLocaleDateString()} {" "}
                      {new Date(resume.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {resume.isPrimary ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Primary
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        Secondary
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleEditResume(resume.id)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Edit
                      </button>
                      
                      <button
                        onClick={() => handleDownloadPDF(resume)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Download
                      </button>
                      
                      {!resume.isPrimary && (
                        <button
                          onClick={() => handleSetAsPrimary(resume.id)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Set Primary
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDeleteResume(resume.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ResumeList;
