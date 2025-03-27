// app/lib/json-resume-processor.ts
import { v4 as uuidv4 } from 'uuid';
import { ResumeSection, ResumeSectionType } from '@/app/lib/types';

/**
 * Interface for JSON resume structure
 */
interface JsonResume {
  header: {
    name: string;
    location: string;
    phone: string;
    email: string;
  };
  summary: string;
  experience: {
    id: string;
    title: string;
    company: string;
    dateRange: string;
    type: string;
    bullets: string[];
  }[];
  skills: Record<string, string[]>;
  education: {
    degree: string;
    institution: string;
    year?: string;
  }[];
  certifications?: {
    name: string;
    issuer: string;
    year?: string;
  }[];
}

/**
 * Convert JSON resume data to sections format expected by ResumeEditor
 * @param {Object|string} jsonResume - The JSON resume data from the LLM
 * @returns {Array} - Array of resume sections in the format expected by ResumeEditor
 */
export function jsonResumeToSections(jsonResume: JsonResume | string): ResumeSection[] {
  try {
    // Parse JSON if it's a string
    const resumeData: JsonResume = typeof jsonResume === 'string' 
      ? JSON.parse(jsonResume) 
      : jsonResume;
    
    const sections: ResumeSection[] = [];
    
    // Process header section
    if (resumeData.header) {
      const headerHtml = `
        <h1 class="text-2xl font-bold text-white">${resumeData.header.name}</h1>
        <p class="text-gray-300">
          ${resumeData.header.location} | ${resumeData.header.phone} | ${resumeData.header.email}
        </p>
      `;
      
      sections.push({
        id: 'header',
        title: 'Header',
        type: ResumeSectionType.HEADER,
        content: headerHtml
      });
    }
    
    // Process summary section
    if (resumeData.summary) {
      sections.push({
        id: 'summary',
        title: 'Professional Summary',
        type: ResumeSectionType.SUMMARY,
        content: `<div class="mb-6"><p class="text-gray-200">${resumeData.summary}</p></div>`
      });
    }
    
    // Process experience section (parent container)
    if (resumeData.experience && resumeData.experience.length > 0) {
      sections.push({
        id: 'experience',
        title: 'Professional Experience',
        type: ResumeSectionType.EXPERIENCE,
        content: '<div class="mb-6"><h2 class="text-xl font-semibold text-white">Professional Experience</h2></div>'
      });
      
      // Process individual job roles
      resumeData.experience.forEach(job => {
        const jobId = job.id || `job-role-${uuidv4().substring(0, 8)}`;
        
        // Convert bullets to HTML list, without adding bullet characters
        const bulletsList = job.bullets && job.bullets.length > 0
          ? `
            <ul class="list-disc list-inside text-gray-100 leading-relaxed space-y-2">
              ${job.bullets.map(bullet => `
                <li class="text-gray-200">${bullet}</li>
              `).join('')}
            </ul>
          `
          : '';
        
        // Create job role content
        const jobContent = `
          <div class="mb-4">
            <h3 class="text-lg font-semibold text-white">${job.title}</h3>
            <p class="text-gray-100">${job.company} | ${job.dateRange}</p>
            ${bulletsList}
          </div>
        `;
        
        sections.push({
          id: jobId,
          title: job.title,
          type: ResumeSectionType.JOB_ROLE,
          content: jobContent,
          parentId: 'experience' // Link to parent experience section
        });
      });
    }
    
    // Process skills section
    if (resumeData.skills) {
      let skillsContent = '<div class="mb-6"><h2 class="text-xl font-semibold text-white">Skills & Competencies</h2>';
      
      // Process skill categories
      Object.entries(resumeData.skills).forEach(([category, skillsList]) => {
        if (skillsList && skillsList.length > 0) {
          const categoryTitle = category.charAt(0).toUpperCase() + category.slice(1);
          
          skillsContent += `
            <div class="mb-3">
              <h3 class="text-lg font-semibold text-white">${categoryTitle}</h3>
              <p class="text-gray-200">${skillsList.join(', ')}</p>
            </div>
          `;
        }
      });
      
      skillsContent += '</div>';
      
      sections.push({
        id: 'skills',
        title: 'Skills & Competencies',
        type: ResumeSectionType.SKILLS,
        content: skillsContent
      });
    }
    
    // Process education section
    if (resumeData.education && resumeData.education.length > 0) {
      let educationContent = '<div class="mb-6"><h2 class="text-xl font-semibold text-white">Education</h2>';
      
      resumeData.education.forEach(edu => {
        educationContent += `
          <div class="mb-3">
            <h3 class="text-lg font-semibold text-white">${edu.degree}</h3>
            <p class="text-gray-200">${edu.institution}${edu.year ? ` | ${edu.year}` : ''}</p>
          </div>
        `;
      });
      
      educationContent += '</div>';
      
      sections.push({
        id: 'education',
        title: 'Education',
        type: ResumeSectionType.EDUCATION,
        content: educationContent
      });
    }
    
    // Process certifications section
    if (resumeData.certifications && resumeData.certifications.length > 0) {
      let certificationsContent = '<div class="mb-6"><h2 class="text-xl font-semibold text-white">Certifications</h2>';
      
      resumeData.certifications.forEach(cert => {
        certificationsContent += `
          <div class="mb-2">
            <p class="text-gray-200">
              <strong>${cert.name}</strong> | ${cert.issuer}${cert.year ? ` | ${cert.year}` : ''}
            </p>
          </div>
        `;
      });
      
      certificationsContent += '</div>';
      
      sections.push({
        id: 'certifications',
        title: 'Certifications',
        type: ResumeSectionType.CERTIFICATIONS,
        content: certificationsContent
      });
    }
    
    return sections;
  } catch (error) {
    console.error('Error processing JSON resume data:', error);
    return [];
  }
}

