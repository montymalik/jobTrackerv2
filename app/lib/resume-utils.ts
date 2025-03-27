// app/lib/resume-utils.ts
import { ResumeSection, ResumeSectionType } from './types';

/**
 * Type guard functions to check section types
 */
const isHeaderSection = (section: ResumeSection): boolean => 
  section.type === 'HEADER';

const isSummarySection = (section: ResumeSection): boolean => 
  section.type === 'SUMMARY';

const isExperienceSection = (section: ResumeSection): boolean => 
  section.type === 'EXPERIENCE';

const isJobRoleSection = (section: ResumeSection): boolean => 
  section.type === 'JOB_ROLE';

const isEducationSection = (section: ResumeSection): boolean => 
  section.type === 'EDUCATION';

const isSkillsSection = (section: ResumeSection): boolean => 
  section.type === 'SKILLS';

const isCertificationsSection = (section: ResumeSection): boolean => 
  section.type === 'CERTIFICATIONS';

const isProjectsSection = (section: ResumeSection): boolean => 
  section.type === 'PROJECTS';

const isOtherSection = (section: ResumeSection): boolean => 
  section.type === 'OTHER';

/**
 * Processes HTML content to ensure bullet points have proper indentation
 */
const formatBulletPoints = (content: string): string => {
  // Add proper indentation to bullet points
  return content
    // Format HTML bullet points (li elements)
    .replace(
      /<li([^>]*)>(.*?)<\/li>/gi, 
      '<li$1 class="ml-5 pl-5">$2</li>'
    )
    // Format plain bullet points (not in li elements)
    .replace(
      /(<p[^>]*>|<div[^>]*>|\n|^)\s*([•●])\s+([^<\n]+)/gi, 
      '$1<span class="inline-block ml-5 pl-5">$2 $3</span>'
    )
    // Handle cases where there's just a bullet at the start of a line
    .replace(
      /^([•●])\s+([^<\n]+)/gm, 
      '<span class="inline-block ml-5 pl-5">$1 $2</span>'
    );
};

/**
 * Formats an existing resume to ensure all bullet points are properly indented
 */
export const formatExistingResume = (sections: ResumeSection[]): ResumeSection[] => {
  return sections.map(section => {
    // Only process job role sections
    if (isJobRoleSection(section)) {
      return {
        ...section,
        content: formatBulletPoints(section.content)
      };
    }
    return section;
  });
};

/**
 * Categorize a section title into an appropriate resume section type
 */
export const getSectionTypeFromTitle = (title: string): ResumeSectionType => {
  const categoriesMap: Record<string, string[]> = {
    'SUMMARY': ['summary', 'objective', 'profile', 'about'],
    'EXPERIENCE': ['experience', 'work', 'employment', 'job', 'career', 'professional'],
    'EDUCATION': ['education', 'academic', 'school', 'university', 'college', 'degree'],
    'SKILLS': ['skill', 'expertise', 'competency', 'proficiency'],
    'CERTIFICATIONS': ['certification', 'certificate', 'licence', 'license', 'credential'],
    'PROJECTS': ['project', 'portfolio', 'achievement'],
    'HEADER': ['header', 'contact', 'personal'],
    'JOB_ROLE': ['manager', 'director', 'leader', 'engineer', 'specialist', 'analyst', 'developer', 'consultant'],
    'OTHER': []
  };
  
  const normalizedTitle = title.toLowerCase();
  
  for (const [type, keywords] of Object.entries(categoriesMap)) {
    if (keywords.some(keyword => normalizedTitle.includes(keyword))) {
      return type as ResumeSectionType;
    }
  }
  
  return 'OTHER' as ResumeSectionType;
};

/**
 * Check if a string contains job role identifiers
 */
const isJobRoleTitle = (text: string): boolean => {
  // Common job title patterns
  const jobPatterns = [
    /manager/i, /director/i, /leader/i, /engineer/i, /specialist/i, 
    /analyst/i, /developer/i, /consultant/i, /chief/i, /officer/i,
    /head of/i, /lead/i, /coordinator/i, /supervisor/i, /administrator/i
  ];
  
  return jobPatterns.some(pattern => pattern.test(text));
};

/**
 * Split job experience content into individual job roles
 */
