import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import {
  createRouteErrorResponse,
  createRouteSuccessResponse,
  parseValidationIssues,
} from '@/utils/responseHandler';
import { importStewardPrompt } from '@/utils/prompt';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

const interpretedStewardSchema = z.object({
  name: z.string().min(1).max(255),
  cscNumber: z.string().min(1).max(50),
  area: z.number().min(0.01),
  locationText: z.string().optional(),
  dateIssued: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  evaluation: z.object({
    rating: z.number().min(1).max(100),
    recommendation: z.string().optional(),
    ratingRemarks: z.string().optional(),
    actionTaken: z.string().optional(),
    generalRemarks: z.string().optional(),
  }),
});

const importStewardResponseSchema = z.object({
  stewards: z.array(interpretedStewardSchema),
});

function createInterpretStewardsJsonSchema(): any {
  return {
    type: 'object',
    properties: {
      stewards: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              maxLength: 255,
              description: 'Steward full name',
            },
            cscNumber: {
              type: 'string',
              minLength: 1,
              maxLength: 50,
              description: 'Community Stewardship Certificate number',
            },
            area: {
              type: 'number',
              minimum: 0.01,
              description: 'Area in hectares',
            },
            locationText: {
              type: 'string',
              description: 'Raw location text (barangay, municipality, etc.)',
            },
            dateIssued: {
              type: 'string',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$',
              description: 'Date issued in YYYY-MM-DD format',
            },
            dateExpiry: {
              type: 'string',
              pattern: '^\\d{4}-\\d{2}-\\d{2}$',
              description: 'Date expiry in YYYY-MM-DD format',
            },
            evaluation: {
              type: 'object',
              properties: {
                rating: {
                  type: 'number',
                  minimum: 1,
                  maximum: 100,
                  description: 'Evaluation rating (1-100)',
                },
                recommendation: {
                  type: 'string',
                  description: 'Evaluation recommendation',
                },
                ratingRemarks: {
                  type: 'string',
                  description: 'Rating-specific remarks',
                },
                actionTaken: {
                  type: 'string',
                  description: 'Action taken by the region',
                },
                generalRemarks: {
                  type: 'string',
                  description: 'General remarks about the steward',
                },
              },
              required: ['rating'],
            },
          },
          required: [
            'name',
            'cscNumber',
            'area',
            'dateIssued',
            'dateExpiry',
            'evaluation',
          ],
        },
      },
    },
    required: ['stewards'],
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
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: importStewardPrompt(instructions) },
        { role: 'user', content: fileContent },
      ],
      functions: [
        {
          name: 'interpret_stewards',
          description:
            'Interpret and extract steward evaluation data from the provided file content',
          parameters: createInterpretStewardsJsonSchema(),
        },
      ],
      function_call: { name: 'interpret_stewards' },
    });

    const functionCall = completion.choices[0].message.function_call;
    console.log('OpenAI function call response:', functionCall);

    if (!functionCall || !functionCall.arguments) {
      return createRouteErrorResponse(
        500,
        'No steward interpretation response from AI'
      );
    }

    let interpretedData;
    try {
      interpretedData = JSON.parse(functionCall.arguments);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return createRouteErrorResponse(500, 'Failed to parse AI response JSON');
    }

    const validatedResponse =
      importStewardResponseSchema.safeParse(interpretedData);
    if (!validatedResponse.success) {
      console.error('Validation failed:', validatedResponse.error);
      return createRouteErrorResponse(
        400,
        'Invalid AI response structure: ' +
          parseValidationIssues(validatedResponse.error.issues)
      );
    }

    console.log(
      'Successfully interpreted stewards:',
      validatedResponse.data.stewards.length
    );

    return createRouteSuccessResponse(200, validatedResponse.data.stewards);
  } catch (error) {
    console.error('Import steward API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return createRouteErrorResponse(500, message);
  }
};
