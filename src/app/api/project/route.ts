import { NextRequest } from 'next/server';
import {
  createRouteSuccessResponse,
  createRouteErrorResponse,
  parseValidationIssues,
} from '@/utils/responseHandler';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/utils/prisma';
import { createProjectSchema } from '@/schemas/project';

export const POST = async (request: NextRequest) => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return createRouteErrorResponse(401, 'Unauthorized');
    }

    const body = await request.json();
    const validatedData = createProjectSchema.safeParse(body);

    if (!validatedData.success) {
      return createRouteErrorResponse(
        400,
        parseValidationIssues(validatedData.error.issues)
      );
    }

    const { components, attachmentUrls, ...projectData } = validatedData.data;

    // Verify barangay exists
    const barangay = await prisma.barangay.findUnique({
      where: { id: projectData.barangayId },
    });

    if (!barangay) {
      return createRouteErrorResponse(400, 'Invalid barangay selected');
    }

    const project = await prisma.project.create({
      data: {
        ...projectData,
        companyId: user.id,
        components: {
          create: components,
        },
        attachments: attachmentUrls
          ? {
              create: attachmentUrls.map((url) => ({ url })),
            }
          : undefined,
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

    // Save component titles to components table for future reference
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

    return createRouteSuccessResponse(201, project);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'An unexpected error occurred';
    return createRouteErrorResponse(500, message);
  }
};

export const GET = async () => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return createRouteErrorResponse(401, 'Unauthorized');
    }

    const projects = await prisma.project.findMany({
      where: {
        companyId: user.id,
      },
      select: {
        id: true,
        title: true,
        projectCode: true,
        startDate: true,
        endDate: true,
        status: true,
        totalProjectCost: true,
        createdAt: true,
        barangay: {
          select: {
            id: true,
            name: true,
            municipality: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            components: true,
            attachments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return createRouteSuccessResponse(200, projects);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'An unexpected error occurred';
    return createRouteErrorResponse(500, message);
  }
};
