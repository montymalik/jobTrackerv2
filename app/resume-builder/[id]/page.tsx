// app/resume-builder/[jobId]/page.tsx
"use client"
import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import ResumeBuilder from '@/app/components/resume/ResumeBuilder';

export default function ResumeBuilderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const jobId = params?.jobId as string;
  const resumeId = searchParams.get('resumeId'); // Extract resumeId from query params
  
  return (
    <div className="container mx-auto py-8">
      <ResumeBuilder 
        jobApplicationId={jobId} 
        resumeId={resumeId || undefined} 
      />
    </div>
  );
}
