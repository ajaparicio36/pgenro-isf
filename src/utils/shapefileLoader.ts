import type {
  Feature,
  FeatureCollection,
  Polygon,
  MultiPolygon,
} from 'geojson';

export interface BarangayGeometry extends Feature<Polygon | MultiPolygon> {
  properties: {
    adm4_psgc: string;
    adm4_en: string; // barangay name
    adm3_en?: string; // municipality name (make optional in case missing)
    adm2_en?: string; // province name (make optional in case missing)
    [key: string]: any; // Allow additional properties
  };
  geometry: Polygon | MultiPolygon;
}

export interface ShapefileData
  extends FeatureCollection<Polygon | MultiPolygon> {
  type: 'FeatureCollection';
  features: BarangayGeometry[];
}

let cachedShapefileData: ShapefileData | null = null;
let loadingPromise: Promise<ShapefileData> | null = null;

// More lenient coordinate validation
const isValidCoordinate = (coord: any): boolean => {
  return (
    Array.isArray(coord) &&
    coord.length >= 2 &&
    typeof coord[0] === 'number' &&
    typeof coord[1] === 'number' &&
    !isNaN(coord[0]) &&
    !isNaN(coord[1])
  );
};

// Panay Island bounds for filtering
const PANAY_BOUNDS = {
  minLng: 121.5,
  maxLng: 123.5,
  minLat: 10.0,
  maxLat: 12.5,
};

const isWithinPanayBounds = (geometry: Polygon | MultiPolygon): boolean => {
  try {
    let coordinatesToCheck: number[][][];

    if (geometry.type === 'Polygon') {
      coordinatesToCheck = geometry.coordinates;
    } else if (geometry.type === 'MultiPolygon') {
      coordinatesToCheck = geometry.coordinates.flat();
    } else {
      return false;
    }

    // Check if any coordinate ring has valid points
    for (const ring of coordinatesToCheck) {
      if (ring && ring.length > 2) {
        for (const coord of ring) {
          if (isValidCoordinate(coord)) {
            const [lng, lat] = coord;
            // More lenient bounds for Philippines/Panay area
            if (lng >= 120.0 && lng <= 125.0 && lat >= 9.0 && lat <= 13.0) {
              return true;
            }
          }
        }
      }
    }

    return false;
  } catch (error) {
    console.warn('Error checking bounds:', error);
    return false;
  }
};

export const loadBarangayShapefile = async (): Promise<ShapefileData> => {
  // Return cached data if available
  if (cachedShapefileData) {
    console.log('Returning cached shapefile data');
    return cachedShapefileData;
  }

  // Return existing loading promise if already loading
  if (loadingPromise) {
    console.log('Waiting for existing load promise');
    return loadingPromise;
  }

  // Create new loading promise
  loadingPromise = (async () => {
    try {
      console.log('Starting GeoJSON load from /data/province_barangays.json');
      const startTime = performance.now();

      const response = await fetch('/data/province_barangays.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      console.log(
        'Fetch response status:',
        response.status,
        response.statusText
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch GeoJSON: ${response.status} ${response.statusText}`
        );
      }

      const geojson = await response.json();
      console.log('GeoJSON parsed successfully');
      console.log('Raw GeoJSON structure:', {
        type: geojson.type,
        featuresCount: geojson.features?.length,
        firstFeature: geojson.features?.[0]
          ? {
              type: geojson.features[0].type,
              geometryType: geojson.features[0].geometry?.type,
              properties: Object.keys(geojson.features[0].properties || {}),
              propertiesValues: geojson.features[0].properties,
            }
          : 'No features',
      });

      // Validate the structure
      if (
        !geojson ||
        !geojson.features ||
        geojson.type !== 'FeatureCollection'
      ) {
        throw new Error(
          'Invalid GeoJSON format - missing features or wrong type'
        );
      }

      // More lenient validation - don't require municipality name since it's missing
      const validFeatures = geojson.features.filter(
        (feature: any, index: number) => {
          try {
            // Basic structure check
            if (!feature || !feature.geometry || !feature.properties) {
              console.warn(`Feature ${index}: Missing geometry or properties`);
              return false;
            }

            // Check geometry type
            if (
              feature.geometry.type !== 'Polygon' &&
              feature.geometry.type !== 'MultiPolygon'
            ) {
              console.warn(
                `Feature ${index}: Invalid geometry type:`,
                feature.geometry.type
              );
              return false;
            }

            // Check if coordinates exist and are valid
            if (
              !feature.geometry.coordinates ||
              !Array.isArray(feature.geometry.coordinates)
            ) {
              console.warn(`Feature ${index}: Invalid coordinates`);
              return false;
            }

            // Only require barangay code and name - municipality will be resolved later
            if (!feature.properties.adm4_psgc || !feature.properties.adm4_en) {
              console.warn(`Feature ${index}: Missing required properties`, {
                adm4_psgc: feature.properties.adm4_psgc,
                adm4_en: feature.properties.adm4_en,
              });
              return false;
            }

            // Check if within reasonable bounds
            const hasValidCoords = isWithinPanayBounds(feature.geometry);
            if (!hasValidCoords) {
              console.warn(
                `Feature ${index}: No valid coordinates within bounds`
              );
              return false;
            }

            return true;
          } catch (error) {
            console.warn(`Feature ${index}: Error validating`, error);
            return false;
          }
        }
      );

      console.log(
        `Validation complete: ${validFeatures.length} valid features from ${geojson.features.length} total`
      );

      if (validFeatures.length === 0) {
        throw new Error('No valid features found in GeoJSON');
      }

      // Sample some features for debugging
      const sampleFeatures = validFeatures.slice(0, 3);
      console.log(
        'Sample features:',
        sampleFeatures.map((f: any) => ({
          name: f.properties.adm4_en,
          code: f.properties.adm4_psgc,
          geometryType: f.geometry.type,
          allProperties: f.properties,
        }))
      );

      cachedShapefileData = {
        type: 'FeatureCollection',
        features: validFeatures,
      };

      const endTime = performance.now();
      console.log(
        `GeoJSON loading completed successfully in ${(endTime - startTime).toFixed(2)}ms`
      );
      console.log(
        `Final dataset: ${cachedShapefileData.features.length} features`
      );

      return cachedShapefileData;
    } catch (error) {
      console.error('Error loading GeoJSON:', error);
      loadingPromise = null;
      throw error;
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
};

export const getBarangayByCode = (
  shapefileData: ShapefileData,
  officialCode: string
): BarangayGeometry | null => {
  return (
    shapefileData.features.find(
      (feature) => feature.properties.adm4_psgc === officialCode
    ) || null
  );
};

export const filterBarangaysByMunicipality = (
  shapefileData: ShapefileData,
  municipalityNames: string[]
): BarangayGeometry[] => {
  if (municipalityNames.length === 0) {
    return shapefileData.features;
  }

  return shapefileData.features.filter((feature) =>
    municipalityNames.some((name) =>
      feature.properties.adm3_en?.toLowerCase().includes(name.toLowerCase())
    )
  );
};
