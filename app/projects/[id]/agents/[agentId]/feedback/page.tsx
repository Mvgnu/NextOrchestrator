import { Metadata } from 'next'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import AgentFeedbackDashboard from './components/AgentFeedbackDashboard'

export const metadata: Metadata = {
  title: 'Agent Feedback',
  description: 'Review and analyze feedback for your agent',
}

interface AgentFeedbackPageProps {
  params: {
    id: string
    agentId: string
  }
}

export default async function AgentFeedbackPage({ params }: AgentFeedbackPageProps) {
  const projectId = params.id
  const agentId = params.agentId
  
  // In a real app, these would be fetched from your database
  // For now, we'll use mock data
  const userId = 'user123'
  const agentName = 'General Assistant'
  
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Agent Feedback</h1>
        <p className="text-muted-foreground">
          Review feedback and performance analytics for {agentName}
        </p>
      </div>
      
      <AgentFeedbackDashboard 
        projectId={projectId}
        agentId={agentId}
        userId={userId}
      />
    </div>
  )
} 