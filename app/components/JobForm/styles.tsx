// Define spinner styles
export const spinnerStyles = `
  @keyframes spinner {
    to {transform: rotate(360deg);}
  }
  .spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    margin-right: 0.5rem;
    border-radius: 50%;
    border: 2px solid #ffffff;
    border-top-color: transparent;
    animation: spinner 0.6s linear infinite;
  }
`;

// File size formatter utility
export const formatFileSize = (sizeInBytes: number) => {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
};
