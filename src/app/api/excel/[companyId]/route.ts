import {
  createRouteErrorResponse,
  createRouteSuccessResponse,
} from '@/utils/responseHandler';
import { NextRequest } from 'next/server';
import prisma from '@/utils/prisma';

export const POST = async (
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ companyId: string }>;
  }
) => {
  try {
    const { content, title } = await request.json();
    const { companyId } = await params;

    if (!content) {
      return createRouteErrorResponse(400, 'Content is required');
    }

    if (!companyId) {
      return createRouteErrorResponse(400, 'Company ID is required');
    }

    const sheet = await prisma.sheet.create({
      data: {
        content,
        companyId,
        title,
      },
    });

    if (!sheet) {
      return createRouteErrorResponse(500, 'Failed to create sheet');
    }

    return createRouteSuccessResponse(200, {
      content: sheet.content,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'An unexpected error occurred';
    return createRouteErrorResponse(500, message);
  }
};

export const PUT = async (
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ companyId: string }>;
  }
) => {
  try {
    const { content, title } = await request.json();
    const { companyId } = await params;

    if (!content) {
      return createRouteErrorResponse(400, 'Content is required');
    }

    if (!companyId) {
      return createRouteErrorResponse(400, 'Company ID is required');
    }

    const sheet = await prisma.sheet.update({
      where: {
        id: companyId,
      },
      data: {
        content,
        title: !!title ? title : undefined,
      },
    });

    if (!sheet) {
      return createRouteErrorResponse(500, 'Failed to update sheet');
    }

    return createRouteSuccessResponse(200, {
      content: sheet.content,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'An unexpected error occurred';
    return createRouteErrorResponse(500, message);
  }
};
