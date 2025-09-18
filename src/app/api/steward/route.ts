import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/utils/prisma';
import { createStewardSchema } from '@/schemas/steward';
import { ZodError } from 'zod';

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const municipalityId = searchParams.get('municipalityId') || '';
    const barangayId = searchParams.get('barangayId') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { cscNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (municipalityId) {
      where.municipalityId = municipalityId;
    }

    if (barangayId) {
      where.barangayId = barangayId;
    }

    const [stewards, totalCount] = await Promise.all([
      prisma.steward.findMany({
        where,
        include: {
          barangay: {
            select: {
              id: true,
              name: true,
            },
          },
          municipality: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              Evaluation: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.steward.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: stewards,
      totalPages,
      totalStewards: totalCount,
      currentPage: page,
    });
  } catch (error) {
    console.error('Error fetching stewards:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stewards' },
      { status: 500 }
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const validatedData = createStewardSchema.parse(body);

    // Validate geojson if provided
    let parsedGeojson = null;
    if (validatedData.geojson) {
      try {
        parsedGeojson = JSON.parse(validatedData.geojson);

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

    // Check if CSC number is unique
    const existingSteward = await prisma.steward.findUnique({
      where: { cscNumber: validatedData.cscNumber },
    });

    if (existingSteward) {
      return NextResponse.json(
        { success: false, error: 'CSC number already exists' },
        { status: 409 }
      );
    }

    const steward = await prisma.steward.create({
      data: {
        name: validatedData.name,
        dateIssued: new Date(validatedData.dateIssued),
        dateExpiry: new Date(validatedData.dateExpiry),
        cscNumber: validatedData.cscNumber,
        area: validatedData.area,
        geojson: validatedData.geojson || null,
        barangayId: validatedData.barangayId,
        municipalityId: validatedData.municipalityId,
      },
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

    return NextResponse.json(
      {
        success: true,
        data: steward,
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

    console.error('Error creating steward:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create steward' },
      { status: 500 }
    );
  }
};
