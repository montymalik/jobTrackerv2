import { useState, ChangeEvent } from "react";
import { JobApplication } from "@/app/lib/types";
import { FormState } from "../types";

export default function useJobForm(job?: JobApplication) {
  // Initialize form state with empty strings for dates if none provided
  const [formState, setFormState] = useState<FormState>({
    companyName: job?.companyName || "",
    jobTitle: job?.jobTitle || "",
    jobUrl: job?.jobUrl || "",
    jobDescription: job?.jobDescription || "",
    confirmationReceived: job?.confirmationReceived || false,
    rejectionReceived: job?.rejectionReceived || false,
    notes: job?.notes || "",
    // For date fields, either use a valid formatted date or empty string
    dateSubmitted: job?.dateSubmitted ? formatDateOrEmpty(job.dateSubmitted) : "",
    dateOfInterview: job?.dateOfInterview ? formatDateOrEmpty(job.dateOfInterview) : "",
  });

  // Helper to format a date or return empty string if invalid
  function formatDateOrEmpty(dateInput: any): string {
    try {
      const date = new Date(dateInput);
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return "";
      }
      // Format as YYYY-MM-DD for date input
      return date.toISOString().split('T')[0];
    } catch (e) {
      console.error("Invalid date:", e);
      return "";
    }
  }

  const [skills, setSkills] = useState<string[]>(
    job && job.keySkills ? job.keySkills.split(",").map((s) => s.trim()) : []
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormState((prev) => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === "date") {
      // For date inputs, log the value and update state
      console.log(`Date ${name} changed to:`, value);
      setFormState((prev) => ({
        ...prev,
        [name]: value
      }));
    } else {
      // For all other inputs
      setFormState((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Prepare form data for submission
  const prepareFormData = () => {
    const formData = new FormData();
    
    // Add all non-date fields
    for (const [key, value] of Object.entries(formState)) {
      if (key !== 'dateSubmitted' && key !== 'dateOfInterview') {
        formData.append(key, String(value));
      }
    }
    
    // Only add date fields if they're not empty
    if (formState.dateSubmitted) {
      formData.append('dateSubmitted', new Date(formState.dateSubmitted).toISOString());
    }
    
    if (formState.dateOfInterview) {
      formData.append('dateOfInterview', new Date(formState.dateOfInterview).toISOString());
    }
    
    return formData;
  };

  const analyzeSkills = async () => {
    if (!formState.jobDescription.trim()) {
      console.error("Job description is missing!");
      return;
    }
    
    // Check for job ID - but don't block if it's a new job
    const jobId = job?.id;
    
    // Show loading spinner
    setIsAnalyzing(true);
    
    try {
      const response = await fetch("/api/gemini/analyze-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDescription: formState.jobDescription,
          jobId: jobId || "temp-id", // Use a temporary ID if no job ID exists
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to analyze skills:", errorText);
        return;
      }
      const data = await response.json();
      setSkills(data.skills || []);
    } catch (error) {
      console.error("Error analyzing skills:", error);
    } finally {
      // Hide loading spinner when done (whether successful or not)
      setIsAnalyzing(false);
    }
  };

  return {
    formState,
    setFormState,
    skills,
    setSkills,
    handleChange,
    isAnalyzing,
    analyzeSkills,
    prepareFormData
  };
}
