import React from "react";
import { JobDescriptionTabProps } from "../types";

const JobDescriptionTab: React.FC<JobDescriptionTabProps> = ({ 
  formState, 
  handleChange, 
  skills, 
  isAnalyzing, 
  analyzeSkills 
}) => {
  // Split skills into two columns for display
  const mid = Math.ceil(skills.length / 2);
  const skillsCol1 = skills.slice(0, mid);
  const skillsCol2 = skills.slice(mid);
  
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Job Description
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-240px)]">
        {/* Left Column: Job Description Field */}
        <div className="flex flex-col h-full">
          <label className="block text-sm font-medium dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            name="jobDescription"
            value={formState.jobDescription}
            onChange={handleChange}
            className="w-full flex-1 rounded-md border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 resize-none"
          />
          <button
            type="button"
            onClick={analyzeSkills}
            disabled={isAnalyzing}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 flex items-center justify-center"
          >
            {isAnalyzing ? (
              <>
                <span className="spinner"></span>
                Analyzing...
              </>
            ) : (
              "Analyze Skills"
            )}
          </button>
        </div>
        {/* Right Column: Key Skills */}
        <div className="flex flex-col h-full">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Key Skills
          </h4>
          {skills.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 flex-grow bg-gray-50 dark:bg-gray-900 p-4 rounded-md overflow-y-auto">
              <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
                {skillsCol1.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
              <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
                {skillsCol2.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
              <p className="text-gray-500 dark:text-gray-400">
                No skills analyzed yet. Click "Analyze Skills" to extract key skills from the job description.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDescriptionTab;
