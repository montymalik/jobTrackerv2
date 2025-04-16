// app/components/resume/builder/JobRoleComponent.tsx
import React from 'react';

interface JobRoleProps {
  title: string;
  company: string;
  dateRange: string;
  bulletPoints: string[];
}

const JobRoleComponent: React.FC<JobRoleProps> = ({
  title,
  company,
  dateRange,
  bulletPoints
}) => {
  return (
    <div className="job-role" style={{ marginBottom: '15px' }}>
      <div style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
        <div style={{ display: 'table-row' }}>
          <div style={{ 
            display: 'table-cell', 
            fontFamily: 'Arial, sans-serif',
            fontSize: '10.5pt',
            fontWeight: 'bold',
            color: '#000000',
            textAlign: 'left',
            verticalAlign: 'top'
          }}>
            {title}
          </div>
          <div style={{ 
            display: 'table-cell', 
            fontFamily: 'Arial, sans-serif',
            fontSize: '10.5pt',
            fontWeight: 'bold',
            color: '#000000',
            textAlign: 'right',
            verticalAlign: 'top',
            width: '125px'
          }}>
            {dateRange}
          </div>
        </div>
      </div>
      
      <div style={{ 
        fontFamily: 'Arial, sans-serif',
        fontSize: '10.5pt',
        fontWeight: 'normal', // Changed from bold to normal
        color: '#000000',
        marginTop: '0',
        marginBottom: '3px'
      }}>
        {company}
      </div>
      
      <ul style={{ 
        listStyleType: 'disc',
        paddingLeft: '20px',
        marginTop: '2px',
        marginBottom: '0'
      }}>
        {bulletPoints.map((bullet, index) => (
          <li 
            key={index}
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: '10pt',
              color: '#000000',
              marginBottom: '1px'
            }}
            dangerouslySetInnerHTML={{ __html: bullet }}
          />
        ))}
      </ul>
    </div>
  );
};

export default JobRoleComponent;
