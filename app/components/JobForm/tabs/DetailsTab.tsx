import React, { useEffect } from "react";
import { DetailsTabProps } from "../types";

const DetailsTab: React.FC<DetailsTabProps> = ({ formState, handleChange }) => {
  // Add debugging for date values
  useEffect(() => {
    console.log("Date values in DetailsTab:", {
      dateSubmitted: formState.dateSubmitted,
      dateOfInterview: formState.dateOfInterview
    });
  }, [formState.dateSubmitted, formState.dateOfInterview]);

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Job Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium dark:text-gray-300">
            Company Name
          </label>
          <input
            type="text"
            name="companyName"
            value={formState.companyName}
            onChange={handleChange}
            className="w-full rounded-md border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium dark:text-gray-300">
            Job Title
          </label>
          <input
            type="text"
            name="jobTitle"
            value={formState.jobTitle}
            onChange={handleChange}
            className="w-full rounded-md border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium dark:text-gray-300">
            Job URL
          </label>
          <input
            type="url"
            name="jobUrl"
            value={formState.jobUrl}
            onChange={handleChange}
            className="w-full rounded-md border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
          />
        </div>
        
        {/* Date Submitted Field */}
        <div>
          <label className="block text-sm font-medium dark:text-gray-300">
            Date Submitted
          </label>
          <input
            type="date"
            name="dateSubmitted"
            value={formState.dateSubmitted || ''}
            onChange={handleChange}
            className="w-full rounded-md border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
            // Add the key prop to force re-render when the value changes
            key={`dateSubmitted-${formState.dateSubmitted || 'empty'}`}
          />
        </div>
        
        {/* Date of Interview Field */}
        <div>
          <label className="block text-sm font-medium dark:text-gray-300">
            Date of Interview
          </label>
          <input
            type="date"
            name="dateOfInterview"
            value={formState.dateOfInterview || ''}
            onChange={handleChange}
            className="w-full rounded-md border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100"
            // Add the key prop to force re-render when the value changes
            key={`dateOfInterview-${formState.dateOfInterview || 'empty'}`}
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="confirmationReceived"
              name="confirmationReceived"
              checked={formState.confirmationReceived}
              onChange={handleChange}
              className="h-5 w-5 rounded dark:border-gray-700 dark:bg-gray-700"
            />
            <label 
              htmlFor="confirmationReceived"
              className="ml-2 text-sm font-medium dark:text-gray-300"
            >
              Confirmation Received
            </label>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rejectionReceived"
              name="rejectionReceived"
              checked={formState.rejectionReceived}
              onChange={handleChange}
              className="h-5 w-5 rounded dark:border-gray-700 dark:bg-gray-700"
            />
            <label 
              htmlFor="rejectionReceived"
              className="ml-2 text-sm font-medium dark:text-gray-300"
            >
              Rejection Received
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsTab;
