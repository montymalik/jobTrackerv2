// app/components/resume/EditorHelpGuide.tsx
import React, { useState } from 'react';

interface EditorHelpGuideProps {
  onClose: () => void;
}

const EditorHelpGuide: React.FC<EditorHelpGuideProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('basics');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      
      {/* Help Dialog */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Resume Editor Help Guide</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab('basics')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'basics'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Basics
            </button>
            <button
              onClick={() => setActiveTab('sections')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'sections'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Sections
            </button>
            <button
              onClick={() => setActiveTab('formatting')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'formatting'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Formatting
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'ai'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              AI Enhancement
            </button>
          </nav>
        </div>
        
        {/* Content Area */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {activeTab === 'basics' && (
            <div className="prose prose-blue dark:prose-invert max-w-none">
              <h3>Getting Started</h3>
              <p>
                Welcome to the Resume Editor! This tool allows you to create, edit, and enhance your resume
                for specific job applications. Here's how to get started:
              </p>
              
              <ul>
                <li>
                  <strong>Section Management:</strong> Your resume is divided into sections like Summary, Experience, and Education.
                  Click on any section to edit its content.
                </li>
                <li>
                  <strong>Drag & Drop:</strong> You can reorder sections by dragging them to a new position.
                  Look for the drag handle (≡) on the left side of each section.
                </li>
                <li>
                  <strong>Add/Remove:</strong> Use the "Add Section" button to add new sections.
                  Each section can be removed using the trash icon.
                </li>
                <li>
                  <strong>Save Changes:</strong> Don't forget to save your resume when you're done editing.
                </li>
              </ul>
              
              <h3>Key Features</h3>
              <p>
                The editor offers several powerful features to help you create an effective resume:
              </p>
              
              <ul>
                <li>
                  <strong>AI Enhancement:</strong> Get AI-powered suggestions to improve each section based on the job description.
                </li>
                <li>
                  <strong>Formatting Tools:</strong> Use markdown-style formatting to structure your content.
                </li>
                <li>
                  <strong>Preview:</strong> See how your resume will look as you make changes.
                </li>
                <li>
                  <strong>Multiple Versions:</strong> Create different versions of your resume for different job applications.
                </li>
              </ul>
            </div>
          )}
          
          {activeTab === 'sections' && (
            <div className="prose prose-blue dark:prose-invert max-w-none">
              <h3>Working with Sections</h3>
              <p>
                Your resume is organized into different sections, each serving a specific purpose.
                Here's how to work with them:
              </p>
              
              <h4>Adding Sections</h4>
              <p>
                Click the "Add Section" button to add a new section to your resume.
                You can choose from several pre-defined section types:
              </p>
              
              <ul>
                <li><strong>Summary:</strong> A brief overview of your qualifications and career goals.</li>
                <li><strong>Experience:</strong> Your work history with achievements and responsibilities.</li>
                <li><strong>Education:</strong> Your academic background and qualifications.</li>
                <li><strong>Skills:</strong> Technical and soft skills relevant to the job.</li>
                <li><strong>Projects:</strong> Highlight specific projects you've worked on.</li>
                <li><strong>Certifications:</strong> Professional certifications and licenses.</li>
                <li><strong>Custom Section:</strong> Create a custom section for additional information.</li>
              </ul>
              
              <h4>Reordering Sections</h4>
              <p>
                To change the order of sections in your resume:
              </p>
              
              <ol>
                <li>Find the drag handle (≡) on the left side of the section you want to move.</li>
                <li>Click and hold the drag handle.</li>
                <li>Drag the section to its new position.</li>
                <li>Release to drop the section in place.</li>
              </ol>
              
              <h4>Removing Sections</h4>
              <p>
                To remove a section you no longer need:
              </p>
              
              <ol>
                <li>Click the trash icon on the right side of the section header.</li>
                <li>Confirm the deletion when prompted.</li>
              </ol>
              <p>
                <em>Note: Section deletion cannot be undone, so make sure you want to remove the section before confirming.</em>
              </p>
            </div>
          )}
          
          {activeTab === 'formatting' && (
            <div className="prose prose-blue dark:prose-invert max-w-none">
              <h3>Formatting Your Content</h3>
              <p>
                The editor supports markdown-style formatting to help you structure your content effectively.
                Here are the formatting options available:
              </p>
              
              <h4>Basic Formatting</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
                  <code>**Bold Text**</code>
                </div>
                <div className="p-3">
                  <strong>Bold Text</strong>
                </div>
              </div>
              
              <h4>Section Headings</h4>
              <p>
                Use <code>###</code> to create headings for company names, job titles, or education entries:
              </p>
              
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded mb-2">
                <code>### Company Name | Position | 2019-Present</code>
              </div>
              
              <div className="border p-3 rounded mb-4">
                <h3 className="font-semibold">Company Name | Position | 2019-Present</h3>
              </div>
              
              <h4>Bullet Points</h4>
              <p>
                Use <code>-</code> at the beginning of a line to create bullet points for listing achievements or responsibilities:
              </p>
              
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded mb-2">
                <pre>
                  - Increased sales by 25% through implementing new marketing strategy<br/>
                  - Led a team of 5 developers to deliver project ahead of schedule
                </pre>
              </div>
              
              <div className="border p-3 rounded mb-4">
                <ul className="list-disc pl-5">
                  <li>Increased sales by 25% through implementing new marketing strategy</li>
                  <li>Led a team of 5 developers to deliver project ahead of schedule</li>
                </ul>
              </div>
              
              <h4>Example: Experience Section</h4>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded mb-2">
                <pre>
                  ### TechCorp | Senior Developer | 2019-Present<br/>
                  - Developed scalable API framework that increased performance by 40%<br/>
                  - Mentored junior developers, improving team productivity by 25%<br/>
                  - **Key Achievement**: Led migration to microservices architecture
                </pre>
              </div>
              
              <div className="border p-3 rounded">
                <h3 className="font-semibold">TechCorp | Senior Developer | 2019-Present</h3>
                <ul className="list-disc pl-5 mt-2">
                  <li>Developed scalable API framework that increased performance by 40%</li>
                  <li>Mentored junior developers, improving team productivity by 25%</li>
                  <li><strong>Key Achievement</strong>: Led migration to microservices architecture</li>
                </ul>
              </div>
            </div>
          )}
          
          {activeTab === 'ai' && (
            <div className="prose prose-blue dark:prose-invert max-w-none">
              <h3>AI Enhancement</h3>
              <p>
                The AI Enhancement feature can help you improve your resume by analyzing the job description
                and suggesting targeted improvements to each section.
              </p>
              
              <h4>How It Works</h4>
              <ol>
                <li>Select the section you want to enhance by clicking on it.</li>
                <li>In the right panel, click the "Enhance with AI" button.</li>
                <li>The AI will analyze your section and the job description, then generate an improved version.</li>
                <li>Review the suggested improvements in the "AI Enhanced Version" area.</li>
                <li>Click "Apply" if you want to use the AI's suggestions, or continue editing manually.</li>
              </ol>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-200 dark:border-blue-800 mb-4">
                <h4 className="text-blue-800 dark:text-blue-300">Tips for Better AI Suggestions</h4>
                <ul>
                  <li>Make sure the job description is detailed and complete.</li>
                  <li>Provide specific achievements and responsibilities in your original content.</li>
                  <li>Review AI suggestions carefully - while they're often helpful, they might not always capture your unique experience perfectly.</li>
                  <li>Feel free to combine AI suggestions with your own edits for the best results.</li>
                </ul>
              </div>
              
              <h4>What the AI Improves</h4>
              <p>
                The AI enhancement typically focuses on:
              </p>
              
              <ul>
                <li>Making your content more impactful and achievement-focused</li>
                <li>Including relevant keywords from the job description</li>
                <li>Using strong action verbs</li>
                <li>Quantifying achievements where possible</li>
                <li>Optimizing your content for ATS (Applicant Tracking Systems)</li>
              </ul>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-800">
                <h4 className="text-yellow-800 dark:text-yellow-300">Important Note</h4>
                <p className="mb-0">
                  Always ensure that the AI-enhanced content is accurate and truly reflects your experience.
                  The AI makes suggestions based on patterns and common practices, but you are the expert on your own background.
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer with close button */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorHelpGuide;
