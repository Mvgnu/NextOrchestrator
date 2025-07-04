import type { Metadata } from 'next'
import AgentPerformanceClient from './agent-performance-client'

export const metadata: Metadata = {
  title: 'Agent Performance',
  description: 'View and analyze agent performance metrics',
}

// Mark this page as dynamic to prevent static generation
export const dynamic = 'force-dynamic'

export default function AgentPerformancePage() {
  return <AgentPerformanceClient />
} 