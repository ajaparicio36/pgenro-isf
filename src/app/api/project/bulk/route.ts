import { NextRequest } from 'next/server';
import {
  createRouteSuccessResponse,
  createRouteErrorResponse,
  parseValidationIssues,
} from '@/utils/responseHandler';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/utils/prisma';
import { createProjectSchema } from '@/schemas/project';
import { z } from 'zod';

const bulkCreateSchema = z.object({
  projects: z
    .array(createProjectSchema)
    .min(1, 'At least one project is required'),
});

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
    const validatedData = bulkCreateSchema.safeParse(body);

    if (!validatedData.success) {
      return createRouteErrorResponse(
        400,
        parseValidationIssues(validatedData.error.issues)
      );
    }

    const createdProjects = [];
    const errors = [];

    for (const [index, projectData] of validatedData.data.projects.entries()) {
      try {
        const { components, attachmentUrls, ...projectInfo } = projectData;

        // Verify barangay exists
        const barangay = await prisma.barangay.findUnique({
          where: { id: projectInfo.barangayId },
        });

        if (!barangay) {
          errors.push({
            index,
            error: 'Invalid barangay selected',
            project: projectInfo.title,
          });
          continue;
        }

        const project = await prisma.project.create({
          data: {
            ...projectInfo,
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
              // Ignore errors if component creation fails
            });
        }

        createdProjects.push(project);
      } catch (error) {
        errors.push({
          index,
          error: error instanceof Error ? error.message : 'Unknown error',
          project: projectData.title,
        });
      }
    }

    return createRouteSuccessResponse(201, {
      created: createdProjects,
      errors,
      summary: {
        total: validatedData.data.projects.length,
        success: createdProjects.length,
        failed: errors.length,
      },
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'An unexpected error occurred';
    return createRouteErrorResponse(500, message);
  }
};
