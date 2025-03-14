import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';

// Define types for the Gemini API response
interface GeminiResponsePart {
  text: string;
}

interface GeminiResponseContent {
  parts: GeminiResponsePart[];
}

interface GeminiResponseCandidate {
  content: GeminiResponseContent;
}

interface GeminiResponse {
  candidates: GeminiResponseCandidate[];
}

// Function to call Gemini API
async function callGemini(prompt: string, model: string = 'gemini-2.0-flash-thinking-exp') {
  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    if (!GOOGLE_API_KEY) {
      throw new Error("Google API key not configured");
    }
    
    console.log("Calling Gemini API for resume analysis");
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-thinking-exp:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    );
    
    if (!response.ok) {
      const error = await response.json();
      console.error("Error from Gemini API:", error);
      throw new Error("Failed to analyze resume match.");
    }
    
    const data = await response.json() as GeminiResponse;
    
    const message = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!message) {
      console.error("No response from Gemini API.");
      throw new Error("No response from Gemini API.");
    }
    
    console.log("Received resume analysis from Gemini API");
    return message;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { jobDescription, resumeText, jobId } = await request.json();
    
    if (!jobDescription || !resumeText) {
      return NextResponse.json(
        { error: 'Job description and resume text are required' },
        { status: 400 }
      );
    }
    
    // Create the prompt for Gemini
    const prompt = `As an experienced Applicant Tracking System (ATS) analyst,
with profound knowledge in technology, software engineering, data science, full stack web development, cloud enginner, 
cloud developers, devops engineer and big data engineering, your role involves evaluating resumes against job descriptions.
Recognizing the competitive job market, provide top-notch assistance for resume improvement.
Your goal is to analyze the resume against the given job description, 
assign a percentage match based on key criteria, and pinpoint missing keywords accurately.
resume:${resumeText}
description:${jobDescription}`;
    
    // Call Gemini API
    const analysis = await callGemini(prompt);
    
    // Log job ID for analytics purposes
    console.log(`Completed resume match analysis for job ID: ${jobId || 'no-id'}`);
    
    // Return the analysis
    return NextResponse.json({ 
      analysis,
      jobId 
    });
  } catch (error) {
    console.error('Error in resume match analysis:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
