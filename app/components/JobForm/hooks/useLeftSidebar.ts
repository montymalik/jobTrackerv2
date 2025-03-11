import { useState, useEffect } from 'react';

const useLeftSidebar = () => {
  // Initialize with closed state on mobile, open on desktop
  const [isOpen, setIsOpen] = useState(() => {
    // If window is available (client-side), check width
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false; // Default to closed on server-side rendering
  });

  // Toggle sidebar state
  const toggleSidebar = () => {
    setIsOpen(prevState => !prevState);
  };

  // Close sidebar when pressing Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && window.innerWidth < 1024) {
        setIsOpen(false);
      }
    };

    // Handle window resize
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Always open on desktop
        setIsOpen(true);
      } else {
        // Default to closed on mobile
        setIsOpen(false);
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleResize);
    
    return () => {
      // Clean up event listeners
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);
  
  return {
    isOpen,
    setIsOpen,
    toggleSidebar
  };
};

export default useLeftSidebar;
