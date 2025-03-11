import { useState, useRef, useEffect } from "react";
import { JobApplication } from "@/app/lib/types";

// Add interface for JobFile
interface JobFile {
  id: string;
  fileName: string;
  fileType: string;
  nextcloudPath: string;
  createdAt?: string;
  updatedAt?: string;
  jobApplicationId: string;
}

export default function useFileManagement(job?: JobApplication) {
  const [files, setFiles] = useState<File[]>([]);
  // Update type to match the expected JobFile structure
  const [existingFiles, setExistingFiles] = useState<JobFile[]>([]);
  
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
      // Change the endpoint to use the existing API without /files
      const response = await fetch(`/api/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        // Extract files from the job data
        console.log("Job data received:", data);
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
