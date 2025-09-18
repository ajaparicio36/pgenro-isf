'use client';

import {
  StewardListResponse,
  StewardResponse,
  EvaluationListResponse,
} from '@/schemas/steward';
import useSWR from 'swr';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

export function useStewards(
  page: number = 1,
  limit: number = 10,
  search: string = '',
  municipalityId: string = '',
  barangayId: string = ''
) {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('limit', limit.toString());
  if (search) params.set('search', search);
  if (municipalityId) params.set('municipalityId', municipalityId);
  if (barangayId) params.set('barangayId', barangayId);

  const { data, error, isLoading, mutate } = useSWR<StewardListResponse>(
    `/api/steward?${params.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    stewards: data?.data || [],
    totalPages: data?.totalPages || 1,
    totalStewards: data?.totalStewards || 0,
    currentPage: data?.currentPage || page,
    isLoading,
    error,
    mutate,
  };
}

export function useSteward(id: string) {
  const { data, error, isLoading, mutate } = useSWR<StewardResponse>(
    id ? `/api/steward/${id}` : null,
    fetcher
  );

  return {
    steward: data?.data || null,
    isLoading,
    error,
    mutate,
  };
}

export function useStewardEvaluations(stewardId: string) {
  const { data, error, isLoading, mutate } = useSWR<EvaluationListResponse>(
    stewardId ? `/api/steward/${stewardId}/evaluations` : null,
    fetcher
  );

  return {
    evaluations: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}
