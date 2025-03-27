// app/components/resume/tiptap/tiptap-utils.ts

/**
 * Formats a specific HTML string to ensure bullet points are properly indented and styled
 * This is useful when applying templates or importing content from other sources
 */
export const formatBulletPoints = (html: string): string => {
  // Replace simple bullet points with properly formatted ones
  const formattedHtml = html.replace(
    /<li>(.*?)<\/li>/g, 
    '<li class="text-gray-200"><span style="display:inline-block; margin-left:5em;">• $1</span></li>'
  );
  
  return formattedHtml;
};

/**
 * Adds resume-specific styling to the HTML content
 */
export const applyResumeStyles = (html: string): string => {
  // Replace paragraph tags with styled ones
  let styledHtml = html.replace(
    /<p>/g,
    '<p class="text-gray-200">'
  );
  
  // Style headings
  styledHtml = styledHtml.replace(
    /<h3>/g,
    '<h3 class="text-white font-bold">'
  );
  
  // Ensure ul elements have the proper classes
  styledHtml = styledHtml.replace(
    /<ul>/g,
    '<ul class="list-disc mt-2 pl-5">'
  );
  
  return styledHtml;
};

/**
 * Converts a TipTap HTML string for saving to ensure it's compatible with the resume format
 */
export const prepareTipTapHtmlForSaving = (html: string): string => {
  // First apply resume styles
  let preparedHtml = applyResumeStyles(html);
  
  // Format any bullet points
  preparedHtml = formatBulletPoints(preparedHtml);
  
  return preparedHtml;
};

/**
 * Converts an HTML string to a format that TipTap can properly display
 */
export const prepareHtmlForTipTap = (html: string): string => {
  // Remove certain inline styles that TipTap might handle differently
  let preparedHtml = html.replace(
    /<span style="display:inline-block; margin-left:5em;">(.*?)<\/span>/g,
    '$1'
  );
  
  // Any other TipTap-specific preparations can be added here
  
  return preparedHtml;
};
