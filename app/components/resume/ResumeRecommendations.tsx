import React, { useState, useEffect } from 'react';

type ResumeRecommendationsProps = {
  jobDescription: string | null;
  onGenerateResume: () => void;
};

export const ResumeRecommendations: React.FC<ResumeRecommendationsProps> = ({ 
  jobDescription, 
  onGenerateResume 
}) => {
  const [loading, setLoading] = useState(false);
  const [resume, setResume] = useState<any>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [matchingSkills, setMatchingSkills] = useState<string[]>([]);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [keywordsFromJob, setKeywordsFromJob] = useState<string[]>([]);

  useEffect(() => {
    const fetchResumeData = async () => {
      try {
        const response = await fetch('/api/resume');
        if (response.ok) {
          const data = await response.json();
          setResume(data);
          setSkills(data.resumeJson?.skills || []);
        }
      } catch (error) {
        console.error('Error fetching resume:', error);
      }
    };

    fetchResumeData();
  }, []);

  useEffect(() => {
    if (!jobDescription || !skills.length) return;

    // Extract keywords from job description
    const commonWords = new Set([
      'and', 'the', 'of', 'to', 'a', 'in', 'for', 'with', 'on', 'at', 'from', 'by',
      'about', 'as', 'an', 'that', 'is', 'are', 'was', 'were', 'be', 'this', 'have',
      'has', 'had', 'not', 'or', 'if', 'but', 'it', 'they', 'their', 'we', 'you', 'will',
      'can', 'should', 'would', 'could'
    ]);

    const words = jobDescription.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));
      
    const wordFrequency: Record<string, number> = {};
    
    words.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
    
    // Sort by frequency and get top keywords
    const sortedKeywords = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
    
    setKeywordsFromJob(sortedKeywords);
    
    // Find matching skills
    const matching = skills.filter(skill => 
      sortedKeywords.some(keyword => 
        skill.toLowerCase().includes(keyword) || 
        keyword.includes(skill.toLowerCase())
      )
    );
    
    setMatchingSkills(matching);
    
    // Find potential missing skills
    const missing = sortedKeywords.filter(keyword => 
      !skills.some(skill => 
        skill.toLowerCase().includes(keyword) || 
        keyword.includes(skill.toLowerCase())
      )
    ).slice(0, 5);
    
    setMissingSkills(missing);
    
  }, [jobDescription, skills]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Resume Recommendations</h3>
      
      {!resume ? (
        <div className="text-center py-4">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No base resume found.</p>
          <button
            onClick={onGenerateResume}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Upload Resume
          </button>
        </div>
      ) : !jobDescription ? (
        <p className="text-gray-500 dark:text-gray-400 py-4">
          Enter a job description to see resume recommendations.
        </p>
      ) : (
        <div className="space-y-5">
          <div>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
              Matching Skills ({matchingSkills.length})
            </h4>
            {matchingSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {matchingSkills.map((skill, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No direct skill matches found.
              </p>
            )}
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
              Skills to Highlight
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Consider emphasizing these skills in your tailored resume
            </p>
            <div className="flex flex-wrap gap-2">
              {matchingSkills.slice(0, 5).map((skill, index) => (
                <span 
                  key={index} 
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
          
          {missingSkills.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-2">
                Potential Skill Gaps
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                These keywords appear in the job description but might not be in your resume
              </p>
              <div className="flex flex-wrap gap-2">
                {missingSkills.map((keyword, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs font-medium rounded-full"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="pt-2">
            <button
              onClick={onGenerateResume}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Generate Tailored Resume
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              This will create a customized version of your resume highlighting relevant skills and experience.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
