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

    // Parse custom query parameters
    const customQuery = searchParams.get('customQuery');
    const customCriteria = customQuery
      ? JSON.parse(decodeURIComponent(customQuery))
      : null;

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

    // Add custom criteria filtering
    if (customCriteria) {
      if (customCriteria.minCost) {
        projectWhere.totalProjectCost = { gte: customCriteria.minCost };
      }
      if (customCriteria.maxCost) {
        projectWhere.totalProjectCost = {
          ...projectWhere.totalProjectCost,
          lte: customCriteria.maxCost,
        };
      }
      if (customCriteria.minArea) {
        projectWhere.totalAreaDeveloped = { gte: customCriteria.minArea };
      }
      if (customCriteria.maxArea) {
        projectWhere.totalAreaDeveloped = {
          ...projectWhere.totalAreaDeveloped,
          lte: customCriteria.maxArea,
        };
      }
      if (customCriteria.specificYears?.length) {
        projectWhere.startDate = { in: customCriteria.specificYears };
      }
    }

    console.log('Loading heatmap data with filters:', {
      projectWhere,
      customCriteria,
    });
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

    // Calculate heatmap data points with custom filtering
    const heatmapData: HeatmapDataPoint[] = [];
    let globalMinYear = new Date().getFullYear();
    let globalMaxYear = 1900;
    const categoryValues: number[] = [];

    for (const barangay of barangaysWithProjects) {
      const projects = barangay.Project;

      // Apply custom project count filtering
      if (
        customCriteria?.minProjects &&
        projects.length < customCriteria.minProjects
      ) {
        continue;
      }
      if (
        customCriteria?.maxProjects &&
        projects.length > customCriteria.maxProjects
      ) {
        continue;
      }

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

      // Custom intensity calculation based on query type
      let categoryValue = 0;
      if (customCriteria) {
        switch (customCriteria.type) {
          case 'cost_threshold':
            categoryValue = totalCost;
            break;
          case 'project_count':
            categoryValue = projects.length * 10; // Amplify for visualization
            break;
          case 'area_threshold':
            categoryValue = totalAreaDeveloped;
            break;
          case 'development_intensity':
            // Complex calculation combining multiple factors
            const costScore = Math.min(totalCost / 1000000, 10); // Cap at 10M
            const areaScore = Math.min(totalAreaDeveloped / 100, 10); // Cap at 100 hectares
            const projectScore = Math.min(projects.length, 10); // Cap at 10 projects
            categoryValue = (costScore + areaScore + projectScore) * 3.33; // Scale to 100
            break;
          default:
            // Fall back to standard category calculation
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
        }
      } else {
        // Standard category calculation
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
        customQuery: customCriteria,
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
      `Custom heatmap processing completed in ${(endTime - startTime).toFixed(2)}ms`
    );
    console.log(
      `Processed ${heatmapData.length} barangays with custom criteria`
    );

    return createRouteSuccessResponse(200, response);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'An unexpected error occurred';
    console.error('Heatmap API error:', message);
    return createRouteErrorResponse(500, message);
  }
};
