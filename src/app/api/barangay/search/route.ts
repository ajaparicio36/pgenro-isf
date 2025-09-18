import { NextRequest } from 'next/server';
import {
  createRouteSuccessResponse,
  createRouteErrorResponse,
} from '@/utils/responseHandler';
import prisma from '@/utils/prisma';
import { z } from 'zod';

const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  municipalityName: z.string().optional(),
  limit: z.number().min(1).max(50).default(10),
});

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const validatedData = searchSchema.safeParse(body);

    if (!validatedData.success) {
      return createRouteErrorResponse(400, 'Invalid search parameters');
    }

    const { query, municipalityName, limit } = validatedData.data;

    // Build search conditions
    const whereConditions: any = {
      OR: [
        {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          officialCode: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ],
    };

    // Add municipality filter if provided
    if (municipalityName) {
      whereConditions.municipality = {
        name: {
          contains: municipalityName,
          mode: 'insensitive',
        },
      };
    }

    const barangays = await prisma.barangay.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        officialCode: true,
        municipality: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [
        {
          name: 'asc',
        },
        {
          municipality: {
            name: 'asc',
          },
        },
      ],
      take: limit,
    });

    return createRouteSuccessResponse(200, barangays);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'An unexpected error occurred';
    return createRouteErrorResponse(500, message);
  }
};
