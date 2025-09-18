'use client';

import { HeatmapResponse, HeatmapFilterData } from '@/schemas/heatmap';
import useSWR from 'swr';

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch heatmap data');
  }
  return response.json();
};

export function useHeatmap(filters: HeatmapFilterData) {
  const queryParams = new URLSearchParams();

  queryParams.set('category', filters.category);

  if (filters.municipalityIds?.length) {
    queryParams.set('municipalityIds', filters.municipalityIds.join(','));
  }

  if (filters.startYear) {
    queryParams.set('startYear', filters.startYear);
  }

  if (filters.endYear) {
    queryParams.set('endYear', filters.endYear);
  }

  const { data, error, isLoading, mutate } = useSWR<HeatmapResponse>(
    `/api/heatmap?${queryParams.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // Cache for 30 seconds
    }
  );

  return {
    heatmapData: data?.data.heatmapData || [],
    metadata: data?.data.metadata || null,
    isLoading,
    error,
    mutate,
  };
}
