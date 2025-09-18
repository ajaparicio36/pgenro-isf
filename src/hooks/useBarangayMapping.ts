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

  // New: Enhanced barangay search functionality
  const searchBarangay = (locationText: string) => {
    if (!locationText || locationText.trim().length === 0) {
      return null;
    }

    const searchText = locationText.toLowerCase().trim();
    const words = searchText.split(/[\s,]+/).filter((word) => word.length > 0);

    console.log(
      'Searching for barangay with text:',
      searchText,
      'words:',
      words
    );

    let bestMatch: { barangay: any; score: number } | null = null;

    for (const [code, barangay] of barangayCodeMap.entries()) {
      const barangayName = barangay.name.toLowerCase();
      const municipalityName = barangay.municipalityName.toLowerCase();

      // Exact match (highest priority)
      if (
        barangayName === searchText ||
        searchText.includes(barangayName) ||
        barangayName.includes(searchText.replace(/^(brgy|barangay)\s*/i, ''))
      ) {
        console.log('Exact match found:', barangay);
        return { ...barangay, officialCode: code };
      }

      // Word-based matching
      let score = 0;
      words.forEach((word) => {
        // Clean word (remove common prefixes)
        const cleanWord = word.replace(/^(brgy|barangay)$/i, '').trim();
        if (cleanWord.length === 0) return;

        if (barangayName.includes(cleanWord)) {
          score += 3;
        }
        if (municipalityName.includes(cleanWord)) {
          score += 2;
        }
        // Partial matching
        if (cleanWord.length > 2) {
          if (barangayName.includes(cleanWord.substring(0, 3))) {
            score += 1;
          }
        }
      });

      // Municipality + Barangay combination check
      const combinedText = `${municipalityName} ${barangayName}`;
      if (
        words.every(
          (word) =>
            word.length < 3 ||
            combinedText.includes(word.replace(/^(brgy|barangay)$/i, ''))
        )
      ) {
        score += 2;
      }

      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { barangay: { ...barangay, officialCode: code }, score };
      }
    }

    if (bestMatch && bestMatch.score >= 2) {
      console.log(
        'Best match found:',
        bestMatch.barangay,
        'with score:',
        bestMatch.score
      );
      return bestMatch.barangay;
    }

    console.log('No suitable match found for:', searchText);
    return null;
  };

  return {
    barangayCodeMap,
    municipalityCodeMap,
    getBarangayByCode,
    getMunicipalityByCode,
    getMunicipalityFromBarangayCode,
    getBarangayByName,
    searchBarangay, // New function
  };
}
