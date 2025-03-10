import { useState, ChangeEvent } from "react";
import { JobApplication } from "@/app/lib/types";
import { FormState } from "../types";

export default function useJobForm(job?: JobApplication) {
  const [formState, setFormState] = useState<FormState>({
    companyName: job?.companyName || "",
    jobTitle: job?.jobTitle || "",
    jobUrl: job?.jobUrl || "",
    jobDescription: job?.jobDescription || "",
    confirmationReceived: job?.confirmationReceived || false,
    rejectionReceived: job?.rejectionReceived || false,
    notes: job?.notes || "",
  });

  // Handle keySkills safely regardless of its presence in the JobApplication type
  const [skills, setSkills] = useState<string[]>(
    job && (job as any).keySkills 
      ? ((job as any).keySkills as string).split(",").map((s) => s.trim()) 
      : []
  );

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormState((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
    analyzeSkills
  };
}
