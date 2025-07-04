'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeftIcon, CheckIcon, CrossCircledIcon } from '@radix-ui/react-icons'
import type { Project, ProjectUpdate } from '@/lib/project-service'

interface ProjectSettingsClientPageProps {
  project: Project | null;
  fetchError: string | null;
}

export default function ProjectSettingsClientPage({ project: initialProject, fetchError }: ProjectSettingsClientPageProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(initialProject);
  const [name, setName] = useState(initialProject?.name || '');
  const [description, setDescription] = useState(initialProject?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(fetchError);

  useEffect(() => {
    if (initialProject) {
        setProject(initialProject);
        setName(initialProject.name || '');
        setDescription(initialProject.description || '');
    }
    if (fetchError) {
        setError(fetchError);
    }
  }, [initialProject, fetchError]);

  if (error && !project) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-destructive/10 border-destructive">
            <CardHeader><CardTitle className="text-destructive">Error Loading Project Settings</CardTitle></CardHeader>
            <CardContent>
                <p>{error}</p>
                <Button asChild variant="outline" className="mt-4"><Link href="/dashboard">Go to Dashboard</Link></Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    // This should ideally be caught by the server component with notFound()
    return <p className="p-4">Project data is not available. It might have been deleted or an error occurred.</p>;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!project?.id) {
        setError('Project ID is missing. Cannot update.');
        setIsSubmitting(false);
        return;
    }

    const updates: ProjectUpdate = {};
    if (name !== project.name) updates.name = name;
    if (description !== (project.description || '')) updates.description = description;

    if (Object.keys(updates).length === 0) {
        toast({ title: "No Changes", description: "No changes were made to the project settings." });
        setIsSubmitting(false);
        return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update project: ${response.statusText}`);
      }

      const updatedProjectData = await response.json();
      setProject(updatedProjectData.project); // Update local state with returned project
      setName(updatedProjectData.project.name);
      setDescription(updatedProjectData.project.description || '');
      
      toast({
        title: "Settings Updated",
        description: "Project settings have been successfully updated.",
        action: <CheckIcon className="h-5 w-5 text-green-500" />
      });
      router.refresh(); // Refresh server components on the page if any depend on this data

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
        action: <CrossCircledIcon className="h-5 w-5 text-red-500"/>
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Button asChild variant="outline" size="sm" className="mb-4">
        <Link href={`/projects/${project.id}`}>
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to Project
        </Link>
      </Button>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Project Settings</CardTitle>
          <CardDescription>
            Manage settings for project: <span className="font-semibold">{project.name}</span>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
            {error && !fetchError && <p className="text-sm text-red-600 p-3 bg-red-50 border border-red-200 rounded-md">Error: {error}</p>}
            
            <div>
                <Label htmlFor="projectName">Project Name</Label>
                <Input 
                id="projectName" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                />
            </div>
            <div>
                <Label htmlFor="projectDescription">Project Description (Optional)</Label>
                <Textarea 
                id="projectDescription" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                rows={4} 
                />
            </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
                </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
} 