'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ComboBox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  User,
  Calendar,
  Star,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMunicipalities } from '@/hooks/useProjects';
import { useBarangayMapping } from '@/hooks/useBarangayMapping';
import { z } from 'zod';
import { format } from 'date-fns';

interface InterpretedSteward {
  name: string;
  cscNumber: string;
  area: number;
  locationText?: string;
  dateIssued: string;
  dateExpiry: string;
  evaluation: {
    rating: number;
    recommendation?: string;
    ratingRemarks?: string;
    actionTaken?: string;
    generalRemarks?: string;
  };
}

interface MultipleStewardsFormProps {
  stewards: InterpretedSteward[];
  onSuccess: () => void;
  onCancel: () => void;
}

const multipleStewardsSchema = z.object({
  stewards: z.array(
    z.object({
      name: z.string().min(1, 'Name is required'),
      cscNumber: z.string().min(1, 'CSC number is required'),
      area: z.number().min(0.01, 'Area must be greater than 0'),
      dateIssued: z.string().min(1, 'Date issued is required'),
      dateExpiry: z.string().min(1, 'Date expiry is required'),
      barangayId: z.string().min(1, 'Barangay is required'),
      municipalityId: z.string().min(1, 'Municipality is required'),
      evaluation: z.object({
        rating: z.number().min(1).max(100),
        recommendation: z.string().optional(),
        ratingRemarks: z.string().optional(),
        actionTaken: z.string().optional(),
        generalRemarks: z.string().optional(),
      }),
    })
  ),
});

type MultipleStewardsFormData = z.infer<typeof multipleStewardsSchema>;

