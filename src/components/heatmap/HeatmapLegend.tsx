'use client';

import React from 'react';
import { HeatmapCategory } from '@/schemas/heatmap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HeatmapLegendProps {
  category: HeatmapCategory;
  metadata: {
    totalBarangays: number;
    dateRange: {
      earliest: string;
      latest: string;
    };
    valueRange: {
      min: number;
      max: number;
    };
  } | null;
}

const HeatmapLegend = ({ category, metadata }: HeatmapLegendProps) => {
  const formatValue = (value: number) => {
    if (category === HeatmapCategory.TOTAL_COST && value >= 1000000) {
      return `₱${(value / 1000000).toFixed(1)}M`;
    }
    if (category === HeatmapCategory.TOTAL_COST && value >= 1000) {
      return `₱${(value / 1000).toFixed(1)}K`;
    }
    if (category === HeatmapCategory.AREA_DEVELOPED) {
      return `${value.toFixed(1)} ha`;
    }
    if (category === HeatmapCategory.RECENTNESS) {
      return `${value.toFixed(0)}%`;
    }
    return value.toString();
  };

  const getCategoryLabel = () => {
    switch (category) {
      case HeatmapCategory.RECENTNESS:
        return 'Project Recentness';
      case HeatmapCategory.AREA_DEVELOPED:
        return 'Area Developed';
      case HeatmapCategory.TOTAL_COST:
        return 'Total Cost';
      default:
        return 'Heat Intensity';
    }
  };

  const getCategoryDescription = () => {
    switch (category) {
      case HeatmapCategory.RECENTNESS:
        return 'Warmer colors indicate more recent projects';
      case HeatmapCategory.AREA_DEVELOPED:
        return 'Warmer colors indicate larger developed areas';
      case HeatmapCategory.TOTAL_COST:
        return 'Warmer colors indicate higher total project costs';
      default:
        return 'Heat intensity visualization';
    }
  };

  if (!metadata) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{getCategoryLabel()}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          {getCategoryDescription()}
        </p>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Low</span>
            <span>High</span>
          </div>
          <div
            className="h-4 rounded"
            style={{
              background:
                'linear-gradient(to right, #3b82f6, #10b981, #f59e0b, #ef4444, #dc2626)',
            }}
          />
          <div className="flex justify-between text-xs font-mono">
            <span>{formatValue(metadata.valueRange.min)}</span>
            <span>{formatValue(metadata.valueRange.max)}</span>
          </div>
        </div>

        <div className="pt-2 border-t space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Total Barangays:</span>
            <span className="font-mono">{metadata.totalBarangays}</span>
          </div>
          <div className="flex justify-between">
            <span>Date Range:</span>
            <span className="font-mono">
              {metadata.dateRange.earliest} - {metadata.dateRange.latest}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HeatmapLegend;
