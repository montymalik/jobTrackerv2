import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, fileName } = body;

    if (!id || !fileName) {
      return NextResponse.json(
        { message: 'ID and fileName are required' },
        { status: 400 }
      );
    }

    const updatedCoverLetter = await prisma.coverLetter.update({
      where: { id },
      data: { fileName }
    });

    return NextResponse.json(updatedCoverLetter);
  } catch (error) {
    console.error('Error updating cover letter filename:', error);
    return NextResponse.json(
      { message: 'Error updating cover letter filename', error: String(error) },
      { status: 500 }
    );
  }
}
