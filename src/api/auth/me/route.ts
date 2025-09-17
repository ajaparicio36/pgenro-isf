import {
  createRouteErrorResponse,
  createRouteSuccessResponse,
} from '@/utils/responseHandler';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/utils/prisma';
import { NextRequest } from 'next/server';

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

    const company = await prisma.company.findUnique({
      where: {
        id: user.id,
      },
      select: {
        id: true,
        companyName: true,
      },
    });

    if (!company) {
      return createRouteErrorResponse(404, 'Company not found');
    }

    return createRouteSuccessResponse(200, {
      user: {
        id: user.id,
        email: user.email,
      },
      company,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'An unexpected error occurred';
    return createRouteErrorResponse(500, message);
  }
};
