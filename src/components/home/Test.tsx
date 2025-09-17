'use client';
import { useAuth } from '@/hooks/useAuth';
import React from 'react';

const Test = () => {
  const { company } = useAuth();
  return <div>Test: {company?.companyName}</div>;
};

export default Test;
