import { NextRequest } from 'next/server';
import {
  createRouteSuccessResponse,
  createRouteErrorResponse,
} from '@/utils/responseHandler';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/utils/prisma';
import { HeatmapCategory, HeatmapDataPoint } from '@/schemas/heatmap';

export const GET = async (request: NextRequest) => {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return createRouteErrorResponse(401, 'Unauthorized');
    }

    // Parse query parameters
    const category =
      (searchParams.get('category') as HeatmapCategory) ||
      HeatmapCategory.RECENTNESS;
    const municipalityIds =
      searchParams.get('municipalityIds')?.split(',') || [];
    const startYear = searchParams.get('startYear');
    const endYear = searchParams.get('endYear');

    // Build optimized where clause for projects
    const projectWhere: any = {
      companyId: user.id,
    };

    if (startYear) {
      projectWhere.startDate = { gte: startYear };
    }
    if (endYear) {
      projectWhere.startDate = { lte: endYear };
    }

    console.log('Loading heatmap data...');
    const startTime = performance.now();

    // Optimized query with selective fields and proper indexing
    const barangaysWithProjects = await prisma.barangay.findMany({
      where:
        municipalityIds.length > 0
          ? {
              municipalityId: { in: municipalityIds },
            }
          : undefined,
      select: {
        id: true,
        name: true,
        officialCode: true,
        municipality: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        Project: {
          where: projectWhere,
          select: {
            id: true,
            startDate: true,
            endDate: true,
            totalAreaDeveloped: true,
            totalProjectCost: true,
            createdAt: true,
          },
          // Add ordering for better performance
          orderBy: {
            startDate: 'desc',
          },
        },
      },
      // Add ordering for consistent results
      orderBy: {
        name: 'asc',
      },
    });

    const queryTime = performance.now();
    console.log(
      `Database query completed in ${(queryTime - startTime).toFixed(2)}ms`
    );

    // Calculate heatmap data points with optimizations
    const heatmapData: HeatmapDataPoint[] = [];
    let globalMinYear = new Date().getFullYear();
    let globalMaxYear = 1900;
    const categoryValues: number[] = [];

    for (const barangay of barangaysWithProjects) {
      const projects = barangay.Project;

      if (projects.length === 0) continue;

      // Pre-calculate values to avoid repeated computations
      const projectYears = projects.map((p) => parseInt(p.startDate));
      const latestYear = Math.max(...projectYears);
      const oldestYear = Math.min(...projectYears);

      globalMinYear = Math.min(globalMinYear, oldestYear);
      globalMaxYear = Math.max(globalMaxYear, latestYear);

      // Calculate recentness score (0-100, where 100 is most recent)
      const currentYear = new Date().getFullYear();
      const yearsSinceLatest = currentYear - latestYear;
      const recentnessScore = Math.max(0, 100 - yearsSinceLatest * 10);

      // Calculate total area developed and cost in single pass
      let totalAreaDeveloped = 0;
      let totalCost = 0;

      for (const project of projects) {
        totalAreaDeveloped += project.totalAreaDeveloped || 0;
        totalCost += project.totalProjectCost || 0;
      }

      // Determine intensity based on category
      let categoryValue = 0;
      switch (category) {
        case HeatmapCategory.RECENTNESS:
          categoryValue = recentnessScore;
          break;
        case HeatmapCategory.AREA_DEVELOPED:
          categoryValue = totalAreaDeveloped;
          break;
        case HeatmapCategory.TOTAL_COST:
          categoryValue = totalCost;
          break;
      }

      categoryValues.push(categoryValue);

      const dataPoint: HeatmapDataPoint = {
        barangayId: barangay.id,
        barangayName: barangay.name,
        municipalityId: barangay.municipality.id,
        municipalityName: barangay.municipality.name,
        municipalityCode: barangay.municipality.code,
        projectCount: projects.length,
        recentnessScore,
        totalAreaDeveloped,
        totalCost,
        latestProjectYear: latestYear.toString(),
        oldestProjectYear: oldestYear.toString(),
        intensity: categoryValue, // Will be normalized below
      };

      heatmapData.push(dataPoint);
    }

    // Normalize intensity values to 0-100 scale
    if (categoryValues.length > 0) {
      const minValue = Math.min(...categoryValues);
      const maxValue = Math.max(...categoryValues);
      const range = maxValue - minValue;

      if (range > 0) {
        heatmapData.forEach((point) => {
          const normalizedValue = ((point.intensity - minValue) / range) * 100;
          point.intensity = Math.round(normalizedValue);
        });
      } else {
        // If all values are the same, set to middle
        heatmapData.forEach((point) => {
          point.intensity = 50;
        });
      }
    }

    const response = {
      heatmapData,
      metadata: {
        category,
        totalBarangays: heatmapData.length,
        dateRange: {
          earliest: globalMinYear.toString(),
          latest: globalMaxYear.toString(),
        },
        valueRange: {
          min: categoryValues.length > 0 ? Math.min(...categoryValues) : 0,
          max: categoryValues.length > 0 ? Math.max(...categoryValues) : 0,
        },
      },
    };

    const endTime = performance.now();
    console.log(
      `Total heatmap processing completed in ${(endTime - startTime).toFixed(2)}ms`
    );
    console.log(`Processed ${heatmapData.length} barangays with project data`);

    return createRouteSuccessResponse(200, response);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'An unexpected error occurred';
    console.error('Heatmap API error:', message);
    return createRouteErrorResponse(500, message);
  }
};
