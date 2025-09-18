import { NextRequest } from 'next/server';
import {
  createRouteErrorResponse,
  createRouteSuccessResponse,
} from '@/utils/responseHandler';
import { createClient } from '@/utils/supabase/server';
import OpenAI from 'openai';

interface ChartInsightRequest {
  chartTitle: string;
  chartType: 'bar' | 'line' | 'pie' | 'area';
  dataType: string;
  data: any[];
  summaryStats: {
    totalProjects: number;
    totalCost: number;
    totalAreaDeveloped: number;
    averageProjectCost: number;
  };
}

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

    if (!process.env.OPENAI_API_KEY) {
      return createRouteErrorResponse(500, 'AI service not configured');
    }

    const body: ChartInsightRequest = await request.json();
    const { chartTitle, chartType, dataType, data, summaryStats } = body;

    if (!chartTitle || !data || data.length === 0) {
      return createRouteErrorResponse(400, 'Invalid chart data provided');
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Generate insights based on chart type and data
    const dataSnapshot = data.slice(0, 10).map((item) => {
      const formatted: any = {};
      Object.entries(item).forEach(([key, value]) => {
        if (typeof value === 'number' && value !== null && !isNaN(value)) {
          if (key.includes('cost') || key.includes('Cost')) {
            formatted[key] = `₱${value.toLocaleString()}`;
          } else if (key.includes('area') || key.includes('Area')) {
            formatted[key] = `${value.toFixed(2)} hectares`;
          } else {
            formatted[key] = value.toLocaleString();
          }
        } else {
          formatted[key] = value || 'N/A';
        }
      });
      return formatted;
    });

    const insightPrompt = `
Analyze this project data chart and provide actionable insights:

**Chart Information:**
- Title: ${chartTitle}
- Type: ${chartType} chart
- Data Type: ${dataType}
- Total Data Points: ${data.length}

**Overall Project Context:**
- Total Projects: ${summaryStats.totalProjects || 0}
- Total Investment: ₱${(summaryStats.totalCost || 0).toLocaleString()}
- Total Area: ${(summaryStats.totalAreaDeveloped || 0).toFixed(2)} hectares
- Average Project Cost: ₱${(summaryStats.averageProjectCost || 0).toLocaleString()}

**Chart Data Sample:**
${JSON.stringify(dataSnapshot, null, 2)}

Please provide:

1. **Key Findings** (2-3 main insights from the data)
2. **Performance Analysis** (what the data reveals about project performance)
3. **Notable Patterns** (trends, outliers, or distributions worth noting)
4. **Strategic Recommendations** (actionable next steps based on the data)

Format your response in clean, structured text suitable for a professional report. Be specific with numbers and provide context for your insights.
    `;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a project management analyst specializing in Philippine development projects. Provide clear, actionable insights based on project data.',
        },
        {
          role: 'user',
          content: insightPrompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const insights = completion.choices[0].message.content || '';

    return createRouteSuccessResponse(200, {
      chartTitle,
      insights,
      dataPoints: data.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chart insights API error:', error);
    const message =
      error instanceof Error ? error.message : 'An unexpected error occurred';
    return createRouteErrorResponse(500, message);
  }
};

function generateDataSummary(data: any[], dataType: string): string {
  if (data.length === 0) return 'No data available';

  const summary: string[] = [];

  // Find numeric fields for analysis
  const numericFields = Object.keys(data[0] || {}).filter(
    (key) => typeof data[0][key] === 'number'
  );

  numericFields.forEach((field) => {
    const values = data
      .map((item) => item[field])
      .filter((val) => typeof val === 'number');
    if (values.length > 0) {
      const total = values.reduce((sum, val) => sum + val, 0);
      const avg = total / values.length;
      const max = Math.max(...values);
      const min = Math.min(...values);

      const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
      summary.push(
        `${fieldName}: Total=${total.toLocaleString()}, Average=${avg.toLocaleString()}, Range=${min.toLocaleString()}-${max.toLocaleString()}`
      );
    }
  });

  // Add categorical data summary
  const categoricalFields = Object.keys(data[0] || {}).filter(
    (key) => typeof data[0][key] === 'string'
  );

  categoricalFields.forEach((field) => {
    const uniqueValues = [...new Set(data.map((item) => item[field]))];
    if (uniqueValues.length < data.length) {
      summary.push(
        `${field}: ${uniqueValues.length} unique values across ${data.length} records`
      );
    }
  });

  return summary.join('\n');
}
