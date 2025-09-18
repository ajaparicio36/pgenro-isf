import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import { createClient } from '@/utils/supabase/server';
import { ZodError, z } from 'zod';

const evaluationSchema = z.object({
  rating: z.number().int().min(1).max(100),
  recommendation: z.string().optional(),
  ratingRemarks: z.string().optional(),
  actionTaken: z.string().optional(),
  generalRemarks: z.string().optional(),
});

export const POST = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const stewardId = id;
    const body = await request.json();
    const validatedData = evaluationSchema.parse(body);

    // Check if steward exists
    const steward = await prisma.steward.findUnique({
      where: { id: stewardId },
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
        stewardId: stewardId,
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
