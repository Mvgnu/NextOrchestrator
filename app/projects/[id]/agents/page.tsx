import Link from 'next/link';
import { auth } from "@/lib/auth";
import { Button } from '@/components/ui/button';
import {
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { PlusCircledIcon, Pencil2Icon, TrashIcon } from '@radix-ui/react-icons';
import {notFound, redirect} from 'next/navigation';
import { AgentService, type Agent } from '@/lib/agent-service'; // Import AgentService and Agent type
// import { cookies } from 'next/headers'; // No longer needed

interface ProjectAgentsPageProps {
  params: {
    id: string; // This is projectId
  };
}

export default async function ProjectAgentsPage({ params }: ProjectAgentsPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    // Or redirect to sign-in, but this should ideally be handled by middleware or layout
    return <p className="p-4">Access Denied. Please sign in.</p>; 
  }
  const userId = session.user.id; // Get userId from session

  const projectId = params.id;
  if (!projectId) {
    notFound();
  }

  let agents: Agent[] = [];
  let fetchError: string | null = null;

  try {
    agents = await AgentService.getProjectAgents(projectId, userId); // Call service directly
  } catch (error: any) {
    console.error(`Failed to load agents for project ${projectId}:`, error);
    fetchError = error.message || 'Could not load agents for this project.';
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Project Agents</h1>
          <p className="text-muted-foreground">
            Manage agents for project: <Link href={`/projects/${projectId}`} className="text-primary hover:underline">{projectId}</Link>
          </p>
        </div>
        <Button asChild size="sm">
          <Link href={`/projects/${projectId}/agents/new`}>
            <PlusCircledIcon className="mr-2 h-4 w-4" /> Create New Agent
          </Link>
        </Button>
      </div>

      {fetchError && (
        <Card className="mb-6 bg-destructive/10 border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{fetchError}</p>
            <p className="text-sm text-muted-foreground mt-2">Please try refreshing the page. If the problem persists, contact support.</p>
          </CardContent>
        </Card>
      )}

      {!fetchError && agents.length === 0 && (
        <Card className="text-center py-10">
          <CardHeader>
            <CardTitle>No Agents Found</CardTitle>
            <CardDescription>This project doesn\'t have any agents yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/projects/${projectId}/agents/new`}>
                <PlusCircledIcon className="mr-2 h-4 w-4" /> Create Your First Agent
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!fetchError && agents.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardHeader>
                <CardTitle className="truncate">{agent.name}</CardTitle>
                <CardDescription className="truncate">
                  Provider: {agent.config?.provider || 'N/A'} | Model: {agent.config?.model || 'N/A'}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p className="line-clamp-3 h-[3.75rem]">{agent.description || 'No description available.'}</p>
                <p>Public: {agent.is_public ? 'Yes' : 'No'}</p>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                {/* Placeholder for future actions */}
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/projects/${projectId}/agents/${agent.id}/edit`}> 
                        <Pencil2Icon className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                    </Link>
                </Button>
                {/* <Button variant="destructive" size="sm" disabled> <TrashIcon className="h-4 w-4" /> <span className="sr-only">Delete</span> </Button> */}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 