/**
 * Convert sections back to JSON format
 * @param {Array} sections - The resume sections array
 * @returns {Object} - Resume data in JSON format
 */
export function sectionsToJsonResume(sections: ResumeSection[]): JsonResume {
  const resumeJson: JsonResume = {
    header: { name: '', location: '', phone: '', email: '' },
    summary: '',
    experience: [],
    skills: {},
    education: []
  };
  
  try {
    // Create a DOM parser for HTML parsing
    const parser = new DOMParser();
    
    // Process each section
    sections.forEach(section => {
      switch (section.type) {
        case ResumeSectionType.HEADER: {
          // Parse HTML content
          const doc = parser.parseFromString(section.content, 'text/html');
          
          // Extract name from h1
          const nameEl = doc.querySelector('h1');
          if (nameEl) {
            resumeJson.header.name = nameEl.textContent?.trim() || '';
          }
          
          // Extract contact info from paragraph
          const contactEl = doc.querySelector('p');
          if (contactEl) {
            const contactText = contactEl.textContent?.trim() || '';
            const parts = contactText.split('|').map(part => part.trim());
            
            if (parts.length >= 3) {
              resumeJson.header.location = parts[0];
              resumeJson.header.phone = parts[1];
              resumeJson.header.email = parts[2];
            }
          }
          break;
        }
        
        case ResumeSectionType.SUMMARY: {
          // Parse HTML content
          const doc = parser.parseFromString(section.content, 'text/html');
          
          // Extract summary text from paragraphs
          const paragraphs = doc.querySelectorAll('p');
          if (paragraphs.length > 0) {
            resumeJson.summary = Array.from(paragraphs)
              .map(p => p.textContent?.trim() || '')
              .join(' ');
          }
          break;
        }
        
        case ResumeSectionType.JOB_ROLE: {
          // Parse HTML content
          const doc = parser.parseFromString(section.content, 'text/html');
          
          // Extract job title
          const titleEl = doc.querySelector('h3');
          const title = titleEl ? titleEl.textContent?.trim() || '' : section.title;
          
          // Extract company and date range
          const companyEl = doc.querySelector('p');
          let company = '';
          let dateRange = '';
          
          if (companyEl) {
            const companyText = companyEl.textContent?.trim() || '';
            const parts = companyText.split('|').map(part => part.trim());
            
            if (parts.length >= 2) {
              company = parts[0];
              dateRange = parts[1];
            } else {
              company = companyText;
            }
          }
          
          // Extract bullets
          const bulletEls = doc.querySelectorAll('li');
          const bullets = Array.from(bulletEls)
            .map(li => li.textContent?.trim() || '');
          
          resumeJson.experience.push({
            id: section.id,
            title,
            company,
            dateRange,
            type: 'JOB_ROLE',
            bullets
          });
          break;
        }
        
        case ResumeSectionType.SKILLS: {
          // Parse HTML content
          const doc = parser.parseFromString(section.content, 'text/html');
          
          // Extract skill categories
          const categories = doc.querySelectorAll('h3');
          
          Array.from(categories).forEach(category => {
            const categoryName = category.textContent?.trim().toLowerCase() || 'other';
            const nextEl = category.nextElementSibling;
            
            if (nextEl && nextEl.tagName === 'P') {
              const skillsList = nextEl.textContent?.split(',').map(skill => skill.trim()) || [];
              resumeJson.skills[categoryName] = skillsList;
            }
          });
          
          // If no categories were found, look for simple lists
          if (Object.keys(resumeJson.skills).length === 0) {
            const skillsLists = doc.querySelectorAll('ul');
            
            if (skillsLists.length > 0) {
              const allSkills = Array.from(skillsLists)
                .flatMap(ul => Array.from(ul.querySelectorAll('li')))
                .map(li => li.textContent?.trim() || '');
              
              resumeJson.skills.technical = allSkills;
            }
          }
          break;
        }
        
        case ResumeSectionType.EDUCATION: {
          // Parse HTML content
          const doc = parser.parseFromString(section.content, 'text/html');
          
          // Extract education items
          const degrees = doc.querySelectorAll('h3');
          
          Array.from(degrees).forEach(degree => {
            const degreeText = degree.textContent?.trim() || '';
            const nextEl = degree.nextElementSibling;
            
            let institution = '';
            let year = '';
            
            if (nextEl && nextEl.tagName === 'P') {
              const institutionText = nextEl.textContent?.trim() || '';
              const parts = institutionText.split('|').map(part => part.trim());
              
              if (parts.length >= 2) {
                institution = parts[0];
                year = parts[1];
              } else {
                institution = institutionText;
              }
            }
            
            resumeJson.education.push({
              degree: degreeText,
              institution,
              year
            });
          });
          break;
        }
        
        case ResumeSectionType.CERTIFICATIONS: {
          // Parse HTML content
          const doc = parser.parseFromString(section.content, 'text/html');
          
          // Initialize certifications array if needed
          if (!resumeJson.certifications) {
            resumeJson.certifications = [];
          }
          
          // Extract certification items
          const certifications = doc.querySelectorAll('p');
          
          Array.from(certifications).forEach(cert => {
            const certText = cert.textContent?.trim() || '';
            const parts = certText.split('|').map(part => part.trim());
            
            if (parts.length >= 2) {
              resumeJson.certifications?.push({
                name: parts[0].replace('strong>', '').trim(),
                issuer: parts[1],
                year: parts.length > 2 ? parts[2] : ''
              });
            }
          });
          break;
        }
      }
    });
    
    return resumeJson;
  } catch (error) {
    console.error('Error converting sections to JSON:', error);
    return resumeJson;
  }
}
