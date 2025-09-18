import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prisma';

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    // Check if steward exists
    const steward = await prisma.steward.findUnique({
      where: { id },
    });

    if (!steward) {
      return NextResponse.json(
        { success: false, error: 'Steward not found' },
        { status: 404 }
      );
    }

    const evaluations = await prisma.evaluation.findMany({
      where: { stewardId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: evaluations,
    });
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch evaluations' },
      { status: 500 }
    );
  }
};
