import { useState, useEffect } from 'react';

const useLeftSidebar = () => {
  // Initialize with closed state for all screens
  // We'll now use hover mechanics in the component itself
  const [isOpen, setIsOpen] = useState(false);

  // Toggle sidebar state - this is now only used for explicit opening/closing
  const toggleSidebar = () => {
    setIsOpen(prevState => !prevState);
  };

  // Handle Escape key to close sidebar
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      // Clean up event listener
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);
  
  return {
    isOpen,
    setIsOpen,
    toggleSidebar
  };
};

export default useLeftSidebar;
