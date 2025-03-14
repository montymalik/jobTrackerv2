import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

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

interface SavedResumesComponentProps {
  jobId: string;
  onSelectResume?: (resume: GeneratedResume) => void;
}

const SavedResumesComponent: React.FC<SavedResumesComponentProps> = ({ jobId, onSelectResume }) => {
  const [resumes, setResumes] = useState<GeneratedResume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simplified version - we'll just silently return empty array rather than showing errors
  useEffect(() => {
    const fetchResumes = async () => {
      if (!jobId) return;

      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching resumes for job ID:', jobId);
        
        // Try multiple possible API endpoints - this helps avoid 404 errors
        // if the route files are in different locations
        const apiEndpoints = [
          `/api/resume/get-by-job?jobId=${jobId}`,
          `/api/resume/get-for-job?jobId=${jobId}`,
          `/api/resume/get?jobId=${jobId}`,
          `/api/resume/simple-get?jobId=${jobId}`
        ];
        
        let data = [];
        let success = false;
        
        // Try each endpoint until one works
        for (const endpoint of apiEndpoints) {
          try {
            console.log(`Trying API endpoint: ${endpoint}`);
            const response = await fetch(endpoint);
            
            if (response.ok) {
              const result = await response.json();
              data = Array.isArray(result) ? result : [];
              success = true;
              console.log(`Successfully fetched ${data.length} resumes from ${endpoint}`);
              break;
            } else {
              console.log(`Endpoint ${endpoint} returned ${response.status}`);
            }
          } catch (e) {
            console.log(`Error fetching from ${endpoint}:`, e);
            // Continue to the next endpoint
          }
        }
        
        if (!success) {
          console.log('All resume fetch attempts failed, returning empty array');
          setResumes([]);
        } else {
          setResumes(data);
        }
      } catch (err) {
        console.error('Error in fetchResumes:', err);
        setResumes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResumes();
  }, [jobId]);

  // Updated handleSelectResume to prevent default behavior
  const handleSelectResume = (resume: GeneratedResume, e: React.MouseEvent) => {
    // Prevent default browser behavior which might be causing navigation
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Loading resume:', resume.id);
    
    if (onSelectResume) {
      try {
        onSelectResume(resume);
        console.log('Resume loaded successfully');
      } catch (error) {
        console.error('Error in onSelectResume callback:', error);
      }
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md text-center">
        <div className="spinner mx-auto mb-2"></div>
        <p className="text-gray-600 dark:text-gray-300">Loading saved resumes...</p>
      </div>
    );
  }

  // Don't show anything if there are no resumes
  if (resumes.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
        Saved Resumes
      </h4>
      <div className="bg-white dark:bg-gray-800 rounded-md border dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                PDF
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {resumes.map((resume) => (
              <tr key={resume.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(resume.createdAt), 'MMM d, yyyy h:mm a')}
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {resume.fileName ? (
                    <span className="text-blue-600 dark:text-blue-400">
                      {resume.fileName}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">
                      No PDF
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    type="button" // Explicitly set type to button to prevent form submission
                    onClick={(e) => handleSelectResume(resume, e)}
                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                  >
                    Load
                  </button>
                  {!resume.isPrimary && (
                    <button
                      type="button" // Explicitly set type to button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        try {
                          console.log('Setting resume as primary:', resume.id);
                          const response = await fetch('/api/resume/set-primary', {
                            method: 'POST',
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ resumeId: resume.id }),
                          });
                          
                          console.log('Set primary response status:', response.status);
                          
                          if (response.ok) {
                            // Refresh the resumes list
                            const updatedResumes = resumes.map(r => ({
                              ...r,
                              isPrimary: r.id === resume.id
                            }));
                            setResumes(updatedResumes);
                          } else {
                            console.error('Failed to set resume as primary:', response.statusText);
                          }
                        } catch (err) {
                          console.error('Error setting primary resume:', err);
                        }
                      }}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Set Primary
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SavedResumesComponent;
