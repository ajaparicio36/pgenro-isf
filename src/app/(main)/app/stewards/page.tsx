'use client';

import React, { useState, useMemo } from 'react';
import { useStewards } from '@/hooks/useStewards';
import { useMunicipalities } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Search,
  User,
  MapPin,
  Calendar,
  Star,
  Edit,
  Eye,
  Filter,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { DASHBOARD_ROUTES } from '@/lib/routes';
import { format } from 'date-fns';

const StewardsPage = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedMunicipalityId, setSelectedMunicipalityId] = useState('');
  const [selectedBarangayId, setSelectedBarangayId] = useState('');

  const limit = 10;

  const { stewards, totalPages, totalStewards, isLoading, error } = useStewards(
    currentPage,
    limit,
    search,
    selectedMunicipalityId,
    selectedBarangayId
  );

  const { municipalities, isLoading: municipalitiesLoading } =
    useMunicipalities();

  // Get barangays for selected municipality
  const availableBarangays = useMemo(() => {
    if (!selectedMunicipalityId) return [];
    const municipality = municipalities.find(
      (m) => m.id === selectedMunicipalityId
    );
    return municipality?.barangays || [];
  }, [municipalities, selectedMunicipalityId]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleMunicipalityChange = (value: string) => {
    setSelectedMunicipalityId(value);
    setSelectedBarangayId(''); // Reset barangay when municipality changes
    setCurrentPage(1);
  };

  const handleBarangayChange = (value: string) => {
    setSelectedBarangayId(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedMunicipalityId('');
    setSelectedBarangayId('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    search || selectedMunicipalityId || selectedBarangayId;

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">
              Failed to load stewards data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Community Stewards
          </h1>
          <p className="text-muted-foreground">
            Manage community stewardship certificates and evaluations
          </p>
        </div>
        <Link href={DASHBOARD_ROUTES.createSteward}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add New Steward
          </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : totalStewards}
                </div>
                <p className="text-sm text-muted-foreground">Total Stewards</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {isLoading
                    ? '...'
                    : stewards.reduce((sum, s) => sum + s.area, 0).toFixed(1)}
                </div>
                <p className="text-sm text-muted-foreground">Total Area (ha)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">
                  {isLoading
                    ? '...'
                    : stewards.reduce((sum, s) => sum + s._count.Evaluation, 0)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total Evaluations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-lg font-bold">
                  {isLoading ? '...' : `${currentPage}/${totalPages}`}
                </div>
                <p className="text-sm text-muted-foreground">Page</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stewards..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={selectedMunicipalityId}
              onValueChange={handleMunicipalityChange}
              disabled={municipalitiesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select municipality" />
              </SelectTrigger>
              <SelectContent>
                {municipalities.map((municipality) => (
                  <SelectItem key={municipality.id} value={municipality.id}>
                    {municipality.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedBarangayId}
              onValueChange={handleBarangayChange}
              disabled={!selectedMunicipalityId || municipalitiesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select barangay" />
              </SelectTrigger>
              <SelectContent>
                {availableBarangays.map((barangay) => (
                  <SelectItem key={barangay.id} value={barangay.id}>
                    {barangay.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center text-sm text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-4 w-20" />
              ) : (
                `${stewards.length} of ${totalStewards} stewards`
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stewards Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ) : stewards.length === 0 ? (
            <div className="p-12 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No stewards found</h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by creating your first steward'}
              </p>
              {!hasActiveFilters && (
                <Link href={DASHBOARD_ROUTES.createSteward}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Steward
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Steward</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>CSC Number</TableHead>
                  <TableHead>Area (ha)</TableHead>
                  <TableHead>Evaluations</TableHead>
                  <TableHead>Date Issued</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stewards.map((steward) => (
                  <TableRow key={steward.id}>
                    <TableCell>
                      <div className="font-medium">{steward.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {steward.barangay.name}
                        </div>
                        <div className="text-muted-foreground">
                          {steward.municipality.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {steward.cscNumber}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {steward.area.toFixed(2)} ha
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {steward._count.Evaluation}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(steward.dateIssued), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          new Date(steward.dateExpiry) > new Date()
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {new Date(steward.dateExpiry) > new Date()
                          ? 'Active'
                          : 'Expired'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/app/stewards/${steward.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/app/stewards/${steward.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/app/stewards/${steward.id}/evaluate`}>
                          <Button size="sm">
                            <Star className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StewardsPage;
