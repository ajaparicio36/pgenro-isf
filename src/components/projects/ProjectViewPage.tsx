'use client';

import React, { useState } from 'react';
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
  Download,
  Edit,
} from 'lucide-react';
import { DASHBOARD_ROUTES } from '@/lib/routes';
import { Separator } from '@/components/ui/separator';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import Image from 'next/image';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import DownloadPlugin from 'yet-another-react-lightbox/plugins/download';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import Slideshow from 'yet-another-react-lightbox/plugins/slideshow';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

interface ProjectViewPageProps {
  projectId: string;
}

const ProjectViewPage = ({ projectId }: ProjectViewPageProps) => {
  const router = useRouter();
  const { project, isLoading, error } = useProject(projectId);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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

  const isImageFile = (filename: string) => {
    const imageExtensions = [
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.bmp',
      '.webp',
      '.svg',
    ];
    return imageExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
  };

  const getFileName = (url: string) => {
    const parts = url.split('/').pop()?.split('-');
    return parts?.slice(2).join('-') || 'Attachment';
  };

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Prepare images for lightbox
  const imageAttachments = project.attachments.filter((attachment) =>
    isImageFile(getFileName(attachment.url))
  );

  const lightboxSlides = imageAttachments.map((attachment) => ({
    src: attachment.url,
    alt: getFileName(attachment.url),
    download: attachment.url,
  }));

  const openLightbox = (imageIndex: number) => {
    setLightboxIndex(imageIndex);
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="container mx-auto py-6 space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: DASHBOARD_ROUTES.root },
            { label: 'Projects', href: DASHBOARD_ROUTES.projects },
            { label: project.title, current: true },
          ]}
        />

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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold">{project.title}</h1>
                <Badge className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
              </div>
              <Button
                onClick={() =>
                  router.push(`${DASHBOARD_ROUTES.projects}/${project.id}/edit`)
                }
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Project
              </Button>
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

        {/* Attachments with Enhanced Lightbox */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.attachments.map((attachment, index) => {
                  const fileName = getFileName(attachment.url);
                  const isImage = isImageFile(fileName);
                  const imageIndex = imageAttachments.findIndex(
                    (img) => img.id === attachment.id
                  );

                  return (
                    <div
                      key={attachment.id}
                      className="border rounded-lg overflow-hidden"
                    >
                      {isImage ? (
                        <div className="relative aspect-video bg-gray-100">
                          <Image
                            src={attachment.url}
                            alt={fileName}
                            fill
                            className="object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => openLightbox(imageIndex)}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all cursor-pointer flex items-center justify-center opacity-0 hover:opacity-100">
                            <span className="text-white font-medium">
                              Click to view
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-100 flex items-center justify-center">
                          <Paperclip className="h-12 w-12 text-gray-400" />
                        </div>
                      )}

                      <div className="p-3 space-y-2">
                        <div
                          className="font-medium text-sm truncate"
                          title={fileName}
                        >
                          {fileName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Uploaded:{' '}
                          {new Date(attachment.uploadedAt).toLocaleDateString()}
                        </div>
                        <div className="flex gap-2">
                          {isImage ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => openLightbox(imageIndex)}
                            >
                              View
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() =>
                                window.open(attachment.url, '_blank')
                              }
                            >
                              Open
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              downloadFile(attachment.url, fileName)
                            }
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Lightbox with all features */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        index={lightboxIndex}
        slides={lightboxSlides}
        plugins={[Zoom, DownloadPlugin, Fullscreen, Slideshow, Thumbnails]}
        zoom={{
          maxZoomPixelRatio: 5,
          zoomInMultiplier: 2,
          doubleTapDelay: 300,
          doubleClickDelay: 300,
          doubleClickMaxStops: 2,
          keyboardMoveDistance: 50,
          wheelZoomDistanceFactor: 100,
          pinchZoomDistanceFactor: 100,
          scrollToZoom: true,
        }}
        thumbnails={{
          position: 'bottom',
          width: 120,
          height: 80,
          border: 1,
          borderRadius: 4,
          padding: 4,
          gap: 16,
        }}
        slideshow={{
          autoplay: false,
          delay: 3000,
        }}
        download={{
          download: ({ slide }) => {
            if (slide.download) {
              const downloadUrl =
                typeof slide.download === 'string' ? slide.download : slide.src;
              const filename = getFileName(downloadUrl);
              downloadFile(downloadUrl, filename);
            }
          },
        }}
        carousel={{
          finite: lightboxSlides.length <= 1,
          preload: 2,
          padding: '16px',
          spacing: '30%',
          imageFit: 'contain',
        }}
        render={{
          buttonPrev: lightboxSlides.length <= 1 ? () => null : undefined,
          buttonNext: lightboxSlides.length <= 1 ? () => null : undefined,
        }}
        controller={{
          closeOnPullDown: true,
          closeOnBackdropClick: true,
        }}
      />
    </>
  );
};

export default ProjectViewPage;
