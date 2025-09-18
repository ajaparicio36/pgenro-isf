import { NextRequest } from 'next/server';
import {
  createRouteSuccessResponse,
  createRouteErrorResponse,
  parseValidationIssues,
} from '@/utils/responseHandler';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/utils/prisma';
import { editProjectSchema } from '@/schemas/project';

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

export const PATCH = async (
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

    const body = await request.json();
    const validatedData = editProjectSchema.safeParse(body);

    if (!validatedData.success) {
      return createRouteErrorResponse(
        400,
        parseValidationIssues(validatedData.error.issues)
      );
    }

    // Verify project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        companyId: user.id,
      },
    });

    if (!existingProject) {
      return createRouteErrorResponse(404, 'Project not found');
    }

    const { components, attachmentUrls, barangayId, ...projectData } =
      validatedData.data;

    // Verify barangay exists if provided
    if (barangayId) {
      const barangay = await prisma.barangay.findUnique({
        where: { id: barangayId },
      });

      if (!barangay) {
        return createRouteErrorResponse(400, 'Invalid barangay selected');
      }
    }

    // Update project with conditional fields
    const updateData: any = {};

    // Only include fields that were provided
    Object.entries(projectData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    if (barangayId !== undefined) {
      updateData.barangayId = barangayId;
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...updateData,
        // Handle components update
        ...(components && {
          components: {
            deleteMany: {},
            create: components,
          },
        }),
        // Handle attachments update
        ...(attachmentUrls && {
          attachments: {
            deleteMany: {},
            create: attachmentUrls.map((url) => ({ url })),
          },
        }),
      },
      include: {
        components: true,
        attachments: true,
        barangay: {
          include: {
            municipality: true,
          },
        },
      },
    });

    // Save new component titles to components table for future reference
    if (components) {
      for (const component of components) {
        await prisma.component
          .upsert({
            where: {
              id: `${component.componentTitle.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            },
            update: {},
            create: {
              componentTitle: component.componentTitle,
            },
          })
          .catch(() => {
            // Ignore errors if component already exists
          });
      }
    }

    return createRouteSuccessResponse(200, project);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'An unexpected error occurred';
    return createRouteErrorResponse(500, message);
  }
};
