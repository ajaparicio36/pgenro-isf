'use client';

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { HeatmapDataPoint } from '@/schemas/heatmap';
import {
  loadBarangayShapefile,
  ShapefileData,
  BarangayGeometry,
} from '@/utils/shapefileLoader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle } from 'lucide-react';
import { useBarangayMapping } from '@/hooks/useBarangayMapping';
import type { PathOptions } from 'leaflet';
import type { Feature, Geometry } from 'geojson';

// Dynamically import Leaflet components to avoid SSR issues
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

interface LeafletMapProps {
  heatmapData: HeatmapDataPoint[];
  isLoading: boolean;
}

// Philippines/Panay Island bounds
const PANAY_BOUNDS = {
  center: [11.0, 122.5] as [number, number],
  zoom: 9,
  maxBounds: [
    [9.5, 120.0],
    [13.0, 125.0],
  ] as [[number, number], [number, number]],
};

const LeafletMap = ({ heatmapData, isLoading }: LeafletMapProps) => {
  const [shapefileData, setShapefileData] = useState<ShapefileData | null>(
    null
  );
  const [loadingShapefile, setLoadingShapefile] = useState(true);
  const [shapefileError, setShapefileError] = useState<string | null>(null);
  const [selectedBarangay, setSelectedBarangay] =
    useState<HeatmapDataPoint | null>(null);
  const {
    getBarangayByCode,
    getBarangayByName,
    getMunicipalityFromBarangayCode,
  } = useBarangayMapping();

  // Load shapefile data with better error handling
  useEffect(() => {
    const loadShapefile = async () => {
      try {
        console.log('LeafletMap: Starting shapefile load...');
        setLoadingShapefile(true);
        setShapefileError(null);

        const data = await loadBarangayShapefile();
        console.log('LeafletMap: Shapefile loaded successfully', {
          featuresCount: data.features.length,
        });

        setShapefileData(data);
      } catch (error) {
        console.error('LeafletMap: Error loading shapefile:', error);
        setShapefileError(
          error instanceof Error
            ? error.message
            : 'Failed to load barangay boundaries'
        );
      } finally {
        setLoadingShapefile(false);
      }
    };

    loadShapefile();
  }, []);

  // Create intensity lookup map
  const intensityMap = useMemo(() => {
    const map = new Map<string, HeatmapDataPoint>();
    heatmapData.forEach((point) => {
      map.set(point.barangayId, point);
    });
    console.log('LeafletMap: Created intensity map with', map.size, 'entries');
    return map;
  }, [heatmapData]);

  // Enhanced matching function with municipality code lookup
  const findMatchingPoint = useMemo(() => {
    return (feature: BarangayGeometry) => {
      const officialCode = feature.properties.adm4_psgc;
      const barangayName = feature.properties.adm4_en;

      // Get municipality name from barangay code
      const municipalityName = getMunicipalityFromBarangayCode(officialCode);

      console.log('Matching feature:', {
        barangayName,
        officialCode,
        resolvedMunicipality: municipalityName,
      });

      // First try to match by official code (most accurate)
      let matchingPoint = heatmapData.find((point) => {
        const barangayInfo = getBarangayByCode(officialCode);
        return barangayInfo && barangayInfo.id === point.barangayId;
      });

      // If no match by code, try by name and resolved municipality
      if (!matchingPoint && municipalityName) {
        matchingPoint = heatmapData.find((point) => {
          const barangayMatch = getBarangayByName(
            barangayName,
            municipalityName
          );
          return barangayMatch && barangayMatch.id === point.barangayId;
        });
      }

      // If still no match, try by name only (less accurate)
      if (!matchingPoint) {
        matchingPoint = heatmapData.find((point) => {
          return (
            point.barangayName.toLowerCase() === barangayName.toLowerCase()
          );
        });
      }

      return matchingPoint;
    };
  }, [
    heatmapData,
    getBarangayByCode,
    getBarangayByName,
    getMunicipalityFromBarangayCode,
  ]);

  // Enhanced feature enrichment function
  const enrichFeatureWithMunicipality = (feature: BarangayGeometry) => {
    const officialCode = feature.properties.adm4_psgc;
    const municipalityName = getMunicipalityFromBarangayCode(officialCode);

    return {
      ...feature,
      properties: {
        ...feature.properties,
        adm3_en: municipalityName || 'Unknown Municipality',
      },
    };
  };

  // Get intensity color with better visibility
  const getIntensityColor = (intensity: number) => {
    if (intensity <= 20) return '#3b82f6'; // Blue
    if (intensity <= 40) return '#10b981'; // Green
    if (intensity <= 60) return '#f59e0b'; // Orange
    if (intensity <= 80) return '#ef4444'; // Red
    return '#dc2626'; // Dark red
  };

  // Style function with better defaults
  const getFeatureStyle = (feature?: Feature<Geometry, any>): PathOptions => {
    const defaultStyle: PathOptions = {
      fillColor: '#e5e7eb',
      weight: 1,
      opacity: 0.8,
      color: '#6b7280',
      fillOpacity: 0.5,
    };

    if (!feature?.properties) {
      return defaultStyle;
    }

    try {
      const barangayFeature = feature as unknown as BarangayGeometry;
      const matchingPoint = findMatchingPoint(barangayFeature);
      const intensity = matchingPoint?.intensity || 0;
      const hasData = !!matchingPoint;

      if (hasData) {
        return {
          fillColor: getIntensityColor(intensity),
          weight: 2,
          opacity: 1,
          color: '#374151',
          fillOpacity: 0.7,
        };
      } else {
        // Style for barangays without data - make them visible but muted
        return {
          fillColor: '#f9fafb',
          weight: 1,
          opacity: 0.6,
          color: '#d1d5db',
          fillOpacity: 0.3,
        };
      }
    } catch (error) {
      console.warn('Error styling feature:', error);
      return defaultStyle;
    }
  };

  // Event handler with enhanced municipality lookup
  const onEachFeature = (feature: Feature<Geometry, any>, layer: any) => {
    if (!feature?.properties) {
      console.warn('Feature missing properties:', feature);
      return;
    }

    try {
      const barangayFeature = feature as unknown as BarangayGeometry;
      const enrichedFeature = enrichFeatureWithMunicipality(barangayFeature);
      const matchingPoint = findMatchingPoint(barangayFeature);

      const tooltipContent = matchingPoint
        ? `
          <div class="p-3 min-w-48">
            <h4 class="font-semibold text-sm mb-1">${matchingPoint.barangayName}</h4>
            <p class="text-xs text-gray-600 mb-2">${matchingPoint.municipalityName}</p>
            <div class="space-y-1">
              <div class="flex justify-between text-xs">
                <span>Projects:</span>
                <span class="font-medium">${matchingPoint.projectCount}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span>Intensity:</span>
                <span class="font-medium">${matchingPoint.intensity}%</span>
              </div>
            </div>
          </div>
        `
        : `
          <div class="p-3">
            <h4 class="font-semibold text-sm mb-1">${barangayFeature.properties.adm4_en || 'Unknown'}</h4>
            <p class="text-xs text-gray-600 mb-1">${enrichedFeature.properties.adm3_en}</p>
            <p class="text-xs text-gray-500">No project data available</p>
            <p class="text-xs text-gray-400 mt-1">Code: ${barangayFeature.properties.adm4_psgc}</p>
          </div>
        `;

      layer.bindTooltip(tooltipContent, {
        permanent: false,
        direction: 'top',
        className:
          'custom-tooltip bg-white border border-gray-200 rounded-lg shadow-lg',
        opacity: 1,
        sticky: true,
      });

      layer.on('click', () => {
        if (matchingPoint) {
          setSelectedBarangay(matchingPoint);
        } else {
          // Show debug info for unmatched features
          console.log('Clicked unmatched feature:', {
            name: barangayFeature.properties.adm4_en,
            code: barangayFeature.properties.adm4_psgc,
            resolvedMunicipality: enrichedFeature.properties.adm3_en,
            availableHeatmapBarangays: heatmapData
              .map((h) => ({
                name: h.barangayName,
                municipality: h.municipalityName,
              }))
              .slice(0, 5),
          });
        }
      });

      layer.on('mouseover', (e: any) => {
        const currentLayer = e.target;
        currentLayer.setStyle({
          weight: 3,
          fillOpacity: 0.9,
          color: '#1f2937',
        });
        currentLayer.bringToFront();
      });

      layer.on('mouseout', (e: any) => {
        const currentLayer = e.target;
        const style = getFeatureStyle(feature);
        currentLayer.setStyle(style);
      });
    } catch (error) {
      console.warn('Error setting up feature interactions:', error);
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('LeafletMap state:', {
      isLoading,
      loadingShapefile,
      hasShapefileData: !!shapefileData,
      shapefileFeatures: shapefileData?.features.length,
      heatmapDataCount: heatmapData.length,
      shapefileError,
    });
  }, [
    isLoading,
    loadingShapefile,
    shapefileData,
    heatmapData.length,
    shapefileError,
  ]);

  const geoJsonKey = useMemo(() => {
    return `geojson-${heatmapData.length}-${shapefileData?.features.length || 0}`;
  }, [heatmapData.length, shapefileData?.features.length]);

  // Loading state
  if (isLoading || loadingShapefile) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">
              {loadingShapefile
                ? 'Loading map boundaries...'
                : 'Loading heatmap data...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (shapefileError) {
    return (
      <Card className="h-96 border-destructive">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
            <p className="text-destructive">{shapefileError}</p>
            <p className="text-sm text-muted-foreground">
              Make sure the province_barangays.json file is accessible at
              /data/province_barangays.json
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No shapefile data
  if (!shapefileData) {
    return (
      <Card className="h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">No boundary data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  console.log(
    'Rendering map with shapefile features:',
    shapefileData.features.length
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div className="relative h-96 rounded-lg overflow-hidden">
            <MapContainer
              center={PANAY_BOUNDS.center}
              zoom={PANAY_BOUNDS.zoom}
              maxBounds={PANAY_BOUNDS.maxBounds}
              maxBoundsViscosity={1.0}
              style={{ height: '100%', width: '100%' }}
              className="leaflet-container"
              preferCanvas={false}
              zoomControl={true}
              scrollWheelZoom={true}
              doubleClickZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={15}
                minZoom={7}
              />

              {shapefileData && shapefileData.features.length > 0 && (
                <GeoJSON
                  key={geoJsonKey}
                  data={shapefileData}
                  style={getFeatureStyle}
                  onEachFeature={onEachFeature}
                  interactive={true}
                />
              )}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeafletMap;
