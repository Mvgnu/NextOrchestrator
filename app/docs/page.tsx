import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function DocsHomePage() {
  return (
    <>
      <h1 className="text-3xl font-bold mb-6">MARS Next Documentation</h1>
      
      <p className="text-lg text-muted-foreground mb-8">
        Welcome to the official documentation for MARS Next. Here you'll find everything 
        you need to get started and make the most out of the platform's features.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 not-prose">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Learn how to set up your account, create your first project, and understand the basic workflow.</p>
            <Link href="/docs/getting-started" className="text-primary hover:underline">
              Read More →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Manage your projects, understand project structure, and configure project settings.</p>
            <Link href="/docs/projects" className="text-primary hover:underline">
              Read More →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Create, configure, and manage AI agents for different tasks within your projects.</p>
            <Link href="/docs/agents" className="text-primary hover:underline">
              Read More →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contexts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Upload, manage, and utilize context documents to inform your AI agents.</p>
            <Link href="/docs/contexts" className="text-primary hover:underline">
              Read More →
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Chat Interface</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Interact with your agents, manage conversations, and synthesize information.</p>
            <Link href="/docs/chat" className="text-primary hover:underline">
              Read More →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Monitor your API usage and analyze agent performance metrics.</p>
            <Link href="/docs/analytics" className="text-primary hover:underline">
              Read More →
            </Link>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
