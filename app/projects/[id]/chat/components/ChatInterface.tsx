'use client'

import { useState, useRef, useEffect } from 'react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Send, RefreshCw } from 'lucide-react'
import agentService, { ExecutionContext } from '@/app/services/agentService'

interface Agent {
  id: string
  name: string
  model: string
  description: string | null
}

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  createdAt: Date
  agentId?: string
}

interface AgentResponse {
  content: string
  agentId: string
  metadata?: {
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    modelName: string;
    finishReason: string;
  };
}

interface ChatInterfaceProps {
  projectId: string
  userId: string
  agents: Agent[]
  projectName: string
}

export default function ChatInterface({ projectId, userId, agents, projectName }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [agentResponses, setAgentResponses] = useState<AgentResponse[]>([])
  const [synthesis, setSynthesis] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    // Load previous messages
    const loadMessages = async () => {
      // Here you would fetch messages from your database
      // For now we'll use empty array
      setMessages([])
    }
    
    loadMessages()
    
    // Focus the input field
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [projectId])
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  const handleSendMessage = async () => {
    if (input.trim() === '' || loading) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      createdAt: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    
    try {
      // Clear previous responses and synthesis
      setAgentResponses([])
      setSynthesis(null)
      
      if (agents.length > 0) {
        // Set up execution context
        const context: ExecutionContext = {
          projectId,
          userId
        };
        
        // Execute all agent requests in parallel
        const result = await agentService.executeParallelAgents(agents, input, context);
        
        // Update state with responses
        setAgentResponses(result.responses);
        setSynthesis(result.synthesis.content);
        
        // Add the synthesized response to messages
        const assistantMessage: Message = {
          id: Date.now().toString(),
          content: result.synthesis.content,
          role: 'assistant',
          createdAt: new Date()
        }
        
        setMessages(prev => [...prev, assistantMessage])
      } else {
        // Fallback if no agents are available
        const assistantMessage: Message = {
          id: Date.now().toString(),
          content: "No agents available to process your request.",
          role: 'assistant',
          createdAt: new Date()
        }
        
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Error in agent execution:', error)
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "An error occurred while processing your request.",
        role: 'assistant',
        createdAt: new Date()
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="py-4 px-6 border-b flex items-center justify-between bg-card">
        <h2 className="text-xl font-semibold">{projectName} - Chat</h2>
        <div className="flex gap-2">
          {agents.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Agents: {agents.map(a => a.name).join(', ')}
            </div>
          )}
        </div>
      </div>
      
      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map(message => (
            <div 
              key={message.id} 
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground ml-12' 
                    : 'bg-muted mr-12'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <div className="mt-1 text-xs opacity-70">
                  {message.createdAt.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Agent Response Debug Panel (can be hidden in production) */}
      {agentResponses.length > 0 && (
        <div className="border-t p-2 bg-muted/30">
          <div className="text-xs font-medium mb-2">Agent Responses (Debug View)</div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {agentResponses.map((response, index) => (
              <div key={index} className="text-xs p-2 bg-muted rounded">
                <div className="font-medium">
                  {agents.find(a => a.id === response.agentId)?.name || response.agentId}:
                </div>
                <div className="truncate">{response.content}</div>
                {response.metadata && (
                  <div className="text-xs mt-1 text-muted-foreground">
                    Tokens: {response.metadata.tokens.total} | Model: {response.metadata.modelName}
                  </div>
                )}
              </div>
            ))}
          </div>
          <Separator className="my-2" />
        </div>
      )}
      
      {/* Input Area */}
      <div className="border-t p-4 bg-card">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            placeholder="Type your message..."
            disabled={loading}
            className="flex-1"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={loading || input.trim() === ''}
            size="icon"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
} 