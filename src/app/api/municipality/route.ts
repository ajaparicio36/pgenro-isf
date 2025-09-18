import {
  createRouteSuccessResponse,
  createRouteErrorResponse,
} from '@/utils/responseHandler';
import prisma from '@/utils/prisma';

export const GET = async () => {
  try {
    const municipalities = await prisma.municipality.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        barangays: {
          select: {
            id: true,
            name: true,
            officialCode: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return createRouteSuccessResponse(200, municipalities);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'An unexpected error occurred';
    return createRouteErrorResponse(500, message);
  }
};
