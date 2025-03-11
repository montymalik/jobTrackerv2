// Sidebar styles
export const sidebarStyles = `
  .sidebar-enter {
    transform: translateX(100%);
  }
  .sidebar-enter-active {
    transform: translateX(0);
    transition: transform 300ms ease-in-out;
  }
  .sidebar-exit {
    transform: translateX(0);
  }
  .sidebar-exit-active {
    transform: translateX(100%);
    transition: transform 300ms ease-in-out;
  }
  
  .overlay-enter {
    opacity: 0;
  }
  .overlay-enter-active {
    opacity: 1;
    transition: opacity 300ms ease-in-out;
  }
  .overlay-exit {
    opacity: 1;
  }
  .overlay-exit-active {
    opacity: 0;
    transition: opacity 300ms ease-in-out;
  }
`;
