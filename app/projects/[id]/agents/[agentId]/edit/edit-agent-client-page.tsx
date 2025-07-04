'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import AgentCreationForm from '../../new/agent-creation-form' // CORRECTED path to reuse form
import type { Agent } from '@/lib/agent-service'
import type { AgentPreset } from '@/lib/agent-preset-service'
import type { Provider } from '@/lib/model-management-service'

interface EditAgentClientPageProps {
  projectId: string;
  agent: Agent | null; // Agent can be null if fetch failed initially
  presets: AgentPreset[];
  providers: Provider[];
  fetchError: string | null;
}

export default function EditAgentClientPage({ 
  projectId, 
  agent, 
  presets, 
  providers,
  fetchError 
}: EditAgentClientPageProps) {
  const router = useRouter()

  if (fetchError && !agent) { // If there was a critical error fetching the agent itself
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-destructive/10 border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">Error Loading Agent</CardTitle>
            </CardHeader>
            <CardContent>
                <p>{fetchError}</p>
                <Button onClick={() => router.back()} variant="outline" className="mt-4">Go Back</Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!agent) {
    // This case should ideally be handled by the server component returning notFound()
    // but as a fallback for client-side rendering issues or partial data.
    return <p className="p-4">Agent data is not available. Please try again.</p>;
  }
  
  // If presets fetch failed but agent data is available, we can still proceed
  if (fetchError && presets.length === 0) {
      console.warn("Failed to fetch presets, proceeding with agent edit form without them.");
  }
  // Also log if providers fetch failed but we are proceeding
  if (fetchError && providers.length === 0) {
    console.warn("Failed to fetch providers, proceeding with agent edit form without them.");
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-2">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Agents
          </Button>
          <h1 className="text-3xl font-bold">Edit Agent</h1>
          <p className="text-muted-foreground">
            Modify agent <span className="font-semibold">{agent.name}</span> for project <Link href={`/projects/${projectId}`} className="text-primary hover:underline">{projectId}</Link>
          </p>
        </div>
      </div>

      {fetchError && (presets.length === 0 || providers.length === 0) && (
         <Card className="mb-4 bg-yellow-50 border-yellow-300">
            <CardHeader><CardTitle className="text-yellow-700 text-sm">Data Loading Issue</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-yellow-600">{fetchError} Some data (presets or providers) could not be loaded. You can still edit the agent manually.</p></CardContent>
         </Card>
      )}

      <Card>
        <CardHeader>
            <CardTitle>Agent Configuration</CardTitle>
            <CardDescription>Update the details for this agent.</CardDescription>
        </CardHeader>
        <CardContent>
            <AgentCreationForm 
                projectId={projectId} 
                presets={presets} 
                providers={providers}
                existingAgent={agent}
            />
        </CardContent>
      </Card>
    </div>
  )
} 