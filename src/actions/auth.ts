'use server';

import { createClient } from '@/utils/supabase/server';
import {
  LoginData,
  loginSchema,
  RegisterData,
  registerSchema,
} from '@/schemas/auth';
import {
  createActionErrorResponse,
  createActionSuccessResponse,
  parseValidationIssues,
} from '@/utils/responseHandler';
import prisma from '@/utils/prisma';

export async function login(values: LoginData) {
  const supabase = await createClient();

  const validatedData = loginSchema.safeParse(values);

  if (!validatedData.success) {
    return createActionErrorResponse(
      `Invalid data: ${parseValidationIssues(validatedData.error.issues)}`
    );
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: validatedData.data.email,
    password: validatedData.data.password,
  });

  if (error) {
    return createActionErrorResponse(error.message);
  }

  return createActionSuccessResponse({
    message: 'Login successful!',
  });
}

export async function signup(values: RegisterData) {
  const supabase = await createClient();

  const validatedData = registerSchema.safeParse(values);

  if (!validatedData.success) {
    return createActionErrorResponse(
      `Invalid data: ${parseValidationIssues(validatedData.error.issues)}`
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email: validatedData.data.email,
    password: validatedData.data.password,
  });

  if (error) {
    return createActionErrorResponse(error.message);
  }

  if (!data.user) {
    return createActionErrorResponse('User data is missing');
  }

  const company = await prisma.company.create({
    data: {
      id: data.user.id,
      companyName: validatedData.data.companyName,
    },
  });

  if (!company) {
    return createActionErrorResponse('Failed to create company');
  }

  return createActionSuccessResponse({
    message: 'Check your email for the login link!',
  });
}
