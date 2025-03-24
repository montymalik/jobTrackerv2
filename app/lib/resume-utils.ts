// app/lib/resume-utils.ts

import { DocumentSection, markdownToSections, categorizeTitleByKeywords } from './markdown-utils';
import { ResumeSection, ResumeSectionType } from './types';

/**
 * A specific implementation for resume section categorization
 * @param title Section title
 * @returns Appropriate ResumeSectionType
 */
export const getSectionTypeFromTitle = (title: string): ResumeSectionType => {
  const categoriesMap: Record<string, string[]> = {
    'SUMMARY': ['summary', 'objective', 'profile', 'about'],
    'EXPERIENCE': ['experience', 'work', 'employment', 'job', 'career'],
    'EDUCATION': ['education', 'academic', 'school', 'university', 'college', 'degree'],
    'SKILLS': ['skill', 'expertise', 'competency', 'proficiency'],
    'CERTIFICATIONS': ['certification', 'certificate', 'licence', 'license', 'credential'],
    'PROJECTS': ['project', 'portfolio', 'achievement'],
    'HEADER': ['header', 'contact', 'personal'],
    'OTHER': []
  };
  
  return categorizeTitleByKeywords<ResumeSectionType>(title, categoriesMap, 'OTHER');
};

/**
 * Creates a new ResumeSection object
 */
export const createResumeSection = (
  id: string,
  type: string,
  title: string,
  content: string
): ResumeSection => {
  return {
    id,
    type: type as ResumeSectionType,
    title,
    content
  };
};

/**
 * Processes resume data specifically into editable sections
 * @param resumeData Resume data from API
 * @returns Array of ResumeSection objects
 */
export const resumeDataToSections = (resumeData: any): ResumeSection[] => {
  // If resume has markdown content, parse it directly
  if (resumeData.markdownContent) {
    return markdownToSections<ResumeSection>(
      resumeData.markdownContent, 
      { 
        getSectionType: getSectionTypeFromTitle,
        headerType: 'HEADER',
        createSection: createResumeSection
      }
    );
  }
  
  // Otherwise, build sections from JSON structure
  const sections: ResumeSection[] = [];
  
  if (resumeData.resumeJson) {
    const { contactInfo, education, experience, skills, summary } = resumeData.resumeJson;
    
    // Add header section (name and contact info)
    if (contactInfo && contactInfo.name) {
      sections.push({
        id: 'header',
        type: 'HEADER',
        title: 'Header',
        content: `${contactInfo.name}\n${contactInfo.email || ''} | ${contactInfo.phone || ''} | ${contactInfo.location || ''}`
      });
    }
    
    // Add summary section
    if (summary) {
      sections.push({
        id: 'summary',
        type: 'SUMMARY',
        title: 'Professional Summary',
        content: summary
      });
    }
    
    // Add experience section
    if (experience && experience.length > 0) {
      let experienceContent = '';
      
      experience.forEach((exp: any) => {
        experienceContent += `### ${exp.company || ''} | ${exp.position || ''} | ${exp.duration || ''}\n`;
        if (exp.description) {
          experienceContent += exp.description + '\n\n';
        } else if (exp.achievements && Array.isArray(exp.achievements)) {
          exp.achievements.forEach((achievement: string) => {
            experienceContent += `- ${achievement}\n`;
          });
          experienceContent += '\n';
        }
      });
      
      sections.push({
        id: 'experience',
        type: 'EXPERIENCE',
        title: 'Experience',
        content: experienceContent
      });
    }
    
    // Add education section
    if (education && education.length > 0) {
      let educationContent = '';
      
      education.forEach((edu: any) => {
        educationContent += `### ${edu.institution || edu.school || ''}\n`;
        educationContent += `${edu.degree || edu.qualification || ''} (${edu.date || edu.dates || ''})\n\n`;
      });
      
      sections.push({
        id: 'education',
        type: 'EDUCATION',
        title: 'Education',
        content: educationContent
      });
    }
    
    // Add skills section
    if (skills && skills.length > 0) {
      const skillsContent = Array.isArray(skills) 
        ? skills.join(', ')
        : typeof skills === 'string' 
          ? skills 
          : '';
          
      sections.push({
        id: 'skills',
        type: 'SKILLS',
        title: 'Skills',
        content: skillsContent
      });
    }
  }
  
  return sections;
};
