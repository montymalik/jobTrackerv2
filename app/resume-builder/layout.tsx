// app/resume-builder/layout.tsx
import type { Metadata } from 'next';
import '@/app/components/resume/builder/resume-print.css';

export const metadata: Metadata = {
  title: 'Resume Builder',
  description: 'Create and customize your professional resume',
};

export default function ResumeBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="resume-builder-layout">
      {children}
    </div>
  );
}
