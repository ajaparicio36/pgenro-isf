'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useProject } from '@/hooks/useProjects';
import EditProjectForm from '@/components/forms/EditProjectForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DASHBOARD_ROUTES } from '@/lib/routes';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

const EditProjectPage = ({ params }: EditProjectPageProps) => {
  const router = useRouter();
  const [projectId, setProjectId] = React.useState<string | null>(null);

  React.useEffect(() => {
    params.then(({ id }) => setProjectId(id));
  }, [params]);

  const { project, isLoading, error } = useProject(projectId || '');

  const handleSuccess = () => {
    router.push(`${DASHBOARD_ROUTES.projects}/${projectId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">Loading project...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              Project not found
            </h2>
            <p className="text-muted-foreground mb-4">
              The project you're looking for doesn't exist or you don't have
              access to it.
            </p>
            <Button onClick={() => router.push(DASHBOARD_ROUTES.projects)}>
              Back to Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: DASHBOARD_ROUTES.root },
          { label: 'Projects', href: DASHBOARD_ROUTES.projects },
          {
            label: project.title,
            href: `${DASHBOARD_ROUTES.projects}/${projectId}`,
          },
          { label: 'Edit', current: true },
        ]}
      />

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            router.push(`${DASHBOARD_ROUTES.projects}/${projectId}`)
          }
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Project
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Project</h1>
          <p className="text-muted-foreground">
            Update project details for "{project.title}"
          </p>
        </div>
      </div>

      <EditProjectForm project={project} onSuccess={handleSuccess} />
    </div>
  );
};

export default EditProjectPage;
