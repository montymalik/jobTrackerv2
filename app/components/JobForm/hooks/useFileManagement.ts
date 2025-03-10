import { useState, useRef, ChangeEvent } from "react";
import { JobApplication } from "@/app/lib/types";

export default function useFileManagement(job?: JobApplication) {
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize existing files from job
  useState(() => {
    if (job?.files) {
      setExistingFiles(job.files);
    }
  });
  
  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };
  
  return {
    files,
    setFiles,
    existingFiles,
    setExistingFiles,
    fileInputRef,
    handleFileUpload,
    handleFileChange
  };
}
