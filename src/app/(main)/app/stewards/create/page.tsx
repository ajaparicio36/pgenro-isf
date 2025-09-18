'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import CreateStewardForm from '@/components/forms/CreateStewardForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { DASHBOARD_ROUTES } from '@/lib/routes';

const CreateStewardPage = () => {
  const router = useRouter();

  const handleSuccess = () => {
    router.push(DASHBOARD_ROUTES.stewards);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={DASHBOARD_ROUTES.stewards}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Stewards
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Create New Steward
            </h1>
            <p className="text-muted-foreground">
              Add a new community steward with land area mapping
            </p>
          </div>
        </div>
      </div>

      <CreateStewardForm onSuccess={handleSuccess} />
    </div>
  );
};

export default CreateStewardPage;
