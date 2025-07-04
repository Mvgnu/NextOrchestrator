'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface Agent {
  id: string
  name: string
  model: string
  description: string | null
}

interface AgentSelectorProps {
  agents: Agent[]
  selectedAgents: string[]
  onChange: (selectedAgentIds: string[]) => void
}

export default function AgentSelector({ agents, selectedAgents, onChange }: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localSelected, setLocalSelected] = useState<string[]>(selectedAgents)
  
  const handleToggleAgent = (agentId: string) => {
    setLocalSelected(prev => 
      prev.includes(agentId) 
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    )
  }
  
  const handleSave = () => {
    onChange(localSelected)
    setIsOpen(false)
  }
  
  const handleCancel = () => {
    setLocalSelected(selectedAgents)
    setIsOpen(false)
  }
  
  const getSelectedAgentNames = () => {
    return agents
      .filter(agent => selectedAgents.includes(agent.id))
      .map(agent => agent.name)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="justify-start w-full">
          <div className="flex flex-wrap gap-1 items-center">
            <span className="mr-1">Agents:</span>
            {getSelectedAgentNames().length > 0 ? (
              getSelectedAgentNames().map(name => (
                <Badge key={name} variant="secondary" className="text-xs">
                  {name}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">Select agents</span>
            )}
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Agents</DialogTitle>
          <DialogDescription>
            Choose which agents to include in this chat session
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-4 max-h-[300px] overflow-y-auto">
          {agents.length > 0 ? (
            agents.map(agent => (
              <div key={agent.id} className="flex items-start space-x-2">
                <Checkbox 
                  id={`agent-${agent.id}`}
                  checked={localSelected.includes(agent.id)}
                  onCheckedChange={() => handleToggleAgent(agent.id)}
                />
                <div>
                  <Label 
                    htmlFor={`agent-${agent.id}`}
                    className="text-base font-medium cursor-pointer"
                  >
                    {agent.name}
                  </Label>
                  <div className="text-xs text-muted-foreground">
                    Model: {agent.model}
                  </div>
                  {agent.description && (
                    <div className="text-xs mt-1">
                      {agent.description}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No agents available. Create some agents first.
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Selection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 