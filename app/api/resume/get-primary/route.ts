import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: NextRequest) {
  const jobApplicationId = request.nextUrl.searchParams.get('jobApplicationId');
  if (!jobApplicationId) {
    return NextResponse.json({ message: 'jobApplicationId required' }, { status: 400 });
  }

  const resume = await prisma.generatedResume.findFirst({
    where: { jobApplicationId, isPrimary: true },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(resume ?? {}, { status: 200 });
}

