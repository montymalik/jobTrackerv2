// app/api/gemini/generate-resume/route.ts
import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";

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

// Function to call Gemini API using direct fetch approach
async function callGemini(prompt: string, model: string = 'gemini-2.0-flash-thinking-exp') {
  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    if (!GOOGLE_API_KEY) {
      throw new Error("Google API key not configured");
    }
    
    console.log("Calling Gemini API with prompt:", prompt);  // Debug log
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GOOGLE_API_KEY}`,
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
      throw new Error("Failed to generate resume.");
    }
    
    const data = await response.json() as GeminiResponse;
    console.log("Gemini API response data:", data);  // Debug log
    
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

export async function POST(request: NextRequest) {
  try {
    const { prompt, jobId, model = "gemini-2.0-flash-thinking-exp" } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }
    
    // Generate the resume using the direct API call approach
    const resumeText = await callGemini(prompt, model);
    
    // Log for analytics or debugging
    console.log(`Generated resume for job ID: ${jobId || 'no-id'}`);
    
    return NextResponse.json({ resume: resumeText });
  } catch (error) {
    console.error("Error in resume generation:", error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 }
    );
  }
}
