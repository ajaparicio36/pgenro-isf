import { z } from 'zod';

export const projectComponentSchema = z.object({
  componentTitle: z.string().min(1, 'Component title is required').max(255),
  componentDescription: z.string().optional(),
  componentCost: z.number().min(0, 'Component cost must be positive'),
});

export const createProjectSchema = z.object({
  title: z.string().min(1, 'Project title is required').max(255),
  projectCode: z.string().optional(),
  startDate: z.string().min(4, 'Start date is required'),
  endDate: z.string().optional(),
  totalAreaDeveloped: z.number().min(0).optional(),
  description: z.string().optional(),
  totalProjectCost: z.number().min(0).optional(),
  barangayId: z.string().min(1, 'Barangay is required'),
  components: z
    .array(projectComponentSchema)
    .min(1, 'At least one component is required'),
  attachmentUrls: z.array(z.string().url()).optional(),
});

export const editProjectSchema = z.object({
  title: z.string().min(1, 'Project title is required').max(255).optional(),
  projectCode: z.string().optional(),
  startDate: z.string().min(4, 'Start date is required').optional(),
  endDate: z.string().optional(),
  totalAreaDeveloped: z.number().min(0).optional(),
  description: z.string().optional(),
  totalProjectCost: z.number().min(0).optional(),
  barangayId: z.string().min(1, 'Barangay is required').optional(),
  components: z
    .array(projectComponentSchema)
    .min(1, 'At least one component is required')
    .optional(),
  attachmentUrls: z.array(z.string().url()).optional(),
});

export type CreateProjectData = z.infer<typeof createProjectSchema>;
export type EditProjectData = z.infer<typeof editProjectSchema>;
export type ProjectComponentData = z.infer<typeof projectComponentSchema>;

export interface ProjectResponse {
  success: boolean;
  data: {
    id: string;
    title: string;
    projectCode: string | null;
    startDate: string;
    endDate: string | null;
    totalAreaDeveloped: number | null;
    status: string;
    description: string | null;
    totalProjectCost: number | null;
    createdAt: Date;
    barangay: {
      id: string;
      name: string;
      municipality: {
        id: string;
        name: string;
        code: string;
      };
    };
    components: {
      id: string;
      componentTitle: string;
      componentDescription: string | null;
      componentCost: number;
    }[];
    attachments: {
      id: string;
      url: string;
      uploadedAt: Date;
    }[];
  };
}

export interface ProjectListResponse {
  success: boolean;
  data: {
    id: string;
    title: string;
    projectCode: string | null;
    startDate: string;
    endDate: string | null;
    status: string;
    totalProjectCost: number | null;
    createdAt: Date;
    barangay: {
      id: string;
      name: string;
      municipality: {
        name: string;
      };
    };
    _count: {
      components: number;
      attachments: number;
    };
  }[];
}

export interface MunicipalityResponse {
  success: boolean;
  data: {
    id: string;
    name: string;
    code: string;
    barangays: {
      id: string;
      name: string;
      officialCode: string;
    }[];
  }[];
}

export interface ComponentResponse {
  success: boolean;
  data: {
    id: string;
    componentTitle: string;
  }[];
}
