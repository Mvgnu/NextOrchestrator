'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import supabase from '@/lib/supabase'

interface AgentEditFormProps {
  projectId: string
  userId: string
  contexts: {
    id: string
    name: string
  }[]
  agent: {
    id: string
    name: string
    description: string | null
    model: string
    temperature: number
    max_tokens: number | null
    system_prompt: string
    memory_enabled: boolean
  }
}

export default function AgentEditForm({ projectId, userId, contexts, agent }: AgentEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [model, setModel] = useState('gpt-4')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState<number | null>(null)
  const [systemPrompt, setSystemPrompt] = useState('')
  const [memoryEnabled, setMemoryEnabled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load agent data when component mounts
  useEffect(() => {
    if (agent) {
      setName(agent.name)
      setDescription(agent.description || '')
      setModel(agent.model)
      setTemperature(agent.temperature)
      setMaxTokens(agent.max_tokens)
      setSystemPrompt(agent.system_prompt)
      setMemoryEnabled(agent.memory_enabled)
    }
  }, [agent])

  // AI model options
  const models = [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
    { value: 'gemini-pro', label: 'Gemini Pro' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    if (!name.trim()) {
      setError('Agent name is required')
      setIsSubmitting(false)
      return
    }

    if (!systemPrompt.trim()) {
      setError('System prompt is required')
      setIsSubmitting(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('agents')
        .update({
          name,
          description: description || null,
          model,
          temperature,
          max_tokens: maxTokens,
          system_prompt: systemPrompt,
          memory_enabled: memoryEnabled,
        })
        .eq('id', agent.id)
        .select()
        .single()

      if (error) throw error

      // Redirect back to project page after successful update
      router.push(`/projects/${projectId}`)
      router.refresh()
    } catch (err) {
      console.error('Error updating agent:', err)
      setError('Failed to update agent. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Agent Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          placeholder="e.g., Research Assistant"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          placeholder="Describe this agent's purpose..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">AI Model</Label>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger>
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="temperature">Temperature: {temperature}</Label>
          <span className="text-sm text-muted-foreground">
            {temperature < 0.3 ? 'More deterministic' : temperature > 0.7 ? 'More creative' : 'Balanced'}
          </span>
        </div>
        <Slider
          id="temperature"
          min={0}
          max={1}
          step={0.1}
          value={[temperature]}
          onValueChange={(value: number[]) => setTemperature(value[0])}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="max-tokens">Max Tokens: {maxTokens}</Label>
          <span className="text-sm text-muted-foreground">
            {maxTokens === null ? 'Default for model' : `Limit: ${maxTokens} tokens`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Slider
            id="max-tokens"
            min={1000}
            max={16000}
            step={1000}
            value={[maxTokens || 4000]}
            onValueChange={(value: number[]) => setMaxTokens(value[0])}
            disabled={maxTokens === null}
            className="flex-1"
          />
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => setMaxTokens(maxTokens === null ? 4000 : null)}
            className="whitespace-nowrap"
          >
            {maxTokens === null ? 'Set Limit' : 'Use Default'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="system-prompt">System Prompt</Label>
        <Textarea
          id="system-prompt"
          value={systemPrompt}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSystemPrompt(e.target.value)}
          placeholder="Instructions for the agent..."
          rows={5}
          required
        />
      </div>

      <Separator className="my-4" />
      
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="memory-enabled"
          checked={memoryEnabled}
          onCheckedChange={(checked) => setMemoryEnabled(checked === true)}
        />
        <div>
          <Label 
            htmlFor="memory-enabled" 
            className="text-sm font-medium cursor-pointer"
          >
            Enable conversation memory
          </Label>
          <p className="text-xs text-muted-foreground">
            When enabled, the agent will remember previous messages in the conversation
          </p>
        </div>
      </div>

      {error && (
        <div className="text-sm font-medium text-destructive">{error}</div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          className="flex-1"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Updating...' : 'Update Agent'}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/projects/${projectId}`)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
} 