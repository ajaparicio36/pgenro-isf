'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useProject } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  DollarSign,
  FileText,
  Paperclip,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { DASHBOARD_ROUTES } from '@/lib/routes';
import { Separator } from '@/components/ui/separator';

interface ProjectViewPageProps {
  projectId: string;
}

const ProjectViewPage = ({ projectId }: ProjectViewPageProps) => {
  const router = useRouter();
  const { project, isLoading, error } = useProject(projectId);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">Loading project details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="flex flex-col items-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-600">
                Project not found
              </h3>
              <p className="text-muted-foreground">
                The project you're looking for doesn't exist or you don't have
                permission to view it.
              </p>
              <Button
                onClick={() => router.push(DASHBOARD_ROUTES.projects)}
                className="mt-4"
              >
                Back to Projects
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalComponentCost = project.components.reduce(
    (sum, comp) => sum + comp.componentCost,
    0
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(DASHBOARD_ROUTES.projects)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold">{project.title}</h1>
            <Badge className={getStatusColor(project.status)}>
              {project.status}
            </Badge>
          </div>
          {project.projectCode && (
            <p className="text-muted-foreground">
              Project Code: {project.projectCode}
            </p>
          )}
        </div>
      </div>

      {/* Project Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Project Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Project Timeline
              </div>
              <div className="font-medium">
                {project.startDate}
                {project.endDate && ` - ${project.endDate}`}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Location
              </div>
              <div className="font-medium">
                {project.barangay.name}, {project.barangay.municipality.name}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Total Cost
              </div>
              <div className="font-medium">
                {project.totalProjectCost
                  ? formatCurrency(project.totalProjectCost)
                  : 'Not specified'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Area Developed
              </div>
              <div className="font-medium">
                {project.totalAreaDeveloped
                  ? `${project.totalAreaDeveloped} hectares`
                  : 'Not specified'}
              </div>
            </div>
          </div>

          {project.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium">Description</h4>
                <p className="text-muted-foreground leading-relaxed">
                  {project.description}
                </p>
              </div>
            </>
          )}

          <Separator />
          <div className="text-xs text-muted-foreground">
            Created:{' '}
            {new Date(project.createdAt).toLocaleDateString('en-PH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </CardContent>
      </Card>

      {/* Project Components */}
      <Card>
        <CardHeader>
          <CardTitle>
            Project Components ({project.components.length})
          </CardTitle>
          {totalComponentCost > 0 && (
            <p className="text-sm text-muted-foreground">
              Total Component Cost: {formatCurrency(totalComponentCost)}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {project.components.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No components found for this project.
            </div>
          ) : (
            <div className="space-y-4">
              {project.components.map((component, index) => (
                <div
                  key={component.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="font-medium">
                        {component.componentTitle}
                      </h4>
                      {component.componentDescription && (
                        <p className="text-sm text-muted-foreground">
                          {component.componentDescription}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(component.componentCost)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attachments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Attachments ({project.attachments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {project.attachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No attachments found for this project.
            </div>
          ) : (
            <div className="space-y-3">
              {project.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {attachment.url
                          .split('/')
                          .pop()
                          ?.split('-')
                          .slice(2)
                          .join('-') || 'Attachment'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Uploaded:{' '}
                        {new Date(attachment.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(attachment.url, '_blank')}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectViewPage;
