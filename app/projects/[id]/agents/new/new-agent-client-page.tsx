'use client'

import { useRouter } from 'next/navigation' // Keep useRouter if needed for navigation
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeftIcon } from '@radix-ui/react-icons'
import AgentCreationForm from './agent-creation-form'
import type { AgentPreset } from '@/lib/agent-preset-service' // Import the AgentPreset type
import type { Provider } from '@/lib/model-management-service' // Added

interface NewAgentClientPageProps {
  projectId: string;
  presets: AgentPreset[];
  providers: Provider[]; // Added
}

export default function NewAgentClientPage({ projectId, presets, providers }: NewAgentClientPageProps) { // Added providers
  const router = useRouter() // For the back button

  if (!projectId) {
    // This should ideally be caught by the Server Component, but as a fallback:
    return <p>Error: Project ID is missing.</p>; 
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-2">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
          <h1 className="text-3xl font-bold">Create New Agent</h1>
          <p className="text-muted-foreground">
            Configure and create a new agent for project: <Link href={`/projects/${projectId}`} className="text-primary hover:underline">{projectId}</Link>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>New Agent Configuration</CardTitle>
            <CardDescription>Use the form below to define your new agent. You can start from a template or configure manually.</CardDescription>
        </CardHeader>
        <CardContent>
            {/* Pass presets and providers to AgentCreationForm */}
            <AgentCreationForm projectId={projectId} presets={presets} providers={providers} /> {/* Added providers */}
        </CardContent>
      </Card>
    </div>
  )
} 