const splitJobExperiences = (experienceContent: string): ResumeSection[] => {
  const sections: ResumeSection[] = [];
  
  // Look for job title patterns that typically start a new job entry
  // This regex looks for patterns like "Job Title, Company | Date - Date" or variations
  const jobTitleRegex = /<h3[^>]*>([^<]+)<\/h3>|<strong[^>]*>([^<]+)<\/strong>|<div[^>]*class="[^"]*job-title[^"]*"[^>]*>([^<]+)<\/div>/gi;
  
  // Extract job sections
  let match;
  let lastIndex = 0;
  let jobSections: {title: string, startIndex: number, endIndex?: number}[] = [];
  
  // Find all job titles and their positions
  while ((match = jobTitleRegex.exec(experienceContent)) !== null) {
    const title = (match[1] || match[2] || match[3]).trim();
    if (isJobRoleTitle(title) || title.includes('Manager') || title.includes('Leader') || 
        title.includes('Engineer') || title.includes('Director')) {
      jobSections.push({
        title: title,
        startIndex: match.index
      });
    }
  }
  
  // Set end indices for each job section
  for (let i = 0; i < jobSections.length; i++) {
    if (i < jobSections.length - 1) {
      jobSections[i].endIndex = jobSections[i + 1].startIndex;
    } else {
      jobSections[i].endIndex = experienceContent.length;
    }
  }
  
  // Create sections for each job
  for (let i = 0; i < jobSections.length; i++) {
    const jobSection = jobSections[i];
    const jobContent = experienceContent.substring(jobSection.startIndex, jobSection.endIndex);
    
    // Clean up the title - extract company and dates if present
    let title = jobSection.title;
    let company = '';
    let dates = '';
    
    // Try to extract company and dates from title (format: "Title, Company | Dates")
    const titleParts = title.split('|');
    if (titleParts.length > 1) {
      dates = titleParts[1].trim();
      const titleCompanyParts = titleParts[0].split(',');
      if (titleCompanyParts.length > 1) {
        title = titleCompanyParts[0].trim();
        company = titleCompanyParts[1].trim();
      }
    }
    
    // Create a unique ID based on the job title
    const jobId = `job-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`;
    
    // Apply bullet point formatting to the job content
    const formattedContent = formatBulletPoints(jobContent);
    
    sections.push({
      id: jobId,
      type: 'JOB_ROLE' as ResumeSectionType,
      title: title,
      content: formattedContent
    });
  }
  
  return sections;
};

/**
 * Parse the resume HTML content into separate sections for editing
 */
export const parseResumeHtml = (htmlContent: string): ResumeSection[] => {
  const sections: ResumeSection[] = [];
  
  // First, check if there's a header section (usually the contact info at the top)
  const headerMatch = htmlContent.match(/<div[^>]*class="[^"]*header[^"]*"[^>]*>([\s\S]*?)<\/div>/i) || 
                      htmlContent.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
  
  if (headerMatch) {
    sections.push({
      id: 'header',
      type: 'HEADER' as ResumeSectionType,
      title: 'Header',
      content: headerMatch[0].trim()
    });
  } else {
    // Create a default header if none found - find any name and contact info at the top
    const nameMatch = htmlContent.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const contactMatch = htmlContent.match(/<p[^>]*>([^<]+\|[^<]+)<\/p>/i);
    
    sections.push({
      id: 'header',
      type: 'HEADER' as ResumeSectionType,
      title: 'Header',
      content: `
<div class="text-center mb-4">
  <h1 class="text-2xl font-bold">${nameMatch ? nameMatch[1] : 'Your Name'}</h1>
  <p class="text-gray-300">${contactMatch ? contactMatch[1] : 'Your Phone | Your Email | Your LinkedIn Profile URL'}</p>
</div>`
    });
  }
  
  // Identify main sections based on h2 tags
  const mainSectionRegex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let match;
  let lastIndex = 0;
  let sectionHtml = htmlContent;
  
  // Remove the header section if we found it
  if (headerMatch) {
    sectionHtml = sectionHtml.replace(headerMatch[0], '');
  }
  
  // Find all h2 headings to identify main sections
  const h2Matches = Array.from(sectionHtml.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi));
  
  // Process each main section
  for (let i = 0; i < h2Matches.length; i++) {
    const h2Match = h2Matches[i];
    const sectionTitle = h2Match[1].replace(/<[^>]*>/g, '').trim();
    const sectionType = getSectionTypeFromTitle(sectionTitle);
    const sectionId = sectionTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Determine section content - from this h2 to the next h2 or end of document
    const startIndex = h2Match.index;
    const endIndex = i < h2Matches.length - 1 ? h2Matches[i + 1].index : sectionHtml.length;
    const sectionContent = sectionHtml.substring(startIndex, endIndex);
    
    // Special handling for Experience sections - split into individual job roles
    if (sectionType === 'EXPERIENCE') {
      // Create the main experience section
      sections.push({
        id: sectionId,
        type: sectionType,
        title: sectionTitle,
        content: `<h2>${sectionTitle}</h2>`
      });
      
      // Extract and add individual job role sections
      const jobSections = splitJobExperiences(sectionContent);
      sections.push(...jobSections);
    } else {
      // For other section types, add as a single section
      sections.push({
        id: sectionId,
        type: sectionType,
        title: sectionTitle,
        content: sectionContent
      });
    }
  }
  
  // If no sections were found, create default ones
  if (sections.length <= 1) { // Only header exists
    sections.push({
      id: 'summary',
      type: 'SUMMARY' as ResumeSectionType,
      title: 'Summary',
      content: '<h2>Summary</h2><div class="summary mb-6"><p class="text-gray-200">Add your professional summary here...</p></div>'
    });
    
    sections.push({
      id: 'experience',
      type: 'EXPERIENCE' as ResumeSectionType,
      title: 'Professional Experience',
      content: '<h2>Professional Experience</h2>'
    });
    
    sections.push({
      id: 'job-role-1',
      type: 'JOB_ROLE' as ResumeSectionType,
      title: 'Job Title',
      content: '<h3>Job Title, Company | Date - Date</h3><p class="text-gray-200">Add your job responsibilities here...</p>'
    });
  }
  
  return sections;
};

