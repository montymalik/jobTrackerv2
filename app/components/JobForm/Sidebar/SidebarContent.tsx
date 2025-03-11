import React from "react";
import { SidebarContentProps } from "../types";

const SidebarContent: React.FC<SidebarContentProps> = ({ 
  formState,
  job,
  skills
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-200">
          {job ? 'Edit Job' : 'New Job'}
        </h2>
        <div className="h-1 w-20 bg-blue-500 rounded"></div>
      </div>

      {/* Job Summary */}
      {formState.companyName && (
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
            {formState.jobTitle || 'Untitled Position'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {formState.companyName}
          </p>
          
          {formState.jobUrl && (
            <p className="text-blue-600 dark:text-blue-400 mt-1 text-sm truncate">
              <a href={formState.jobUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                {formState.jobUrl}
              </a>
            </p>
          )}
          
          {/* Application Status */}
          <div className="mt-3 flex flex-wrap gap-2">
            {formState.confirmationReceived && (
              <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Confirmation Received
              </span>
            )}
            {formState.rejectionReceived && (
              <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                Rejection Received
              </span>
            )}
          </div>
        </div>
      )}

      {/* Key Skills */}
      {skills && skills.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Key Skills</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span 
                key={index}
                className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Application Timeline */}
      {(formState.dateSubmitted || formState.dateOfInterview) && (
        <div>
          <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Timeline</h3>
          <div className="space-y-3">
            {formState.dateSubmitted && (
              <div className="flex items-start">
                <div className="mr-3 mt-1">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Applied</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{formState.dateSubmitted}</p>
                </div>
              </div>
            )}
            
            {formState.dateOfInterview && (
              <div className="flex items-start">
                <div className="mr-3 mt-1">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs">📞</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-200">Interviewed</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{formState.dateOfInterview}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes Preview */}
      {formState.notes && (
        <div>
          <h3 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">Notes</h3>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm text-gray-700 dark:text-gray-300">
            {formState.notes.length > 150 
              ? `${formState.notes.substring(0, 150)}...` 
              : formState.notes}
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarContent;
