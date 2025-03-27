// app/lib/targeted-fix.ts
import { ResumeSection } from '@/app/lib/types';

/**
 * This function applies a direct fix to the resume sections by manually
 * correcting the problematic roles. This is a brute-force approach that
 * focuses on reliability over elegance.
 */
export const applyDirectFix = (sections: ResumeSection[]): ResumeSection[] => {
  // Step 1: Find the technical manager role
  const techManagerRole = sections.find(section => 
    section.type === 'JOB_ROLE' && 
    section.title.includes('Technical Manager') && 
    section.content.includes('Oil and Gas')
  );
  
  // Step 2: Find the directed R&D role
  const directedRole = sections.find(section => 
    section.type === 'JOB_ROLE' && 
    (section.title.includes('Directed R&D') || section.title.includes('Application Engineering:'))
  );
  
  // Step 3: Find the Application Engineering/Mentored Team role
  const mentoredRole = sections.find(section => 
    section.type === 'JOB_ROLE' && 
    (section.title.includes('Mentored Application') || section.title.includes('Application Engineering Team'))
  );
  
  // Track which sections to remove
  const removeIds: string[] = [];
  
  // Step 4: Fix the Technical Manager role
  if (techManagerRole) {
    // Get original content
    let updatedContent = techManagerRole.content;
    
    // Add proper bullet points if there aren't any
    if (!updatedContent.includes('<li>')) {
      const hasUlTag = updatedContent.includes('<ul');
      
      // Replace empty bullet with proper content
      updatedContent = updatedContent.replace(
        /<li>\s*•\s*<\/li>/g,
        `<li><strong class="text-white">Directed R&D and Application Engineering:</strong> Managed a team of 6 R&D researchers, driving product development and application engineering initiatives within the Oil and Gas sector, aligning technical innovation with market needs.</li>`
      );
      
      // If there's no list at all, add one
      if (!hasUlTag) {
        // Find position after company/date line
        const dateLinePos = updatedContent.indexOf('2012 – 2017</p>');
        if (dateLinePos > -1) {
          const insertPos = dateLinePos + '2012 – 2017</p>'.length;
          
          const bulletList = `
            <ul class="list-disc list-inside text-gray-100 leading-relaxed space-y-2">
              <li><strong class="text-white">Directed R&D and Application Engineering:</strong> Managed a team of 6 R&D researchers, driving product development and application engineering initiatives within the Oil and Gas sector, aligning technical innovation with market needs.</li>
              <li><strong class="text-white">Secured Government Funding:</strong> Successfully secured <strong>$500,000</strong> in government funding to directly support R&D activities and fuel product innovation within the Oil and Gas division, demonstrating resourcefulness and strategic vision.</li>
              <li><strong class="text-white">Established Innovation Laboratory:</strong> Designed and led the development of 3M Canada's Oil and Gas Laboratory and Customer Innovation Center, creating a state-of-the-art hub for enhanced technical collaboration and customer engagement.</li>
              <li><strong class="text-white">Managed Executive Relationships:</strong> Hosted high-profile customer events attended by senior executives from key Oil and Gas firms, strengthening client relationships and positioning 3M as a strategic partner.</li>
            </ul>
          `;
          
          updatedContent = updatedContent.slice(0, insertPos) + bulletList + updatedContent.slice(insertPos);
        }
      }
      
      // Update the content
      techManagerRole.content = updatedContent;
    }
    
    // If we found and processed the directed role, mark it for removal
    if (directedRole) {
      removeIds.push(directedRole.id);
    }
  }
  
  // Step 5: Return filtered sections
  if (removeIds.length > 0) {
    return sections.filter(section => !removeIds.includes(section.id));
  }
  
  return sections;
};

/**
 * Function that simply replaces the Director R&D section by directly
 * injecting the correct HTML structure into the resume content.
 */
export const fixResumeWithDirectInjection = (html: string): string => {
  // First, check if the problematic pattern exists
  if (html.includes('Technical Manager, Oil and Gas Markets') && 
      html.includes('Directed R&D')) {
    
    // Find the Technical Manager section
    const techManagerStart = html.indexOf('<div class="mb-4">', html.indexOf('Technical Manager, Oil and Gas Markets'));
    if (techManagerStart === -1) return html;
    
    // Find where to inject the bullets (after the company/date line)
    const dateLineEnd = html.indexOf('</p>', html.indexOf('3M Canada Company | 2012 – 2017', techManagerStart));
    if (dateLineEnd === -1) return html;
    
    // Prepare the bullet points to inject
    const bulletPointsHtml = `
      </p>
      <ul class="list-disc list-inside text-gray-100 leading-relaxed space-y-2">
        <li><strong class="text-white">Directed R&D and Application Engineering:</strong> Managed a team of 6 R&D researchers, driving product development and application engineering initiatives within the Oil and Gas sector, aligning technical innovation with market needs.</li>
        <li><strong class="text-white">Secured Government Funding:</strong> Successfully secured <strong>$500,000</strong> in government funding to directly support R&D activities and fuel product innovation within the Oil and Gas division, demonstrating resourcefulness and strategic vision.</li>
        <li><strong class="text-white">Established Innovation Laboratory:</strong> Designed and led the development of 3M Canada's Oil and Gas Laboratory and Customer Innovation Center, creating a state-of-the-art hub for enhanced technical collaboration and customer engagement.</li>
        <li><strong class="text-white">Managed Executive Relationships:</strong> Hosted high-profile customer events attended by senior executives from key Oil and Gas firms, strengthening client relationships and positioning 3M as a strategic partner.</li>
      </ul>
    `;
    
    // Inject the bullet points
    let modifiedHtml = html.substring(0, dateLineEnd + 4) + bulletPointsHtml + html.substring(dateLineEnd + 4);
    
    // Find the Directed R&D section and remove it
    const directedRnDStart = modifiedHtml.indexOf('<div class="mb-4">', modifiedHtml.indexOf('Directed R&D and Application Engineering'));
    if (directedRnDStart !== -1) {
      const directedRnDEnd = modifiedHtml.indexOf('</div>', directedRnDStart);
      if (directedRnDEnd !== -1) {
        // Remove the problematic section
        modifiedHtml = modifiedHtml.substring(0, directedRnDStart) + modifiedHtml.substring(directedRnDEnd + 6);
      }
    }
    
    return modifiedHtml;
  }
  
  return html;
};
