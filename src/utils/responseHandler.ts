import { z } from 'zod';

export const createActionSuccessResponse = <T>(data: T) => {
  return {
    success: true,
    data,
  };
};

export const createActionErrorResponse = (message: string) => {
  return {
    success: false,
    message,
  };
};

export const parseValidationIssues = (issues: z.core.$ZodIssue[]) => {
  return issues.map((issue) => issue.message).join(', ');
};
