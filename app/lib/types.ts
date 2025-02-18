export type ApplicationStatus = "TO_APPLY" | "APPLIED" | "INTERVIEW_SCHEDULED";

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
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  dateSubmitted?: Date | null;
  dateOfInterview?: Date | null;
  confirmationReceived: boolean;
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

