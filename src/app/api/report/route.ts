import { NextRequest } from 'next/server';
import {
  createRouteErrorResponse,
  createRouteSuccessResponse,
  parseValidationIssues,
} from '@/utils/responseHandler';
import { createClient } from '@/utils/supabase/server';
import prisma from '@/utils/prisma';
import { reportFiltersSchema } from '@/schemas/report';
import OpenAI from 'openai';

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

    const body = await request.json();
    const validatedFilters = reportFiltersSchema.safeParse(body);

    if (!validatedFilters.success) {
      return createRouteErrorResponse(
        400,
        parseValidationIssues(validatedFilters.error.issues)
      );
    }

    const { startYear, endYear, municipalityIds, barangayIds } =
      validatedFilters.data;

    // Build where clause for projects
    const projectWhere: any = {
      companyId: user.id,
      startDate: {
        gte: startYear,
        lte: endYear,
      },
    };

    if (barangayIds && barangayIds.length > 0) {
      projectWhere.barangayId = { in: barangayIds };
    } else if (municipalityIds && municipalityIds.length > 0) {
      projectWhere.barangay = {
        municipalityId: { in: municipalityIds },
      };
    }

    // Fetch projects with detailed information
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

    // Calculate summary statistics
    const totalProjects = projects.length;
    const totalCost = projects.reduce(
      (sum, p) => sum + (p.totalProjectCost || 0),
      0
    );
    const totalAreaDeveloped = projects.reduce(
      (sum, p) => sum + (p.totalAreaDeveloped || 0),
      0
    );
    const averageProjectCost =
      totalProjects > 0 ? totalCost / totalProjects : 0;

    // Group by municipality
    const municipalityMap = new Map();
    projects.forEach((project) => {
      const municipalityId = project.barangay.municipality.id;
      const municipalityName = project.barangay.municipality.name;

      if (!municipalityMap.has(municipalityId)) {
        municipalityMap.set(municipalityId, {
          municipalityId,
          municipalityName,
          projectCount: 0,
          totalCost: 0,
          totalAreaDeveloped: 0,
          averageProjectCost: 0,
        });
      }

      const data = municipalityMap.get(municipalityId);
      data.projectCount++;
      data.totalCost += project.totalProjectCost || 0;
      data.totalAreaDeveloped += project.totalAreaDeveloped || 0;
    });

    // Calculate averages for municipalities
    municipalityMap.forEach((data) => {
      data.averageProjectCost =
        data.projectCount > 0 ? data.totalCost / data.projectCount : 0;
    });

    const municipalityData = Array.from(municipalityMap.values()).sort(
      (a, b) => b.totalCost - a.totalCost
    );

    // Group by year
    const yearMap = new Map();
    projects.forEach((project) => {
      const year = project.startDate;
      if (!yearMap.has(year)) {
        yearMap.set(year, {
          year,
          projectCount: 0,
          totalCost: 0,
          totalAreaDeveloped: 0,
        });
      }

      const data = yearMap.get(year);
      data.projectCount++;
      data.totalCost += project.totalProjectCost || 0;
      data.totalAreaDeveloped += project.totalAreaDeveloped || 0;
    });

    const yearlyData = Array.from(yearMap.values()).sort((a, b) =>
      a.year.localeCompare(b.year)
    );

    // Group by status
    const statusMap = new Map();
    projects.forEach((project) => {
      const status = project.status;
      if (!statusMap.has(status)) {
        statusMap.set(status, {
          status,
          count: 0,
          totalCost: 0,
        });
      }

      const data = statusMap.get(status);
      data.count++;
      data.totalCost += project.totalProjectCost || 0;
    });

    const statusData = Array.from(statusMap.values());

    // Generate AI analysis
    let aiAnalysis = '';
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const analysisPrompt = `
Analyze the following project data and provide insights in markdown format:

**Summary Statistics:**
- Total Projects: ${totalProjects}
- Total Cost: ₱${totalCost.toLocaleString()}
- Total Area Developed: ${totalAreaDeveloped.toFixed(2)} hectares
- Average Project Cost: ₱${averageProjectCost.toLocaleString()}
- Date Range: ${startYear} - ${endYear}

**Municipality Breakdown:**
${municipalityData.map((m) => `- ${m.municipalityName}: ${m.projectCount} projects, ₱${m.totalCost.toLocaleString()}`).join('\n')}

**Yearly Distribution:**
${yearlyData.map((y) => `- ${y.year}: ${y.projectCount} projects, ₱${y.totalCost.toLocaleString()}`).join('\n')}

**Status Distribution:**
${statusData.map((s) => `- ${s.status}: ${s.count} projects, ₱${s.totalCost.toLocaleString()}`).join('\n')}

Please provide:
1. Key insights and trends
2. Performance analysis
3. Recommendations for future planning
4. Notable patterns in the data

Format the response in clean markdown with proper headers and sections.
        `;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content:
                'You are a project management analyst. Provide clear, actionable insights based on project data.',
            },
            {
              role: 'user',
              content: analysisPrompt,
            },
          ],
          max_tokens: 1500,
          temperature: 0.7,
        });

        aiAnalysis = completion.choices[0].message.content || '';
      } catch (error) {
        console.error('AI analysis error:', error);
        aiAnalysis = 'AI analysis temporarily unavailable.';
      }
    }

    const reportData = {
      summary: {
        totalProjects,
        totalCost,
        totalAreaDeveloped,
        averageProjectCost,
      },
      municipalityData,
      yearlyData,
      statusData,
      aiAnalysis,
    };

    return createRouteSuccessResponse(200, reportData);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : 'An unexpected error occurred';
    console.error('Report API error:', message);
    return createRouteErrorResponse(500, message);
  }
};
