import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { jobApplicationId, fileName, filePath } = req.body;

    // Validate required fields
    if (!jobApplicationId || !fileName) {
      return res.status(400).json({ message: 'Job application ID and file name are required' });
    }

    // Find the primary resume for this job application
    const primaryResume = await prisma.generatedResume.findFirst({
      where: { 
        jobApplicationId,
        isPrimary: true 
      },
    });

    if (!primaryResume) {
      return res.status(404).json({ message: 'Primary resume not found for this job application' });
    }

    // Update the filename and path
    const updatedResume = await prisma.generatedResume.update({
      where: { id: primaryResume.id },
      data: { 
        fileName,
        filePath: filePath || null
      },
    });

    return res.status(200).json(updatedResume);
  } catch (error) {
    console.error('Error updating resume filename:', error);
    return res.status(500).json({ message: 'Failed to update resume filename', error: String(error) });
  }
}

