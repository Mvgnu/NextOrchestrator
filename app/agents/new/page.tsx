import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { agentTemplates } from '@/lib/ai-config'

export default function NewAgentPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <Link href="/agents" className="text-sm text-blue-500 mb-4 block">&larr; Back to Agents</Link>
        <h1 className="text-3xl font-bold">Create New Agent</h1>
        <p className="text-muted-foreground">Configure a new agent with specialized abilities</p>
      </div>
      
      <form>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="name">
                  Agent Name
                </label>
                <input
                  id="name"
                  type="text"
                  className="w-full border rounded-md px-3 py-2"
                  placeholder="e.g., Research Assistant"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="type">
                  Agent Type
                </label>
                <select
                  id="type"
                  className="w-full border rounded-md px-3 py-2"
                >
                  {agentTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name} - {template.description}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>
          
          {/* Model Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Model Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="provider">
                  Provider
                </label>
                <select
                  id="provider"
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                  <option value="xai">xAI</option>
                  <option value="deepseek">DeepSeek</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="model">
                  Model
                </label>
                <select
                  id="model"
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="claude-3-opus">Claude 3 Opus</option>
                  <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                  <option value="claude-3-haiku">Claude 3 Haiku</option>
                  <option value="gemini-pro">Gemini Pro</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input type="checkbox" id="memory" className="mr-2" />
                <label htmlFor="memory" className="text-sm">
                  Enable Memory (Agent remembers conversation history)
                </label>
              </div>
            </CardContent>
          </Card>
          
          {/* Prompt Template */}
          <Card>
            <CardHeader>
              <CardTitle>Prompt Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="tone">
                  Tone
                </label>
                <select
                  id="tone"
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="neutral">Neutral</option>
                  <option value="formal">Formal</option>
                  <option value="friendly">Friendly</option>
                  <option value="academic">Academic</option>
                  <option value="creative">Creative</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" htmlFor="base-prompt">
                  Base Prompt
                </label>
                <textarea
                  id="base-prompt"
                  className="w-full border rounded-md px-3 py-2 h-32"
                  placeholder="Enter the base prompt that defines this agent's behavior..."
                  defaultValue="You are a helpful assistant. Your task is to analyze the provided context and respond to user questions with relevant insights."
                ></textarea>
                <p className="text-xs text-muted-foreground mt-1">
                  Define how this agent should behave and approach problems.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline">
              <Link href="/agents">Cancel</Link>
            </Button>
            <Button type="submit">Create Agent</Button>
          </div>
        </div>
      </form>
    </div>
  )
} 