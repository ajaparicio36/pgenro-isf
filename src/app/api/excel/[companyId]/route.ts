import {
  createRouteErrorResponse,
  createRouteSuccessResponse,
} from '@/utils/responseHandler';
import { NextRequest } from 'next/server';
import prisma from '@/utils/prisma';
import { excelUploadSchema } from '@/schemas/excel';

export const GET = async ({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) => {
  try {
    const { companyId } = await params;

    if (!companyId) {
      return createRouteErrorResponse(400, 'Company ID is required');
    }

    const sheet = await prisma.sheet.findUnique({
      where: {
        companyId,
      },
    });

    if (!sheet) {
      return createRouteErrorResponse(404, 'Sheet not found');
    }

    return createRouteSuccessResponse(200, {
      id: sheet.id,
      title: sheet.title,
      content: sheet.content,
    });
  } catch (error) {
    console.error('Error in GET:', error);
    return createRouteErrorResponse(500, 'Internal Server Error');
  }
};

export const POST = async (
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ companyId: string }>;
  }
) => {
  try {
    const body = await request.json();
    const { companyId } = await params;

    if (!companyId) {
      return createRouteErrorResponse(400, 'Company ID is required');
    }

    console.log(body);

    // Validate the request body
    const validation = excelUploadSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return createRouteErrorResponse(
        400,
        firstError?.message || 'Invalid data'
      );
    }

    const { title, content } = validation.data;

    console.log('content', content);

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
      id: sheet.id,
      title: sheet.title,
      content: sheet.content,
      message: 'Sheet uploaded successfully',
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

    console.log('raw content', content);

    // Update the sheet
    const updateData: any = { content };
    if (title && title.trim()) {
      updateData.title = title.trim();
    }

    console.log('update data', updateData);

    const sheet = await prisma.sheet.update({
      where: {
        companyId: companyId, // Find sheet by companyId since it's unique
      },
      data: updateData,
    });

    if (!sheet) {
      return createRouteErrorResponse(500, 'Failed to update sheet');
    }

    return createRouteSuccessResponse(200, {
      id: sheet.id,
      title: sheet.title,
      content: sheet.content,
      message: 'Sheet updated successfully',
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'An unexpected error occurred';
    return createRouteErrorResponse(500, message);
  }
};
