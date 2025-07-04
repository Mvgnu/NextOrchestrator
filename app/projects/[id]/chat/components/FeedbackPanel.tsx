'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ThumbsUp, ThumbsDown, MessageCircle, CheckCircle, RefreshCw } from 'lucide-react'
import feedbackService, { FeedbackRating } from '@/app/services/feedbackService'
import { SynthesisResult, AgentResponse } from '@/app/services/synthesisService'
import { Agent } from '@/app/services/agentAssignmentService'

interface FeedbackPanelProps {
  synthesisResult: SynthesisResult
  agents: Agent[]
  projectId: string
  userId: string
  onFeedbackSubmitted?: () => void
}

export default function FeedbackPanel({
  synthesisResult,
  agents,
  projectId,
  userId,
  onFeedbackSubmitted
}: FeedbackPanelProps) {
  const [activePanel, setActivePanel] = useState<'synthesis' | 'agent' | null>(null)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [comments, setComments] = useState('')
  const [rating, setRating] = useState<FeedbackRating>({
    accuracy: 3,
    relevance: 3,
    completeness: 3,
    clarity: 3
  })
  
  // Reset the form
  const resetForm = () => {
    setComments('');
    setRating({
      accuracy: 3,
      relevance: 3,
      completeness: 3,
      clarity: 3
    });
    setFeedbackSubmitted(false);
  };
  
  // Open feedback for synthesis
  const openSynthesisFeedback = () => {
    resetForm();
    setActivePanel('synthesis');
  };
  
  // Open feedback for a specific agent
  const openAgentFeedback = (agentId: string) => {
    resetForm();
    setSelectedAgentId(agentId);
    setActivePanel('agent');
  };
  
  // Handle form submission
  const handleSubmitFeedback = async () => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      if (activePanel === 'synthesis') {
        // Submit feedback for synthesis
        await feedbackService.submitSynthesisFeedback(
          synthesisResult.id,
          'query-' + synthesisResult.id, // Mock query ID
          rating,
          comments,
          userId
        );
      } else if (activePanel === 'agent' && selectedAgentId) {
        // Find the response for this agent
        const agentResponse = synthesisResult.agentResponses.find(
          r => r.agentId === selectedAgentId
        );
        
        if (agentResponse) {
          // Submit feedback for agent response
          await feedbackService.submitAgentFeedback({
            agent_id: selectedAgentId,
            message_id: 'response-' + agentResponse.agentId, // Mock response ID
            query_id: 'query-' + synthesisResult.id, // Mock query ID
            rating_overall: Object.values(rating).reduce((sum, val) => sum + val, 0) / Object.values(rating).length,
            rating_accuracy: rating.accuracy,
            rating_relevance: rating.relevance,
            rating_completeness: rating.completeness,
            rating_clarity: rating.clarity,
            comments: comments,
            user_id: userId,
            project_id: projectId
          });
        }
      }
      
      setFeedbackSubmitted(true);
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Render the rating sliders
  const renderRatingSliders = () => {
    const categories = [
      { key: 'accuracy', label: 'Accuracy' },
      { key: 'relevance', label: 'Relevance' },
      { key: 'completeness', label: 'Completeness' },
      { key: 'clarity', label: 'Clarity' }
    ];
    
    return (
      <div className="space-y-6 my-4">
        {categories.map(category => (
          <div key={category.key} className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor={`rating-${category.key}`}>{category.label}</Label>
              <span className="text-sm font-medium">
                {rating[category.key as keyof FeedbackRating]}/5
              </span>
            </div>
            <Slider
              id={`rating-${category.key}`}
              min={1}
              max={5}
              step={1}
              value={[rating[category.key as keyof FeedbackRating]]}
              onValueChange={(values) => {
                setRating({
                  ...rating,
                  [category.key]: values[0]
                });
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Render the feedback form
  const renderFeedbackForm = () => {
    if (feedbackSubmitted) {
      return (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 mx-auto text-primary mb-4" />
          <h3 className="text-lg font-medium">Feedback Submitted</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Thank you for your feedback! It helps us improve our AI agents.
          </p>
          <Button onClick={resetForm}>Submit Another Feedback</Button>
        </div>
      );
    }
    
    return (
      <>
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">
            {activePanel === 'synthesis' 
              ? 'Synthesis Feedback' 
              : `Feedback for ${agents.find(a => a.id === selectedAgentId)?.name || 'Agent'}`}
          </h3>
          <p className="text-sm text-muted-foreground">
            Please rate the response on the following criteria and provide any additional comments.
          </p>
        </div>
        
        {renderRatingSliders()}
        
        <div className="space-y-2 my-4">
          <Label htmlFor="feedback-comments">Additional Comments</Label>
          <Textarea
            id="feedback-comments"
            placeholder="What did you like or dislike about the response? Any suggestions for improvement?"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setActivePanel(null);
              setSelectedAgentId(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitFeedback}
            disabled={loading}
          >
            {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Submit Feedback
          </Button>
        </DialogFooter>
      </>
    );
  };
  
  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-2">
        <MessageCircle className="h-4 w-4" />
        <h3 className="text-sm font-medium">Feedback</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <Dialog open={activePanel === 'synthesis'} onOpenChange={(open) => {
          if (!open) setActivePanel(null);
        }}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={openSynthesisFeedback}
            >
              <ThumbsUp className="h-3 w-3 mr-1" />
              Rate Synthesis
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Provide Feedback on Synthesis</DialogTitle>
              <DialogDescription>
                Your feedback helps us improve the quality of our AI synthesis.
              </DialogDescription>
            </DialogHeader>
            {renderFeedbackForm()}
          </DialogContent>
        </Dialog>
        
        {agents.length > 0 && synthesisResult.agentResponses.map(response => {
          const agent = agents.find(a => a.id === response.agentId);
          if (!agent) return null;
          
          return (
            <Dialog 
              key={response.agentId}
              open={activePanel === 'agent' && selectedAgentId === response.agentId} 
              onOpenChange={(open) => {
                if (!open) {
                  setActivePanel(null);
                  setSelectedAgentId(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => openAgentFeedback(response.agentId)}
                >
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Rate {agent.name}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Provide Feedback on {agent.name}</DialogTitle>
                  <DialogDescription>
                    Your feedback helps us improve the agent's responses.
                  </DialogDescription>
                </DialogHeader>
                {renderFeedbackForm()}
              </DialogContent>
            </Dialog>
          );
        })}
      </div>
    </div>
  );
} 