const MultipleStewardsForm = ({
  stewards,
  onSuccess,
  onCancel,
}: MultipleStewardsFormProps) => {
  const {
    municipalities,
    isLoading: municipalitiesLoading,
    error: municipalitiesError,
  } = useMunicipalities();
  const { searchBarangay } = useBarangayMapping();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creatingStatus, setCreatingStatus] = useState<{
    [key: number]: 'pending' | 'creating' | 'success' | 'error';
  }>({});

  const defaultValues: MultipleStewardsFormData = {
    stewards: stewards.map((steward) => ({
      ...steward,
      barangayId: '',
      municipalityId: '',
    })),
  };

  const form = useForm<MultipleStewardsFormData>({
    resolver: zodResolver(multipleStewardsSchema),
    defaultValues,
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: 'stewards',
  });

  // Auto-assign barangays based on location text
  useEffect(() => {
    if (!municipalitiesLoading && municipalities.length > 0 && searchBarangay) {
      console.log('Attempting to auto-assign barangays for stewards...');
      const formValues = form.getValues();

      formValues.stewards.forEach((steward, index) => {
        if (!steward.barangayId && stewards[index].locationText) {
          const matchedBarangay = searchBarangay(stewards[index].locationText!);
          if (matchedBarangay) {
            console.log(
              `Auto-assigned barangay for steward ${index}:`,
              matchedBarangay
            );
            form.setValue(`stewards.${index}.barangayId`, matchedBarangay.id);

            // Find and set municipality
            const municipality = municipalities.find((m) =>
              m.barangays.some((b) => b.id === matchedBarangay.id)
            );
            if (municipality) {
              form.setValue(
                `stewards.${index}.municipalityId`,
                municipality.id
              );
            }
          }
        }
      });
    }
  }, [municipalitiesLoading, municipalities, searchBarangay, form, stewards]);

  const onSubmit: SubmitHandler<MultipleStewardsFormData> = async (data) => {
    setIsSubmitting(true);
    const newCreatingStatus: {
      [key: number]: 'pending' | 'creating' | 'success' | 'error';
    } = {};

    // Initialize all as pending
    data.stewards.forEach((_, index) => {
      newCreatingStatus[index] = 'pending';
    });
    setCreatingStatus(newCreatingStatus);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < data.stewards.length; i++) {
      const steward = data.stewards[i];

      setCreatingStatus((prev) => ({ ...prev, [i]: 'creating' }));

      try {
        // Create steward
        const stewardResponse = await fetch('/api/steward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: steward.name,
            cscNumber: steward.cscNumber,
            area: steward.area,
            dateIssued: steward.dateIssued,
            dateExpiry: steward.dateExpiry,
            barangayId: steward.barangayId,
            municipalityId: steward.municipalityId,
            geojson: '', // Empty for imported stewards
          }),
        });

        const stewardResult = await stewardResponse.json();

        if (stewardResult.success) {
          // Create evaluation with the correct endpoint
          const evaluationResponse = await fetch(
            `/api/steward/${stewardResult.data.id}/evaluate`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                rating: steward.evaluation.rating,
                recommendation: steward.evaluation.recommendation,
                ratingRemarks: steward.evaluation.ratingRemarks,
                actionTaken: steward.evaluation.actionTaken,
                generalRemarks: steward.evaluation.generalRemarks,
              }),
            }
          );

          const evaluationResult = await evaluationResponse.json();

          if (evaluationResult.success) {
            setCreatingStatus((prev) => ({ ...prev, [i]: 'success' }));
            successCount++;
          } else {
            console.error(
              `Failed to create evaluation for steward ${i}:`,
              evaluationResult
            );
            setCreatingStatus((prev) => ({ ...prev, [i]: 'error' }));
            errorCount++;
          }
        } else {
          console.error(`Failed to create steward ${i}:`, stewardResult);
          setCreatingStatus((prev) => ({ ...prev, [i]: 'error' }));
          errorCount++;
        }
      } catch (error) {
        console.error(`Error creating steward/evaluation ${i}:`, error);
        setCreatingStatus((prev) => ({ ...prev, [i]: 'error' }));
        errorCount++;
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setIsSubmitting(false);

    if (successCount > 0) {
      toast.success(
        `Successfully created ${successCount} steward(s) with evaluations`
      );
    }

    if (errorCount > 0) {
      toast.error(`Failed to create ${errorCount} steward(s)`);
    }

    if (successCount > 0) {
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }
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
          AI has interpreted {stewards.length} steward(s) from your file. Please
          assign the correct barangay for each steward.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6">
            {fields.map((field, index) => {
              const steward = stewards[index];
              const status = creatingStatus[index];
              const currentBarangayId = form.watch(
                `stewards.${index}.barangayId`
              );
              const wasAutoAssigned = currentBarangayId && steward.locationText;

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
                      <User className="h-5 w-5" />
                      {steward.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      CSC: {steward.cscNumber} • Area: {steward.area} ha
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Dates</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(
                            new Date(steward.dateIssued),
                            'MMM dd, yyyy'
                          )}{' '}
                          -{' '}
                          {format(new Date(steward.dateExpiry), 'MMM dd, yyyy')}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Evaluation
                        </p>
                        <p className="font-medium flex items-center gap-1">
                          <Star className="h-4 w-4" />
                          {steward.evaluation.rating}/100
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge
                          variant={
                            new Date(steward.dateExpiry) > new Date()
                              ? 'default'
                              : 'destructive'
                          }
                        >
                          {new Date(steward.dateExpiry) > new Date()
                            ? 'Active'
                            : 'Expired'}
                        </Badge>
                      </div>
                    </div>

                    {steward.locationText && (
                      <div
                        className={`p-4 border rounded-lg ${
                          wasAutoAssigned
                            ? 'bg-green-50 border-green-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <MapPin
                            className={`h-4 w-4 mt-0.5 ${
                              wasAutoAssigned
                                ? 'text-green-600'
                                : 'text-blue-600'
                            }`}
                          />
                          <div>
                            <p
                              className={`text-sm font-medium ${
                                wasAutoAssigned
                                  ? 'text-green-900'
                                  : 'text-blue-900'
                              }`}
                            >
                              {wasAutoAssigned
                                ? 'Auto-matched location:'
                                : 'Location from file:'}
                            </p>
                            <p
                              className={`text-sm ${
                                wasAutoAssigned
                                  ? 'text-green-700'
                                  : 'text-blue-700'
                              }`}
                            >
                              {steward.locationText}
                            </p>
                            {wasAutoAssigned && (
                              <p className="text-xs text-green-600 mt-1">
                                ✓ Automatically assigned barangay
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name={`stewards.${index}.barangayId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Assign Barangay *
                            {wasAutoAssigned && (
                              <span className="text-green-600 text-sm ml-2">
                                (Auto-assigned)
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <ComboBox
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                // Auto-assign municipality
                                const municipality = municipalities.find((m) =>
                                  m.barangays.some((b) => b.id === value)
                                );
                                if (municipality) {
                                  form.setValue(
                                    `stewards.${index}.municipalityId`,
                                    municipality.id
                                  );
                                }
                              }}
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

                    {steward.evaluation.recommendation && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Recommendation</p>
                        <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                          {steward.evaluation.recommendation}
                        </p>
                      </div>
                    )}

                    {(steward.evaluation.ratingRemarks ||
                      steward.evaluation.actionTaken ||
                      steward.evaluation.generalRemarks) && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          Evaluation Details
                        </p>
                        <div className="space-y-2">
                          {steward.evaluation.ratingRemarks && (
                            <div className="p-3 border rounded">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Rating Remarks
                              </p>
                              <p className="text-sm">
                                {steward.evaluation.ratingRemarks}
                              </p>
                            </div>
                          )}
                          {steward.evaluation.actionTaken && (
                            <div className="p-3 border rounded">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Action Taken
                              </p>
                              <p className="text-sm">
                                {steward.evaluation.actionTaken}
                              </p>
                            </div>
                          )}
                          {steward.evaluation.generalRemarks && (
                            <div className="p-3 border rounded">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                General Remarks
                              </p>
                              <p className="text-sm">
                                {steward.evaluation.generalRemarks}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Stewards...
                </>
              ) : (
                `Create ${stewards.length} Steward(s) with Evaluations`
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default MultipleStewardsForm;
