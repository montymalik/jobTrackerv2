import React from "react";
import { NotesTabProps } from "../types";

const NotesTab: React.FC<NotesTabProps> = ({ formState, handleChange }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
        Notes
      </h3>
      <div className="flex flex-col h-[calc(100vh-240px)]">
        <textarea
          name="notes"
          value={formState.notes}
          onChange={handleChange}
          className="w-full flex-1 rounded-md border dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 resize-none"
          placeholder="Add your notes about this job application here..."
        />
      </div>
    </div>
  );
};

export default NotesTab;
