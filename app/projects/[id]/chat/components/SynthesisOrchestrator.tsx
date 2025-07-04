'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Send, Search, CheckCircle, XCircle, Clock } from 'lucide-react'
import synthesisService, { 
  SynthesisOrchestration, 
  SynthesisStage, 
  SynthesisResult,
  AgentResponse,
  SynthesisOptions
} from '@/app/services/synthesisService'
import { AgentContextAssignment } from '@/app/services/agentAssignmentService'
import { ContextDigest } from '@/app/services/contextService'
import FeedbackPanel from './FeedbackPanel'

// Adjusted interface to match what the synthesisService expects
interface Agent {
  id: string
  name: string
  description: string | null
  model: string
  temperature: number
  max_tokens: number | null
  system_prompt: string
  project_id: string
  user_id: string
  memory_enabled: boolean
  created_at: string
  updated_at: string
}

interface SynthesisOrchestratorProps {
  projectId: string
  userId: string
  agents: Agent[]
  contextDigests: ContextDigest[]
  onSynthesisComplete?: (result: SynthesisResult) => void
}

export default function SynthesisOrchestrator({
  projectId,
  userId,
  agents,
  contextDigests,
  onSynthesisComplete
}: SynthesisOrchestratorProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [orchestration, setOrchestration] = useState<SynthesisOrchestration | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  
  // Run synthesis orchestration
  const handleRunSynthesis = async () => {
    if (!query.trim() || loading) return;
    
    setLoading(true);
    setError(null);
    setOrchestration(null);
    setShowFeedback(false);
    
    try {
      // Mock agent-context assignments for now (would be fetched from an actual service)
      const mockAssignments: SynthesisOptions = {
        temperature: 0.7,
        maxTokens: 2000
      };
      
      // Run the orchestration
      const result = await synthesisService.runOrchestration(
        query,
        agents,
        contextDigests,
        mockAssignments
      );
      
      // Update state with orchestration result
      setOrchestration(result);
      
      // Show feedback panel for completed orchestrations
      if (result.status === 'completed' && result.result) {
        setShowFeedback(true);
      }
      
      // Notify parent when synthesis is complete
      if (result.status === 'completed' && result.result && onSynthesisComplete) {
        onSynthesisComplete(result.result);
      }
    } catch (err) {
      console.error('Error running synthesis:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Render a stage status badge
  const renderStageStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return <Badge className="bg-gray-500">Unknown</Badge>;
    }
  };
  
  // Render stage details
  const renderStages = (stages: SynthesisStage[]) => {
    return (
      <div className="space-y-3 my-4">
        {stages.map(stage => (
          <div key={stage.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {stage.status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : stage.status === 'in_progress' ? (
                  <Clock className="h-5 w-5 text-blue-500" />
                ) : stage.status === 'failed' ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-500" />
                )}
                <span className="font-medium">
                  {stage.name.charAt(0).toUpperCase() + stage.name.slice(1)}
                </span>
              </div>
              {renderStageStatus(stage.status)}
            </div>
            
            <p className="text-sm text-muted-foreground">
              {stage.description}
            </p>
            
            {stage.result && (
              <div className="mt-2 text-sm bg-muted p-2 rounded">
                {stage.result}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  // Render agent responses
  const renderAgentResponses = (responses: AgentResponse[]) => {
    return (
      <div className="space-y-3 my-4">
        <h3 className="text-lg font-medium">Agent Responses</h3>
        {responses.map((response, index) => {
          const agent = agents.find(a => a.id === response.agentId);
          return (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">
                  {agent?.name || `Agent ${index + 1}`}
                </span>
                <Badge variant="outline">
                  {agent?.model || 'Unknown Model'}
                </Badge>
              </div>
              
              <div className="bg-muted rounded p-3 max-h-[200px] overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap">{response.content}</pre>
              </div>
              
              {response.metadata && response.metadata.tokens && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Tokens: {response.metadata.tokens.total} | Model: {response.metadata.modelName} | Reason: {response.metadata.finishReason}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  // Render synthesis result
  const renderSynthesisResult = (result: SynthesisResult) => {
    return (
      <div className="space-y-3 my-4">
        <h3 className="text-lg font-medium">Synthesized Response</h3>
        
        <div className="bg-muted rounded p-4 max-h-[500px] overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap">{result.content}</pre>
        </div>
        
        {result.metadata && (
          <div className="text-xs text-muted-foreground">
            <span>Model: {result.metadata.modelName}</span>
            <span className="mx-2">|</span>
            <span>Tokens: {result.metadata.tokens.total}</span>
            <span className="mx-2">|</span>
            <span>Time: {(result.metadata.executionTimeMs / 1000).toFixed(2)}s</span>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Synthesis Orchestrator</h2>
        
        <div className="flex gap-2">
          <Input
            placeholder="Enter your query..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleRunSynthesis();
              }
            }}
            disabled={loading}
            className="flex-1"
          />
          <Button 
            onClick={handleRunSynthesis} 
            disabled={!query.trim() || loading}
          >
            {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            Run
          </Button>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {orchestration && (
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Orchestration Status</h3>
              <Badge
                className={
                  orchestration.status === 'completed'
                    ? 'bg-green-500'
                    : orchestration.status === 'in_progress'
                    ? 'bg-blue-500'
                    : orchestration.status === 'failed'
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
                }
              >
                {orchestration.status.charAt(0).toUpperCase() + orchestration.status.slice(1)}
              </Badge>
            </div>
            
            <div className="text-sm text-muted-foreground mt-1">
              <span>Query: "{orchestration.query}"</span>
              <span className="mx-2">|</span>
              <span>Started: {orchestration.startedAt.toLocaleTimeString()}</span>
              {orchestration.completedAt && (
                <>
                  <span className="mx-2">|</span>
                  <span>
                    Duration: {((orchestration.completedAt.getTime() - orchestration.startedAt.getTime()) / 1000).toFixed(2)}s
                  </span>
                </>
              )}
            </div>
            
            <Separator className="my-4" />
            
            {renderStages(orchestration.stages)}
            
            {orchestration.result && orchestration.result.agentResponses && orchestration.result.agentResponses.length > 0 && (
              <>
                <Separator className="my-4" />
                {renderAgentResponses(orchestration.result.agentResponses)}
              </>
            )}
            
            {orchestration.result && (
              <>
                <Separator className="my-4" />
                {renderSynthesisResult(orchestration.result)}
                
                {showFeedback && orchestration.status === 'completed' && (
                  <>
                    <Separator className="my-4" />
                    <FeedbackPanel
                      synthesisResult={orchestration.result}
                      agents={agents.map(a => ({
                        id: a.id,
                        name: a.name,
                        description: a.description,
                        model: a.model,
                        temperature: a.temperature,
                        maxTokens: a.max_tokens || undefined,
                        systemPrompt: a.system_prompt,
                        projectId: a.project_id,
                        userId: a.user_id,
                        createdAt: new Date(a.created_at),
                        updatedAt: new Date(a.updated_at)
                      }))}
                      projectId={projectId}
                      userId={userId}
                      onFeedbackSubmitted={() => setShowFeedback(false)}
                    />
                  </>
                )}
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
} 