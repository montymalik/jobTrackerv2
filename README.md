# Job Application Tracker 📝🚀

## Overview
Job Application Tracker is a powerful web application designed to help job seekers manage their job application process efficiently. With AI-powered features and a comprehensive tracking system, this app simplifies the job search journey.

## 🌟 Key Features

### Job Application Management
- Drag-and-drop Kanban board for tracking application status
- Columns: To Apply, Applied, Interview Scheduled
- Add, edit, and manage job applications
- Store detailed job information including:
  - Company name
  - Job title
  - Job description
  - Application URL
  - Submission and interview dates
  - Contact information
  - Notes

### AI-Powered Resume Tools 🤖
- Base resume upload and parsing
- AI-driven resume optimization
- Skill extraction from job descriptions
- Resume match analysis
- Customized resume generation for specific job applications

### Document Management
- Upload and store job-related files (resumes, cover letters)
- AI-generated cover letter creation
- Resume version tracking

## 🛠 Tech Stack
- **Frontend**: 
  - React
  - Next.js 15
  - Tailwind CSS
- **Backend**:
  - Prisma ORM
  - PostgreSQL
- **AI Integration**:
  - Google Gemini API
- **Additional Libraries**:
  - React DnD (Drag and Drop)
  - html2pdf.js
  - Mammoth (DOCX parsing)

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- PostgreSQL
- Google API Key for Gemini

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/job-application-tracker.git
cd job-application-tracker
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env` file with:
```
DATABASE_URL="postgresql://username:password@localhost:5432/jobtracker"
GOOGLE_API_KEY="your_gemini_api_key"
```

4. Set up database
```bash
npx prisma migrate dev
```

5. Run the development server
```bash
npm run dev
```

## 📦 Key Components

### Job Board
- Kanban-style board for tracking job applications
- Drag and drop functionality to update application status
- Dark mode support

### Resume Tools
- Base resume upload and parsing
- AI-powered resume optimization
- Job description skill matching
- Cover letter generation

### AI Analysis
- Extract key skills from job descriptions
- Analyze resume compatibility with job requirements
- Generate tailored resumes and cover letters

## 🔒 Data Privacy
- Local storage of job application data
- Secure file uploads
- No third-party tracking

## 🤝 Contributing
Contributions are welcome! Please read the contributing guidelines before getting started.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## 📄 License
This project is licensed under the MIT License.


---

**Happy Job Hunting! 🌟**
