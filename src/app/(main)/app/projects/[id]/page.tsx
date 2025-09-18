import React from 'react';
import ProjectViewPage from '@/components/projects/ProjectViewPage';

const ProjectView = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return <ProjectViewPage projectId={id} />;
};

export default ProjectView;
