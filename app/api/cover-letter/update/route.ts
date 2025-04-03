import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, content } = body;

    if (!id || !content) {
      return NextResponse.json(
        { message: 'ID and content are required' },
        { status: 400 }
      );
    }

    const updatedCoverLetter = await prisma.coverLetter.update({
      where: { id },
      data: { content }
    });

    return NextResponse.json(updatedCoverLetter);
  } catch (error) {
    console.error('Error updating cover letter:', error);
    return NextResponse.json(
      { message: 'Error updating cover letter', error: String(error) },
      { status: 500 }
    );
  }
}
