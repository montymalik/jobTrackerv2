// Here's a much more direct approach for your BulletPointFormatter.tsx
import React from 'react';
import { ResumeSection, ResumeSectionType } from '@/app/lib/types';

interface BulletPointFormatterProps {
  currentSection: string | null;
  sections: ResumeSection[];
  onUpdateContent: (sectionId: string, newContent: string) => void;
}

const BulletPointFormatter: React.FC<BulletPointFormatterProps> = ({ 
  currentSection, 
  sections, 
  onUpdateContent 
}) => {
  if (!currentSection) return null;
  
  const currentSectionData = sections.find(s => s.id === currentSection);
  if (!currentSectionData || currentSectionData.type !== 'JOB_ROLE') return null;
  
  // Force indentation with a direct approach
  const indentBullets = () => {
    // Get the current content
    let content = currentSectionData.content;
    
    // Step 1: Replace list items with strong indentation
    content = content.replace(
      /<li([^>]*)>(.*?)<\/li>/gi,
      (match, attributes, innerContent) => {
        // If it already starts with a bullet point symbol
        if (innerContent.trim().startsWith('•')) {
          return `<li${attributes}><div style="padding-left: 60px !important; text-indent: 0 !important;">${innerContent}</div></li>`;
        } else {
          // If not, add one and the indentation
          return `<li${attributes}><div style="padding-left: 60px !important; text-indent: 0 !important;">• ${innerContent}</div></li>`;
        }
      }
    );
    
    // Step 2: Add direct divs for any bullet points not in list items
    content = content.replace(
      /(<p[^>]*>|<div[^>]*>|\n|^)\s*([•])\s+([^<\n]+)/gi,
      '$1<div style="padding-left: 60px !important; text-indent: 0 !important;">$2 $3</div>'
    );
    
    // Step 3: Add inline indentation to any remaining bullet symbols
    content = content.replace(
      /([^<>])([•])([^<>]*)/g,
      '$1<span style="display: inline-block; margin-left: 60px !important;">$2$3</span>'
    );
    
    // Update the content
    onUpdateContent(currentSection, content);
  };
  
  // Add direct CSS style to the HTML
  const addDirectStyles = () => {
    // Get the current content
    const content = currentSectionData.content;
    
    // Add a style tag that targets all bullet points
    const styledContent = `
<style>
/* Target any list item */
li {
  position: relative;
}
/* Add indentation to bullet points */
li::before {
  content: "•";
  position: absolute;
  left: 60px !important;
}
/* Hide original bullets if using list-style */
ul {
  list-style-position: inside;
}
/* Direct bullet character indentation */
.bullet-indent, li > span:first-child, li > div:first-child {
  padding-left: 60px !important;
  display: block !important;
}
</style>
${content}`;
    
    // Update with the new styled content
    onUpdateContent(currentSection, styledContent);
  };
  
  // Replace all bullet points with properly formatted HTML
  const replaceBullets = () => {
    const content = currentSectionData.content;
    
    // Create a temporary div to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    
    // Find all bullet points and add indentation divs
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      tempDiv,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node: Node | null;
    while (node = walker.nextNode()) {
      if (node.textContent && node.textContent.includes('•')) {
        textNodes.push(node as Text);
      }
    }
    
    // Replace bullet points with indented versions
    textNodes.forEach(textNode => {
      const newContent = textNode.textContent!.replace(
        /•\s*(.*)/g,
        '<div style="padding-left: 60px !important; margin-left: 0 !important;">• $1</div>'
      );
      
      // Create a span to hold the new HTML
      const span = document.createElement('span');
      span.innerHTML = newContent;
      
      // Replace the text node with the new span
      if (textNode.parentNode) {
        textNode.parentNode.replaceChild(span, textNode);
      }
    });
    
    // Get the modified HTML
    const modifiedContent = tempDiv.innerHTML;
    onUpdateContent(currentSection, modifiedContent);
  };
  
  // Direct CSS approach
  const applyInlineIndentation = () => {
    const content = currentSectionData.content;
    
    // Replace list items that contain bullet points to add indentation
    let newContent = content.replace(
      /(<li[^>]*>)([\s\S]*?)(•)([\s\S]*?)(<\/li>)/gi,
      `$1<div style="padding-left: 60px !important;">$3$4</div>$5`
    );
    
    // For bullet points not in list items
    newContent = newContent.replace(
      /([^>])(•)([^<]*)/gi,
      `$1<div style="padding-left: 60px !important;">$2$3</div>`
    );
    
    onUpdateContent(currentSection, newContent);
  };
  return (
    <div className="mb-3 space-y-2">
      <button
        onClick={indentBullets}
        className="bg-purple-700 hover:bg-purple-600 text-xs px-3 py-1 rounded"
      >
        Force Indent Bullets (5 spaces)
      </button>
      
      <button
        onClick={applyInlineIndentation}
        className="bg-blue-700 hover:bg-blue-600 text-xs px-3 py-1 rounded ml-2"
      >
        Apply Bullet Indentation
      </button>
    </div>
  );
};
export default BulletPointFormatter;
