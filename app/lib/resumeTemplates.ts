// app/lib/resumeTemplates.ts
import { ResumeSectionType } from './types';

interface SectionTemplate {
  title: string;
  content: string;
  description: string;
}

// Templates for different section types
export const getSectionTemplate = (type: ResumeSectionType): SectionTemplate => {
  switch (type) {
    case 'HEADER':
      return {
        title: 'Header',
        content: 'Your Name\nyour.email@example.com | (123) 456-7890 | City, State',
        description: 'Your name and contact information'
      };
    
    case 'SUMMARY':
      return {
        title: 'Professional Summary',
        content: 'Experienced professional with X years in [industry/field]. Skilled in [key skills] with a proven track record of [notable achievement]. Seeking to leverage [skills/expertise] to drive results as a [target role].',
        description: 'A brief overview of your qualifications and career goals'
      };
      
    case 'EXPERIENCE':
      return {
        title: 'Experience',
        content: '### Company Name | Job Title | MM/YYYY - Present\n- Achieved [specific, quantifiable result] by [action taken]\n- Led [project/initiative] that resulted in [positive outcome]\n- Developed and implemented [process/system] that improved [metric] by [percentage]\n\n### Previous Company | Previous Title | MM/YYYY - MM/YYYY\n- Spearheaded [initiative] resulting in [outcome]\n- Collaborated with [teams/departments] to deliver [results]',
        description: 'Your work history with accomplishments'
      };
      
    case 'EDUCATION':
      return {
        title: 'Education',
        content: '### University Name\nDegree Name (Field of Study), Graduation Year\n- Notable achievement or honor\n- Relevant coursework',
        description: 'Your educational background and achievements'
      };
      
    case 'SKILLS':
      return {
        title: 'Skills',
        content: '**Technical Skills:** Skill 1, Skill 2, Skill 3\n**Soft Skills:** Communication, Leadership, Problem-solving\n**Languages:** English (Native), Spanish (Conversational)',
        description: 'List of relevant technical and soft skills'
      };
      
    case 'CERTIFICATIONS':
      return {
        title: 'Certifications',
        content: '- Certification Name (Issuing Organization, Year)\n- Another Certification (Issuing Organization, Year)',
        description: 'Professional certifications and licenses'
      };
      
    case 'PROJECTS':
      return {
        title: 'Projects',
        content: '### Project Name\n- Description of the project and your role\n- Technologies used: [list technologies]\n- Key outcome or achievement\n\n### Another Project\n- Brief description of your contribution\n- Impact or results',
        description: 'Highlight significant projects you have worked on'
      };
      
    case 'OTHER':
      return {
        title: 'Additional Section',
        content: 'Content for your custom section goes here.\n- You can use bullet points\n- Or paragraphs\n\nFormat as needed.',
        description: 'Custom section for additional information'
      };
      
    default:
      return {
        title: 'New Section',
        content: '',
        description: 'Custom content section'
      };
  }
};

// Section templates for different job types
export const getSectionTemplatesForJobType = (jobType: string): SectionTemplate[] => {
  const templates: SectionTemplate[] = [];
  
  // Common sections for all job types
  templates.push(getSectionTemplate('HEADER'));
  templates.push(getSectionTemplate('SUMMARY'));
  templates.push(getSectionTemplate('EXPERIENCE'));
  templates.push(getSectionTemplate('EDUCATION'));
  templates.push(getSectionTemplate('SKILLS'));
  
  // Add job-specific sections
  if (jobType.toLowerCase().includes('developer') || 
      jobType.toLowerCase().includes('engineer') ||
      jobType.toLowerCase().includes('programmer')) {
    templates.push({
      title: 'Technical Projects',
      content: '### Project Name\n- Developed [feature/application] using [technologies]\n- Implemented [technical solution] that [achieved result]\n- GitHub: [link to repository]\n\n### Another Project\n- Built [application/system] that [solved problem]\n- Technologies: [list major technologies used]',
      description: 'Showcase coding projects and technical implementations'
    });
    
    templates.push({
      title: 'Technical Skills',
      content: '**Programming Languages:** Language 1, Language 2, Language 3\n**Frameworks & Libraries:** Framework 1, Library 1, Framework 2\n**Tools & Platforms:** Tool 1, Platform 1, Tool 2\n**Database Technologies:** Database 1, Database 2',
      description: 'Detailed breakdown of technical skills by category'
    });
  }
  
  if (jobType.toLowerCase().includes('manager') || 
      jobType.toLowerCase().includes('director') ||
      jobType.toLowerCase().includes('lead')) {
    templates.push({
      title: 'Leadership Experience',
      content: '### Organization | Role | Duration\n- Led team of [X] members to [accomplish goal]\n- Increased [key metric] by [percentage] through [strategy]\n- Managed budget of $[amount] and delivered [outcome]\n\n### Previous Leadership Role\n- Developed and mentored [X] team members\n- Implemented [initiative] that [improved process/outcome]',
      description: 'Highlight your leadership roles and achievements'
    });
  }
  
  return templates;
};
