'use client';

import {
  ProjectListResponse,
  ProjectResponse,
  MunicipalityResponse,
  ComponentResponse,
} from '@/schemas/project';
import useSWR from 'swr';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch data');
  }
  return response.json();
};

export function useProjects() {
  const { data, error, isLoading, mutate } = useSWR<ProjectListResponse>(
    '/api/project',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  return {
    projects: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}

export function useProject(id: string) {
  const { data, error, isLoading, mutate } = useSWR<ProjectResponse>(
    id ? `/api/project/${id}` : null,
    fetcher
  );

  return {
    project: data?.data || null,
    isLoading,
    error,
    mutate,
  };
}

export function useMunicipalities() {
  const { data, error, isLoading } = useSWR<MunicipalityResponse>(
    '/api/municipality',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // Cache for 5 minutes
    }
  );

  return {
    municipalities: data?.data || [],
    isLoading,
    error,
  };
}

export function useComponents() {
  const { data, error, isLoading, mutate } = useSWR<ComponentResponse>(
    '/api/components',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  return {
    components: data?.data || [],
    isLoading,
    error,
    mutate,
  };
}
