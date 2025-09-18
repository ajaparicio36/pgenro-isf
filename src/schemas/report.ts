import { z } from 'zod';

export const reportFiltersSchema = z.object({
  startYear: z.string().min(4, 'Start year is required'),
  endYear: z.string().min(4, 'End year is required'),
  municipalityIds: z.array(z.string()).optional(),
  barangayIds: z.array(z.string()).optional(),
});

export const reportDataSchema = z.object({
  summary: z.object({
    totalProjects: z.number(),
    totalCost: z.number(),
    totalAreaDeveloped: z.number(),
    averageProjectCost: z.number(),
  }),
  municipalityData: z.array(
    z.object({
      municipalityId: z.string(),
      municipalityName: z.string(),
      projectCount: z.number(),
      totalCost: z.number(),
      totalAreaDeveloped: z.number(),
      averageProjectCost: z.number(),
    })
  ),
  yearlyData: z.array(
    z.object({
      year: z.string(),
      projectCount: z.number(),
      totalCost: z.number(),
      totalAreaDeveloped: z.number(),
    })
  ),
  statusData: z.array(
    z.object({
      status: z.string(),
      count: z.number(),
      totalCost: z.number(),
    })
  ),
  aiAnalysis: z.string().optional(),
});

export type ReportFilters = z.infer<typeof reportFiltersSchema>;
export type ReportData = z.infer<typeof reportDataSchema>;

export interface ReportResponse {
  success: boolean;
  data: ReportData;
}
