'use client';

import { AuthResponse } from '@/schemas/auth';
import useSWR from 'swr';

const fetcher = async (url: string): Promise<AuthResponse> => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }

  return response.json();
};

export function useAuth() {
  const { data, error, isLoading, mutate } = useSWR<AuthResponse>(
    '/api/auth/me',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 1,
    }
  );

  return {
    user: data?.data.user || null,
    company: data?.data.company || null,
    isLoading,
    error,
    mutate,
  };
}
