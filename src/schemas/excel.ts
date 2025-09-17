import { z } from 'zod';

export interface CellChange {
  address: string; // e.g., "A1", "B2"
  value: any;
  userId: string;
  timestamp: number;
}

export interface ExcelData {
  worksheets: {
    [key: string]: {
      cells: {
        [address: string]: {
          value: any;
          formula?: string;
          style?: any;
        };
      };
    };
  };
}

export interface CollaborationState {
  activeUsers: {
    userId: string;
    userName: string;
    currentCell?: string;
    color: string;
  }[];
  pendingChanges: CellChange[];
}

export const excelSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.any(), // ExcelData object
});

export const excelUploadSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  content: z.object({
    worksheets: z.record(
      z.string(),
      z.object({
        cells: z.record(
          z.string(),
          z.object({
            value: z.any().optional(),
            formula: z.string().optional(),
            style: z.any().optional(),
          })
        ),
      })
    ),
  }),
});
