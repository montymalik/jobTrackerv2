// app/api/ai/analyze-resume/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/app/lib/prisma";  // Add Prisma import

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

// Mock response for testing purposes
const MOCK_ANALYSIS_RESPONSE = {
  "Candidate Name": "John Doe",
  "Mail ID": "john.doe@example.com",
  "Phone Number": "+1-123-456-7890",
  "Address": "123 Main Street, Anytown, CA 12345",
  "Job Role": "Full Stack Developer",
  "Nationality": "American",
  "Contract Type": "Full-time",
  "Education": [
    {
      "degree": "Bachelor of Science in Computer Science",
      "institution": "University of Technology",
      "duration": "2014-2018"
    }
  ],
  "Work Experience": [
    {
      "company": "Tech Solutions Inc.",
      "position": "Senior Developer",
      "duration": "2020-Present",
      "keyResponsibilities": [
        "Led development of company's flagship product",
        "Managed team of 5 developers"
      ],
      "suggestedRewrite": [
        "Spearheaded the architectural redesign and development of the company's flagship product, resulting in a 40% increase in performance and 25% reduction in bug reports",
        "Managed and mentored a team of 5 developers, implementing agile methodologies that improved sprint velocity by 30% and on-time deliveries by 45%"
      ]
    }
  ],
  "ATS Score": 78,
  "Missing Keywords": ["Docker", "Kubernetes", "CI/CD"],
  "Profile Summary": {
    "Summary": "Experienced software developer with over 5 years of experience in building web applications using React, Node.js, and Python.",
    "Scoring Breakdown": {
      "Impact": {
        "Score": "65",
        "Comments": "Resume demonstrates some impact but could use more quantifiable achievements."
      },
      "Brevity - Length & Depth": {
        "Score": "80",
        "Comments": "Good balance of conciseness and detail."
      },
      "Use of Bullets": {
        "Score": "75",
        "Comments": "Effective use of bullet points, but some bullets could be more consistent in structure."
      },
      "Style": {
        "Score": "70",
        "Comments": "Clean formatting but could use more modern design elements."
      },
      "Buzzwords": {
        "Score": "60",
        "Comments": "Some industry buzzwords present, but missing key terms relevant to the job description."
      },
      "Readability": {
        "Score": "85",
        "Comments": "Content is well-organized and easy to scan."
      },
      "Skills": {
        "Score": "75",
        "Comments": "Good range of technical skills, but could highlight more soft skills."
      },
      "Grammar & Spelling": {
        "Score": "95",
        "Comments": "Excellent grammar and spelling throughout."
      },
      "Formatting Consistency": {
        "Score": "80",
        "Comments": "Consistent formatting with minor variations in spacing."
      },
      "Contact Information": {
        "Score": "100",
        "Comments": "Complete and well-presented contact information."
      },
      "Action Verbs Usage": {
        "Score": "70",
        "Comments": "Uses action verbs but could employ more powerful and varied verbs."
      },
      "Chronological Order": {
        "Score": "90",
        "Comments": "Clear and logical chronological presentation."
      },
      "Relevance of Experience": {
        "Score": "75",
        "Comments": "Most experience is relevant, but some older roles could be condensed."
      },
      "ATS Keyword Optimization": {
        "Score": "65",
        "Comments": "Missing several keywords from the job description."
      },
      "Quantifiable Achievements": {
        "Score": "55",
        "Comments": "Limited metrics and specific results. Add more numbers."
      },
      "Customization for Role": {
        "Score": "70",
        "Comments": "Some customization evident, but could align more closely with the specific role."
      }
    }
  }
};

