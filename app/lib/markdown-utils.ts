// app/lib/markdown-utils.ts
/**
 * Generic section interface that can be extended by specific implementations
 */
export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  type: string;
}

/**
 * Default styling options for markdown to HTML conversion
 * These can be imported and used directly in components
 */
export const defaultMarkdownHtmlOptions = {
  headingClass: {
    h1: 'text-xl font-bold mb-1',
    h2: 'text-lg font-bold mt-4 mb-2',
    h3: 'text-md font-semibold mt-3 mb-1'
  },
  paragraphClass: 'my-2',
  listClass: 'list-disc pl-5 my-2 space-y-2',
  listItemClass: 'leading-relaxed',
  strongClass: 'font-semibold',
  emphasisClass: 'italic'
};

/**
 * Converts markdown text to HTML with enhanced formatting
 * @param markdown Markdown text to convert
 * @param options Optional configuration for HTML conversion
 * @returns HTML string
 */
export const markdownToHtml = (
  markdown: string, 
  options: {
    headingClass?: {
      h1?: string,
      h2?: string,
      h3?: string
    },
    paragraphClass?: string,
    listClass?: string,
    listItemClass?: string,
    strongClass?: string,
    emphasisClass?: string
  } = {}
): string => {
  if (!markdown) return '';
  
  // Merge options with defaults
  const config = {
    headingClass: { ...defaultMarkdownHtmlOptions.headingClass, ...options.headingClass },
    paragraphClass: options.paragraphClass || defaultMarkdownHtmlOptions.paragraphClass,
    listClass: options.listClass || defaultMarkdownHtmlOptions.listClass,
    listItemClass: options.listItemClass || defaultMarkdownHtmlOptions.listItemClass,
    strongClass: options.strongClass || defaultMarkdownHtmlOptions.strongClass,
    emphasisClass: options.emphasisClass || defaultMarkdownHtmlOptions.emphasisClass
  };
  
  // Process different markdown elements in the correct order
  
  // First, handle code blocks to protect them from other processing
  let processedText = markdown;
  
  // Replace strong emphasis (bold) - do this before other formatting
  processedText = processedText.replace(/\*\*(.*?)\*\*/g, `<strong class="${config.strongClass}">$1</strong>`);
  
  // Replace emphasis (italic)
  processedText = processedText.replace(/\*(.*?)\*/g, `<em class="${config.emphasisClass}">$1</em>`);
  
  // Convert markdown-like content to HTML
  let html = processedText
    // Replace markdown headers
    .replace(/### (.*?)$/gm, `<h3 class="${config.headingClass.h3}">$1</h3>`)
    .replace(/## (.*?)$/gm, `<h2 class="${config.headingClass.h2}">$1</h2>`)
    .replace(/# (.*?)$/gm, `<h1 class="${config.headingClass.h1}">$1</h1>`);
    
  // Improved list handling - gather all list items first
  const listItems: string[] = [];
  const listItemRegex = /^- (.*?)$/gm;
  let match;
  
  while ((match = listItemRegex.exec(html)) !== null) {
    listItems.push(match[1]);
    // Replace the matched content with a placeholder
    html = html.replace(match[0], `%%LIST_ITEM_${listItems.length - 1}%%`);
  }
  
  // Now create the full list HTML if we have any list items
  if (listItems.length > 0) {
    let listHtml = `<ul class="${config.listClass}">`;
    
    for (let i = 0; i < listItems.length; i++) {
      listHtml += `<li class="${config.listItemClass}">${listItems[i]}</li>`;
    }
    
    listHtml += '</ul>';
    
    // Replace all list item placeholders with the full list
    const allPlaceholders = listItems.map((_, i) => `%%LIST_ITEM_${i}%%`).join('|');
    const placeholderRegex = new RegExp(`(${allPlaceholders})`, 'g');
    
    // Replace the first placeholder with the list HTML and remove others
    let replacementDone = false;
    html = html.replace(placeholderRegex, match => {
      if (!replacementDone) {
        replacementDone = true;
        return listHtml;
      }
      return '';
    });
  }
  
  // Replace multiple newlines with paragraph breaks
  html = html.replace(/\n\s*\n/g, `</p><p class="${config.paragraphClass}">`);
  
  // Replace single newlines with line breaks
  html = html.replace(/\n/g, '<br>');
  
  // Wrap content in paragraph if it doesn't start with a specific HTML tag
  if (!html.trim().startsWith('<h') && !html.trim().startsWith('<ul') && !html.trim().startsWith('<p')) {
    html = `<p class="${config.paragraphClass}">${html}</p>`;
  }
  
  return html;
};

/**
 * Converts HTML to markdown format
 * @param html HTML string to convert
 * @returns Markdown string
 */
export const htmlToMarkdown = (html: string): string => {
  if (!html) return '';
  
  let markdown = html
    // Replace HTML headers
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    // Replace emphasis
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    // Replace lists
    .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, '$1\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    // Replace paragraphs
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    // Replace line breaks
    .replace(/<br\s*\/?>/gi, '\n')
    // Remove remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return markdown;
};

/**
 * General purpose function that determines a type/category from a given title
 * Can be extended to support different categorization schemes
 * @param title The title to categorize
 * @param categoriesMap Optional map of keywords to categories
 * @returns The determined category or default
 */
export const categorizeTitleByKeywords = <T extends string>(
  title: string, 
  categoriesMap: Record<string, string[]>,
  defaultCategory: T
): T => {
  const normalizedTitle = title.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoriesMap)) {
    if (keywords.some(keyword => normalizedTitle.includes(keyword))) {
      return category as T;
    }
  }
  
  return defaultCategory;
};

/**
 * Converts structured sections to a combined markdown string
 * @param sections Array of document section objects
 * @param options Custom formatting options 
 * @returns Combined markdown string
 */
export const sectionsToMarkdown = <T extends DocumentSection>(
  sections: T[],
  options: {
    headerType?: string;
    spaceBetweenSections?: number;
  } = {}
): string => {
  const config = {
    headerType: options.headerType || 'HEADER',
    spaceBetweenSections: options.spaceBetweenSections || 2
  };
  
  let markdown = '';
  
  // Process each section
  sections.forEach((section, index) => {
    // Add spacing between sections
    if (index > 0) {
      markdown += '\n'.repeat(config.spaceBetweenSections);
    }
    
    // Add section header based on type
    if (config.headerType === 'HEADER') {
      markdown += `## ${section.title}\n${section.content}`;
    } else {
      // For all other section types, use standard markdown headers
      markdown += `## ${section.title}\n${section.content}`;
    }
  });
  
  return markdown;
};

/**
 * Parses markdown content into structured sections
 * @param markdown Raw markdown content
 * @param options Configuration options for parsing
 * @returns Array of parsed sections
 */
export const markdownToSections = <T extends DocumentSection>(
  markdown: string,
  options: {
    getSectionType?: (title: string) => string;
    defaultSectionType?: string;
    sectionIdPrefix?: string;
    headerType?: string;
    createSection?: (id: string, type: string, title: string, content: string) => T;
  } = {}
): T[] => {
  const sections: T[] = [];
  const lines = markdown.split('\n');
  
  const defaultOptions = {
    getSectionType: (title: string) => 'SECTION',
    defaultSectionType: 'SECTION',
    sectionIdPrefix: 'section-',
    headerType: 'HEADER',
    createSection: (id: string, type: string, title: string, content: string): T => {
      return { id, type, title, content } as T;
    }
  };
  
  const config = {
    getSectionType: options.getSectionType || defaultOptions.getSectionType,
    defaultSectionType: options.defaultSectionType || defaultOptions.defaultSectionType,
    sectionIdPrefix: options.sectionIdPrefix || defaultOptions.sectionIdPrefix,
    headerType: options.headerType || defaultOptions.headerType,
    createSection: options.createSection || defaultOptions.createSection
  };
  
  // Initialize with header section
  let currentSection = config.createSection(
    'header',
    config.headerType,
    'Header',
    ''
  );
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Main header (usually title)
    if (line.startsWith('# ')) {
      currentSection.content += line.substring(2) + '\n';
    }
    // Section headers
    else if (line.startsWith('## ')) {
      // Save previous section if it's not empty
      if (currentSection.content.trim()) {
        sections.push(currentSection);
      }
      
      // Start new section
      const sectionTitle = line.substring(3).trim();
      const sectionType = config.getSectionType(sectionTitle);
      currentSection = config.createSection(
        `${config.sectionIdPrefix}${sections.length}`,
        sectionType,
        sectionTitle,
        ''
      );
    }
    // Subsection headers
    else if (line.startsWith('### ')) {
      // Add subsection header to current section
      currentSection.content += line + '\n';
    }
    // Regular content
    else {
      // Add line to current section
      currentSection.content += line + '\n';
    }
    
    i++;
  }
  
  // Add the last section
  if (currentSection.content.trim()) {
    sections.push(currentSection);
  }
  
  return sections;
};
