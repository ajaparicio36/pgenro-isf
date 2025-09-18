'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import CreateProjectForm from './CreateProjectForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DASHBOARD_ROUTES } from '@/lib/routes';

const CreateProjectPage = () => {
  const router = useRouter();

  const handleSuccess = () => {
    router.push(DASHBOARD_ROUTES.projects);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <p className="text-muted-foreground">
            Fill in the details to create a new project
          </p>
        </div>
      </div>

      <CreateProjectForm onSuccess={handleSuccess} />
    </div>
  );
};

export default CreateProjectPage;
