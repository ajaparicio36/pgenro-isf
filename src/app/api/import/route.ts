import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import {
  createRouteErrorResponse,
  createRouteSuccessResponse,
  parseValidationIssues,
} from '@/utils/responseHandler';
import { importPrompt } from '@/utils/prompt';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

const interpretedProjectSchema = z.object({
  title: z.string().min(1).max(255),
  projectCode: z.string().optional(),
  startDate: z.string().min(4),
  endDate: z.string().optional(),
  totalAreaDeveloped: z.number().min(0).optional(),
  description: z.string().optional(),
  totalProjectCost: z.number().min(0).optional(),
  locationText: z.string().optional(), // Raw location text from Excel
  components: z
    .array(
      z.object({
        componentTitle: z.string().min(1).max(255),
        componentDescription: z.string().optional(),
        componentCost: z.number().min(0),
      })
    )
    .min(1),
  attachmentUrls: z.array(z.string().url()).optional(),
});

const importResponseSchema = z.object({
  projects: z.array(interpretedProjectSchema),
});

function createInterpretProjectsJsonSchema(): any {
  return {
    type: 'object',
    properties: {
      projects: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
              description: 'Project title',
            },
            projectCode: {
              type: 'string',
              description: 'Optional project code',
            },
            startDate: {
              type: 'string',
              minLength: 4,
              description: 'Start date (year)',
            },
            endDate: {
              type: 'string',
              description: 'Optional end date (year)',
            },
            totalAreaDeveloped: {
              type: 'number',
              minimum: 0,
              description: 'Total area developed in hectares',
            },
            description: {
              type: 'string',
              description: 'Project description',
            },
            totalProjectCost: {
              type: 'number',
              minimum: 0,
              description: 'Total project cost',
            },
            locationText: {
              type: 'string',
              description:
                'Raw location text from the data (barangay, municipality, etc.)',
            },
            components: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                properties: {
                  componentTitle: {
                    type: 'string',
                    minLength: 1,
                    maxLength: 255,
                    description: 'Component title',
                  },
                  componentDescription: {
                    type: 'string',
                    description: 'Optional component description',
                  },
                  componentCost: {
                    type: 'number',
                    minimum: 0,
                    description: 'Component cost',
                  },
                },
                required: ['componentTitle', 'componentCost'],
              },
              description: 'Array of project components',
            },
            attachmentUrls: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uri',
                description: 'URL to attachment',
              },
              description: 'Optional array of attachment URLs',
            },
          },
          required: ['title', 'startDate', 'components'],
        },
      },
    },
    required: ['projects'],
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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const formData = await request.formData();
    const instructions = formData.get('instructions') as string | null;
    const file = formData.get('file') as File | null;

    if (!file) {
      return createRouteErrorResponse(400, 'No file provided');
    }

    const fileContent = await file.text();

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: importPrompt(instructions) },
        { role: 'user', content: fileContent },
      ],
      functions: [
        {
          name: 'interpret_projects',
          description:
            'Interpret and extract project data from the provided file content',
          parameters: createInterpretProjectsJsonSchema(),
        },
      ],
      function_call: { name: 'interpret_projects' },
    });

    const functionCall = completion.choices[0].message.function_call;
    console.log(functionCall);

    if (!functionCall || !functionCall.arguments) {
      return createRouteErrorResponse(
        500,
        'No project interpretation response from AI'
      );
    }

    let interpretedData;
    try {
      interpretedData = JSON.parse(functionCall.arguments);
    } catch (parseError) {
      return createRouteErrorResponse(500, 'Failed to parse AI response JSON');
    }

    const validatedResponse = importResponseSchema.safeParse(interpretedData);
    if (!validatedResponse.success) {
      return createRouteErrorResponse(
        400,
        'Invalid AI response structure: ' +
          parseValidationIssues(validatedResponse.error.issues)
      );
    }

    // Return interpreted projects without creating them
    return createRouteSuccessResponse(200, validatedResponse.data.projects);
  } catch (error) {
    console.log(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return createRouteErrorResponse(500, message);
  }
};
