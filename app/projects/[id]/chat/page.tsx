import { Metadata } from 'next'
// import SynthesisOrchestrator from './components/SynthesisOrchestrator' // Assuming this is for later
// import { Agent } from '@/app/services/agentAssignmentService' // Type might come from lib/agent-service now
// import { ContextDigest } from '@/app/services/contextService' // Type might come from lib/context-service now
import { notFound } from 'next/navigation';
import { auth } from "@/lib/auth";
import ChatInterface from '@/components/ChatInterface';
import * as ProjectService from '@/lib/project-service';
import { Button } from '@/components/ui/button'
import { ContextService, type Context } from '@/lib/context-service'; // Import Context type
import { AgentService, type Agent } from '@/lib/agent-service'; // Import AgentService and Agent type
// import { cookies } from 'next/headers'; // No longer needed for fetchProjectAgents

export const metadata: Metadata = {
  title: 'Chat & Synthesis',
  description: 'Interact with your agents and context through an intelligent interface',
}

interface ProjectChatPageProps {
  params: {
    id: string
  }
}

// Mock function to get context info - replace with actual ContextService call later
// async function getMockProjectContexts(projectId: string, userId: string): Promise<MockContextInfo[]> { ... }

export default async function ProjectChatPage({ params }: ProjectChatPageProps) {
  const projectId = params.id
  
  const session = await auth();

  if (!session?.user?.id) {
    // Or redirect to login page
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="p-4 text-lg text-muted-foreground">Please sign in to access the chat.</p>
      </div>
    );
  }
  const userId = session.user.id;

  let agents: Agent[] = []; // Use Agent type from lib/agent-service
  let contextsForSelector: Array<{ id: string, summary: string }> = [];
  let fetchError: string | null = null;

  try {
    // Check project existence and user access first
    const project = await ProjectService.getProject(projectId, userId);
    if (!project) {
      console.warn(`Project ${projectId} not found or user ${userId} lacks access.`);
      notFound(); // Project does not exist or user lacks access
    }

    // Now fetch agents and contexts since access is confirmed
    const [fetchedAgents, fetchedContexts] = await Promise.all([
      AgentService.getProjectAgents(projectId, userId), // Call service directly
      ContextService.getProjectContexts(projectId) 
    ]);
    
    // Assign fetched agents
    agents = fetchedAgents;
    
    // Map fetched contexts to the structure needed by ChatInterface selector
    contextsForSelector = fetchedContexts.map((ctx: Context) => ({ // Use Context type
        id: ctx.id,
        summary: ctx.name || (ctx.content ? `${ctx.content.substring(0, 75)}...` : `Context ${ctx.id}`)
    }));

  } catch (error) {
    console.error("Error loading chat page data:", error);
    fetchError = error instanceof Error ? error.message : "Failed to load chat data.";
  }

  // Handle errors during data fetching
  if (fetchError) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="p-4 text-lg text-red-600">Error loading chat: {fetchError}</p>
      </div>
    );
  }

  // Handle case where project exists but has no agents
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h2 className="text-xl font-semibold mb-2">No Agents Found</h2>
        <p className="text-muted-foreground mb-4 text-center">
          This project doesn't have any agents yet. You need at least one agent to start chatting.
        </p>
        <Button asChild>
          <a href={`/projects/${projectId}/agents/new`}>Create New Agent</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col"> {/* Use full height */}
      {/* Can add page title or project info header here */} 
      {/* Example Header 
      <header className="p-4 border-b bg-card text-card-foreground">
         <h1 className="text-lg font-semibold">Chat for Project: {projectId}</h1>
      </header> 
      */}          
      <ChatInterface
        projectId={projectId}
        availableAgents={agents}
        availableContexts={contextsForSelector} // Pass formatted contexts
      />
    </div>
  )
} 