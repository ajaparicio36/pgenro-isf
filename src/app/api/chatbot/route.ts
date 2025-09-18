import { NextRequest } from 'next/server';
import {
  createRouteSuccessResponse,
  createRouteErrorResponse,
} from '@/utils/responseHandler';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/utils/prisma';
import { HeatmapCategory } from '@/schemas/heatmap';
import OpenAI from 'openai';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatbotResponse {
  message: string;
  suggestedFilters?: {
    category?: HeatmapCategory;
    municipalityIds?: string[];
    startYear?: string;
    endYear?: string;
    customQuery?: {
      type: 'complex_filter' | 'comparison' | 'trend_analysis';
      parameters: any;
    };
  };
  reportData?: any;
  chartData?: {
    type: 'bar' | 'line' | 'pie' | 'area';
    dataType: string;
    data: any[];
    title: string;
  };
  action?: 'heatmap' | 'report' | 'chart' | 'custom_heatmap' | 'general';
}

const PRESET_SUGGESTIONS = [
  'Show me recent projects in the heatmap',
  'Show projects costing over 5 million pesos',
  'Display barangays with more than 3 projects',
  'Find areas developed in the last 2 years',
  'Show municipalities with highest project density',
  'Chart project costs by municipality',
  'Compare development across different years',
  'Generate a comprehensive report',
];