/**
 * Process resume data into editable sections
 */
export const resumeDataToSections = (resumeData: any): ResumeSection[] => {
  // If we have markdown content, we need to convert it to HTML first
  if (resumeData.markdownContent) {
    // For now, let's assume it's already HTML or a mix of markdown and HTML
    const htmlContent = resumeData.markdownContent
      .replace(/```html/g, '')
      .replace(/```/g, '')
      .trim();
      
    const sections = parseResumeHtml(htmlContent);
    // Apply bullet point formatting to job role sections
    return formatExistingResume(sections);
  }
  
  // If it's already HTML content
  if (resumeData.htmlContent) {
    const sections = parseResumeHtml(resumeData.htmlContent);
    // Apply bullet point formatting to job role sections
    return formatExistingResume(sections);
  }
  
  // If it's JSON format, convert to HTML sections
  if (resumeData.resumeJson) {
    const { contactInfo, education, experience, skills, summary } = resumeData.resumeJson;
    const sections: ResumeSection[] = [];
    
    // Create header
    sections.push({
      id: 'header',
      type: 'HEADER' as ResumeSectionType,
      title: 'Header',
      content: `
<div class="text-center mb-4">
  <h1 class="text-2xl font-bold">${contactInfo?.name || 'Your Name'}</h1>
  <p class="text-gray-300">${contactInfo?.phone || 'Your Phone'} | ${contactInfo?.email || 'Your Email'} | ${contactInfo?.linkedin || 'Your LinkedIn Profile URL'}</p>
</div>`
    });
    
    // Create summary
    if (summary) {
      sections.push({
        id: 'summary',
        type: 'SUMMARY' as ResumeSectionType,
        title: 'Summary',
        content: `<h2>Summary</h2><div class="summary mb-6"><p class="text-gray-200">${summary}</p></div>`
      });
    }
    
    // Create main experience section
    sections.push({
      id: 'experience',
      type: 'EXPERIENCE' as ResumeSectionType,
      title: 'Professional Experience',
      content: `<h2>Professional Experience</h2>`
    });
    
    // Create individual job sections with indented bullet points
    if (experience && experience.length > 0) {
      experience.forEach((exp: any, index: number) => {
        const jobContent = `
<h3>${exp.position || 'Job Title'}, ${exp.company || 'Company'} | ${exp.duration || 'Date Range'}</h3>
${exp.description ? `<p class="mt-2 text-gray-200">${exp.description}</p>` : ''}
${exp.achievements && exp.achievements.length > 0 ? `
<ul class="list-none mt-2">
  ${exp.achievements.map((achievement: string) => `<li class="ml-5 pl-5 text-gray-200">• ${achievement}</li>`).join('')}
</ul>` : ''}`;
        
        sections.push({
          id: `job-role-${index}`,
          type: 'JOB_ROLE' as ResumeSectionType,
          title: exp.position || 'Job Title',
          content: jobContent
        });
      });
    }
    
    // Create education
    if (education && education.length > 0) {
      let educationHtml = '<h2>Education</h2><div class="education mb-6">';
      education.forEach((edu: any) => {
        educationHtml += `
<div class="mb-4">
  <h3 class="font-semibold">${edu.institution || edu.school || ''}</h3>
  <p class="text-gray-200">${edu.degree || edu.qualification || ''}</p>
  <p class="text-gray-400">${edu.date || edu.dates || ''}</p>
</div>`;
      });
      educationHtml += '</div>';
      
      sections.push({
        id: 'education',
        type: 'EDUCATION' as ResumeSectionType,
        title: 'Education',
        content: educationHtml
      });
    }
    
    // Create skills
    if (skills && skills.length > 0) {
      const skillsHtml = `
<h2>Skills</h2>
<div class="skills mb-6">
  <p class="text-gray-200">${Array.isArray(skills) ? skills.join(', ') : skills}</p>
</div>`;
      
      sections.push({
        id: 'skills',
        type: 'SKILLS' as ResumeSectionType,
        title: 'Skills',
        content: skillsHtml
      });
    }
    
    return sections;
  }
  
  // Default empty sections if no data
  return [
    {
      id: 'header',
      type: 'HEADER' as ResumeSectionType,
      title: 'Header',
      content: `
<div class="text-center mb-4">
  <h1 class="text-2xl font-bold">Your Name</h1>
  <p class="text-gray-300">Your Phone | Your Email | Your LinkedIn Profile URL</p>
</div>`
    },
    {
      id: 'summary',
      type: 'SUMMARY' as ResumeSectionType,
      title: 'Summary',
      content: '<h2>Summary</h2><div class="summary mb-6"><p class="text-gray-200">Add your professional summary here...</p></div>'
    },
    {
      id: 'experience',
      type: 'EXPERIENCE' as ResumeSectionType,
      title: 'Professional Experience',
      content: '<h2>Professional Experience</h2>'
    },
    {
      id: 'job-role-1',
      type: 'JOB_ROLE' as ResumeSectionType,
      title: 'Job Title',
      content: `<h3>Job Title, Company | Date - Date</h3>
<ul class="list-none mt-2">
  <li class="ml-5 pl-5 text-gray-200">• Add your responsibilities here</li>
  <li class="ml-5 pl-5 text-gray-200">• Describe your key accomplishments</li>
</ul>`
    }
  ];
};

