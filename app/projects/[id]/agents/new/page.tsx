import { getServerSession } from 'next-auth/next'
// import { authOptions } from '@/lib/auth' // authOptions might not be needed if using auth() from next-auth directly in RSC
import { auth } from '@/lib/auth'; // Prefer using the exported auth for RSC
import { AgentPresetService, type AgentPreset } from '@/lib/agent-preset-service'
import { ModelManagementService, type Provider } from '@/lib/model-management-service' // Added
import NewAgentClientPage from './new-agent-client-page' // We will create this next
import { notFound, redirect } from 'next/navigation'

interface NewAgentPageProps {
  params: {
    id: string // This is projectId
  }
}

// This is now an async Server Component
export default async function NewAgentPage({ params }: NewAgentPageProps) {
  // const session = await getServerSession(authOptions) // Old way
  const session = await auth(); // New way with exported auth

  if (!session?.user?.id) {
    // Redirect to sign-in or show an unauthorized message
    // For now, redirecting to sign-in might be too abrupt if they just need to log in.
    // Consider a more user-friendly approach or ensure auth guards are in place earlier.
    console.error('No session found, redirecting or showing error...')
    // For simplicity in this step, let's assume an auth guard higher up or redirect from middleware.
    // If trying to access this page directly without session, it might break here.
    // redirect('/auth/signin'); // Or handle as per your auth flow
    return <p>Unauthorized. Please <a href={`/auth/signin?callbackUrl=/projects/${params.id}/agents/new`}>sign in</a>.</p>; // Placeholder
  }

  const projectId = params.id
  if (!projectId) {
    console.error('Project ID is missing from params')
    notFound() // Or redirect to a generic error page or projects list
  }

  let presets: AgentPreset[] = []
  let providers: Provider[] = [] // Added

  try {
    presets = await AgentPresetService.getUserPresets(session.user.id)
  } catch (error) {
    console.error('Failed to fetch agent presets:', error)
    // Optionally, render the page without presets or show an error message
    // For now, we'll proceed with an empty presets array if fetching fails
  }

  try {
    providers = await ModelManagementService.getAllProviders() // Added
  } catch (error) {
    console.error('Failed to fetch providers:', error)
    // Decide if this is critical. For now, page might be less useful without providers.
    // Consider showing an error message to the user or fallback.
  }

  // Render the client component, passing down projectId, presets, and providers
  return <NewAgentClientPage projectId={projectId} presets={presets} providers={providers} />
} 