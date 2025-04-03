import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobApplicationId, content, isPrimary = true } = body;

    if (!jobApplicationId || !content) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If this is set to primary, reset all other cover letters for this job to non-primary
    if (isPrimary) {
      await prisma.coverLetter.updateMany({
        where: { jobApplicationId },
        data: { isPrimary: false }
      });
    }

    // Create new cover letter
    const coverLetter = await prisma.coverLetter.create({
      data: {
        content,
        jobApplicationId,
        isPrimary,
      }
    });

    return NextResponse.json(coverLetter);
  } catch (error) {
    console.error('Error saving cover letter:', error);
    return NextResponse.json(
      { message: 'Error saving cover letter', error: String(error) },
      { status: 500 }
    );
  }
}
