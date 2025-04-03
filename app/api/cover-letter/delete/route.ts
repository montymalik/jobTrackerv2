import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { message: 'Cover letter ID is required' },
        { status: 400 }
      );
    }

    const deletedCoverLetter = await prisma.coverLetter.delete({
      where: { id }
    });

    return NextResponse.json(deletedCoverLetter);
  } catch (error) {
    console.error('Error deleting cover letter:', error);
    return NextResponse.json(
      { message: 'Error deleting cover letter', error: String(error) },
      { status: 500 }
    );
  }
}
