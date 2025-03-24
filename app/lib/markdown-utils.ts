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
 * Converts markdown text to HTML with basic formatting
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
    listItemClass?: string
  } = {}
): string => {
  if (!markdown) return '';
  
  const defaultOptions = {
    headingClass: {
      h1: 'text-xl font-bold mb-1',
      h2: 'text-lg font-bold mt-4 mb-2',
      h3: 'text-md font-semibold mt-3 mb-1'
    },
    paragraphClass: 'my-2',
    listClass: 'list-disc pl-5 my-2',
    listItemClass: ''
  };
  
  // Merge options with defaults
  const config = {
    headingClass: { ...defaultOptions.headingClass, ...options.headingClass },
    paragraphClass: options.paragraphClass || defaultOptions.paragraphClass,
    listClass: options.listClass || defaultOptions.listClass,
    listItemClass: options.listItemClass || defaultOptions.listItemClass
  };
  
  // Convert markdown-like content to HTML
  let html = markdown
    // Replace markdown headers
    .replace(/### (.*?)$/gm, `<h3 class="${config.headingClass.h3}">$1</h3>`)
    .replace(/## (.*?)$/gm, `<h2 class="${config.headingClass.h2}">$1</h2>`)
    .replace(/# (.*?)$/gm, `<h1 class="${config.headingClass.h1}">$1</h1>`)
    // Replace bullet points
    .replace(/- (.*?)$/gm, `<li class="${config.listItemClass}">$1</li>`)
    // Fix lists
    .replace(/<li(.*?)>(.*?)<\/li>/g, function(match) {
      return `<ul class="${config.listClass}">${match}</ul>`;
    })
    // Replace multiple newlines with paragraph breaks
    .replace(/\n\s*\n/g, `</p><p class="${config.paragraphClass}">`)
    // Replace single newlines with line breaks
    .replace(/\n/g, '<br>')
    // Wrap in paragraph
    .replace(/^([\s\S]+?)(?=<h|<ul|<p|$)/, `<p class="${config.paragraphClass}">$1</p>`);  // Fix nested lists
  html = html.replace(/<ul>([^<]*)<ul>/g, '<ul>$1');
  html = html.replace(/<\/ul>([^<]*)<\/ul>/g, '$1</ul>');
  
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
    if (section.type === config.headerType) {
      // For header section, extract first line as the main title
      const lines = section.content.trim().split('\n');
      if (lines.length > 0) {
        markdown += `# ${lines[0].trim()}\n`;
        
        // Add remaining content
        if (lines.length > 1) {
          markdown += lines.slice(1).join('\n') + '\n';
        }
      } else {
        markdown += `# Untitled Document\n`;
      }
    } else {
      // For all other sections, add the section title as a level 2 header
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
