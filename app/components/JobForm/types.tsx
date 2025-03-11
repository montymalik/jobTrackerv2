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
}
