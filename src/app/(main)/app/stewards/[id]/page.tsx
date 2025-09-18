'use client';

import React from 'react';
import { useSteward, useStewardEvaluations } from '@/hooks/useStewards';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Star,
  Edit,
  FileText,
  User,
  Award,
  Map,
} from 'lucide-react';
import Link from 'next/link';
import { DASHBOARD_ROUTES } from '@/lib/routes';
import { format } from 'date-fns';
import dynamic from 'next/dynamic';

// Dynamically import map for viewing geojson
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const GeoJSON = dynamic(
  () => import('react-leaflet').then((mod) => mod.GeoJSON),
  { ssr: false }
);

interface StewardPageProps {
  params: Promise<{ id: string }>;
}

const StewardPage = ({ params }: StewardPageProps) => {
  const [id, setId] = React.useState<string>('');

  React.useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  const { steward, isLoading, error } = useSteward(id);
  const { evaluations, isLoading: evaluationsLoading } =
    useStewardEvaluations(id);

  if (error) {
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

  if (isLoading || !steward) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isActive = new Date(steward.dateExpiry) > new Date();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={DASHBOARD_ROUTES.stewards}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Stewards
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {steward.name}
              </h1>
              <Badge variant={isActive ? 'default' : 'destructive'}>
                {isActive ? 'Active' : 'Expired'}
              </Badge>
            </div>
            <p className="text-muted-foreground">CSC: {steward.cscNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/app/stewards/${steward.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Link href={`/app/stewards/${steward.id}/evaluate`}>
            <Button>
              <Star className="h-4 w-4 mr-2" />
              Evaluate
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Steward Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Steward Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Full Name
                  </label>
                  <p className="text-lg font-semibold">{steward.name}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    CSC Number
                  </label>
                  <code className="block text-sm bg-muted px-2 py-1 rounded mt-1">
                    {steward.cscNumber}
                  </code>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Location
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{steward.barangay.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {steward.municipality.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Date Issued
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p>
                      {format(new Date(steward.dateIssued), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Date Expiry
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p>
                      {format(new Date(steward.dateExpiry), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Land Area
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="text-lg">
                      {steward.area.toFixed(2)} hectares
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Land Area Map */}
          {steward.geojson && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  Land Area Mapping
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 rounded-lg overflow-hidden">
                  <MapContainer
                    center={[11.0, 122.5]}
                    zoom={12}
                    style={{ height: '100%', width: '100%' }}
                    className="leaflet-container"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <GeoJSON
                      data={JSON.parse(steward.geojson)}
                      style={() => ({
                        color: '#2563eb',
                        fillColor: '#3b82f6',
                        fillOpacity: 0.3,
                        weight: 2,
                      })}
                    />
                  </MapContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Evaluations Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Evaluations ({steward._count?.Evaluation || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {evaluationsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : evaluations.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No evaluations yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This steward hasn't been evaluated yet.
                  </p>
                  <Link href={`/app/stewards/${steward.id}/evaluate`}>
                    <Button size="sm">
                      <Star className="h-4 w-4 mr-2" />
                      Add First Evaluation
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {evaluations.slice(0, 5).map((evaluation) => (
                    <div key={evaluation.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">
                          Rating: {evaluation.rating}/5
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(
                            new Date(evaluation.createdAt),
                            'MMM dd, yyyy'
                          )}
                        </span>
                      </div>

                      {evaluation.ratingRemarks && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {evaluation.ratingRemarks}
                        </p>
                      )}

                      {evaluation.recommendation && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Recommendation:
                          </p>
                          <p className="text-sm line-clamp-2">
                            {evaluation.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {evaluations.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      And {evaluations.length - 5} more evaluations...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/app/stewards/${steward.id}/evaluate`}>
                <Button className="w-full" size="sm">
                  <Star className="h-4 w-4 mr-2" />
                  New Evaluation
                </Button>
              </Link>
              <Link href={`/app/stewards/${steward.id}/edit`}>
                <Button variant="outline" className="w-full" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Details
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StewardPage;
