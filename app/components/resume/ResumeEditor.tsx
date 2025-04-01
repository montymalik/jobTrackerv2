// app/components/resume/ResumeEditor.tsx
import React, { useState, useMemo } from 'react';
import { ResumeExportButton } from '@/app/lib/ResumeExporter';
import { ResumeSection, ResumeSectionType } from '@/app/lib/types';
import AIResumeAnalyzer from './AIResumeAnalyzer';
// Import refactored components
import { SectionList } from './resume-editor/SectionList';
import { SectionEditor } from './resume-editor/SectionEditor';
import { ErrorBoundary } from './resume-editor/ErrorBoundary';
// Import custom hooks
import { useResumeData } from './resume-editor/hooks/useResumeData';
import { useSectionManagement } from './resume-editor/hooks/useSectionManagement';
import { usePdfExport } from './resume-editor/hooks/usePdfExport';
interface ResumeEditorProps {
  resumeId?: string;
  jobApplicationId?: string;
  onSave?: (sections: ResumeSection[]) => Promise<void>;
}
const ResumeEditor: React.FC<ResumeEditorProps> = ({ resumeId, jobApplicationId }) => {
  // UI state
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  // Get resume data and methods from custom hooks
  const {
    resumeSections,
    setResumeSections,
    isLoading,
    error,
    setError,
    isSaving,
    saveSuccess,
    setSaveSuccess,
    currentResumeId,
    jobDescription,
    sectionHierarchy,
    setSectionHierarchy,
    handleSave
  } = useResumeData(resumeId, jobApplicationId);
  const {
    activeSection,
    setActiveSection,
    handleSectionClick,
    handleContentEdit,
    handleDeleteSection,
    handleAddSummary,
    handleAddSection,
    handleAddJobRole,
    shouldShowAddJobRoleButton,
    handleApplySuggestion, // Make sure this is included
    getSectionTypeOrder,
    canMoveSection,
    handleMoveUp,
    handleMoveDown,
    handleMoveChildUp, // Add this
    handleMoveChildDown // Add this
  } = useSectionManagement(
    resumeSections, 
    setResumeSections, 
    sectionHierarchy, 
    setSectionHierarchy,
    setSaveSuccess // Pass the setSaveSuccess function to the hook
  );
  const { pdfExportContent } = usePdfExport(resumeSections, getSectionTypeOrder);
  // Toggle analyzer visibility
  const toggleAnalyzer = () => setShowAnalyzer(prev => !prev);
  // Memoize expensive calculations
  const sortedTopLevelSections = useMemo(() => {
    // Filter out only top-level sections
    const topLevelSections = resumeSections.filter(section => 
      !section.parentId || Object.keys(sectionHierarchy).includes(section.id)
    );
    
    // Important: Keep the exact same order as in resumeSections
    // Just ensure Header and Summary are at the top
    
    // First extract Header and Summary
    const header = topLevelSections.find(s => s.type === ResumeSectionType.HEADER);
    const summary = topLevelSections.find(s => 
      s.type === ResumeSectionType.SUMMARY && s.id === 'summary'
    );
    
    // Then get all other sections in their original order
    const otherSections = topLevelSections.filter(s => 
      s.type !== ResumeSectionType.HEADER && 
      !(s.type === ResumeSectionType.SUMMARY && s.id === 'summary')
    );
    
    // Combine them in the correct order
    const result = [];
    if (header) result.push(header);
    if (summary) result.push(summary);
    result.push(...otherSections);
    
    console.log('Sorted sections:', result.map(s => s.title));
    return result;
  }, [resumeSections, sectionHierarchy]);
  // No data state
  if (!isLoading && resumeSections.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-6 text-white">
        <h2 className="text-xl font-bold mb-4">Resume Editor - No Data Found</h2>
        <div className="p-4 bg-yellow-900/20 rounded-md">
          <p className="text-yellow-400 mb-2">
            ⚠️ No resume sections were loaded. This might be due to:
          </p>
          <ul className="list-disc pl-5 text-yellow-200 space-y-1">
            <li>API endpoint not returning data correctly</li>
            <li>No primary resume found for this job</li>
            <li>Error in data processing</li>
          </ul>
          <div className="mt-4">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <ErrorBoundary>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Resume Content */}
        <div className="lg:col-span-2 bg-gray-900 rounded-lg p-6 text-white">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Resume Editor</h2>
            <div className="flex space-x-2">
              <button 
                onClick={handleAddSection}
                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm mr-2"
              >
                Add Section
              </button>
              {!resumeSections.some(s => s.type === ResumeSectionType.SUMMARY) && (
                <button 
                  onClick={handleAddSummary}
                  className="bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded text-sm mr-2"
                >
                  Add Summary
                </button>
              )}
              <button
                onClick={toggleAnalyzer}
                className={`px-3 py-1 rounded text-sm mr-2 ${
                  showAnalyzer 
                    ? 'bg-purple-800 hover:bg-purple-900' 
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {showAnalyzer ? 'Hide Analyzer' : 'ATS Analyzer'}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm disabled:opacity-50 mr-2"
              >
                {isSaving ? "Saving..." : "Save Resume"}
              </button>
              <ResumeExportButton
                content={pdfExportContent}
                contentType="markdown"
                filename={`Resume_${new Date().toISOString().split('T')[0]}.pdf`}
                metadata={{ id: currentResumeId ?? undefined }}
                buttonText="Export PDF"
                buttonClassName="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                customFonts={{
                  name: 'Arial',
                  headings: 'Arial',
                  body: 'Arial'
                }}
                colors={{
                  name: '#000000',
                  headings: '#000000',
                  subheadings: '#000000',
                  body: '#000000',
                  bullet: '#000000'
                }}
                isDisabled={resumeSections.length === 0}
                onSuccess={() => {
                  setSaveSuccess(true);
                  setTimeout(() => setSaveSuccess(false), 3000);
                }}
                onError={(error) => {
                  console.error('PDF Export error:', error);
                  setError(`Failed to export PDF: ${error.message}`);
                }}
              />
            </div>
          </div>
          
          {/* Resume Sections List */}
          <SectionList
            sections={resumeSections}
            topLevelSections={sortedTopLevelSections}
            sectionHierarchy={sectionHierarchy}
            activeSection={activeSection}
            onSectionClick={handleSectionClick}
            onDeleteSection={handleDeleteSection}
            onMoveUp={(sectionId, e) => {
              e.stopPropagation();
              handleMoveUp(sectionId);
            }}
            onMoveDown={(sectionId, e) => {
             e.stopPropagation();
             handleMoveDown(sectionId);
            }}
            handleMoveChildUp={handleMoveChildUp}
            handleMoveChildDown={handleMoveChildDown}
            onAddJobRole={handleAddJobRole}
            shouldShowAddJobRoleButton={shouldShowAddJobRoleButton}
            canMoveSection={canMoveSection}
          />
          
          {/* Status Messages */}
          <div className="mt-6">
            {saveSuccess && (
              <div className="p-2 bg-green-900/20 text-green-400 rounded">
                {isSaving ? "Resume saved successfully!" : "Action completed successfully!"}
              </div>
            )}
            {error && (
              <div className="p-2 bg-red-900/20 text-red-400 rounded">
                {error}
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column (1/3): Either Section Editor or AI Resume Analyzer */}
        <div className="bg-gray-900 rounded-lg p-6 text-white">
          {showAnalyzer ? (
            <AIResumeAnalyzer 
              resumeId={currentResumeId}
              jobDescription={jobDescription}
              jobApplicationId={jobApplicationId}
              resumeSections={resumeSections}
              onApplySuggestion={handleApplySuggestion} // Make sure this is correctly passed!
            />
          ) : (
            <SectionEditor
              activeSection={activeSection}
              resumeSections={resumeSections}
              setResumeSections={setResumeSections}
              handleContentEdit={handleContentEdit}
              showTemplatePicker={showTemplatePicker}
              setShowTemplatePicker={setShowTemplatePicker}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};
export default ResumeEditor;
