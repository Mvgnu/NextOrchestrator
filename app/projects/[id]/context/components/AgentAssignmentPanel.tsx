'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RefreshCw, UserPlus, Trash2, Check, Info, Loader2 } from 'lucide-react'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ContextDigest } from '@/app/services/contextService'
import agentAssignmentService, { 
  Agent, 
  AgentContextAssignment 
} from '@/app/services/agentAssignmentService'
import * as AgentClient from '@/lib/agent-client'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'

interface AgentAssignmentPanelProps {
  contextDigest: ContextDigest | null
  projectId: string
  userId: string
}

interface AgentWithAssignment extends AgentClient.Agent {
  isAssigned?: boolean
  role?: 'primary' | 'auxiliary' | 'specialist'
  priority?: number
  customInstructions?: string
  assignmentId?: string
}

export default function AgentAssignmentPanel({ 
  contextDigest, 
  projectId, 
  userId 
}: AgentAssignmentPanelProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [agents, setAgents] = useState<AgentWithAssignment[]>([])
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [role, setRole] = useState<'primary' | 'auxiliary' | 'specialist'>('primary')
  const [priority, setPriority] = useState<number>(5)
  const [customInstructions, setCustomInstructions] = useState<string>('')
  const { toast } = useToast()
  
  // Fetch agents for this project
  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true)
      try {
        // Call the API to get agents for this project
        const agentsData = await AgentClient.getProjectAgents(projectId)
        setAgents(
          agentsData.map((agent: AgentClient.Agent) => ({
            ...agent,
            isAssigned: false
          }))
        )
        
        // If agents exist, select the first one by default
        if (agentsData.length > 0) {
          setSelectedAgentId(agentsData[0].id)
        }
      } catch (error) {
        console.error('Error fetching agents:', error)
        toast({
          title: "Error",
          description: "Failed to load agents",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchAgents()
  }, [projectId, userId, toast])
  
  const handleSaveAssignment = async () => {
    if (!contextDigest || !selectedAgentId) {
      toast({
        title: "Error",
        description: "Please select an agent first",
        variant: "destructive"
      })
      return
    }
    
    setSaving(true)
    
    try {
      // Create the assignment data
      const assignmentData = {
        context_id: contextDigest.id,
        assignments: [
          {
            agent_id: selectedAgentId,
            role,
            priority,
            custom_instructions: customInstructions.trim() || undefined
          }
        ]
      }
      
      // Call API to save the assignment
      const response = await fetch('/api/contexts/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assignmentData)
      })
      
      if (!response.ok) {
        throw new Error('Failed to save agent assignment')
      }
      
      toast({
        title: "Success",
        description: "Agent assigned to context",
      })
      
    } catch (error) {
      console.error('Error saving assignment:', error)
      toast({
        title: "Error",
        description: "Failed to assign agent",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }
  
  if (!contextDigest) {
    return (
      <Card className="p-4 mt-4">
        <p className="text-center text-muted-foreground">
          Generate a context digest first to assign agents
        </p>
      </Card>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Agent Assignment</h3>
        <Button variant="outline" asChild>
          <Link href={`/projects/${projectId}/agents/new`}>
            <UserPlus className="h-4 w-4 mr-2" />
            Create New Agent
          </Link>
        </Button>
      </div>
      
      <Card className="p-4">
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No agents available</p>
              <Button variant="outline" className="mt-2" asChild>
                <Link href={`/projects/${projectId}/agents/new`}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Your First Agent
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="agent-select">Select Agent</Label>
                <Select
                  value={selectedAgentId || undefined}
                  onValueChange={setSelectedAgentId}
                >
                  <SelectTrigger id="agent-select">
                    <SelectValue placeholder="Select an agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAgentId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {agents.find(a => a.id === selectedAgentId)?.description || 'No description available'}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role-select">Agent Role</Label>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as any)}
                >
                  <SelectTrigger id="role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="auxiliary">Auxiliary</SelectItem>
                    <SelectItem value="specialist">Specialist</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center mt-1">
                  <div className="text-xs text-muted-foreground">
                    {role === 'primary' ? (
                      'Main agent responsible for handling this context'
                    ) : role === 'specialist' ? (
                      'Expert agent for specific aspects of this context'
                    ) : (
                      'Supporting agent that provides additional insights'
                    )}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
                          <Info className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-sm">
                        <p><strong>Primary:</strong> Main agent responsible for this context.</p>
                        <p><strong>Specialist:</strong> Expert in specific aspects of this context.</p>
                        <p><strong>Auxiliary:</strong> Provides supporting information.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="priority-select">Priority (1-10)</Label>
                  <span className="text-sm">{priority}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Higher priority agents are consulted first
                </p>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label htmlFor="custom-instructions">Custom Instructions (Optional)</Label>
                <textarea
                  id="custom-instructions"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Add specific instructions for this agent with this context..."
                  className="w-full min-h-[100px] p-2 border rounded-md"
                />
              </div>
              
              <Button 
                onClick={handleSaveAssignment} 
                disabled={saving || !selectedAgentId}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Assign Agent to Context
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  )
} 