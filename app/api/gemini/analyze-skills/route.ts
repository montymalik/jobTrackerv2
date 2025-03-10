import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";
import { prisma } from "@/app/lib/prisma";

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

// Function to call Gemini API (modified to match the first code)
async function callGemini(prompt: string) {
  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    if (!GOOGLE_API_KEY) {
      throw new Error("Google API key not configured");
    }
    console.log("Calling Gemini API with prompt:", prompt);  // Debug log
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
      throw new Error("Failed to analyze skills.");
    }
    const data = await response.json() as GeminiResponse;
    console.log("Gemini API response data:", data);  // Debug log
    
    // Now TypeScript knows the structure of data
    const message = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!message) {
      console.error("No response from Gemini API.");  // Debug log
      throw new Error("No response from Gemini API.");
    }
    console.log("Received message from Gemini API:", message);  // Debug log
    return message;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}

// Handle POST NextRequest
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received request body:", body);
    const { jobDescription, jobId } = body;
    if (!jobDescription || !jobId) {
      console.error("Missing job description or job ID.");
      return NextResponse.json(
        { error: "Job description and job ID are required." },
        { status: 400 },
      );
    }
    console.log("Received job description and job ID:", { jobDescription, jobId });
    const prompt = `
      I have a job description below. 
      Please analyze it and extract key skills required for the job. 
      Provide the key skills as a clear, concise list of keywords without any additional explanation.
      
      Job Description:
      ${jobDescription}
      
      Key Skills:
    `;
    const message = await callGemini(prompt);
    console.log("Raw skills response:", message);
    const skills = message
      ? message
          .split("\n")
          .map((skill) => skill.replace(/^\d+\.\s*/, "").trim())
          .filter(
            (skill) =>
              skill &&
              skill.toLowerCase() !== "key skills:" &&
              skill.toLowerCase() !== "key skills",
          )
      : [];
    console.log("Extracted skills:", skills);
    try {
      console.log("Attempting to save key skills to DB:", { jobId, skills });
      const updatedJob = await prisma.jobApplication.update({
        where: { id: jobId },
        data: { keySkills: skills.join(", ") },
      });
      if (!updatedJob) {
        throw new Error("Database update returned null.");
      }
      console.log("Successfully updated job with key skills:", updatedJob);
      return NextResponse.json({
        skills,
        savedSkills: updatedJob.keySkills,
        message: "Skills analyzed and saved successfully.",
      });
    } catch (dbError) {
      console.error("Database saving error:", dbError);
      return NextResponse.json(
        { error: "Failed to save key skills to database." },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error analyzing skills:", error);
    return NextResponse.json(
      { error: "Failed to analyze skills." },
      { status: 500 },
    );
  }
}
