'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Trash2, RotateCcw } from 'lucide-react';
import * as L from 'leaflet';
import 'leaflet-draw';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const FeatureGroup = dynamic(
  () => import('react-leaflet').then((mod) => mod.FeatureGroup),
  { ssr: false }
);

// Import Leaflet Draw
const EditControl = dynamic(
  () => import('react-leaflet-draw').then((mod) => mod.EditControl),
  { ssr: false }
);

interface DrawableMapProps {
  onGeoJsonChange?: (geojson: string | null) => void;
  onAreaChange?: (area: number) => void;
  initialGeoJson?: string | null;
  height?: string;
}

// Philippines/Panay Island bounds
const PANAY_BOUNDS = {
  center: [11.0, 122.5] as [number, number],
  zoom: 10,
  maxBounds: [
    [9.5, 120.0],
    [13.0, 125.0],
  ] as [[number, number], [number, number]],
};

const DrawableMap = ({
  onGeoJsonChange,
  onAreaChange,
  initialGeoJson,
  height = '400px',
}: DrawableMapProps) => {
  const [isClient, setIsClient] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [drawnItems, setDrawnItems] = useState<L.FeatureGroup | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    setIsClient(true);

    // Load Leaflet and Leaflet Draw
    const loadLeaflet = async () => {
      if (typeof window !== 'undefined') {
        const L = (await import('leaflet')).default;
        await import('leaflet-draw');

        // Fix for default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: '/leaflet/marker-icon-2x.png',
          iconUrl: '/leaflet/marker-icon.png',
          shadowUrl: '/leaflet/marker-shadow.png',
        });

        setLeafletLoaded(true);
      }
    };

    loadLeaflet();
  }, []);

  const calculateArea = useCallback((layer: L.Layer) => {
    if (typeof window === 'undefined') return 0;

    try {
      const geoJson = (layer as any).toGeoJSON();

      if (geoJson.geometry.type === 'Polygon') {
        // Simple area calculation in hectares
        // This is approximate - for production use a proper geodesic calculation
        const coords = geoJson.geometry.coordinates[0];
        let area = 0;

        for (let i = 0; i < coords.length - 1; i++) {
          const [x1, y1] = coords[i];
          const [x2, y2] = coords[i + 1];
          area += x1 * y2 - x2 * y1;
        }

        // Convert to hectares (very rough approximation)
        area = ((Math.abs(area) / 2) * 111000 * 111000) / 10000;
        return Math.round(area * 100) / 100;
      }
    } catch (error) {
      console.error('Error calculating area:', error);
    }

    return 0;
  }, []);

  const handleCreated = useCallback(
    (e: any) => {
      if (!drawnItems) return;

      const layer = e.layer;
      drawnItems.addLayer(layer);

      // Clear previous drawings (only allow one polygon)
      drawnItems.eachLayer((existingLayer: L.Layer) => {
        if (existingLayer !== layer) {
          drawnItems.removeLayer(existingLayer);
        }
      });

      const geoJson = (layer as any).toGeoJSON();
      const area = calculateArea(layer);

      onGeoJsonChange && onGeoJsonChange(JSON.stringify(geoJson));
      onAreaChange && onAreaChange(area);
    },
    [drawnItems, calculateArea, onGeoJsonChange, onAreaChange]
  );

  const handleEdited = useCallback(
    (e: any) => {
      const layers = e.layers;
      layers.eachLayer((layer: L.Layer) => {
        const geoJson = (layer as any).toGeoJSON();
        const area = calculateArea(layer);

        onGeoJsonChange && onGeoJsonChange(JSON.stringify(geoJson));
        onAreaChange && onAreaChange(area);
      });
    },
    [calculateArea, onGeoJsonChange, onAreaChange]
  );

  const handleDeleted = useCallback(() => {
    onGeoJsonChange && onGeoJsonChange(null);
    onAreaChange && onAreaChange(0);
  }, [onGeoJsonChange, onAreaChange]);

  const clearDrawings = useCallback(() => {
    if (drawnItems) {
      drawnItems.clearLayers();
      onGeoJsonChange && onGeoJsonChange(null);
      onAreaChange && onAreaChange(0);
    }
  }, [drawnItems, onGeoJsonChange, onAreaChange]);

  const resetMap = useCallback(() => {
    clearDrawings();
  }, [clearDrawings]);

  // Initialize map when it's ready
  useEffect(() => {
    if (mapRef.current && leafletLoaded && !drawnItems) {
      const map = mapRef.current;
      const drawnItemsLayer = new L.FeatureGroup();
      map.addLayer(drawnItemsLayer);
      setDrawnItems(drawnItemsLayer);

      // Add event listeners
      map.on('draw:created', handleCreated);
      map.on('draw:edited', handleEdited);
      map.on('draw:deleted', handleDeleted);

      setMapLoaded(true);
    }
  }, [
    mapRef.current,
    leafletLoaded,
    drawnItems,
    handleCreated,
    handleEdited,
    handleDeleted,
  ]);

  // Load initial GeoJSON if provided
  useEffect(() => {
    if (initialGeoJson && drawnItems && leafletLoaded) {
      try {
        const geoJsonData = JSON.parse(initialGeoJson);
        const layer = L.geoJSON(geoJsonData);

        drawnItems.clearLayers();
        drawnItems.addLayer(layer.getLayers()[0]);

        const area = calculateArea(layer.getLayers()[0]);
        onAreaChange && onAreaChange(area);
      } catch (error) {
        console.error('Error loading initial GeoJSON:', error);
      }
    }
  }, [initialGeoJson, drawnItems, leafletLoaded, calculateArea, onAreaChange]);

  if (!isClient || !leafletLoaded) {
    return (
      <Card style={{ height }}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center space-y-2">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading drawing tools...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Draw a polygon to define the steward's land area
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearDrawings}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={resetMap}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div
            className="relative overflow-hidden rounded-lg"
            style={{ height }}
          >
            <MapContainer
              ref={mapRef}
              center={PANAY_BOUNDS.center}
              zoom={PANAY_BOUNDS.zoom}
              maxBounds={PANAY_BOUNDS.maxBounds}
              maxBoundsViscosity={1.0}
              style={{ height: '100%', width: '100%' }}
              className="leaflet-container"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={18}
                minZoom={8}
              />

              {mapLoaded && drawnItems && (
                <FeatureGroup>
                  <EditControl
                    position="topright"
                    onCreated={handleCreated}
                    onEdited={handleEdited}
                    onDeleted={handleDeleted}
                    draw={{
                      rectangle: false,
                      circle: false,
                      circlemarker: false,
                      marker: false,
                      polyline: false,
                      polygon: {
                        allowIntersection: false,
                        drawError: {
                          color: '#e1e100',
                          message:
                            '<strong>Error:</strong> Shape edges cannot cross!',
                        },
                        shapeOptions: {
                          color: '#2563eb',
                          fillOpacity: 0.3,
                        },
                      },
                    }}
                  />
                </FeatureGroup>
              )}
            </MapContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DrawableMap;
