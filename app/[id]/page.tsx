// app/resume-builder/[jobId]/page.tsx
"use client"
import React from 'react';
import { useParams } from 'next/navigation';
import ResumeBuilder from '@/app/components/resume/ResumeBuilder';

export default function ResumeEditorPage() {
  const params = useParams();
  const jobId = params?.jobId as string;
  
  return (
    <div className="container mx-auto py-8">
      <ResumeBuilder jobApplicationId={jobId} />
    </div>
  );
}
