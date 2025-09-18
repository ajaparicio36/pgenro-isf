'use client';

import { useMunicipalities } from '@/hooks/useProjects';
import { useMemo } from 'react';

export function useBarangayMapping() {
  const { municipalities } = useMunicipalities();

  const barangayCodeMap = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        municipalityName: string;
        municipalityCode: string;
      }
    >();

    municipalities.forEach((municipality) => {
      municipality.barangays.forEach((barangay) => {
        // Map official code to barangay info
        map.set(barangay.officialCode, {
          id: barangay.id,
          name: barangay.name,
          municipalityName: municipality.name,
          municipalityCode: municipality.code,
        });
      });
    });

    console.log('Barangay mapping created:', {
      totalBarangays: map.size,
      municipalities: municipalities.length,
      sampleMappings: Array.from(map.entries()).slice(0, 3),
    });

    return map;
  }, [municipalities]);

  // Create municipality code to name mapping
  const municipalityCodeMap = useMemo(() => {
    const map = new Map<string, string>();
    municipalities.forEach((municipality) => {
      map.set(municipality.code, municipality.name);
    });
    return map;
  }, [municipalities]);

  const getBarangayByCode = (officialCode: string) => {
    return barangayCodeMap.get(officialCode) || null;
  };

  const getMunicipalityByCode = (municipalityCode: string) => {
    return municipalityCodeMap.get(municipalityCode) || null;
  };

  // Get municipality name from barangay code by extracting municipality part
  const getMunicipalityFromBarangayCode = (barangayCode: string) => {
    // PSGCodes typically follow pattern: province(3) + municipality(3) + barangay(3)
    // So we can extract the municipality code from the barangay code
    if (barangayCode.length >= 6) {
      const municipalityCode = barangayCode.substring(0, 6) + '000';
      return getMunicipalityByCode(municipalityCode);
    }
    return null;
  };

  const getBarangayByName = (
    barangayName: string,
    municipalityName?: string
  ) => {
    for (const [code, barangay] of barangayCodeMap.entries()) {
      const nameMatch =
        barangay.name.toLowerCase() === barangayName.toLowerCase();
      const municipalityMatch =
        !municipalityName ||
        barangay.municipalityName.toLowerCase() ===
          municipalityName.toLowerCase();

      if (nameMatch && municipalityMatch) {
        return { ...barangay, officialCode: code };
      }
    }
    return null;
  };

  return {
    barangayCodeMap,
    municipalityCodeMap,
    getBarangayByCode,
    getMunicipalityByCode,
    getMunicipalityFromBarangayCode,
    getBarangayByName,
  };
}
