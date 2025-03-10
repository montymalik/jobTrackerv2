import React from "react";
import { FilesTabProps } from "../types";
import { formatFileSize } from "../styles";

const FilesTab: React.FC<FilesTabProps> = ({
  files,
  existingFiles,
  fileInputRef,
  handleFileUpload,
  handleFileChange,
  setFiles
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Uploaded Files
        </h3>
        <button
          type="button"
          onClick={handleFileUpload}
          className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-[calc(100vh-240px)] overflow-y-auto">
        {/* Display existing files */}
        {existingFiles.map((file, index) => (
          <div key={`existing-${index}`} className="p-4 border rounded-md dark:border-gray-700 hover:shadow-md transition-shadow">
            <div 
              className="flex flex-col items-center cursor-pointer" 
              onClick={() => window.open(file.nextcloudPath, '_blank')}
            >
              <div className="w-24 h-32 flex items-center justify-center border rounded-md mb-2 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="text-center p-2 bg-gray-100 dark:bg-gray-700 text-red-400 rounded-md">
                  PDF
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium truncate w-40">{file.fileName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  PDF - {formatFileSize(file.fileSize || 43600)} {/* Default size if not available */}
                </p>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Uploaded {file.createdAt ? new Date(file.createdAt).toLocaleString() : "previously"}
              </div>
            </div>
            <div className="mt-2 flex justify-between">
              <button 
                type="button" 
                className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
              >
                {file.fileType === 'application/pdf' ? 'Resume' : 'Cover Letter'}
              </button>
              <button 
                type="button" 
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        
        {/* Display newly uploaded files (not yet saved) */}
        {files.map((file, index) => (
          <div key={`new-${index}`} className="p-4 border rounded-md dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center cursor-pointer" 
              onClick={() => {
                // Create a URL for the file
                const fileUrl = URL.createObjectURL(file);
                window.open(fileUrl, '_blank');
              }}
            >
              <div className="w-24 h-32 flex items-center justify-center border rounded-md mb-2 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="text-center p-2 bg-gray-100 dark:bg-gray-700 text-red-400 rounded-md">
                  {file.type.includes('pdf') ? 'PDF' : file.type.includes('doc') ? 'DOC' : 'FILE'}
                </div>
              </div>
              <div className="text-center">
                <p className="font-medium truncate w-40">{file.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {file.type.split('/')[1]?.toUpperCase() || 'FILE'} - {formatFileSize(file.size)}
                </p>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Just now (not saved yet)
              </div>
            </div>
            <div className="mt-2 flex justify-between">
              <button 
                type="button" 
                className="px-3 py-1 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
              >
                {file.name.toLowerCase().includes('resume') ? 'Resume' : 'Cover Letter'}
              </button>
              <button 
                type="button" 
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent opening the file when clicking the delete button
                  setFiles(files.filter((_, i) => i !== index));
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        
        {/* Empty state if no files */}
        {existingFiles.length === 0 && files.length === 0 && (
          <div className="col-span-full p-8 border rounded-md text-center dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              No files uploaded yet. Click the + button to upload files.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilesTab;
