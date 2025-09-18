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

export function useProjects(
  page: number = 1,
  limit: number = 10,
  search: string = ''
) {
  const { data, error, isLoading, mutate } = useSWR<ProjectListResponse>(
    `/api/project?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // Temporary client-side pagination fallback if API doesn't support pagination
  const allProjects = data?.data || [];
  const hasApiPagination = data?.totalPages !== undefined;

  if (hasApiPagination) {
    // API handles pagination and search
    return {
      projects: allProjects,
      totalPages: data?.totalPages || 1,
      totalProjects: data?.totalProjects || 0,
      currentPage: page,
      isLoading,
      error,
      mutate,
    };
  } else {
    // Client-side pagination and search fallback
    let filteredProjects = allProjects;

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filteredProjects = allProjects.filter(
        (project) =>
          project.title.toLowerCase().includes(searchLower) ||
          (project.projectCode &&
            project.projectCode.toLowerCase().includes(searchLower)) ||
          project.barangay.name.toLowerCase().includes(searchLower) ||
          project.barangay.municipality.name.toLowerCase().includes(searchLower)
      );
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProjects = filteredProjects.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredProjects.length / limit);

    return {
      projects: paginatedProjects,
      totalPages,
      totalProjects: filteredProjects.length,
      currentPage: page,
      isLoading,
      error,
      mutate,
    };
  }
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
      shouldRetryOnError: true,
      onError: (error) => {
        console.error('Failed to load municipalities:', error);
      },
      onSuccess: (data) => {
        console.log(
          'Successfully loaded municipalities:',
          data?.data?.length || 0
        );
      },
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
