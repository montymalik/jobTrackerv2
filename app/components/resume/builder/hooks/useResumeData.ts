// app/components/resume/builder/hooks/useResumeData.ts
import { useState, useEffect } from 'react';
import { ResumeSection, ResumeSectionType } from '@/app/lib/types';

/**
 * Custom hook to load and manage resume data
 */
export const useResumeData = (resumeId?: string, jobApplicationId?: string) => {
  const [sections, setSections] = useState<ResumeSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(resumeId || null);
  const [jobDescription, setJobDescription] = useState<string>(''); 

  // Load resume data
  useEffect(() => {
    const loadResume = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("Loading resume with params:", { resumeId, jobApplicationId });
        let response;
        
        // If resumeId is provided, load that specific resume
        if (resumeId) {
          response = await fetch(`/api/resume/check?id=${resumeId}`);
        } 
        // Otherwise, load the primary resume for the job application
        else if (jobApplicationId) {
          console.log(`Fetching primary resume for job: ${jobApplicationId}`);
          response = await fetch(`/api/resume/get-primary?jobApplicationId=${jobApplicationId}`);
        } 
        // Fallback to the base resume if neither is provided
        else {
          response = await fetch('/api/resume/get');
        }
        if (!response.ok) {
          throw new Error(`Failed to load resume data: ${response.status}`);
        }
        const data = await response.json();
        console.log("Resume API Response:", data, "from URL:", response.url); // Debug log
        
        // Handle different response formats based on the API endpoint
        let resumeContent;
        let extractedResumeId;
        let extractedJobDescription;
        
        // Handle check endpoint
        if (response.url.includes('/api/resume/check')) {
          if (data.found && data.resume) {
            console.log("Found resume via check endpoint");
            resumeContent = data.resume.jsonContent;
            extractedResumeId = data.resume.id;
            
            // Check for job description at all possible locations
            console.log("Looking for job description in API response...");
            if (data.resume.jobDescription) {
              console.log("Found jobDescription directly in resume object");
              extractedJobDescription = data.resume.jobDescription;
            } 
            else if (data.resume.jobApplication && data.resume.jobApplication.jobDescription) {
              console.log("Found jobDescription in resume.jobApplication object");
              extractedJobDescription = data.resume.jobApplication.jobDescription;
            }
            // Perform a depth-first search for jobDescription through nested objects
            else {
              const findJobDescription = (obj: any, path = ""): string | null => {
                if (!obj || typeof obj !== 'object') return null;
                
                if (obj.jobDescription && typeof obj.jobDescription === 'string') {
                  console.log(`Found jobDescription at path: ${path}.jobDescription`);
                  return obj.jobDescription;
                }
                
                for (const key in obj) {
                  if (key === 'jobDescription' && typeof obj[key] === 'string') {
                    console.log(`Found jobDescription at path: ${path}.${key}`);
                    return obj[key];
                  }
                  
                  if (typeof obj[key] === 'object' && obj[key] !== null) {
                    const result = findJobDescription(obj[key], `${path}.${key}`);
                    if (result) return result;
                  }
                }
                
                return null;
              };
              
              const foundJobDesc = findJobDescription(data);
              if (foundJobDesc) {
                extractedJobDescription = foundJobDesc;
              }
            }
          }
        }
        
        // Handle primary resume endpoint
        else if (response.url.includes('/api/resume/get-primary')) {
          // /api/resume/get-primary returns a Resume object or empty object if none found
          if (data && data.id && data.jsonContent) {
            console.log("Found primary resume", data.id);
            resumeContent = data.jsonContent;
            extractedResumeId = data.id;
            
            // Also fetch job description if available
            if (jobApplicationId) {
              try {
                const jobResponse = await fetch(`/api/jobs/${jobApplicationId}`);
                if (jobResponse.ok) {
                  const jobData = await jobResponse.json();
                  extractedJobDescription = jobData.jobDescription;
                }
              } catch (jobErr) {
                console.error("Error fetching job details:", jobErr);
              }
            }
          } else {
            console.log("No primary resume found, falling back to base resume");
            const baseResponse = await fetch('/api/resume/get');
            if (baseResponse.ok) {
              const baseData = await baseResponse.json();
              resumeContent = JSON.stringify(baseData);
            } else {
              throw new Error('Failed to load any resume data');
            }
          }
        } 
        // Handle direct resume data
        else if (data.markdownContent) {
          console.log("Processing direct resume data with markdownContent");
          resumeContent = data.markdownContent;
          extractedResumeId = data.id;
        } 
        // Handle base resume (JSON format)
        else {
          console.log("Processing as JSON format or other");
          resumeContent = JSON.stringify(data);
        }
        
        // Set the current resume ID if we found one
        if (extractedResumeId) {
          console.log("Setting current resume ID:", extractedResumeId);
          setCurrentResumeId(extractedResumeId);
        }
        
        // Set job description if we found one
        if (extractedJobDescription) {
          console.log(`Found job description, length: ${extractedJobDescription.length}`);
          setJobDescription(extractedJobDescription);
        } else {
          console.log("No job description found in API response");
          // Reset to empty string if not found
          setJobDescription('');
        }
        if (!resumeContent) {
          console.error("No resume content could be extracted");
          throw new Error("Failed to extract resume content from response");
        }
        // Convert markdown/JSON content to sections
        console.log("Parsing resume content to sections...");
        const parsedSections = parseResumeToSections(resumeContent);
        
        // Reorder sections to ensure header is first and summary second
        const orderedSections = reorderSections(parsedSections);
        console.log(`Parsed ${orderedSections.length} sections from resume content`);
        setSections(orderedSections);
      } catch (err) {
        console.error('Error loading resume:', err);
        setError('Failed to load resume data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    loadResume();
  }, [resumeId, jobApplicationId]);
  
  // Reorder sections to ensure header first, summary second, and others after
  const reorderSections = (sections: ResumeSection[]): ResumeSection[] => {
    // Create buckets for different section types
    const headerSection = sections.find(s => s.type === 'HEADER');
    const summarySection = sections.find(s => s.type === 'SUMMARY');
    const educationSection = sections.find(s => s.type === 'EDUCATION');
    const experienceSections = sections.filter(s => s.type === 'EXPERIENCE');
    const jobRoleSections = sections.filter(s => s.type === 'JOB_ROLE');
    
    // Other sections besides header, summary, education, experience, and job roles
    const otherSections = sections.filter(s => 
      s.type !== 'HEADER' && 
      s.type !== 'SUMMARY' && 
      s.type !== 'EDUCATION' && 
      s.type !== 'EXPERIENCE' && 
      s.type !== 'JOB_ROLE'
    );
    
    // Combine sections in the specified order
    const result: ResumeSection[] = [];
    
    // Add header section first (if it exists)
    if (headerSection) {
      result.push(headerSection);
    }
    
    // Add summary section second (if it exists)
    if (summarySection) {
      result.push(summarySection);
    }
    
    // Add experience sections and their job roles
    experienceSections.forEach(expSection => {
      result.push(expSection);
      
      // Add any job roles that belong to this experience section
      const childJobRoles = jobRoleSections.filter(job => job.parentId === expSection.id);
      result.push(...childJobRoles);
    });
    
    // Add any orphaned job roles
    const orphanedJobRoles = jobRoleSections.filter(job => 
      !job.parentId || !experienceSections.some(exp => exp.id === job.parentId)
    );
    result.push(...orphanedJobRoles);
    
    // Add education section after experience (if it exists)
    if (educationSection) {
      result.push(educationSection);
    }
    
    // Add all other sections
    result.push(...otherSections);
    
    return result;
  };
  
  // Parse resume content (JSON) into sections
  const parseResumeToSections = (content: string): ResumeSection[] => {
    try {
      // First, try to parse as JSON
      const jsonData = JSON.parse(content);
      console.log("Parsed content as JSON:", jsonData);
      
      // Check if we have the raw sections data (from our enhanced save)
      if (jsonData._rawSections && Array.isArray(jsonData._rawSections)) {
        console.log("Found _rawSections in JSON data, using directly");
        return jsonData._rawSections as ResumeSection[];
      }
      
      // Check if this is JSON data with a header object (our LLM format)
      if (jsonData.header) {
        console.log("Found JSON with header object - handling as LLM output");
        return convertJsonToSections(jsonData);
      }
      
      // If not in LLM format but still JSON, return empty array or default sections
      console.log("JSON format not recognized, returning empty sections");
      return [];
      
    } catch (e) {
      console.log("Content is not valid JSON, treating as legacy format");
      return parseMarkdownContent(content);
    }
  };

  // Enhanced function to convert JSON to sections
  const convertJsonToSections = (jsonData: any): ResumeSection[] => {
    const sections: ResumeSection[] = [];
    
    // Process header
    if (jsonData.header) {
      const { name, email, phone, location } = jsonData.header;
      const contactInfo = [email, phone, location].filter(Boolean).join(' | ');
      
      sections.push({
        id: 'header',
        title: 'Header',
        type: ResumeSectionType.HEADER,
        content: `<h1 class="text-2xl font-bold">${name || 'Your Name'}</h1>
                  <p class="text-gray-300">${contactInfo}</p>`
      });
    }
    
    // Process summary - check for raw HTML first
    if (jsonData.summary || jsonData._rawSummaryHtml) {
      sections.push({
        id: 'summary',
        title: 'Professional Summary',
        type: ResumeSectionType.SUMMARY,
        content: jsonData._rawSummaryHtml || `<p class="text-gray-200">${jsonData.summary}</p>`
      });
    }
    
    // Process experience
    if (jsonData.experience && jsonData.experience.length > 0) {
      // Add main experience section
      const experienceSectionId = 'experience';
      sections.push({
        id: experienceSectionId,
        title: 'Professional Experience',
        type: ResumeSectionType.EXPERIENCE,
        content: `<h2>Professional Experience</h2>`
      });
      
      // Add individual job roles
      jsonData.experience.forEach((exp: any, index: number) => {
        // Use stored raw HTML if available, otherwise reconstruct
        if (exp._rawHtml) {
          sections.push({
            id: exp.id || `job-role-${index}`,
            title: exp.title || 'Job Title',
            type: ResumeSectionType.JOB_ROLE,
            parentId: experienceSectionId,
            content: exp._rawHtml
          });
        } else {
          const bullets = exp.bullets || [];
          
          const bulletsList = bullets.length > 0 
            ? `<ul class="list-disc pl-5">${bullets.map((bullet: string) => 
                `<li>${bullet}</li>`).join('')}</ul>`
            : '<ul class="list-disc pl-5"><li>Add job responsibilities...</li></ul>';
          
          sections.push({
            id: exp.id || `job-role-${index}`,
            title: exp.title || 'Job Title',
            type: ResumeSectionType.JOB_ROLE,
            parentId: experienceSectionId,
            content: `<h3>${exp.title || 'Job Title'}</h3>
                      <p>${exp.company || 'Company'} | ${exp.dateRange || 'Date Range'}</p>
                      ${bulletsList}`
          });
        }
      });
    }
    
    // Process education
    if (jsonData.education && jsonData.education.length > 0) {
      // Create a unique ID for the education section
      const educationSectionId = 'education-section';
      
      // Use raw HTML if available
      if (jsonData._rawEducationHtml) {
        sections.push({
          id: educationSectionId,
          title: 'Education',
          type: ResumeSectionType.EDUCATION,
          content: jsonData._rawEducationHtml
        });
      } else {
        let educationContent = '<h2>Education</h2>';
        
        jsonData.education.forEach((edu: any) => {
          educationContent += `<div class="mb-4">
            <h3>${edu.degree || 'Degree'}</h3>
            <p>${edu.institution || 'Institution'} | ${edu.year || ''}</p>
          </div>`;
        });
        
        sections.push({
          id: educationSectionId,
          title: 'Education',
          type: ResumeSectionType.EDUCATION,
          content: educationContent
        });
      }
    }
    
    // Process skills - use raw HTML if available
    if (jsonData.skills || jsonData._rawSkillsHtml) {
      if (jsonData._rawSkillsHtml) {
        sections.push({
          id: 'skills',
          title: 'Skills',
          type: ResumeSectionType.SKILLS,
          content: jsonData._rawSkillsHtml
        });
      } else {
        let skillsContent = '';
        
        // Handle skills as an object with categories
        if (typeof jsonData.skills === 'object' && !Array.isArray(jsonData.skills)) {
          for (const [category, skillsList] of Object.entries(jsonData.skills)) {
            if (Array.isArray(skillsList) && skillsList.length > 0) {
              skillsContent += `<p><strong>${category.charAt(0).toUpperCase() + category.slice(1)}:</strong> `;
              skillsContent += (skillsList as string[]).join(', ');
              skillsContent += '</p>';
            }
          }
        } 
        // Handle skills as an array
        else if (Array.isArray(jsonData.skills)) {
          skillsContent = `<p class="text-gray-200">${jsonData.skills.join(', ')}</p>`;
        }
        
        if (skillsContent) {
          sections.push({
            id: 'skills',
            title: 'Skills',
            type: ResumeSectionType.SKILLS,
            content: skillsContent
          });
        }
      }
    }
    
    // Process certifications if available - use raw HTML if available
    if (jsonData.certifications || jsonData._rawCertificationsHtml) {
      if (jsonData._rawCertificationsHtml) {
        sections.push({
          id: 'certifications',
          title: 'Certifications',
          type: ResumeSectionType.CERTIFICATIONS,
          content: jsonData._rawCertificationsHtml
        });
      } else if (jsonData.certifications && jsonData.certifications.length > 0) {
        const certContent = `<ul class="list-disc pl-5">
          ${jsonData.certifications.map((cert: any) => {
            const certName = typeof cert === 'string' ? cert : (cert.name || cert.title);
            return `<li>${certName}</li>`;
          }).join('')}
        </ul>`;
        
        sections.push({
          id: 'certifications',
          title: 'Certifications',
          type: ResumeSectionType.CERTIFICATIONS,
          content: certContent
        });
      }
    }
    
    return sections;
  };
  
  // Parse legacy markdown content into sections (kept for backward compatibility)
  const parseMarkdownContent = (content: string): ResumeSection[] => {
    console.log("Parsing as legacy format content");
    const sections: ResumeSection[] = [];
    
    // Extract header (name and contact info)
    const nameMatch = content.match(/# (.*?)(?:\n|$)/);
    const contactMatch = content.match(/(?:[\w\.-]+@[\w\.-]+|[0-9-() .]+)(?:\s*\|\s*)(?:[\w\.-]+@[\w\.-]+|[0-9-() .]+)/);
    
    // If no name is found, try to extract from first line
    let nameText = 'Your Name';
    if (nameMatch) {
      nameText = nameMatch[1];
    } else {
      // Try to get the first non-empty line
      const firstLineMatch = content.match(/^\s*(.+?)[\r\n]/);
      if (firstLineMatch) nameText = firstLineMatch[1];
    }
    
    // Add the header section
    sections.push({
      id: 'header',
      title: 'Header',
      type: ResumeSectionType.HEADER,
      content: `<h1 class="text-2xl font-bold">${nameText}</h1>
                <p class="text-gray-300">${contactMatch ? contactMatch[0] : 'Email | Phone | Location'}</p>`
    });
    
    // Look for a summary at the beginning before any major sections
    const firstSectionMatch = content.match(/\n\s*#+\s+[^#\n]+/i);
    if (firstSectionMatch) {
      const firstSectionPos = firstSectionMatch.index || 0;
      if (firstSectionPos > 50) { // If there's substantial text before the first section heading
        const possibleSummary = content.substring(0, firstSectionPos).trim();
        // Exclude short lines and anything that looks like contact info
        if (possibleSummary.length > 100 && !possibleSummary.match(/^\s*[\w\.-]+@[\w\.-]+/)) {
          sections.push({
            id: 'summary',
            title: 'Professional Summary',
            type: ResumeSectionType.SUMMARY,
            content: `<p class="text-gray-200">${possibleSummary}</p>`
          });
        }
      }
    }
    
    // Extract main sections based on headings
    // First look for ## headings (major sections)
    const sectionMatches = Array.from(content.matchAll(/\n\s*(#{1,3})\s+([^#\n]+)(?:\n)([\s\S]*?)(?=\n\s*#{1,3}\s+[^#\n]+\n|$)/g));
    
    let currentExperienceSection: any = null;
    let jobIndex = 0;
    
    for (const match of sectionMatches) {
      const headingLevel = match[1].length; // Number of # symbols
      const title = match[2].trim();
      const sectionContent = match[3].trim();
      
      // Check if this is a job title (H3) or a main section (H1/H2)
      if (headingLevel === 3) {
        // This is likely a job role
        // Make sure we have an experience section to put it under
        if (!currentExperienceSection) {
          currentExperienceSection = {
            id: 'experience',
            title: 'Professional Experience',
            type: ResumeSectionType.EXPERIENCE,
            content: `<h2>Professional Experience</h2>`
          };
          sections.push(currentExperienceSection);
        }
        
        // Extract company and dates from the content if available
        let companyAndDates = '';
        const companyMatch = sectionContent.match(/^(.+?)(?:\n|$)/);
        if (companyMatch) {
          companyAndDates = `<p>${companyMatch[1]}</p>`;
        }
        
        // Extract bullet points
        const bullets = sectionContent.match(/[-•]\s+([^\n]+)/g) || [];
        const bulletsList = bullets.length > 0 
          ? `<ul class="list-disc pl-5">${bullets.map(b => `<li>${b.replace(/^[-•]\s+/, '')}</li>`).join('')}</ul>`
          : '<ul class="list-disc pl-5"><li>Add job responsibilities...</li></ul>';
        
        sections.push({
          id: `job-role-${jobIndex++}`,
          title: title,
          type: ResumeSectionType.JOB_ROLE,
          parentId: currentExperienceSection.id,
          content: `<h3>${title}</h3>${companyAndDates}${bulletsList}`
        });
      } else {
        // This is a main section (h1 or h2)
        const sectionType = getSectionType(title);
        
        if (sectionType === 'EXPERIENCE') {
          // This is an experience section heading
          currentExperienceSection = {
            id: 'experience',
            title: title,
            type: ResumeSectionType.EXPERIENCE,
            content: `<h2>${title}</h2>`
          };
          sections.push(currentExperienceSection);
        } else if (sectionType === 'EDUCATION') {
          // Handle education section specifically
          sections.push({
            id: `education-${Date.now()}`,
            title: title,
            type: ResumeSectionType.EDUCATION,
            content: convertMarkdownToHtml(sectionContent),
            parentId: undefined
          });
        } else if (sectionType === 'SKILLS') {
          // Process skills section
          sections.push({
            id: 'skills',
            title: title,
            type: ResumeSectionType.SKILLS,
            content: convertToSkillsHtml(sectionContent)
          });
        } else if (sectionType === 'SUMMARY') {
          // Process summary section
          sections.push({
            id: 'summary',
            title: title,
            type: ResumeSectionType.SUMMARY,
            content: `<p class="text-gray-200">${sectionContent}</p>`
          });
        } else {
          // Generic section
          sections.push({
            id: `section-${sections.length}`,
            title: title,
            type: sectionType,
            content: convertMarkdownToHtml(sectionContent)
          });
        }
      }
    }
    
    // If we didn't find any sections but we have content, create a default summary
    if (sections.length === 1 && content.length > 100) { // Just the header
      sections.push({
        id: 'summary',
        title: 'Professional Summary',
        type: ResumeSectionType.SUMMARY,
        content: `<p class="text-gray-200">${content.substring(0, 500)}</p>`
      });
    }
    
    return sections;
  };
  
  // Determine the type of section based on its title
  const getSectionType = (title: string): ResumeSectionType => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('experience') || lowerTitle.includes('work') || lowerTitle.includes('career')) {
      return ResumeSectionType.EXPERIENCE;
    } else if (lowerTitle.includes('skill') || lowerTitle.includes('competen')) {
      return ResumeSectionType.SKILLS;
    } else if (lowerTitle.includes('education') || lowerTitle.includes('academic')) {
      return ResumeSectionType.EDUCATION;
    } else if (lowerTitle.includes('summary') || lowerTitle.includes('profile') || lowerTitle.includes('objective')) {
      return ResumeSectionType.SUMMARY;
    } else if (lowerTitle.includes('certif') || lowerTitle.includes('licen') || lowerTitle.includes('award')) {
      return ResumeSectionType.CERTIFICATIONS;
    } else if (lowerTitle.includes('project') || lowerTitle.includes('portfolio')) {
      return ResumeSectionType.PROJECTS;
    } else {
      return ResumeSectionType.OTHER;
    }
  };
  
  // Convert skills section content to HTML
  const convertToSkillsHtml = (markdown: string): string => {
    // Check if this is a bullet list
    if (markdown.includes('- ') || markdown.includes('• ')) {
      const bullets = markdown.match(/[-•]\s+([^\n]+)/g) || [];
      return `<ul class="list-disc pl-5">
        ${bullets.map(bullet => `<li>${bullet.replace(/^[-•]\s+/, '')}</li>`).join('')}
      </ul>`;
    } 
    
    // Check if there are clear category headers followed by lists
    const categories = markdown.match(/(.+?):\s*([^\n]+)/g);
    if (categories && categories.length > 0) {
      return categories.map(category => {
        const [header, skills] = category.split(':', 2);
        return `<p><strong>${header.trim()}</strong>: ${skills.trim()}</p>`;
      }).join('');
    }
    
    // Default to a simple paragraph
    return `<p class="text-gray-200">${markdown}</p>`;
  };
  
  // Helper to convert simple markdown to HTML
  const convertMarkdownToHtml = (markdown: string): string => {
    return markdown
      .replace(/### (.*?)(?:\n|$)/g, '<h3>$1</h3>\n')
      .replace(/- (.*?)(?:\n|$)/g, '<li>$1</li>\n')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

  // Improved function to extract bullet points from job content
  const extractBulletPoints = (content: string): string[] => {
    if (!content) return [];
    
    // First try to extract from list items
    const bulletMatches = Array.from(content.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi));
    
    if (bulletMatches.length > 0) {
      return bulletMatches.map(match => {
        // Keep formatting like <strong> and <em> inside bullets
        const bullet = match[1]
          .replace(/<strong>(.*?)<\/strong>/gi, '$1')
          .replace(/<em>(.*?)<\/em>/gi, '$1')
          .replace(/<[^>]+>/g, '');
        
        return bullet.trim();
      });
    }
    
    // If no li tags found, try to parse from text with bullet markers
    const text = stripHtml(content);
    const lines = text.split('\n');
    const bulletLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*');
    });
    
    if (bulletLines.length > 0) {
      return bulletLines.map(line => {
        return line.trim().replace(/^[-•*]\s+/, '');
      });
    }
    
    return [];
  };

  // Enhanced HTML stripping function that preserves important text
  const stripHtml = (html: string): string => {
    if (!html) return '';
    
    let text = html
      .replace(/<strong>(.*?)<\/strong>/gi, '$1')
      .replace(/<em>(.*?)<\/em>/gi, '$1')
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '$1\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
      .replace(/<ul[^>]*>(.*?)<\/ul>/gi, '$1\n')
      .replace(/<ol[^>]*>(.*?)<\/ol>/gi, '$1\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '');
    
    text = text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+|\s+$/g, '');
    
    return text;
  };

  // Enhanced sectionsToStructuredData function
  const sectionsToStructuredData = (sections: ResumeSection[]): any => {
    const structuredData: any = {
      header: {
        name: '',
        email: '',
        phone: '',
        location: ''
      },
      summary: '',
      experience: [],
      education: [],
      skills: [],
      certifications: []
    };
    
    // Process header section
    const header = sections.find(s => s.type === 'HEADER');
    if (header) {
      const nameMatch = header.content.match(/<h1[^>]*>(.*?)<\/h1>/i);
      if (nameMatch && nameMatch[1]) {
        structuredData.header.name = stripHtml(nameMatch[1]);
      }
      
      const contactMatch = header.content.match(/<p[^>]*>(.*?)<\/p>/i);
      if (contactMatch && contactMatch[1]) {
        const contactInfo = stripHtml(contactMatch[1]).split('|');
        if (contactInfo.length >= 3) {
          structuredData.header.email = contactInfo[0].trim();
          structuredData.header.phone = contactInfo[1].trim();
          structuredData.header.location = contactInfo[2].trim();
        } else if (contactInfo.length === 2) {
          structuredData.header.email = contactInfo[0].trim();
          structuredData.header.phone = contactInfo[1].trim();
        } else if (contactInfo.length === 1) {
          const contactText = contactInfo[0].trim();
          if (contactText.includes('@')) {
            structuredData.header.email = contactText;
          } else if (/\d/.test(contactText)) {
            structuredData.header.phone = contactText;
          } else {
            structuredData.header.location = contactText;
          }
        }
      }
      
      // Store original HTML content
      structuredData._rawHeaderHtml = header.content;
    }
    
    // Process summary section with improved HTML handling
    const summary = sections.find(s => s.type === 'SUMMARY');
    if (summary) {
      const summaryMatch = summary.content.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
      if (summaryMatch && summaryMatch[1]) {
        structuredData.summary = stripHtml(summaryMatch[1]);
      } else {
        structuredData.summary = stripHtml(summary.content);
      }
      structuredData._rawSummaryHtml = summary.content;
    }
    
    // Process experience section with improved bullet point extraction
    const experienceSections = sections.filter(s => s.type === 'JOB_ROLE');
    experienceSections.forEach(job => {
      const titleMatch = job.content.match(/<h3[^>]*>(.*?)<\/h3>/i);
      const companyMatch = job.content.match(/<p[^>]*>(.*?)<\/p>/i);
      const bullets = extractBulletPoints(job.content);
      const title = titleMatch ? stripHtml(titleMatch[1]) : job.title;
      let company = '';
      let dateRange = '';
      
      if (companyMatch && companyMatch[1]) {
        const companyParts = stripHtml(companyMatch[1]).split('|');
        if (companyParts.length >= 2) {
          company = companyParts[0].trim();
          dateRange = companyParts[1].trim();
        } else {
          company = companyParts[0].trim();
        }
      }
      
      const experienceEntry = {
        id: job.id,
        title,
        company,
        dateRange,
        type: 'JOB_ROLE',
        bullets,
        _rawHtml: job.content
      };
      
      structuredData.experience.push(experienceEntry);
    });
    
    // Process education section
    const educationSection = sections.find(s => s.type === 'EDUCATION');
    if (educationSection) {
      structuredData._rawEducationHtml = educationSection.content;
      const h3Matches = Array.from(educationSection.content.matchAll(/<h3[^>]*>(.*?)<\/h3>/gi));
      const pMatches = Array.from(educationSection.content.matchAll(/<p[^>]*>(.*?)<\/p>/gi));
      
      if (h3Matches.length > 0 && pMatches.length > 0) {
        for (let i = 0; i < h3Matches.length; i++) {
          if (i < pMatches.length) {
            const degree = stripHtml(h3Matches[i][1]);
            let institution = '';
            let year = '';
            const details = stripHtml(pMatches[i][1]);
            const parts = details.split('|');
            
            if (parts.length >= 2) {
              institution = parts[0].trim();
              year = parts[1].trim();
            } else {
              institution = details.trim();
            }
            
            structuredData.education.push({
              degree,
              institution,
              year
            });
          }
        }
      }
      
      if (structuredData.education.length === 0) {
        const divMatches = Array.from(educationSection.content.matchAll(/<div[^>]*>([\s\S]*?)<\/div>/gi));
        
        for (const match of divMatches) {
          const content = match[1];
          const h3Match = content.match(/<h3[^>]*>(.*?)<\/h3>/i);
          const pMatch = content.match(/<p[^>]*>(.*?)<\/p>/i);
          
          if (h3Match && pMatch) {
            const degree = stripHtml(h3Match[1]);
            const parts = stripHtml(pMatch[1]).split('|');
            let institution = '';
            let year = '';
            
            if (parts.length >= 2) {
              institution = parts[0].trim();
              year = parts[1].trim();
            } else {
              institution = parts[0].trim();
            }
            
            structuredData.education.push({
              degree,
              institution,
              year
            });
          }
        }
      }
      
      if (structuredData.education.length === 0) {
        structuredData.education.push({
          degree: educationSection.title,
          institution: 'University Name',
          year: ''
        });
      }
    }
    
    // Process skills section
    const skills = sections.find(s => s.type === 'SKILLS');
    if (skills) {
      structuredData._rawSkillsHtml = skills.content;
      const categories: Record<string, string[]> = {};
      const pMatches = Array.from(skills.content.matchAll(/<p[^>]*><strong>(.*?)<\/strong>:(.*?)<\/p>/gi));
      
      if (pMatches.length > 0) {
        for (const match of pMatches) {
          const category = stripHtml(match[1]).toLowerCase();
          const skillsList = stripHtml(match[2]).split(',').map(s => s.trim());
          categories[category] = skillsList;
        }
        structuredData.skills = categories;
      } else {
        const simpleMatch = skills.content.match(/<p[^>]*>(.*?)<\/p>/i);
        if (simpleMatch && simpleMatch[1]) {
          structuredData.skills = stripHtml(simpleMatch[1]).split(',').map(s => s.trim());
        } else {
          const bulletMatches = Array.from(skills.content.matchAll(/<li[^>]*>(.*?)<\/li>/gi));
          if (bulletMatches.length > 0) {
            structuredData.skills = bulletMatches.map(match => stripHtml(match[1]));
          }
        }
      }
    }
    
    // Process certifications section
    const certifications = sections.find(s => s.type === 'CERTIFICATIONS');
    if (certifications) {
      structuredData._rawCertificationsHtml = certifications.content;
      const bulletMatches = Array.from(certifications.content.matchAll(/<li[^>]*>(.*?)<\/li>/gi));
      if (bulletMatches.length > 0) {
        structuredData.certifications = bulletMatches.map(match => stripHtml(match[1]));
      }
    }
    
    // Store the complete section data as a backup
    structuredData._rawSections = sections.map(section => ({
      id: section.id,
      title: section.title,
      type: section.type,
      content: section.content,
      parentId: section.parentId
    }));
    
    structuredData._meta = {
      version: '2.0',
      preserved: true,
      lastUpdated: new Date().toISOString()
    };
    
    return structuredData;
  };
  
  // Define handleSave outside of sectionsToStructuredData
      const handleSave = async () => {
  if (!jobApplicationId && !currentResumeId) {
    setError('Missing job application ID or resume ID for saving');
    return;
  }
  
  setIsSaving(true);
  setError(null);
  
  try {
    const structuredData = sectionsToStructuredData(sections);
    
    // Debug log the structured data
    console.log("structuredData type:", typeof structuredData);
    console.log("structuredData keys:", Object.keys(structuredData || {}));
    
    // Ensure jsonContent is properly set with a fallback
    const jsonContentToSave = structuredData ? 
      (typeof structuredData === 'string' ? structuredData : JSON.stringify(structuredData)) 
      : JSON.stringify({});
    
    console.log("jsonContentToSave length:", jsonContentToSave.length);
    
    // Create a properly structured payload
    const payload = {
      id: currentResumeId,
      jsonContent: jsonContentToSave,
      markdownContent: null,  // Explicitly null
      contentType: 'json'
    };
    
    console.log("Sending payload with keys:", Object.keys(payload));
    
    let response;
    
    if (currentResumeId) {
      console.log("Updating existing resume ID:", currentResumeId);
      response = await fetch(`/api/resume/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
    } else {
      console.log("Creating new resume for job ID:", jobApplicationId);
      response = await fetch('/api/resume/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobApplicationId,
          jsonContent: jsonContentToSave,
          markdownContent: null,
          isPrimary: true,
          contentType: 'json'
        }),
      });
    }
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save resume: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log("Resume saved successfully:", data);
      setCurrentResumeId(data.id);
      setSaveSuccess(true);
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving resume:', err);
      setError('Failed to save resume. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    sections,
    setSections,
    isLoading,
    error,
    setError,
    isSaving,
    saveSuccess,
    setSaveSuccess,
    currentResumeId,
    jobDescription,
    handleSave
  };
};

