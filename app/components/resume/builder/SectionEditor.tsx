// app/components/resume/builder/SectionEditor.tsx
import React, { useState } from 'react';
import { ResumeSection } from '@/app/lib/types';
import AIAssistant from './AIAssistant';

interface SectionEditorProps {
  section: ResumeSection;
  onContentChange: (content: string) => void;
  onTitleChange: (title: string) => void;
  jobDescription?: string | null;
}

const SectionEditor: React.FC<SectionEditorProps> = ({
  section,
  onContentChange,
  onTitleChange,
  jobDescription = null
}) => {
  const [showAI, setShowAI] = useState(false);
  const [aiTarget, setAiTarget] = useState<string>('');
  const [aiPrompt, setAiPrompt] = useState<string>('');
  
  // Special handling for different section types
  const renderEditor = () => {
    switch (section.type) {
      case 'HEADER':
        return renderHeaderEditor();
      case 'SUMMARY':
        return renderSummaryEditor();
      case 'JOB_ROLE':
        return renderJobRoleEditor();
      case 'SKILLS':
        return renderSkillsEditor();
      default:
        return renderGenericEditor();
    }
  };
  
  // Header section editor (name, contact info)
  const renderHeaderEditor = () => {
    // Extract name and contact info from HTML content
    const nameMatch = section.content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const contactMatch = section.content.match(/<p[^>]*>(.*?)<\/p>/i);
    
    const name = nameMatch ? nameMatch[1] : '';
    const contactInfo = contactMatch ? contactMatch[1] : '';
    
    const updateHeaderContent = (newName: string, newContactInfo: string) => {
      const newContent = `<h1 class="text-2xl font-bold">${newName}</h1>
                         <p class="text-gray-300">${newContactInfo}</p>`;
      onContentChange(newContent);
    };
    
    return (
      <div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => updateHeaderContent(e.target.value, contactInfo)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Contact Information (Email | Phone | Location)
          </label>
          <input
            type="text"
            value={contactInfo}
            onChange={(e) => updateHeaderContent(name, e.target.value)}
            placeholder="email@example.com | (555) 123-4567 | City, State"
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>
    );
  };
  
  // Summary section editor
  const renderSummaryEditor = () => {
    // Extract summary content from HTML
    const contentMatch = section.content.match(/<p[^>]*>(.*?)<\/p>/i);
    const summaryContent = contentMatch ? contentMatch[1] : '';
    
    const updateSummaryContent = (newSummary: string) => {
      const newContent = `<p class="text-gray-200">${newSummary}</p>`;
      onContentChange(newContent);
    };
    
    const handleAIAssist = () => {
      setAiTarget('summary');
      setAiPrompt('Generate a professional summary highlighting my experience and skills.');
      setShowAI(true);
    };
    
    const handleApplySuggestion = (suggestion: string) => {
      if (aiTarget === 'summary') {
        updateSummaryContent(suggestion);
      }
      setShowAI(false);
    };
    
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Section Title
          </label>
          <button
            onClick={handleAIAssist}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Assist
          </button>
        </div>
        
        <input
          type="text"
          value={section.title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:border-gray-600"
        />
        
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Summary Content
        </label>
        <textarea
          value={summaryContent}
          onChange={(e) => updateSummaryContent(e.target.value)}
          rows={6}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
        />
        
        {showAI && aiTarget === 'summary' && (
          <AIAssistant
            prompt={aiPrompt}
            onClose={() => setShowAI(false)}
            onApply={handleApplySuggestion}
            jobDescription={jobDescription}
          />
        )}
      </div>
    );
  };
  
  // Job role editor
  const renderJobRoleEditor = () => {
    // Extract job role details from HTML content
    const titleMatch = section.content.match(/<h3[^>]*>(.*?)<\/h3>/i);
    const companyMatch = section.content.match(/<p[^>]*>(.*?)<\/p>/i);
    
    // Extract bullet points
    const bulletMatches = Array.from(section.content.matchAll(/<li[^>]*>(.*?)<\/li>/gi));
    const bullets = bulletMatches.map(match => match[1]);
    
    const jobTitle = titleMatch ? titleMatch[1] : '';
    const companyAndDates = companyMatch ? companyMatch[1] : '';
    
    // Update job role content with all fields
    const updateJobContent = (title: string, companyDates: string, newBullets: string[]) => {
      const bulletsList = newBullets.map(bullet => `<li>${bullet}</li>`).join('');
      
      const newContent = `<h3>${title}</h3>
                         <p>${companyDates}</p>
                         <ul class="list-disc pl-5">
                           ${bulletsList}
                         </ul>`;
      
      onContentChange(newContent);
    };
    
    // Update a specific bullet point
    const updateBullet = (index: number, text: string) => {
      const newBullets = [...bullets];
      newBullets[index] = text;
      updateJobContent(jobTitle, companyAndDates, newBullets);
    };
    
    // Add a new bullet point
    const addBullet = () => {
      const newBullets = [...bullets, 'New responsibility'];
      updateJobContent(jobTitle, companyAndDates, newBullets);
    };
    
    // Remove a bullet point
    const removeBullet = (index: number) => {
      const newBullets = bullets.filter((_, i) => i !== index);
      updateJobContent(jobTitle, companyAndDates, newBullets);
    };
    
    // Handle AI enhancement for a specific bullet
    const handleBulletAIAssist = (index: number, text: string) => {
      setAiTarget(`bullet-${index}`);
      setAiPrompt(`Enhance this job responsibility to be more impactful and results-oriented: "${text}"`);
      setShowAI(true);
    };
    
    // Apply AI suggestion to the right bullet
    const handleApplySuggestion = (suggestion: string) => {
      if (aiTarget.startsWith('bullet-')) {
        const index = parseInt(aiTarget.split('-')[1]);
        updateBullet(index, suggestion);
      }
      setShowAI(false);
    };
    
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Job Title
          </label>
        </div>
        
        <input
          type="text"
          value={jobTitle}
          onChange={(e) => updateJobContent(e.target.value, companyAndDates, bullets)}
          className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:border-gray-600"
          placeholder="Software Engineer"
        />
        
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Company and Dates
        </label>
        <input
          type="text"
          value={companyAndDates}
          onChange={(e) => updateJobContent(jobTitle, e.target.value, bullets)}
          className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:border-gray-600"
          placeholder="Company Name | Jan 2020 - Present"
        />
        
        <div className="mb-2 flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Responsibilities
          </label>
          <button
            onClick={addBullet}
            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm"
          >
            + Add
          </button>
        </div>
        
        {bullets.map((bullet, index) => (
          <div key={index} className="mb-2 flex items-start">
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <span className="mr-2 text-gray-500">•</span>
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => updateBullet(index, e.target.value)}
                  className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
              </div>
            </div>
            <div className="flex ml-2">
              <button
                onClick={() => handleBulletAIAssist(index, bullet)}
                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm mr-1"
                title="AI Enhance"
              >
                AI
              </button>
              <button
                onClick={() => removeBullet(index)}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm"
                title="Remove"
              >
                ×
              </button>
            </div>
          </div>
        ))}
        
        {showAI && aiTarget.startsWith('bullet-') && (
          <AIAssistant
            prompt={aiPrompt}
            onClose={() => setShowAI(false)}
            onApply={handleApplySuggestion}
            jobDescription={jobDescription}
          />
        )}
      </div>
    );
  };
  
  // Skills section editor
  const renderSkillsEditor = () => {
    // Extract skills content
    const contentMatch = section.content.match(/<p[^>]*>(.*?)<\/p>/i);
    const skillsContent = contentMatch ? contentMatch[1] : '';
    
    const updateSkillsContent = (newSkills: string) => {
      const newContent = `<p class="text-gray-200">${newSkills}</p>`;
      onContentChange(newContent);
    };
    
    const handleAIAssist = () => {
      setAiTarget('skills');
      setAiPrompt('Generate a list of relevant skills for my resume based on my experience.');
      setShowAI(true);
    };
    
    const handleApplySuggestion = (suggestion: string) => {
      if (aiTarget === 'skills') {
        updateSkillsContent(suggestion);
      }
      setShowAI(false);
    };
    
    return (
      <div>
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Section Title
          </label>
          <button
            onClick={handleAIAssist}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI Assist
          </button>
        </div>
        
        <input
          type="text"
          value={section.title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:border-gray-600"
        />
        
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Skills (separate with commas)
        </label>
        <textarea
          value={skillsContent}
          onChange={(e) => updateSkillsContent(e.target.value)}
          rows={4}
          className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          placeholder="JavaScript, React, Node.js, Python, etc."
        />
        
        {showAI && aiTarget === 'skills' && (
          <AIAssistant
            prompt={aiPrompt}
            onClose={() => setShowAI(false)}
            onApply={handleApplySuggestion}
            jobDescription={jobDescription}
          />
        )}
      </div>
    );
  };
  
  // Generic section editor for other section types
  const renderGenericEditor = () => {
    return (
      <div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Section Title
          </label>
          <input
            type="text"
            value={section.title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Content
          </label>
          <textarea
            value={section.content}
            onChange={(e) => onContentChange(e.target.value)}
            rows={10}
            className="w-full p-2 border rounded font-mono text-sm dark:bg-gray-700 dark:border-gray-600"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            You can use HTML formatting for this section.
          </p>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg">
      {renderEditor()}
    </div>
  );
};

export default SectionEditor;