export const POST = async (request: NextRequest) => {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return createRouteErrorResponse(401, 'Unauthorized');
    }

    const { message, conversationHistory } = await request.json();

    if (!message) {
      return createRouteErrorResponse(400, 'Message is required');
    }

    // Get municipalities and barangays for context
    const municipalities = await prisma.municipality.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        barangays: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get project stats for context
    const projectStats = await prisma.project.aggregate({
      where: { companyId: user.id },
      _count: true,
      _sum: {
        totalProjectCost: true,
        totalAreaDeveloped: true,
      },
      _min: {
        startDate: true,
      },
      _max: {
        startDate: true,
      },
    });

    if (!process.env.OPENAI_API_KEY) {
      return createRouteErrorResponse(500, 'AI service not configured');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = `You are an AI assistant for a project management dashboard analyzing development projects in Philippine barangays and municipalities.

Available data context:
- Total projects: ${projectStats._count}
- Total cost: ₱${(projectStats._sum.totalProjectCost || 0).toLocaleString()}
- Total area developed: ${(projectStats._sum.totalAreaDeveloped || 0).toFixed(2)} hectares
- Date range: ${projectStats._min.startDate} - ${projectStats._max.startDate}
- Available municipalities: ${municipalities.map((m) => m.name).join(', ')}

You can help with:
1. **Standard Heatmap Visualization** - Basic categories (recentness, area developed, cost)
2. **Custom Heatmap Queries** - Advanced filtering (cost thresholds, project counts, specific criteria)
3. **Chart Generation** - Various chart types for data comparison
4. **Report Generation** - Comprehensive analysis with AI insights

Available heatmap categories:
- RECENTNESS: Shows how recent projects are (0-100 scale)
- AREA_DEVELOPED: Shows total area developed in hectares
- TOTAL_COST: Shows total project costs in PHP

For custom queries, you can create complex filters like:
- "Projects over X cost" 
- "Barangays with more than Y projects"
- "Areas developed in specific time periods"
- "High-impact development zones"

When users ask for specific criteria or comparisons, use the create_custom_heatmap function.
Respond in a helpful, professional tone with specific actionable insights.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...((conversationHistory || []) as ChatMessage[]).map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: 'user', content: message },
      ],
      max_tokens: 800,
      temperature: 0.7,
      functions: [
        {
          name: 'update_heatmap',
          description: 'Update heatmap with standard categories',
          parameters: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                enum: ['RECENTNESS', 'AREA_DEVELOPED', 'TOTAL_COST'],
              },
              municipalityIds: {
                type: 'array',
                items: { type: 'string' },
              },
              startYear: { type: 'string' },
              endYear: { type: 'string' },
            },
          },
        },
        {
          name: 'create_custom_heatmap',
          description:
            'Create custom heatmap visualization with specific criteria',
          parameters: {
            type: 'object',
            properties: {
              queryType: {
                type: 'string',
                enum: [
                  'cost_threshold',
                  'project_count',
                  'area_threshold',
                  'time_specific',
                  'development_intensity',
                ],
              },
              criteria: {
                type: 'object',
                properties: {
                  minCost: { type: 'number' },
                  maxCost: { type: 'number' },
                  minProjects: { type: 'number' },
                  maxProjects: { type: 'number' },
                  minArea: { type: 'number' },
                  maxArea: { type: 'number' },
                  specificYears: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  developmentType: { type: 'string' },
                },
              },
              municipalityIds: {
                type: 'array',
                items: { type: 'string' },
              },
              startYear: { type: 'string' },
              endYear: { type: 'string' },
            },
          },
        },
        {
          name: 'generate_chart',
          description: 'Generate data visualization charts',
          parameters: {
            type: 'object',
            properties: {
              chartType: {
                type: 'string',
                enum: ['bar', 'line', 'pie', 'area'],
              },
              dataType: {
                type: 'string',
                enum: [
                  'cost_by_municipality',
                  'area_by_barangay',
                  'projects_by_year',
                  'status_distribution',
                  'cost_by_barangay',
                  'projects_by_municipality',
                  'high_value_projects',
                  'development_timeline',
                ],
              },
              startYear: { type: 'string' },
              endYear: { type: 'string' },
              municipalityIds: {
                type: 'array',
                items: { type: 'string' },
              },
              threshold: { type: 'number' },
              limit: { type: 'number', default: 10 },
            },
          },
        },
        {
          name: 'generate_report',
          description: 'Generate comprehensive project report',
          parameters: {
            type: 'object',
            properties: {
              startYear: { type: 'string' },
              endYear: { type: 'string' },
              municipalityIds: {
                type: 'array',
                items: { type: 'string' },
              },
              barangayIds: {
                type: 'array',
                items: { type: 'string' },
              },
              includeAnalysis: { type: 'boolean', default: true },
            },
          },
        },
      ],
      function_call: 'auto',
    });

    const response = completion.choices[0];
    const chatbotResponse: ChatbotResponse = {
      message:
        response.message?.content ||
        "I apologize, but I couldn't process your request.",
      action: 'general',
    };

    // Handle function calls
    if (response.message?.function_call) {
      const functionName = response.message.function_call.name;
      const functionArgs = JSON.parse(
        response.message.function_call.arguments || '{}'
      );

      if (functionName === 'update_heatmap') {
        chatbotResponse.action = 'heatmap';
        chatbotResponse.suggestedFilters = {
          category: functionArgs.category as HeatmapCategory,
          municipalityIds: functionArgs.municipalityIds,
          startYear: functionArgs.startYear,
          endYear: functionArgs.endYear,
        };
        chatbotResponse.message = `I've updated the heatmap to show ${functionArgs.category.toLowerCase().replace('_', ' ')}${functionArgs.municipalityIds ? ` for selected municipalities` : ''}.`;
      } else if (functionName === 'create_custom_heatmap') {
        // Generate custom heatmap data based on specific criteria
        const { queryType, criteria, municipalityIds, startYear, endYear } =
          functionArgs;

        // Build custom query filters
        const customFilters = {
          category: HeatmapCategory.TOTAL_COST, // Default category for custom queries
          municipalityIds,
          startYear,
          endYear,
          customQuery: {
            type: queryType,
            parameters: criteria,
          },
        };

        chatbotResponse.action = 'custom_heatmap';
        chatbotResponse.suggestedFilters = customFilters;

        // Generate descriptive message based on query type
        let description = '';
        switch (queryType) {
          case 'cost_threshold':
            const costRange =
              criteria.minCost && criteria.maxCost
                ? `between ₱${criteria.minCost.toLocaleString()} and ₱${criteria.maxCost.toLocaleString()}`
                : criteria.minCost
                  ? `over ₱${criteria.minCost.toLocaleString()}`
                  : `under ₱${criteria.maxCost.toLocaleString()}`;
            description = `projects with costs ${costRange}`;
            break;
          case 'project_count':
            const projectRange =
              criteria.minProjects && criteria.maxProjects
                ? `between ${criteria.minProjects} and ${criteria.maxProjects}`
                : criteria.minProjects
                  ? `more than ${criteria.minProjects}`
                  : `less than ${criteria.maxProjects}`;
            description = `barangays with ${projectRange} projects`;
            break;
          case 'area_threshold':
            const areaRange =
              criteria.minArea && criteria.maxArea
                ? `between ${criteria.minArea} and ${criteria.maxArea} hectares`
                : criteria.minArea
                  ? `over ${criteria.minArea} hectares`
                  : `under ${criteria.maxArea} hectares`;
            description = `areas developed ${areaRange}`;
            break;
          case 'time_specific':
            description = `projects from specific time periods (${criteria.specificYears?.join(', ')})`;
            break;
          case 'development_intensity':
            description = 'high-intensity development zones';
            break;
          default:
            description = 'custom criteria';
        }

        chatbotResponse.message = `I've created a custom heatmap showing ${description}. The visualization highlights areas that match your specific criteria.`;
      } else if (functionName === 'generate_chart') {
        // Generate chart data
        const chartFilters = {
          startYear: functionArgs.startYear || projectStats._min.startDate,
          endYear: functionArgs.endYear || projectStats._max.startDate,
          municipalityIds: functionArgs.municipalityIds,
          limit: functionArgs.limit || 10,
        };

        const projectWhere: any = {
          companyId: user.id,
          startDate: {
            gte: chartFilters.startYear,
            lte: chartFilters.endYear,
          },
        };

        if (chartFilters.municipalityIds?.length) {
          projectWhere.barangay = {
            municipalityId: { in: chartFilters.municipalityIds },
          };
        }

        const projects = await prisma.project.findMany({
          where: projectWhere,
          include: {
            barangay: {
              include: {
                municipality: true,
              },
            },
          },
        });

        let chartData: any[] = [];
        const chartType = functionArgs.chartType;
        const dataType = functionArgs.dataType;

        switch (dataType) {
          case 'cost_by_municipality':
            const municipalityCostMap = new Map();
            projects.forEach((project) => {
              const municipalityName = project.barangay.municipality.name;
              const cost = project.totalProjectCost || 0;
              municipalityCostMap.set(
                municipalityName,
                (municipalityCostMap.get(municipalityName) || 0) + cost
              );
            });
            chartData = Array.from(municipalityCostMap.entries())
              .map(([name, totalCost]) => ({ name, totalCost }))
              .sort((a, b) => b.totalCost - a.totalCost)
              .slice(0, chartFilters.limit);
            break;

          case 'area_by_barangay':
            const barangayAreaMap = new Map();
            projects.forEach((project) => {
              const barangayName = `${project.barangay.name}, ${project.barangay.municipality.name}`;
              const area = project.totalAreaDeveloped || 0;
              barangayAreaMap.set(
                barangayName,
                (barangayAreaMap.get(barangayName) || 0) + area
              );
            });
            chartData = Array.from(barangayAreaMap.entries())
              .map(([name, totalArea]) => ({ name, totalArea }))
              .sort((a, b) => b.totalArea - a.totalArea)
              .slice(0, chartFilters.limit);
            break;

          case 'cost_by_barangay':
            const barangayCostMap = new Map();
            projects.forEach((project) => {
              const barangayName = `${project.barangay.name}, ${project.barangay.municipality.name}`;
              const cost = project.totalProjectCost || 0;
              barangayCostMap.set(
                barangayName,
                (barangayCostMap.get(barangayName) || 0) + cost
              );
            });
            chartData = Array.from(barangayCostMap.entries())
              .map(([name, totalCost]) => ({ name, totalCost }))
              .sort((a, b) => b.totalCost - a.totalCost)
              .slice(0, chartFilters.limit);
            break;

          case 'projects_by_municipality':
            const municipalityProjectMap = new Map();
            projects.forEach((project) => {
              const municipalityName = project.barangay.municipality.name;
              municipalityProjectMap.set(
                municipalityName,
                (municipalityProjectMap.get(municipalityName) || 0) + 1
              );
            });
            chartData = Array.from(municipalityProjectMap.entries())
              .map(([name, projectCount]) => ({ name, projectCount }))
              .sort((a, b) => b.projectCount - a.projectCount)
              .slice(0, chartFilters.limit);
            break;

          case 'projects_by_year':
            const yearMap = new Map();
            projects.forEach((project) => {
              const year = project.startDate;
              yearMap.set(year, (yearMap.get(year) || 0) + 1);
            });
            chartData = Array.from(yearMap.entries())
              .map(([year, projectCount]) => ({ year, projectCount }))
              .sort((a, b) => a.year.localeCompare(b.year));
            break;

          case 'status_distribution':
            const statusMap = new Map();
            projects.forEach((project) => {
              const status = project.status;
              statusMap.set(status, (statusMap.get(status) || 0) + 1);
            });
            chartData = Array.from(statusMap.entries()).map(
              ([status, count]) => ({ status, count })
            );
            break;
        }

        chatbotResponse.action = 'chart';
        chatbotResponse.chartData = {
          type: chartType,
          dataType,
          data: chartData,
          title: getChartTitle(dataType),
        };
        chatbotResponse.message = `I've generated a ${chartType} chart showing ${getChartTitle(
          dataType
        ).toLowerCase()}.`;
      } else if (functionName === 'generate_report') {
        // Generate report data
        const reportFilters = {
          startYear: functionArgs.startYear || projectStats._min.startDate,
          endYear: functionArgs.endYear || projectStats._max.startDate,
          municipalityIds: functionArgs.municipalityIds,
          barangayIds: functionArgs.barangayIds,
        };

        // Generate report (similar to existing report API logic)
        const projectWhere: any = {
          companyId: user.id,
          startDate: {
            gte: reportFilters.startYear,
            lte: reportFilters.endYear,
          },
        };

        if (reportFilters.barangayIds?.length) {
          projectWhere.barangayId = { in: reportFilters.barangayIds };
        } else if (reportFilters.municipalityIds?.length) {
          projectWhere.barangay = {
            municipalityId: { in: reportFilters.municipalityIds },
          };
        }

        const projects = await prisma.project.findMany({
          where: projectWhere,
          include: {
            barangay: {
              include: {
                municipality: true,
              },
            },
            components: true,
          },
          orderBy: {
            startDate: 'asc',
          },
        });

        // Calculate report data (reuse logic from report API)
        const totalProjects = projects.length;
        const totalCost = projects.reduce(
          (sum, p) => sum + (p.totalProjectCost || 0),
          0
        );
        const totalAreaDeveloped = projects.reduce(
          (sum, p) => sum + (p.totalAreaDeveloped || 0),
          0
        );

        chatbotResponse.action = 'report';
        chatbotResponse.reportData = {
          summary: {
            totalProjects,
            totalCost,
            totalAreaDeveloped,
            averageProjectCost:
              totalProjects > 0 ? totalCost / totalProjects : 0,
          },
          projects: projects.slice(0, 10), // Limit for performance
        };
        chatbotResponse.message = `I've generated a report for ${totalProjects} projects from ${reportFilters.startYear} to ${reportFilters.endYear}. Check the report section below for detailed analysis.`;
      }
    }

    return createRouteSuccessResponse(200, {
      response: chatbotResponse,
      suggestions: PRESET_SUGGESTIONS,
    });
  } catch (error) {
    console.error('Chatbot API error:', error);
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';
    return createRouteErrorResponse(500, message);
  }
};

function getChartTitle(dataType: string): string {
  switch (dataType) {
    case 'cost_by_municipality':
      return 'Total Project Cost by Municipality';
    case 'area_by_barangay':
      return 'Total Area Developed by Barangay';
    case 'cost_by_barangay':
      return 'Total Project Cost by Barangay';
    case 'projects_by_municipality':
      return 'Number of Projects by Municipality';
    case 'projects_by_year':
      return 'Projects by Year';
    case 'status_distribution':
      return 'Project Status Distribution';
    default:
      return 'Project Data Chart';
  }
}
