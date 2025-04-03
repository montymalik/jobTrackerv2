import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { coverLetterId, jobId } = body;

    if (!coverLetterId || !jobId) {
      return NextResponse.json(
        { message: 'Cover letter ID and job ID are required' },
        { status: 400 }
      );
    }

    // Reset all cover letters for this job to non-primary
    await prisma.coverLetter.updateMany({
      where: { jobApplicationId: jobId },
      data: { isPrimary: false }
    });

    // Set the selected cover letter as primary
    const updatedCoverLetter = await prisma.coverLetter.update({
      where: { id: coverLetterId },
      data: { isPrimary: true }
    });

    return NextResponse.json(updatedCoverLetter);
  } catch (error) {
    console.error('Error setting primary cover letter:', error);
    return NextResponse.json(
      { message: 'Error setting primary cover letter', error: String(error) },
      { status: 500 }
    );
  }
}
