'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSteward } from '@/hooks/useStewards';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateStewardSchema, UpdateStewardData } from '@/schemas/steward';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Calendar, MapPin, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import DrawableMap from '@/components/map/DrawableMap';
import Link from 'next/link';
import { DASHBOARD_ROUTES } from '@/lib/routes';

interface EditStewardPageProps {
  params: Promise<{ id: string }>;
}

const EditStewardPage = ({ params }: EditStewardPageProps) => {
  const [id, setId] = React.useState<string>('');
  const router = useRouter();

  React.useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  const {
    steward,
    isLoading: stewardLoading,
    error: stewardError,
  } = useSteward(id);
  const { municipalities, isLoading: municipalitiesLoading } =
    useMunicipalities();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMunicipalityId, setSelectedMunicipalityId] =
    useState<string>('');

  const form = useForm<UpdateStewardData>({
    resolver: zodResolver(updateStewardSchema),
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

  // Set form values when steward data loads
  React.useEffect(() => {
    if (steward) {
      form.reset({
        name: steward.name,
        dateIssued: new Date(steward.dateIssued).toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        dateExpiry: new Date(steward.dateExpiry).toISOString().split('T')[0],
        cscNumber: steward.cscNumber,
        area: steward.area,
        geojson: steward.geojson || '',
        barangayId: steward.barangay.id,
        municipalityId: steward.municipality.id,
      });
      setSelectedMunicipalityId(steward.municipality.id);
    }
  }, [steward, form]);

  const onSubmit = async (data: UpdateStewardData) => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/steward/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Steward updated successfully');
        router.push(`/app/stewards/${id}`);
      } else {
        toast.error(result.error || 'Failed to update steward');
        if (result.details) {
          console.error('Validation errors:', result.details);
        }
      }
    } catch (error) {
      console.error('Error updating steward:', error);
      toast.error('An error occurred while updating the steward');
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

  if (stewardError) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">
              Failed to load steward data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stewardLoading || municipalitiesLoading || !steward) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/app/stewards/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Steward
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Steward</h1>
            <p className="text-muted-foreground">
              Update steward information and land area mapping
            </p>
          </div>
        </div>
      </div>

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
                      <Input
                        placeholder="Enter steward's full name"
                        {...field}
                      />
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
                Draw a polygon on the map to define the steward's land
                boundaries. The area will be automatically calculated.
              </p>
            </CardHeader>
            <CardContent>
              <DrawableMap
                onGeoJsonChange={handleGeoJsonChange}
                onAreaChange={handleAreaChange}
                initialGeoJson={steward.geojson}
                height="500px"
              />

              {(form.watch('area') || 0) > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✓ Land area mapped:{' '}
                    <strong>{form.watch('area') || 0} hectares</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Link href={`/app/stewards/${id}`}>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Steward'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EditStewardPage;
