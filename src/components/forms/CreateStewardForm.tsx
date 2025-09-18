'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createStewardSchema, CreateStewardData } from '@/schemas/steward';
import { useMunicipalities } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Loader2, Calendar, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import DrawableMap from '@/components/map/DrawableMap';

interface CreateStewardFormProps {
  onSuccess?: () => void;
}

const CreateStewardForm = ({ onSuccess }: CreateStewardFormProps) => {
  const { municipalities, isLoading: municipalitiesLoading } =
    useMunicipalities();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMunicipalityId, setSelectedMunicipalityId] =
    useState<string>('');

  const form = useForm<CreateStewardData>({
    resolver: zodResolver(createStewardSchema),
    defaultValues: {
      name: '',
      dateIssued: '',
      dateExpiry: '',
      cscNumber: '',
      area: 0,
      geojson: '',
      barangayId: '',
      municipalityId: '',
    },
  });

  const onSubmit = async (data: CreateStewardData) => {
    setIsSubmitting(true);
    try {
      console.log(data.geojson?.toString());
      const response = await fetch('/api/steward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Steward created successfully');
        form.reset();
        onSuccess?.();
      } else {
        toast.error(result.error || 'Failed to create steward');
        if (result.details) {
          console.error('Validation errors:', result.details);
        }
      }
    } catch (error) {
      console.error('Error creating steward:', error);
      toast.error('An error occurred while creating the steward');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeoJsonChange = (geoJson: string | null) => {
    form.setValue('geojson', geoJson || '');
  };

  const handleAreaChange = (area: number) => {
    form.setValue('area', area);
  };

  const handleBarangayChange = (barangayId: string) => {
    form.setValue('barangayId', barangayId);

    // Find the municipality for this barangay
    const municipality = municipalities.find((m) =>
      m.barangays.some((b) => b.id === barangayId)
    );

    if (municipality) {
      form.setValue('municipalityId', municipality.id);
      setSelectedMunicipalityId(municipality.id);
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
          <span className="text-lg">Loading form data...</span>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Steward Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Steward Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter steward's full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cscNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CSC Number *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter Community Stewardship Certificate number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="barangayId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location (Barangay) *</FormLabel>
                  <FormControl>
                    <ComboBox
                      value={field.value}
                      onValueChange={handleBarangayChange}
                      placeholder="Select barangay location"
                      searchPlaceholder="Search municipalities or barangays..."
                      groups={locationGroups}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateIssued"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date Issued *
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date Expiry *
                    </FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Area (hectares)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Area will be calculated from map"
                      readOnly
                      {...field}
                      value={field.value || ''}
                      className="bg-muted"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Land Area Mapping</CardTitle>
            <p className="text-sm text-muted-foreground">
              Draw a polygon on the map to define the steward's land boundaries.
              The area will be automatically calculated.
            </p>
          </CardHeader>
          <CardContent>
            <DrawableMap
              onGeoJsonChange={handleGeoJsonChange}
              onAreaChange={handleAreaChange}
              height="500px"
            />

            {form.watch('area') > 0 && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ Land area mapped:{' '}
                  <strong>{form.watch('area')} hectares</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSubmitting}
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || municipalitiesLoading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Steward'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateStewardForm;