// Function to call Gemini API
async function callGemini(prompt: string) {
  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    
    if (!GOOGLE_API_KEY) {
      console.warn("Google API key not configured, using mock data");
      return JSON.stringify(MOCK_ANALYSIS_RESPONSE);
    }
    
    console.log("Calling Gemini API with prompt length:", prompt.length);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GOOGLE_API_KEY}`,
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
          generationConfig: {
            temperature: 0.2,
            topK: 32,
            topP: 1,
            maxOutputTokens: 8192,
          },
        }),
      },
    );
    
    if (!response.ok) {
      const error = await response.json();
      console.error("Error from Gemini API:", error);
      throw new Error(`Failed to analyze resume: ${JSON.stringify(error)}`);
    }
    
    const data = await response.json() as GeminiResponse;
    
    // Extract the response text
    const message = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!message) {
      console.error("No response from Gemini API.");
      throw new Error("No response from Gemini API.");
    }
    
    console.log("Received response from Gemini API with length:", message.length);
    return message;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Received resume analysis request");
    
    // Parse the request body
    const body = await request.json();
    const { resumeContent, jobDescription, prompt, jobApplicationId } = body;

    console.log("Received request body:", { 
      resumeContentLength: resumeContent?.length || 0,
      jobDescriptionLength: jobDescription?.length || 0,
      promptLength: prompt?.length || 0,
      jobApplicationId
    });

    // Validate input
    if (!resumeContent) {
      console.error("Missing resume content");
      return NextResponse.json(
        { error: 'Missing resume content' },
        { status: 400 }
      );
    }
    
    // Determine effective job description
    let effectiveJobDescription = jobDescription || "";
    
    // If we have a jobApplicationId but no job description, try to fetch it from the database
    if (jobApplicationId && effectiveJobDescription.length < 10) {
      try {
        console.log("Fetching job description from database for jobId:", jobApplicationId);
        const jobApplication = await prisma.jobApplication.findUnique({
          where: { id: jobApplicationId }
        });
        
        if (jobApplication?.jobDescription) {
          console.log("Found job description in database");
          effectiveJobDescription = jobApplication.jobDescription;
        } else if (jobApplication?.jobDescription) {
          console.log("Found jobDescription in database");
          effectiveJobDescription = jobApplication.jobDescription;
        } else {
          console.warn("No job description found in database");
        }
      } catch (dbError) {
        console.error("Error fetching job from database:", dbError);
      }
    }
    
    // Use default if still no job description
    if (effectiveJobDescription.length < 10) {
      console.log("Using generic job description");
      effectiveJobDescription = "General professional role";
    }
    
    if (!prompt) {
      console.error("Missing prompt");
      return NextResponse.json(
        { error: 'Missing prompt' },
        { status: 400 }
      );
    }
    
    try {
      // Prepare the full prompt
      const fullPrompt = `
${prompt}

JOB DESCRIPTION:
${effectiveJobDescription}

RESUME:
${resumeContent}

Please analyze this resume against the job description and provide a detailed evaluation in the JSON format specified in the prompt.
`;

      console.log("Prompt prepared, sending to Gemini API");
      
      // Send to Gemini API with timeout handling
      const responseText = await Promise.race([
        callGemini(fullPrompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Gemini API request timed out')), 60000)
        )
      ]) as string;
      
      console.log("Successfully received and processed Gemini response");
      
      // Try to parse the response as JSON
      try {
        // First check if it's already valid JSON by attempting to parse it
        try {
          JSON.parse(responseText);
          // If we get here, it's valid JSON as a string
          console.log("Response is valid JSON as string");
          return NextResponse.json({ analysis: JSON.parse(responseText) });
        } catch (jsonError) {
          console.log("Response is not direct JSON, extracting JSON from text");
          
          // Try to extract JSON from the text
          const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                           responseText.match(/```\n([\s\S]*?)\n```/);
          
          if (jsonMatch && jsonMatch[1]) {
            try {
              const extractedJson = JSON.parse(jsonMatch[1].trim());
              console.log("Successfully extracted JSON from code block");
              return NextResponse.json({ analysis: extractedJson });
            } catch (extractError) {
              console.error("Error parsing extracted JSON:", extractError);
            }
          }
          
          // Try to extract JSON from free text
          if (responseText.includes('{') && responseText.includes('}')) {
            try {
              const jsonStart = responseText.indexOf('{');
              const jsonEnd = responseText.lastIndexOf('}') + 1;
              if (jsonStart >= 0 && jsonEnd > jsonStart) {
                const jsonStr = responseText.substring(jsonStart, jsonEnd);
                const extractedObj = JSON.parse(jsonStr);
                console.log("Successfully extracted JSON from text");
                return NextResponse.json({ analysis: extractedObj });
              }
            } catch (freeTextError) {
              console.error("Error extracting JSON from free text:", freeTextError);
            }
          }
          
          // If we couldn't parse JSON, return the raw text for client-side processing
          console.log("Returning raw text response");
          return NextResponse.json({ 
            analysis: responseText,
            rawResponse: true
          });
        }
      } catch (processingError) {
        console.error("Error processing response:", processingError);
        
        // Return fallback data as a last resort
        return NextResponse.json(
          { 
            error: `Error processing AI response: ${processingError instanceof Error ? processingError.message : "Unknown error"}`,
            fallback: true,
            analysis: MOCK_ANALYSIS_RESPONSE
          },
          { status: 200 }
        );
      }
    } catch (apiError) {
      console.error("Error with Gemini API:", apiError);
      
      // Return a more specific error about the API call
      return NextResponse.json(
        { 
          error: `Gemini API error: ${apiError instanceof Error ? apiError.message : "Unknown API error"}`,
          fallback: true,
          analysis: MOCK_ANALYSIS_RESPONSE
        },
        { status: 200 } // Return 200 with fallback data instead of error
      );
    }
  } catch (error) {
    console.error('Unhandled error in resume analysis:', error);
    // Return a fallback response instead of an error
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Unknown error",
        fallback: true,
        analysis: MOCK_ANALYSIS_RESPONSE
      },
      { status: 200 } // Return 200 with fallback data
    );
  }
}
