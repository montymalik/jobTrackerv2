import { useState, useRef, useEffect } from "react";
import { JobApplication } from "@/app/lib/types";

export default function useFileManagement(job?: JobApplication) {
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<string[]>([]);
  
  // Correct way to type a ref - it will hold an HTMLInputElement but starts as null
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Effect to fetch existing files if job exists
  useEffect(() => {
    if (job?.id) {
      // Fetch existing files
      fetchExistingFiles(job.id);
    }
  }, [job?.id]);
  
  // Function to fetch existing files
  const fetchExistingFiles = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/files`);
      if (response.ok) {
        const data = await response.json();
        setExistingFiles(data.files || []);
      }
    } catch (error) {
      console.error("Error fetching existing files:", error);
    }
  };
  
  // Function to trigger file input
  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Function to handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Convert FileList to array and append to existing files
      const newFiles = Array.from(e.target.files);
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
      
      // Clear the input value to allow selecting the same file again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  
  return {
    files,
    setFiles,
    existingFiles,
    fileInputRef,
    handleFileUpload,
    handleFileChange
  };
}
