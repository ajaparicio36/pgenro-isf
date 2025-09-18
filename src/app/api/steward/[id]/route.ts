import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import { updateStewardSchema } from '@/schemas/steward';
import { ZodError } from 'zod';

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    const steward = await prisma.steward.findUnique({
      where: { id },
      include: {
        barangay: {
          select: {
            id: true,
            name: true,
            officialCode: true,
          },
        },
        municipality: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            Evaluation: true,
          },
        },
      },
    });

    if (!steward) {
      return NextResponse.json(
        { success: false, error: 'Steward not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: steward,
    });
  } catch (error) {
    console.error('Error fetching steward:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch steward' },
      { status: 500 }
    );
  }
};

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateStewardSchema.parse(body);

    // Check if steward exists
    const existingSteward = await prisma.steward.findUnique({
      where: { id },
    });

    if (!existingSteward) {
      return NextResponse.json(
        { success: false, error: 'Steward not found' },
        { status: 404 }
      );
    }

    // Validate geojson if provided
    if (validatedData.geojson) {
      try {
        const parsedGeojson = JSON.parse(validatedData.geojson);

        // Basic GeoJSON validation for Feature objects
        if (parsedGeojson.type === 'Feature') {
          if (
            !parsedGeojson.geometry ||
            !parsedGeojson.geometry.type ||
            !parsedGeojson.geometry.coordinates
          ) {
            throw new Error('Invalid GeoJSON Feature format');
          }
        }
        // For other GeoJSON types (Polygon, etc.)
        else if (!parsedGeojson.type || !parsedGeojson.coordinates) {
          throw new Error('Invalid GeoJSON format');
        }
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Invalid GeoJSON format' },
          { status: 400 }
        );
      }
    }

    // Check CSC number uniqueness if it's being updated
    if (
      validatedData.cscNumber &&
      validatedData.cscNumber !== existingSteward.cscNumber
    ) {
      const cscExists = await prisma.steward.findUnique({
        where: { cscNumber: validatedData.cscNumber },
      });

      if (cscExists) {
        return NextResponse.json(
          { success: false, error: 'CSC number already exists' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};

    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.dateIssued)
      updateData.dateIssued = new Date(validatedData.dateIssued);
    if (validatedData.dateExpiry)
      updateData.dateExpiry = new Date(validatedData.dateExpiry);
    if (validatedData.cscNumber) updateData.cscNumber = validatedData.cscNumber;
    if (validatedData.area !== undefined) updateData.area = validatedData.area;
    if (validatedData.geojson !== undefined)
      updateData.geojson = validatedData.geojson;
    if (validatedData.barangayId)
      updateData.barangayId = validatedData.barangayId;
    if (validatedData.municipalityId)
      updateData.municipalityId = validatedData.municipalityId;

    const updatedSteward = await prisma.steward.update({
      where: { id },
      data: updateData,
      include: {
        barangay: {
          select: {
            id: true,
            name: true,
            officialCode: true,
          },
        },
        municipality: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedSteward,
    });
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

    console.error('Error updating steward:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update steward' },
      { status: 500 }
    );
  }
};

export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await params;

    // Check if steward exists
    const existingSteward = await prisma.steward.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            Evaluation: true,
          },
        },
      },
    });

    if (!existingSteward) {
      return NextResponse.json(
        { success: false, error: 'Steward not found' },
        { status: 404 }
      );
    }

    // Delete the steward (evaluations will be cascade deleted)
    await prisma.steward.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Steward deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting steward:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete steward' },
      { status: 500 }
    );
  }
};