/**
 * Combine resume sections back into a complete HTML document
 */
export const sectionsToHtml = (sections: ResumeSection[]): string => {
  // Sort sections by type
  const sectionOrder: Record<string, number> = {
    'HEADER': 0,
    'SUMMARY': 1,
    'EXPERIENCE': 2,
    'JOB_ROLE': 3, // Job roles will come right after experience section
    'EDUCATION': 4,
    'SKILLS': 5,
    'CERTIFICATIONS': 6,
    'PROJECTS': 7,
    'OTHER': 8
  };
  
  // First sort by section type, then for job roles, keep their original order
  const sortedSections = [...sections].sort((a, b) => {
    const orderA = sectionOrder[a.type] ?? 999;
    const orderB = sectionOrder[b.type] ?? 999;
    
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // For sections of the same type (especially JOB_ROLE), preserve original order
    return sections.indexOf(a) - sections.indexOf(b);
  });
  
  // Combine into HTML
  let html = '';
  let isInExperienceSection = false;
  
  for (const section of sortedSections) {
    // Special handling for JOB_ROLE sections
    if (isJobRoleSection(section)) {
      // Only include job role content (no need for the outer h2 wrapper)
      if (!isInExperienceSection) {
        // If we're not already in an experience section, we need to start one
        isInExperienceSection = true;
      }
      html += section.content + '\n\n';
    } 
    else if (isExperienceSection(section)) {
      // Start a new experience section
      html += section.content + '\n\n';
      isInExperienceSection = true;
    }
    else {
      // End experience section if needed
      if (isInExperienceSection && 
          !isExperienceSection(section) && 
          !isJobRoleSection(section)) {
        isInExperienceSection = false;
      }
      
      // Add other section content normally
      html += section.content + '\n\n';
    }
  }
  
  return html.trim();
};

/**
 * For backward compatibility with existing code that expects markdown
 */
export const sectionsToMarkdown = (sections: ResumeSection[]): string => {
  // Convert HTML sections to a format that the existing backend expects
  return sectionsToHtml(sections);
};
