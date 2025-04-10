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
    
    console.log("Calling Gemini API for resume enhancement");
    
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
      throw new Error("Failed to enhance resume content.");
    }
    
    const data = await response.json() as GeminiResponse;
    
    const message = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!message) {
      console.error("No response from Gemini API.");
      throw new Error("No response from Gemini API.");
    }
    
    console.log("Received resume enhancement from Gemini API");
    return message;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { jobDescription, fieldText, jobId } = await request.json();
    
    if (!fieldText) {
      return NextResponse.json(
        { error: 'Field text is required' },
        { status: 400 }
      );
    }
    
    // Log received values for debugging
    console.log("API received request with:", {
      jobDescriptionLength: jobDescription?.length || 0,
      fieldTextLength: fieldText.length
    });
    
    // Create the new prompt for Gemini
    const prompt = `You are an expert resume writer. I need you to enhance the following text from my resume to make it more impactful.

Your enhancement should:
- Highlight challenges faced
- Describe actions taken
- Show measurable outcomes
- Use concise, impactful language

Job Description: 
${jobDescription || "Not provided"}

Text to Improve:
${fieldText}

Please provide only the enhanced text without explanations or additional comments.`;
    
    // Call Gemini API
    const analysis = await callGemini(prompt);
    
    // Log job ID for analytics purposes
    console.log(`Completed resume enhancement for job ID: ${jobId || 'no-id'}`);
    
    // Return the analysis
    return NextResponse.json({ 
      analysis,
      jobId 
    });
  } catch (error) {
    console.error('Error in resume enhancement:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
