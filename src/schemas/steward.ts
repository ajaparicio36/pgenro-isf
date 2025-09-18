import { z } from 'zod';

// Steward creation schema
export const createStewardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  dateIssued: z.string().min(1, 'Date issued is required'),
  dateExpiry: z.string().min(1, 'Date expiry is required'),
  cscNumber: z.string().min(1, 'CSC number is required').max(50),
  area: z.number().min(0.01, 'Area must be greater than 0'),
  geojson: z.string().optional(), // Will be parsed as JSON string
  barangayId: z.string().min(1, 'Barangay is required'),
  municipalityId: z.string().min(1, 'Municipality is required'),
});

// Steward update schema (all fields optional except id)
export const updateStewardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  dateIssued: z.string().min(1, 'Date issued is required').optional(),
  dateExpiry: z.string().min(1, 'Date expiry is required').optional(),
  cscNumber: z.string().min(1, 'CSC number is required').max(50).optional(),
  area: z.number().min(0.01, 'Area must be greater than 0').optional(),
  geojson: z.string().optional(),
  barangayId: z.string().min(1, 'Barangay is required').optional(),
  municipalityId: z.string().min(1, 'Municipality is required').optional(),
});

// Evaluation creation schema
export const createEvaluationSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, 'Rating must be at least 1')
    .max(100, 'Rating must be at most 100'),
  recommendation: z.string().optional(),
  ratingRemarks: z.string().optional(),
  actionTaken: z.string().optional(),
  generalRemarks: z.string().optional(),
  stewardId: z.string().min(1, 'Steward ID is required'),
});

export type CreateStewardData = z.infer<typeof createStewardSchema>;
export type UpdateStewardData = z.infer<typeof updateStewardSchema>;
export type CreateEvaluationData = z.infer<typeof createEvaluationSchema>;

// Response interfaces
export interface StewardResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    dateIssued: Date;
    dateExpiry: Date;
    cscNumber: string;
    area: number;
    geojson: string | null;
    barangay: {
      id: string;
      name: string;
      officialCode: string;
    };
    municipality: {
      id: string;
      name: string;
      code: string;
    };
    createdAt: Date;
    updatedAt: Date;
    _count?: {
      Evaluation: number;
    };
  };
}

export interface StewardListResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    dateIssued: Date;
    dateExpiry: Date;
    cscNumber: string;
    area: number;
    barangay: {
      id: string;
      name: string;
    };
    municipality: {
      id: string;
      name: string;
    };
    createdAt: Date;
    _count: {
      Evaluation: number;
    };
  }[];
  totalPages?: number;
  totalStewards?: number;
  currentPage?: number;
}

export interface EvaluationResponse {
  success: boolean;
  data: {
    id: string;
    rating: number;
    recommendation: string | null;
    ratingRemarks: string | null;
    actionTaken: string | null;
    generalRemarks: string | null;
    steward: {
      id: string;
      name: string;
      cscNumber: string;
    };
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface EvaluationListResponse {
  success: boolean;
  data: {
    id: string;
    rating: number;
    recommendation: string | null;
    ratingRemarks: string | null;
    actionTaken: string | null;
    generalRemarks: string | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
}
