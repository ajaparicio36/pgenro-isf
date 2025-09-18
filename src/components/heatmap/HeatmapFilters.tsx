'use client';

import React from 'react';
import { HeatmapCategory, HeatmapFilterData } from '@/schemas/heatmap';
import { useMunicipalities } from '@/hooks/useProjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface HeatmapFiltersProps {
  filters: HeatmapFilterData;
  onFiltersChange: (filters: HeatmapFilterData) => void;
}

const CATEGORY_LABELS = {
  [HeatmapCategory.RECENTNESS]: 'Project Recentness',
  [HeatmapCategory.AREA_DEVELOPED]: 'Area Developed (Hectares)',
  [HeatmapCategory.TOTAL_COST]: 'Total Project Cost',
};

const HeatmapFilters = ({ filters, onFiltersChange }: HeatmapFiltersProps) => {
  const { municipalities } = useMunicipalities();
  const currentYear = new Date().getFullYear();

  const handleCategoryChange = (category: HeatmapCategory) => {
    onFiltersChange({ ...filters, category });
  };

  const handleMunicipalityToggle = (municipalityId: string) => {
    const current = filters.municipalityIds || [];
    const updated = current.includes(municipalityId)
      ? current.filter((id) => id !== municipalityId)
      : [...current, municipalityId];

    onFiltersChange({
      ...filters,
      municipalityIds: updated.length > 0 ? updated : undefined,
    });
  };

  const handleYearChange = (field: 'startYear' | 'endYear', value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value || undefined,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({ category: HeatmapCategory.RECENTNESS });
  };

  const selectedMunicipalities = municipalities.filter((m) =>
    filters.municipalityIds?.includes(m.id)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Heatmap Filters
          <Button variant="outline" size="sm" onClick={clearAllFilters}>
            Clear All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Heat Category</Label>
          <Select value={filters.category} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Start Year</Label>
            <Input
              type="number"
              placeholder="2020"
              value={filters.startYear || ''}
              onChange={(e) => handleYearChange('startYear', e.target.value)}
            />
          </div>
          <div>
            <Label>End Year</Label>
            <Input
              type="number"
              placeholder={currentYear.toString()}
              value={filters.endYear || ''}
              onChange={(e) => handleYearChange('endYear', e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label>Filter by Municipalities</Label>
          <Select onValueChange={handleMunicipalityToggle}>
            <SelectTrigger>
              <SelectValue placeholder="Select municipalities..." />
            </SelectTrigger>
            <SelectContent>
              {municipalities.map((municipality) => (
                <SelectItem
                  key={municipality.id}
                  value={municipality.id}
                  disabled={filters.municipalityIds?.includes(municipality.id)}
                >
                  {municipality.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedMunicipalities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {selectedMunicipalities.map((municipality) => (
                <Badge
                  key={municipality.id}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleMunicipalityToggle(municipality.id)}
                >
                  {municipality.name}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default HeatmapFilters;
