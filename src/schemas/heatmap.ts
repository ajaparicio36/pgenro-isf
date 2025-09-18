import { z } from 'zod';

export enum HeatmapCategory {
  RECENTNESS = 'recentness',
  AREA_DEVELOPED = 'area_developed',
  TOTAL_COST = 'total_cost',
}

export const heatmapFilterSchema = z.object({
  category: z.nativeEnum(HeatmapCategory).default(HeatmapCategory.RECENTNESS),
  municipalityIds: z.array(z.string()).optional(),
  startYear: z.string().optional(),
  endYear: z.string().optional(),
});

export type HeatmapFilterData = z.infer<typeof heatmapFilterSchema>;

export interface HeatmapDataPoint {
  barangayId: string;
  barangayName: string;
  municipalityId: string;
  municipalityName: string;
  municipalityCode: string;
  projectCount: number;
  recentnessScore: number; // 0-100 scale
  totalAreaDeveloped: number; // in hectares
  totalCost: number;
  latestProjectYear: string;
  oldestProjectYear: string;
  intensity: number; // calculated based on selected category (0-100)
}

export interface HeatmapResponse {
  success: boolean;
  data: {
    heatmapData: HeatmapDataPoint[];
    metadata: {
      category: HeatmapCategory;
      totalBarangays: number;
      dateRange: {
        earliest: string;
        latest: string;
      };
      valueRange: {
        min: number;
        max: number;
      };
    };
  };
}
