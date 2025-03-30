// app/api/ai/ats-prompt/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Try to read the prompt from a file
    const promptPath = path.join(process.cwd(), 'app/data/ats-prompt.txt');
    
    let prompt;
    try {
      if (fs.existsSync(promptPath)) {
        prompt = fs.readFileSync(promptPath, 'utf8');
      } else {
        // Default prompt if file doesn't exist
        prompt = `You are acting as an advanced ATS (Applicant Tracking System) to evaluate resumes against specific job descriptions. Your task includes assessing the alignment of a resume with a job description based on skills, qualifications, and experience, and providing an ATS score and detailed feedback.
Steps

    Parse Inputs: You are given a job description (JD) and a resume.

        Extract all relevant details from each, including:

            Job Role

            Required Skills

            Qualifications

            Work Experience

    Evaluate Resume: Compare the resume against the JD:

        Identify matching skills, qualifications, and experiences.

        Note any keywords or required qualifications missing from the resume.

    Calculate ATS Score: Provide an ATS score between 0 and 100 based on the relevance of the resume to the JD. No decimals.

    Profile Summary: Generate a detailed summary:

        Justify the ATS score with a scoring breakdown highlighting positive and negative factors, as derived from the resume.  Be brutal in you assessment and criticism.

        Positive factors include matching skills and qualifications.

        Negative factors are missing elements or irrelevant experience that caused score deductions.

    Suggest rewrites for each of the keyResponsibilities rewrite the following by highlighting the key challenge I faced, the steps I took to address it, and the positive outcome that resulted from my efforts. Use metrics where available, if no metrics are available make  a suggestion on possible metrics. Focus on making the response impactful and concise with a strong emphasis on my contribution and its effect.  Do not specifically highlight the challenge, action or result.

    Extract Core Information: Retrieve and format the following from the resume as JSON:

        Candidate Name

        Mail ID

        Phone Number

        Address (in the existing format, if provided)

        Nationality

        Education details

        Work Experience details

    Perform Essential Checks: Conduct 16 key checks including and supply a score out of 100 for each check

        Impact

        Brevity - Length & Depth

        Use of Bullets

        Style

        Buzzwords

        Readability

        Skills`;
      }
    } catch (error) {
      console.error('Error reading prompt file:', error);
      // Use a simple default prompt if there's an error
      prompt = "You are acting as an advanced ATS (Applicant Tracking System) to evaluate resumes against specific job descriptions.";
    }

    return NextResponse.json({ prompt });
  } catch (error) {
    console.error('Error in ATS prompt API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
