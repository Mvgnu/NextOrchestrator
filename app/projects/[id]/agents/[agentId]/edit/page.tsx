// import { getServerSession } from 'next-auth/next'; // Old way
// import { authOptions } from '@/lib/auth'; // Old way
import { auth } from '@/lib/auth'; // New way
import { AgentService, type Agent } from '@/lib/agent-service';
import { AgentPresetService, type AgentPreset } from '@/lib/agent-preset-service';
import { ModelManagementService, type Provider } from '@/lib/model-management-service'; // Added
import EditAgentClientPage from './edit-agent-client-page';
import { notFound } from 'next/navigation';

interface EditAgentPageProps {
  params: {
    id: string; // projectId
    agentId: string;
  };
}

export default async function EditAgentPage({ params }: EditAgentPageProps) {
  // const session = await getServerSession(authOptions); // Old way
  const session = await auth(); // New way
  if (!session?.user?.id) {
    return <p className="p-4">Access Denied. Please <a href={`/auth/signin?callbackUrl=/projects/${params.id}/agents/${params.agentId}/edit`}>sign in</a>.</p>;
  }

  const { id: projectId, agentId } = params;

  if (!projectId || !agentId) {
    console.error('Project ID or Agent ID is missing from params');
    notFound();
  }

  let agent: Agent | null = null;
  let presets: AgentPreset[] = [];
  let providers: Provider[] = []; // Added
  let fetchError: string | null = null;

  try {
    // Fetch in parallel
    const [agentResult, presetsResult, providersResult] = await Promise.allSettled([
      AgentService.getAgent(agentId),
      AgentPresetService.getUserPresets(session.user.id),
      ModelManagementService.getAllProviders() // Added
    ]);

    if (agentResult.status === 'fulfilled') {
      agent = agentResult.value;
    } else {
      console.error('Error fetching agent:', agentResult.reason);
      fetchError = (agentResult.reason as Error)?.message || 'Could not load agent data.';
    }

    if (presetsResult.status === 'fulfilled') {
      presets = presetsResult.value;
    } else {
      console.error('Error fetching presets:', presetsResult.reason);
      // Non-critical, but we can append to fetchError or log
      fetchError = (fetchError ? fetchError + "; " : "") + ((presetsResult.reason as Error)?.message || 'Could not load presets.');
    }

    if (providersResult.status === 'fulfilled') { // Added
      providers = providersResult.value;
    } else {
      console.error('Error fetching providers:', providersResult.reason);
      fetchError = (fetchError ? fetchError + "; " : "") + ((providersResult.reason as Error)?.message || 'Could not load providers.');
    }

    if (!agent) { // Agent is critical, if it failed to load, notFound
      console.warn(`Agent with ID ${agentId} not found or critical data load failure.`);
      notFound();
    }
    
    if (agent.project_id !== projectId || agent.user_id !== session.user.id) {
        console.warn(`Security: User ${session.user.id} attempted to edit agent ${agentId} not belonging to them or project ${projectId}.`);
        notFound();
    }

  } catch (error: any) { // Catch for any unforeseen error in the try block logic itself
    console.error(`Unexpected error fetching data for editing agent ${agentId}:`, error);
    fetchError = error.message || 'An unexpected error occurred.';
    if (!agent) notFound(); // Ensure notFound if agent is still null
  }
  
  return (
    <EditAgentClientPage 
      projectId={projectId} 
      agent={agent} 
      presets={presets} 
      providers={providers} // Added
      fetchError={fetchError}
    />
  );
} 