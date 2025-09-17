import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Invalid email address').min(5).max(255),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long')
    .max(255),
});

export type LoginData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    companyName: z.string().min(1, 'Company name is required').max(80),
    email: z.email('Invalid email address').min(5).max(255),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .max(255),
    confirmPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters long')
      .max(255),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
  });

export type RegisterData = z.infer<typeof registerSchema>;

export type LoginResponse = {
  message: string;
};

export type RegisterResponse = {
  message: string;
};
