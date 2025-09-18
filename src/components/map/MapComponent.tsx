'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { HeatmapDataPoint } from '@/schemas/heatmap';

// Dynamically import LeafletMap to avoid SSR issues
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    </div>
  ),
});

interface MapComponentProps {
  heatmapData: HeatmapDataPoint[];
  isLoading: boolean;
}

const MapComponent = ({ heatmapData, isLoading }: MapComponentProps) => {
  return <LeafletMap heatmapData={heatmapData} isLoading={isLoading} />;
};

export default MapComponent;
