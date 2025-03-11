import React from "react";
import { sidebarStyles } from "./styles";
import { SidebarProps } from "../types";

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  toggleSidebar, 
  children 
}) => {
  return (
    <>
      {/* Overlay - visible only when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar container */}
      <div 
        className={`
          fixed top-0 right-0 h-full bg-white dark:bg-gray-800 shadow-lg z-30
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          w-72 lg:w-80
        `}
      >
        {/* Close button */}
        <button
          onClick={toggleSidebar}
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Sidebar content */}
        <div className="p-6 pt-12 h-full overflow-y-auto">
          {children}
        </div>
      </div>

      {/* Toggle button - visible on all screens */}
      <button
        onClick={toggleSidebar}
        className="fixed bottom-6 right-6 p-3 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 z-10"
        aria-label="Toggle sidebar"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>
    </>
  );
};

export default Sidebar;
