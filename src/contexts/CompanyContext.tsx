'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Company } from '@/schemas/auth';

interface CompanyContextType {
  company: Company | null;
  isLoading: boolean;
  error: unknown;
  setCompany: (company: Company | null) => void;
  updateCompany: (updates: Partial<Company>) => void;
  clearCompany: () => void;
  refetch: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

interface CompanyProviderProps {
  children: ReactNode;
}

export function CompanyProvider({ children }: CompanyProviderProps) {
  const [company, setCompanyState] = useState<Company | null>(null);
  const { company: authCompany, isLoading, error, mutate } = useAuth();

  // Sync company data from auth hook
  useEffect(() => {
    if (authCompany) {
      setCompanyState(authCompany);
    }
  }, [authCompany]);

  const setCompany = useCallback((company: Company | null) => {
    setCompanyState(company);
  }, []);

  const updateCompany = useCallback((updates: Partial<Company>) => {
    setCompanyState((current) => {
      if (!current) return null;
      return { ...current, ...updates };
    });
  }, []);

  const clearCompany = useCallback(() => {
    setCompanyState(null);
  }, []);

  const refetch = useCallback(() => {
    mutate();
  }, [mutate]);

  const value: CompanyContextType = {
    company,
    isLoading,
    error,
    setCompany,
    updateCompany,
    clearCompany,
    refetch,
  };

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
