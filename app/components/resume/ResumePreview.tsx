import React, { useState, useEffect } from 'react';

type ResumePreviewProps = {
  resumeId?: string;
};

type ResumeData = {
  id: string;
  fileName: string;
  fileType: string;
  filePath?: string;
  createdAt: string;
  resumeJson: {
    raw: string;
    contactInfo: {
      name?: string;
      email?: string;
      phone?: string;
      location?: string;
    };
    education: Array<{
      institution?: string;
      degree?: string;
      date?: string;
    }>;
    experience: Array<{
      company?: string;
      position?: string;
      duration?: string;
      description?: string;
    }>;
    skills: string[];
  };
};

export const ResumePreview: React.FC<ResumePreviewProps> = ({ resumeId }) => {
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchResume = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/resume');
        
        if (!response.ok) {
          throw new Error('Failed to fetch resume data');
        }
        
        const data = await response.json();
        setResume(data);
      } catch (err) {
        console.error('Error fetching resume:', err);
        setError('Could not load resume data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResume();
  }, [resumeId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900">
          <svg className="h-6 w-6 text-red-600 dark:text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No Resume Found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {error || "Please upload a resume to view its details"}
        </p>
      </div>
    );
  }

  const { resumeJson } = resume;
  const contactInfo = resumeJson.contactInfo || {};
  const skills = resumeJson.skills || [];
  const education = resumeJson.education || [];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'skills'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Skills ({skills.length})
          </button>
          <button
            onClick={() => setActiveTab('education')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'education'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Education ({education.length})
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'raw'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Raw Text
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Resume Information</h3>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border rounded-md p-3 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Filename</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{resume.fileName}</p>
                </div>
                <div className="border rounded-md p-3 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Uploaded</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(resume.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Contact Information</h3>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contactInfo.name && (
                  <div className="border rounded-md p-3 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{contactInfo.name}</p>
                  </div>
                )}
                {contactInfo.email && (
                  <div className="border rounded-md p-3 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{contactInfo.email}</p>
                  </div>
                )}
                {contactInfo.phone && (
                  <div className="border rounded-md p-3 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{contactInfo.phone}</p>
                  </div>
                )}
                {contactInfo.location && (
                  <div className="border rounded-md p-3 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{contactInfo.location}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Skills Summary</h3>
              <span className="text-sm text-blue-600 dark:text-blue-400 cursor-pointer" onClick={() => setActiveTab('skills')}>
                View all
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.slice(0, 8).map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                  {skill}
                </span>
              ))}
              {skills.length > 8 && (
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium rounded-full">
                  +{skills.length - 8} more
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Education Summary</h3>
              <span className="text-sm text-blue-600 dark:text-blue-400 cursor-pointer" onClick={() => setActiveTab('education')}>
                View all
              </span>
            </div>
            <div className="space-y-3">
              {education.slice(0, 2).map((edu, index) => (
                <div key={index} className="border rounded-md p-3 dark:border-gray-700">
                  {edu.institution && <p className="text-sm font-medium text-gray-900 dark:text-white">{edu.institution}</p>}
                  {edu.degree && <p className="text-sm text-gray-700 dark:text-gray-300">{edu.degree}</p>}
                  {edu.date && <p className="text-xs text-gray-500 dark:text-gray-400">{edu.date}</p>}
                </div>
              ))}
              {education.length > 2 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  + {education.length - 2} more education entries
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Skills ({skills.length})</h3>
            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span key={index} className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No skills detected in resume</p>
            )}
          </div>
        )}

        {activeTab === 'education' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Education</h3>
            {education.length > 0 ? (
              <div className="space-y-4">
                {education.map((edu, index) => (
                  <div key={index} className="border rounded-md p-4 dark:border-gray-700">
                    {edu.institution && <p className="text-md font-medium text-gray-900 dark:text-white">{edu.institution}</p>}
                    {edu.degree && <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{edu.degree}</p>}
                    {edu.date && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{edu.date}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No education details detected in resume</p>
            )}
          </div>
        )}

        {activeTab === 'raw' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Raw Resume Text</h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 overflow-auto max-h-96">
              <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {resumeJson.raw || "No raw text available"}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
