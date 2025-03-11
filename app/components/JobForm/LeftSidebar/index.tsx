import React from "react";
import { LeftSidebarProps } from "../types";

const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  isOpen, 
  toggleSidebar,
  activeTab,
  setActiveTab,
  navItems,
  onCancel,
  onSubmit,
  isSubmitting,
  job
}) => {
  return (
    <>
      {/* Overlay - visible only when sidebar is open on mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar container */}
      <div 
        className={`
          fixed top-0 left-0 h-full bg-gray-900 dark:bg-gray-900 shadow-lg z-30
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          w-64 lg:w-72
        `}
      >
        {/* Header with close button */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-white font-semibold">{job ? "Edit Job" : "New Job"}</h2>
          <button
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    // On mobile, close sidebar after selection
                    if (window.innerWidth < 1024) {
                      toggleSidebar();
                    }
                  }}
                  className={`w-full flex items-center p-3 rounded-md transition-colors ${
                    activeTab === item.id
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer with action buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
            >
              {isSubmitting ? "Saving..." : job ? "Update" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Toggle button - only visible when sidebar is closed - positioned at bottom left */}
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed bottom-6 left-6 p-3 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 z-40 transition-opacity duration-300"
          aria-label="Toggle navigation"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
    </>
  );
};

export default LeftSidebar;
