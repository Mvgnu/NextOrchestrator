import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from "@/lib/auth"
import * as ProjectService from '@/lib/project-service'
import { ContextService, Context } from '@/lib/context-service'
import { AgentService, Agent } from '@/lib/agent-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'

interface ProjectPageProps {
  params: {
    id: string
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect('/auth/signin')
  }
  const userId = session.user.id;
  const projectId = params.id;
  
  let project;
  try {
    project = await ProjectService.getProject(projectId, userId);
  } catch (error) {
    console.error(`Project fetch error for ${projectId}, user ${userId}:`, error);
    notFound();
  }
  
  if (!project) {
    notFound();
  }
  
  let contexts: Context[] = [];
  try {
    contexts = await ContextService.getProjectContexts(projectId);
  } catch (error) {
    console.error(`Error fetching contexts via ContextService for project ${projectId}:`, error);
  }
  
   let agents: Agent[] = [];
   try {
      const userAgents = await AgentService.getUserAgents(userId);
      agents = userAgents.filter(agent => agent.project_id === projectId);
   } catch (error) {
      console.error(`Error fetching agents via AgentService for project ${projectId}:`, error);
   }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-6">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/projects/${params.id}/settings`}>
              Settings
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/projects/${params.id}/chat`}>
              Open Chat
            </Link>
          </Button>
        </div>
      </div>
      
      <Separator className="my-6" />
      
      <Tabs defaultValue="contexts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contexts">Contexts</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="contexts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Context Library</h2>
            <Button asChild>
              <Link href={`/projects/${projectId}/contexts/new`}>
                Add Context
              </Link>
            </Button>
          </div>
          
          {contexts && contexts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {contexts.map((context) => (
                <Card key={context.id} className="flex flex-col">
                  <CardHeader className="p-4">
                    <CardTitle className="truncate" title={context.name}>{context.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex-grow">
                    <p className="text-sm text-muted-foreground">
                       Created: {new Date(context.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-end mt-auto">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/projects/${projectId}/contexts/${context.id}`}>
                        View
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border rounded-md bg-muted/40">
              <p className="text-muted-foreground mb-4">No contexts added yet.</p>
              <Button asChild>
                <Link href={`/projects/${projectId}/contexts/new`}>
                  Add Your First Context
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="agents" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Project Agents</h2>
            <Button asChild>
              <Link href={`/projects/${projectId}/agents/new`}>
                Create Agent
              </Link>
            </Button>
          </div>
          
          {agents && agents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <Card key={agent.id}>
                  <CardHeader className="p-4">
                    <CardTitle>{agent.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {agent.description && (
                      <p className="text-sm mb-2">{agent.description}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Model: {agent.config?.model || 'N/A'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Temperature: {agent.config?.temperature !== undefined ? agent.config.temperature : 'N/A'}
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/projects/${projectId}/agents/${agent.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                    <form action={`/api/projects/${projectId}/agents/${agent.id}/delete`} method="POST">
                      <Button variant="destructive" size="sm" type="submit">
                        Delete
                      </Button>
                    </form>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border rounded-md bg-muted/40">
              <p className="text-muted-foreground mb-4">No agents created yet.</p>
              <Button asChild>
                <Link href={`/projects/${projectId}/agents/new`}>
                  Create Your First Agent
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 