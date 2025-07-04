import { getProject, type Project } from '@/lib/project-service';
import { auth } from "@/lib/auth";
import ProjectSettingsClientPage from './project-settings-client-page';
import { notFound } from 'next/navigation';

interface ProjectSettingsPageProps {
  params: {
    id: string; // This is projectId
  };
}

export default async function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    return <p className="p-4">Access Denied. Please sign in.</p>; 
  }

  const projectId = params.id;
  if (!projectId) {
    notFound();
  }

  let project: Project | null = null;
  let fetchError: string | null = null;

  try {
    project = await getProject(projectId, session.user.id);
    if (!project) {
      notFound();
    }
  } catch (error: any) {
    console.error(`Failed to load project settings for ${projectId}:`, error);
    fetchError = error.message || 'Could not load project details.';
    if (!project) notFound();
  }
  
  return (
    <ProjectSettingsClientPage 
      project={project} 
      fetchError={fetchError} 
    />
  );
} 