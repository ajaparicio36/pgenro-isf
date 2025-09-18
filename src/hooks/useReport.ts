import { useState } from 'react';
import { ReportFilters, ReportData } from '@/schemas/report';
import { toast } from 'sonner';

export const useReport = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async (filters: ReportFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      const result = await response.json();

      if (result.success) {
        setReportData(result.data);
        return result.data;
      } else {
        const errorMessage = result.message || 'Failed to generate report';
        setError(errorMessage);
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to generate report';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    reportData,
    isLoading,
    error,
    generateReport,
  };
};
