import { NextRequest } from 'next/server';
import {
  createRouteSuccessResponse,
  createRouteErrorResponse,
  parseValidationIssues,
} from '@/utils/responseHandler';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/utils/prisma';
import { z } from 'zod';

const createComponentSchema = z.object({
  componentTitle: z.string().min(1, 'Component title is required').max(255),
});

export const GET = async () => {
  try {
    const components = await prisma.component.findMany({
      select: {
        id: true,
        componentTitle: true,
      },
      orderBy: {
        componentTitle: 'asc',
      },
    });

    return createRouteSuccessResponse(200, components);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'An unexpected error occurred';
    return createRouteErrorResponse(500, message);
  }
};

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
    const validatedData = createComponentSchema.safeParse(body);

    if (!validatedData.success) {
      return createRouteErrorResponse(
        400,
        parseValidationIssues(validatedData.error.issues)
      );
    }

    // Check if component already exists
    const existingComponent = await prisma.component.findFirst({
      where: {
        componentTitle: {
          equals: validatedData.data.componentTitle,
          mode: 'insensitive',
        },
      },
    });

    if (existingComponent) {
      return createRouteSuccessResponse(200, existingComponent);
    }

    const component = await prisma.component.create({
      data: {
        componentTitle: validatedData.data.componentTitle,
      },
    });

    return createRouteSuccessResponse(201, component);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'An unexpected error occurred';
    return createRouteErrorResponse(500, message);
  }
};
