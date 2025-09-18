import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import { createEvaluationSchema } from '@/schemas/steward';
import { ZodError } from 'zod';

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const validatedData = createEvaluationSchema.parse(body);

    // Check if steward exists
    const steward = await prisma.steward.findUnique({
      where: { id: validatedData.stewardId },
    });

    if (!steward) {
      return NextResponse.json(
        { success: false, error: 'Steward not found' },
        { status: 404 }
      );
    }

    const evaluation = await prisma.evaluation.create({
      data: {
        rating: validatedData.rating,
        recommendation: validatedData.recommendation || null,
        ratingRemarks: validatedData.ratingRemarks || null,
        actionTaken: validatedData.actionTaken || null,
        generalRemarks: validatedData.generalRemarks || null,
        stewardId: validatedData.stewardId,
      },
      include: {
        steward: {
          select: {
            id: true,
            name: true,
            cscNumber: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: evaluation,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error,
        },
        { status: 400 }
      );
    }

    console.error('Error creating evaluation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create evaluation' },
      { status: 500 }
    );
  }
};
