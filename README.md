# Job Application Tracker

Just a personal **Next.js** web application that helps me track and manage job applications. You can add job details, upload files, and organize your applications into different columns such as "To Apply," "Applied," "Interview Scheduled,"  A hidden "Archived" page, where jobs applications that a rejection is recieved lives, orgainized in a grid pattern.

---

## Features

1. **Drag and Drop**: Easily move job cards between columns using React DnD.  
2. **File Upload**: Attach files (resumes, cover letters, etc.) to each application.  
3. **Dark Mode**: Toggle a dark theme for the entire app.  
4. **Visual Indicators**:
   - Green dot for confirmation received.
   - Purple dot for attached files.
5. **Search & Organization**: Keep everything in columns for an at-a-glance overview.

---

## Tech Stack

- **Next.js** (App Router)  
- **React DnD** for drag-and-drop  
- **Tailwind CSS** for styling (including dark mode)  
- **Prisma** for database interactions  
- **TypeScript** for type safety  
- **PM2** (optional) for process management in production

---

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/YourUsername/job-tracker.git
cd job-tracker
```

### 2. Install Dependencies
```bash
npm intall
```

### 3. Setup Up Environment
Create a ```.env``` (or ```.env.local```) file in the project root. Example:
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/job_tracker"
```
Adjust for your own environment

### 4. Initialize the Database (Prisma)
If using Prisma migrations:
```bash
npx prisma migrate dev
```
Also generate the Prisma client if needed:
```bash
npx prisma generate
```

### 5. Run Locally (Development)
```bash
npm run dev
```

### 6. Build and Start (Production)
```bash
npm run build
npm run start
```

### 6. File uploads
- By default, files are stored in public/uploads/{jobId}/.
- Ensure the uploads folder exists and is writable in production.

---
## Planned Improvements
- Fix the date issue, right now dates are saved 1 day previous than what is entered
- Add remote storage options
- Add dark mode to the Archived-Jobs page
- Add the ability to access uploaded files when jobs are moved to the archived-jobs page


## Notes
This is a personal project and while it is working for me in a self-hosted environment, I can't guarantee it will work for you.  However, if you are having issues, let me know and I will take a look.
