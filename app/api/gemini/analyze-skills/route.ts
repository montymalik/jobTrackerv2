import { NextRequest, NextResponse } from "next/server";
import fetch from "node-fetch";
import { prisma } from "@/app/lib/prisma"; // Import Prisma client

// Function to call Gemini API
async function callGemini(prompt: string) {
  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
    if (!GOOGLE_API_KEY) {
      throw new Error("Google API key not configured");
    }

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
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Error from Gemini API:", error);
      throw new Error("Failed to analyze skills.");
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}

// Handle POST request
export async function POST(request: NextRequest) {
  try {
    const { jobDescription, jobId } = await request.json();

    if (!jobDescription || !jobId) {
      return NextResponse.json(
        { error: "Job description and job ID are required." },
        { status: 400 }
      );
    }

    const prompt = `
      I have a job description below. 
      Please analyze it and extract key skills required for the job. 
      Provide the key skills as a clear, concise list of keywords without any additional explanation.

      Job Description:
      ${jobDescription}

      Key Skills:
    `;

    const message = await callGemini(prompt);
    const skills = message
      ? message.split("\n").map((skill) => skill.replace(/^\d+\.\s*/, "").trim())
      : [];

    // Save the key skills to the database
    const updatedJob = await prisma.jobApplication.update({
      where: { id: jobId },
      data: { keySkills: skills.join(", ") },
    });

    return NextResponse.json({
      skills,
      savedSkills: updatedJob.keySkills,
      message: "Skills analyzed and saved successfully.",
    });
  } catch (error) {
    console.error("Error analyzing skills:", error);
    return NextResponse.json(
      { error: "Failed to analyze skills." },
      { status: 500 }
    );
  }
}

