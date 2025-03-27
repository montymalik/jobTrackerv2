// app/api/resume/resume-editor/[id]/page.tsx
"use client"
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
// Remove the problematic import that's causing the build error
// import { ResumeSection } from '@/app/lib/types';
import ResumeEditor from '@/app/components/resume/ResumeEditor';

export default function ResumeEditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const resumeId = params?.id as string;
  // Extract jobApplicationId using the Next.js hook
  const jobApplicationId = searchParams.get('jobApplicationId');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Add debugging logs to see the actual values
  useEffect(() => {
    console.log("ResumeEditorPage parameters:", {
      resumeId,
      jobApplicationId,
      rawSearchParams: searchParams.toString()
    });
  }, [resumeId, jobApplicationId, searchParams]);

  // Clear success message after a delay
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);
  
  // Function to save resume - updated to accept structured resume data
  const handleSaveResume = async (resumeData: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Saving resume with jobApplicationId:", jobApplicationId);
      
      // Add jobApplicationId to the resume data
      if (jobApplicationId) {
        resumeData.jobApplicationId = jobApplicationId;
      }
      
      // API call to save resume
      const response = await fetch(`/api/resume/update/${resumeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resumeData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save resume');
      }
      
      // Successfully saved
      console.log("Resume saved successfully");
      setSaveSuccess(true);
      
    } catch (err) {
      console.error('Error saving resume:', err);
      setError('Failed to save resume. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Resume Editor</h1>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded text-gray-800 dark:text-gray-200"
        >
          Back to Job
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-md border border-red-200">
          {error}
        </div>
      )}
      
      {saveSuccess && (
        <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-md border border-green-200">
          Resume saved successfully!
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <ResumeEditor
          resumeId={resumeId}
          jobApplicationId={jobApplicationId || undefined}
          onSave={handleSaveResume}
        />
      </div>
    </div>
  );
}
