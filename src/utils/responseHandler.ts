import { NextResponse } from 'next/server';
import { z } from 'zod';

export const createActionSuccessResponse = <T>(data: T) => {
  return {
    success: true,
    data,
  };
};

export const createActionErrorResponse = (message: string) => {
  return {
    success: false as const,
    message,
  };
};

export const parseValidationIssues = (issues: z.core.$ZodIssue[]) => {
  return issues.map((issue) => issue.message).join(', ');
};

export const createRouteSuccessResponse = <T>(status: number, data: T) => {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
};

export const createRouteErrorResponse = (status: number, message: string) => {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
};
