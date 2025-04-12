import { JobApplication } from "@/app/lib/types";
import { RefObject, ChangeEvent } from "react";

export interface JobFormProps {
  job?: JobApplication;
  onSubmit: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

export interface FormState {
  companyName: string;
  jobTitle: string;
  jobUrl: string;
  jobDescription: string;
  confirmationReceived: boolean;
  rejectionReceived: boolean;
  notes: string;
  dateSubmitted: string | null;
  dateOfInterview: string | null;
}

export interface GeneratedResume {
  id: string;
  markdownContent: string;
  jsonContent: string;
  version: number;
  jobApplicationId: string;
  isPrimary: boolean;
  fileName: string | null;
  filePath: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface CoverLetter {
  id: string;
  content: string;
  version: number;
  jobApplicationId: string;
  isPrimary: boolean;
  fileName: string | null;
  filePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DetailsTabProps {
  formState: FormState;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export interface JobDescriptionTabProps {
  formState: FormState;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  skills: string[];
  isAnalyzing: boolean;
  analyzeSkills: () => Promise<void>;
}

export interface NotesTabProps {
  formState: FormState;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export interface FilesTabProps {
  files: File[];
  existingFiles: any[];
  fileInputRef: RefObject<HTMLInputElement>;
  handleFileUpload: () => void;
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export interface CoverLetterTabProps {
  formState: FormState;
  jobId?: string;
  selectedCoverLetter: CoverLetter | null;
  onCoverLetterGenerated: (coverLetterId: string | null) => void;
}

export interface ResumeGeneratorTabProps {
  formState: FormState;
  jobId?: string;
  onResumeGenerated?: (resumeId: string | null) => void;
  selectedResume?: GeneratedResume | null;
}

export interface SavedResumesTabProps {
  jobId?: string;
  onSelectResume?: (resume: GeneratedResume) => void;
  onViewInEditor?: (resume: GeneratedResume) => void;
  currentResumeId?: string | null;
}

export interface AIToolsTabProps {
  formState: FormState;
  jobId?: string;
}

// Right sidebar types
export interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  children: React.ReactNode;
}

export interface SidebarContentProps {
  formState: FormState;
  job?: JobApplication;
  skills: string[];
}

// Left navigation sidebar types
export interface LeftSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  navItems: Array<{
    id: string;
    label: string;
    icon: string;
  }>;
  onCancel: () => void;
  onSubmit: (e?: React.FormEvent) => void;
  isSubmitting: boolean;
  job?: JobApplication;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
}
