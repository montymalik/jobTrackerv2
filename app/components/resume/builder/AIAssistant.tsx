// app/components/resume/builder/AIAssistant.tsx
import React, { useState, useEffect } from 'react';

interface AIAssistantProps {
  prompt: string;
  onClose: () => void;
  onApply: (text: string) => void;
  jobDescription?: string | null;
}

const AIAssistant: React.FC<AIAssistantProps> = ({
  prompt,
  onClose,
  onApply,
  jobDescription = null
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState('');
  const [editableSuggestion, setEditableSuggestion] = useState('');

  // Add debug logging
  useEffect(() => {
    console.log("AIAssistant received jobDescription:", 
      jobDescription ? `${jobDescription.substring(0, 50)}... (${jobDescription.length} chars)` : "null");
  }, [jobDescription]);

  useEffect(() => {
    const fetchAISuggestion = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Default job description in case we don't have one
        const defaultJobDesc = "Customer Success Manager position focused on SaaS products, strategic account management, and driving customer value. Required skills include account management experience, upselling capabilities, strategic planning for product adoption, understanding of IT concepts, and strong communication skills.";
        
        // Use the provided job description if available, otherwise use default
        const effectiveJobDesc = jobDescription || defaultJobDesc;
        
        console.log("AI request using prompt:", prompt.substring(0, 50) + "...");
        console.log("AI request using job description of length:", effectiveJobDesc.length);
        
        // Using the updated resume-match-analysis endpoint
        const response = await fetch('/api/resume/resume-match-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jobDescription: effectiveJobDesc,
            fieldText: prompt
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to get AI suggestion');
        }
        
        const data = await response.json();
        
        // Use the suggestion directly from the response
        const enhancedText = data.analysis ? data.analysis.trim() : '';
        
        console.log("Received AI suggestion of length:", enhancedText.length);
        
        setSuggestion(enhancedText);
        setEditableSuggestion(enhancedText);
      } catch (err) {
        console.error('Error getting AI suggestion:', err);
        setError('Failed to get AI suggestion. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAISuggestion();
  }, [prompt, jobDescription]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700 p-4 z-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">AI Suggestion</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center p-6">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-3 text-gray-700 dark:text-gray-300">Generating suggestion...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-red-800 dark:text-red-200">
            {error}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Edit the suggestion if needed before applying:
            </p>
            <textarea
              value={editableSuggestion}
              onChange={(e) => setEditableSuggestion(e.target.value)}
              className="w-full p-3 border rounded-md mb-4 min-h-[120px] dark:bg-gray-700 dark:border-gray-600"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditableSuggestion(suggestion)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded"
              >
                Reset
              </button>
              <button
                onClick={() => onApply(editableSuggestion)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Apply Suggestion
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
