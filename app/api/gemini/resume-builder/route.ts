import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI with your API key
// Note: In production, you should use environment variables for your API key
// and not hardcode it directly in your source code
const API_KEY = process.env.GOOGLE_GEMINI_API_KEY || '';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(API_KEY);

export async function POST(request: NextRequest) {
  // Ensure API key is set
  if (!API_KEY) {
    return NextResponse.json(
      { error: 'Google Gemini API key is not configured' },
      { status: 500 }
    );
  }

  try {
    // Parse the request body
    const body = await request.json();
    const { prompt, jobId } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // If jobId is provided but not included in the prompt, try to fetch the job description
    let enhancedPrompt = prompt;
    if (jobId && !prompt.includes(jobId)) {
      try {
        const jobResponse = await fetch(`${request.nextUrl.origin}/api/jobs/${jobId}`);
        if (jobResponse.ok) {
          const jobData = await jobResponse.json();
          if (jobData.jobDescription) {
            // Replace the generic job description placeholder with the actual job description
            enhancedPrompt = prompt.replace(
              'No job description provided. Optimize based on general best practices.',
              jobData.jobDescription
            );
          }
        }
      } catch (error) {
        console.warn('Error fetching job description in API route:', error);
        // Continue with original prompt if job fetch fails
      }
    }

    // Configure the model - Gemini Pro is optimal for text generation tasks
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" });

    // Set generation config for the resume content
    const generationConfig = {
      temperature: 0.7,      // Moderate creativity
      topK: 40,              // Consider top 40 tokens
      topP: 0.95,            // Sample from top 95% of probability mass
      maxOutputTokens: 2048, // Limit response size
    };

    // Call the Gemini API
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
      generationConfig,
    });

    // Extract the response text
    const response = result.response;
    const generatedText = response.text();

    // Return the generated content
    return NextResponse.json({
      content: generatedText,
    });
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    
    // Determine if it's a rate limit or quota error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      return NextResponse.json(
        { error: 'API quota exceeded or rate limited. Please try again later.' },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}

// Optional: Also support GET requests to check if the API is properly configured
export async function GET() {
  if (!API_KEY) {
    return NextResponse.json(
      { status: 'error', message: 'Google Gemini API key is not configured' },
      { status: 500 }
    );
  }
  
  return NextResponse.json({
    status: 'ok',
    message: 'Resume builder API is properly configured',
  });
}
