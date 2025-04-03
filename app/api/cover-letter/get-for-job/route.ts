import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json(
        { message: 'Job ID is required' },
        { status: 400 }
      );
    }

    const coverLetters = await prisma.coverLetter.findMany({
      where: {
        jobApplicationId: jobId
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(coverLetters);
  } catch (error) {
    console.error('Error fetching cover letters:', error);
    return NextResponse.json(
      { message: 'Error fetching cover letters', error: String(error) },
      { status: 500 }
    );
  }
}
