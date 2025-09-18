'use client';

import React, { useState } from 'react';
import { HeatmapCategory, HeatmapFilterData } from '@/schemas/heatmap';
import { useHeatmap } from '@/hooks/useHeatmap';
import HeatmapFilters from '@/components/heatmap/HeatmapFilters';
import HeatmapLegend from '@/components/heatmap/HeatmapLegend';
import MapComponent from '@/components/map/MapComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import 'leaflet/dist/leaflet.css';

const DashboardPage = () => {
  const [filters, setFilters] = useState<HeatmapFilterData>({
    category: HeatmapCategory.RECENTNESS,
  });

  const { heatmapData, metadata, isLoading, error } = useHeatmap(filters);

  const handleFiltersChange = (newFilters: HeatmapFilterData) => {
    setFilters(newFilters);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Project Heatmap Dashboard
          </h1>
          <p className="text-muted-foreground">
            Visualize project distribution and intensity across barangays
          </p>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">
              Failed to load heatmap data. Please try again later.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <HeatmapFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
          <HeatmapLegend category={filters.category} metadata={metadata} />
        </div>

        <div className="lg:col-span-3">
          <MapComponent heatmapData={heatmapData} isLoading={isLoading} />
        </div>
      </div>

      {/* Summary Statistics */}
      {metadata && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Barangays
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metadata.totalBarangays}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Date Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metadata.dateRange.earliest} - {metadata.dateRange.latest}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {heatmapData.reduce(
                  (sum, point) => sum + point.projectCount,
                  0
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Value Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {metadata.valueRange.min.toFixed(0)} -{' '}
                {metadata.valueRange.max.toFixed(0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
