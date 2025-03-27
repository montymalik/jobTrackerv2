// app/components/resume/ResumeHTMLTemplates.tsx
import React from 'react';

export interface TemplateOption {
  id: string;
  label: string;
  content: string;
}

export const resumeTemplates: TemplateOption[] = [
  {
    id: 'summary',
    label: 'Professional Summary',
    content: `<p class="text-gray-100 leading-relaxed mb-4">
  Results-driven <strong class="text-white">Customer Success Professional</strong> with 10+ years of experience building strong client relationships and driving customer value. Proven expertise in on-boarding, training, and proactive support, ensuring seamless customer experiences and fostering long-term partnerships. Detail-oriented and passionate about leveraging customer feedback to continuously improve product offerings and exceed customer expectations.
</p>`
  },
  {
    id: 'achievements',
    label: 'Key Achievements',
    content: `<ul class="list-disc pl-6 space-y-4">
  <li class="mb-2 leading-relaxed text-gray-100">
    <strong class="text-white font-semibold">Customer Adoption & Revenue Growth:</strong> Drove a 20% increase in adoption of Connected Safety SaaS platform across enterprise accounts, generating over $5MM in upsell revenue through proactive customer engagement and issue resolution.
  </li>
  <li class="mb-2 leading-relaxed text-gray-100">
    <strong class="text-white font-semibold">Enhanced Customer Onboarding:</strong> Streamlined customer onboarding processes by 15% by developing a custom project management tool and standardized training programs, resulting in consistent and high-quality customer experiences.
  </li>
  <li class="mb-2 leading-relaxed text-gray-100">
    <strong class="text-white font-semibold">Voice of Customer Advocacy:</strong> Effectively acted as the voice of the customer, collaborating cross-functionally with sales, engineering, and product teams to deliver tailored solutions and drive product improvements based on customer feedback.
  </li>
</ul>`
  },
  {
    id: 'work-experience',
    label: 'Work Experience',
    content: `<div class="mb-4">
  <h3 class="text-lg font-semibold text-white mb-2">3M Canada Company | Customer Success / On-boarding Specialist | 2019 - 2023</h3>
  <ul class="list-disc pl-6 space-y-3 text-gray-100">
    <li class="mb-2 leading-relaxed">
      <strong class="text-white">Customer Onboarding & Training:</strong> Spearheaded post-sale deployment and comprehensive customer training for 3M's Connected Safety SaaS platform, ensuring rapid user adoption for enterprise clients like Amazon and Microsoft.
    </li>
    <li class="mb-2 leading-relaxed">
      Developed and executed <strong class="text-white">Mutual Success Plans</strong> with key accounts, aligning strategic priorities and ensuring achievement of mutual business goals.
    </li>
    <li class="mb-2 leading-relaxed">
      Provided expert technical troubleshooting for complex enterprise implementations, <strong class="text-white">reducing average resolution time by 15%</strong> and improving client satisfaction related to technical support by 10%.
    </li>
  </ul>
</div>`
  },
  {
    id: 'skills',
    label: 'Key Skills',
    content: `<div class="mb-4">
  <ul class="list-disc pl-6 space-y-2 text-gray-100">
    <li class="leading-relaxed"><strong class="text-white">Customer Success:</strong> Account Management, Relationship Building, Solution Selling</li>
    <li class="leading-relaxed"><strong class="text-white">Technical Skills:</strong> SaaS Implementation, Training Development, Technical Documentation</li>
    <li class="leading-relaxed"><strong class="text-white">Tools:</strong> Salesforce, Gainsight, Asana, JIRA, Confluence, Microsoft Office Suite</li>
    <li class="leading-relaxed"><strong class="text-white">Soft Skills:</strong> Communication, Problem-Solving, Presentation, Stakeholder Management</li>
  </ul>
</div>`
  },
  {
    id: 'education',
    label: 'Education',
    content: `<div class="mb-4">
  <h3 class="text-lg font-semibold text-white mb-2">Education</h3>
  <p class="mb-2 text-gray-100"><strong class="text-white">Bachelor of Science, Computer Science</strong> - University of Toronto (2015)</p>
  <p class="mb-2 text-gray-100"><strong class="text-white">Certified Customer Success Manager (CCSM)</strong> - Success Hacker (2020)</p>
  <p class="mb-2 text-gray-100"><strong class="text-white">Salesforce Certified Administrator</strong> - Salesforce (2019)</p>
</div>`
  }
];

interface TemplatePickerProps {
  onSelectTemplate: (content: string) => void;
}

const ResumeTemplatesPicker: React.FC<TemplatePickerProps> = ({ onSelectTemplate }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-md">
      <h3 className="text-white font-medium mb-3">Select a Template</h3>
      <div className="grid grid-cols-2 gap-2">
        {resumeTemplates.map(template => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template.content)}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-sm rounded text-white text-left truncate"
          >
            {template.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ResumeTemplatesPicker;
