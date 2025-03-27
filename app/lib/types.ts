export type ApplicationStatus = "TO_APPLY" | "APPLIED" | "INTERVIEW_SCHEDULED" | "ARCHIVED";

export interface JobApplication {
  id: string;
  companyName: string;
  jobTitle: string;
  jobDescription?: string | null;
  jobUrl?: string | null;
  status: ApplicationStatus;
  dateApplied?: Date | null;
  contactInfo?: any;
  hasBeenContacted: boolean;
  files: JobFile[];
  keySkills?: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  dateSubmitted?: Date | null;
  dateOfInterview?: Date | null;
  confirmationReceived: boolean;
  rejectionReceived?: boolean;
}

export interface JobFile {
  id: string;
  fileName: string;
  fileType: string;
  nextcloudPath: string;
  jobApplicationId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Changed from a union type to an enum
export enum ResumeSectionType {
  HEADER = "HEADER",
  SUMMARY = "SUMMARY",
  EXPERIENCE = "EXPERIENCE",
  EDUCATION = "EDUCATION",
  SKILLS = "SKILLS",
  CERTIFICATIONS = "CERTIFICATIONS",
  PROJECTS = "PROJECTS",
  OTHER = "OTHER",
  JOB_ROLE = "JOB_ROLE"
}

// app/lib/types.ts
export interface ResumeSection {
  id: string;  // Added id property
  type: ResumeSectionType;
  title: string; // Section title
  content: string; // Section content
  parentId?: string; // Fixed the syntax error (removed extra question mark)
}

export interface FormState {
  companyName: string;
  jobTitle: string;
  jobDescription: string;
  // Add any other properties used in your form
}

export interface GeneratedResume {
  id: string;
  markdownContent: string;
  fileName: string | null;
  version: number;
  isPrimary?: boolean;
  jobApplicationId?: string;
  updatedAt?: Date | string;
  createdAt?: Date | string;
}

export interface ResumeGeneratorTabProps {
  formState: FormState;
  jobId?: string;
  onResumeGenerated?: (resumeId: string | null) => void;
  selectedResume?: GeneratedResume | null;
}
