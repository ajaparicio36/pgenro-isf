'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ComboBox } from '@/components/ui/combobox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  MapPin,
  DollarSign,
  Package,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMunicipalities } from '@/hooks/useProjects';
import { z } from 'zod';

interface InterpretedProject {
  title: string;
  projectCode?: string;
  startDate: string;
  endDate?: string;
  totalAreaDeveloped?: number;
  description?: string;
  totalProjectCost?: number;
  locationText?: string;
  components: {
    componentTitle: string;
    componentDescription?: string;
    componentCost: number;
  }[];
  attachmentUrls?: string[];
}

interface MultipleProjectsFormProps {
  projects: InterpretedProject[];
  onSuccess: () => void;
  onCancel: () => void;
}

const multipleProjectsSchema = z.object({
  projects: z.array(
    z.object({
      title: z.string().min(1, 'Title is required'),
      projectCode: z.string().optional(),
      startDate: z.string().min(4, 'Start date is required'),
      endDate: z.string().optional(),
      totalAreaDeveloped: z.number().min(0).optional(),
      description: z.string().optional(),
      totalProjectCost: z.number().min(0).optional(),
      barangayId: z.string().min(1, 'Barangay is required'),
      components: z
        .array(
          z.object({
            componentTitle: z.string().min(1),
            componentDescription: z.string().optional(),
            componentCost: z.number().min(0),
          })
        )
        .min(1),
      attachmentUrls: z.array(z.string().url()).optional(),
    })
  ),
});

type MultipleProjectsFormData = z.infer<typeof multipleProjectsSchema>;

const MultipleProjectsForm = ({
  projects,
  onSuccess,
  onCancel,
}: MultipleProjectsFormProps) => {
  const { municipalities, isLoading: municipalitiesLoading } =
    useMunicipalities();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creatingStatus, setCreatingStatus] = useState<{
    [key: number]: 'pending' | 'creating' | 'success' | 'error';
  }>({});

  const form = useForm<MultipleProjectsFormData>({
    resolver: zodResolver(multipleProjectsSchema),
    defaultValues: {
      projects: projects.map((project) => ({
        ...project,
        barangayId: '',
        totalAreaDeveloped: project.totalAreaDeveloped || undefined,
        totalProjectCost: project.totalProjectCost || undefined,
      })),
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'projects',
  });

  const onSubmit = async (data: MultipleProjectsFormData) => {
    setIsSubmitting(true);
    const newCreatingStatus: {
      [key: number]: 'pending' | 'creating' | 'success' | 'error';
    } = {};

    // Initialize all as pending
    data.projects.forEach((_, index) => {
      newCreatingStatus[index] = 'pending';
    });
    setCreatingStatus(newCreatingStatus);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < data.projects.length; i++) {
      const project = data.projects[i];

      // Update status to creating
      setCreatingStatus((prev) => ({ ...prev, [i]: 'creating' }));

      try {
        const response = await fetch('/api/project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(project),
        });

        const result = await response.json();

        if (result.success) {
          setCreatingStatus((prev) => ({ ...prev, [i]: 'success' }));
          successCount++;
        } else {
          setCreatingStatus((prev) => ({ ...prev, [i]: 'error' }));
          errorCount++;
        }
      } catch (error) {
        setCreatingStatus((prev) => ({ ...prev, [i]: 'error' }));
        errorCount++;
      }

      // Small delay to show progress
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setIsSubmitting(false);

    if (successCount > 0) {
      toast.success(`Successfully created ${successCount} project(s)`);
    }

    if (errorCount > 0) {
      toast.error(`Failed to create ${errorCount} project(s)`);
    }

    if (successCount > 0) {
      // Wait a bit to show final status, then close
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const getStatusIcon = (
    status: 'pending' | 'creating' | 'success' | 'error'
  ) => {
    switch (status) {
      case 'creating':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Prepare combobox groups for municipalities and barangays
  const locationGroups = municipalities.map((municipality) => ({
    label: municipality.name,
    options: municipality.barangays.map((barangay) => ({
      value: barangay.id,
      label: barangay.name,
    })),
  }));

  if (municipalitiesLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading municipalities...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Review & Assign Locations</h2>
        <p className="text-muted-foreground">
          AI has interpreted {projects.length} project(s) from your file. Please
          assign the correct barangay for each project.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6">
            {fields.map((field, index) => {
              const project = projects[index];
              const status = creatingStatus[index];
              const totalComponentCost = project.components.reduce(
                (sum, comp) => sum + comp.componentCost,
                0
              );

              return (
                <Card key={field.id} className="relative">
                  {status && (
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      {getStatusIcon(status)}
                      <Badge
                        variant={
                          status === 'success'
                            ? 'default'
                            : status === 'error'
                              ? 'destructive'
                              : status === 'creating'
                                ? 'secondary'
                                : 'outline'
                        }
                      >
                        {status === 'creating'
                          ? 'Creating...'
                          : status === 'success'
                            ? 'Created'
                            : status === 'error'
                              ? 'Failed'
                              : 'Pending'}
                      </Badge>
                    </div>
                  )}

                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 pr-20">
                      <Package className="h-5 w-5" />
                      {project.title}
                    </CardTitle>
                    {project.projectCode && (
                      <p className="text-sm text-muted-foreground">
                        Code: {project.projectCode}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Timeline
                        </p>
                        <p className="font-medium">
                          {project.startDate}
                          {project.endDate && ` - ${project.endDate}`}
                        </p>
                      </div>

                      {project.totalProjectCost && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Total Cost
                          </p>
                          <p className="font-medium flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {formatCurrency(project.totalProjectCost)}
                          </p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Components
                        </p>
                        <p className="font-medium">
                          {project.components.length} components
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total: {formatCurrency(totalComponentCost)}
                        </p>
                      </div>
                    </div>

                    {project.locationText && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">
                              Location from file:
                            </p>
                            <p className="text-sm text-blue-700">
                              {project.locationText}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name={`projects.${index}.barangayId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assign Barangay *</FormLabel>
                          <FormControl>
                            <ComboBox
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Select the correct barangay"
                              searchPlaceholder="Search municipalities or barangays..."
                              groups={locationGroups}
                              disabled={isSubmitting}
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {project.description && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Description</p>
                        <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                          {project.description}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Components</p>
                      <div className="space-y-2">
                        {project.components.map((component, compIndex) => (
                          <div
                            key={compIndex}
                            className="flex justify-between items-start p-3 border rounded"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {component.componentTitle}
                              </p>
                              {component.componentDescription && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {component.componentDescription}
                                </p>
                              )}
                            </div>
                            <p className="font-medium text-sm">
                              {formatCurrency(component.componentCost)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || municipalitiesLoading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Projects...
                </>
              ) : (
                `Create ${projects.length} Project(s)`
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default MultipleProjectsForm;
