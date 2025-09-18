import { NextRequest } from 'next/server';
import {
  createRouteSuccessResponse,
  createRouteErrorResponse,
} from '@/utils/responseHandler';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/utils/prisma';

interface Params {
  params: {
    id: string;
  };
}

export const GET = async (
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
      return createRouteErrorResponse(401, 'Unauthorized');
    }

    const project = await prisma.project.findFirst({
      where: {
        id,
        companyId: user.id,
      },
      include: {
        components: {
          select: {
            id: true,
            componentTitle: true,
            componentDescription: true,
            componentCost: true,
          },
        },
        attachments: {
          select: {
            id: true,
            url: true,
            uploadedAt: true,
          },
        },
        barangay: {
          include: {
            municipality: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return createRouteErrorResponse(404, 'Project not found');
    }

    return createRouteSuccessResponse(200, project);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'An unexpected error occurred';
    return createRouteErrorResponse(500, message);
  }
};

export const DELETE = async (request: NextRequest, { params }: Params) => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return createRouteErrorResponse(401, 'Unauthorized');
    }

    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        companyId: user.id,
      },
    });

    if (!project) {
      return createRouteErrorResponse(404, 'Project not found');
    }

    await prisma.project.delete({
      where: {
        id: params.id,
      },
    });

    return createRouteSuccessResponse(200, {
      message: 'Project deleted successfully',
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'An unexpected error occurred';
    return createRouteErrorResponse(500, message);
  }
};
