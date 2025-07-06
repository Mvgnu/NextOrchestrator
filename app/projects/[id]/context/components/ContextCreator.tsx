'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MessageSquare, CheckCircle, RefreshCw, Send, Save, Loader2 } from 'lucide-react'
import * as ContextClient from '@/lib/context-client'
import { v4 as uuidv4 } from 'uuid'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import clientLogger from '@/lib/client-logger'

interface Message {
  id: string
  role: 'agent' | 'user'
  content: string
  timestamp: Date
}

interface ContextCreatorProps {
  projectId: string
  userId: string
}

export default function ContextCreator({ 
  projectId, 
  userId,
}: ContextCreatorProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('chat')
  const [contextComplete, setContextComplete] = useState(false)
  const [contextContent, setContextContent] = useState('')
  const [contextName, setContextName] = useState('')
  const [saveError, setSaveError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  
  // Initialize chat with the first agent message
  useEffect(() => {
    setMessages([
      {
        id: uuidv4(),
        role: 'agent',
        content: "Hi there! I'll help you create a context for your project. Let's build it together through conversation. To start, could you tell me what this project is about?",
        timestamp: new Date()
      }
    ])
  }, [])
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // Simulate agent response generation
  const generateAgentResponse = async (userMessage: string) => {
    // In a real implementation, this would call your LLM API
    // For now, we'll use predefined responses based on message count
    
    // Simulate API call with delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const messageCount = messages.filter(m => m.role === 'user').length
    
    let responseContent = ''
    
    // Simple conversation flow based on how many questions have been answered
    switch (messageCount) {
      case 0:
        responseContent = `Thanks for sharing that! Let me ask a few more questions to build a comprehensive context.\n\nWhat are the main goals or objectives of this project?`
        break
      case 1:
        responseContent = `Great! Now I have a better understanding of your goals. Let's get more specific.\n\nWho are the primary users or audience for this project? What are their needs?`
        break
      case 2:
        responseContent = `That's helpful information about your audience. Now, let's discuss any specific requirements or constraints.\n\nAre there any technical, budget, or timeline constraints I should know about?`
        break
      case 3:
        responseContent = `I understand the constraints now. Let's talk about any existing work or research.\n\nHave you already done any work or research for this project that should be included in the context?`
        break
      case 4:
        responseContent = `Thanks for all this information! I think I have enough to create a context document for your project now. Would you like to add anything else before I generate it?`
        break
      default:
        responseContent = `I've captured that additional information. I now have enough to generate a comprehensive context for your project. Click "Generate Context" when you're ready!`
    }
    
    return {
      id: uuidv4(),
      role: 'agent' as const,
      content: responseContent,
      timestamp: new Date()
    }
  }
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading || isSaving) return
    
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setLoading(true)
    
    try {
      const agentResponse = await generateAgentResponse(inputValue)
      setMessages(prev => [...prev, agentResponse])
    } catch (error) {
      clientLogger.error('Error generating agent response:', error)
      toast({
        title: "Agent Error",
        description: "Failed to get response from agent.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Generate the context document
  const handleGenerateContext = async () => {
    setLoading(true)
    setContextName('Generated Context ' + new Date().toLocaleTimeString())
    
    try {
      // Extract all the user messages
      const userMessages = messages
        .filter(m => m.role === 'user')
        .map(m => m.content)
      
      // Draft content to send for digestion
      const draftContent = `
# Project Context Information

## Project Overview
${userMessages[0] || 'Not provided'}

## Goals and Objectives
${userMessages[1] || 'Not provided'}

## Target Audience
${userMessages[2] || 'Not provided'}

## Constraints and Requirements
${userMessages[3] || 'Not provided'}

## Existing Work and Research
${userMessages[4] || 'Not provided'}

## Additional Information
${userMessages.slice(5).join('\n\n') || 'None'}
`;

      // Use the digestContent API to refine the markdown with AI
      try {
        const digestedContent = await ContextClient.digestContent(draftContent, "Project Context Document");
        setContextContent(digestedContent);
      } catch (error) {
        clientLogger.error("Digest error, falling back to draft:", error);
        setContextContent(draftContent);
        toast({
          title: "Digest Warning",
          description: "Using simple formatting. AI digestion failed.",
          variant: "destructive",
        });
      }
      
      setActiveTab('preview')
    } catch (error) {
      clientLogger.error('Error generating context:', error)
      toast({
        title: "Generation Error",
        description: "Failed to generate context preview.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Save the context
  const handleSaveContext = async () => {
    if (!contextName.trim()) {
      setSaveError("Context name is required.")
      return
    }
    if (!contextContent.trim()) {
      setSaveError("Cannot save empty context.")
      return
    }
    
    setIsSaving(true)
    setSaveError(null)
    
    try {
      // Use the client API instead of direct service call
      const newContext = await ContextClient.createContext({
        name: contextName,
        content: contextContent,
        project_id: projectId,
        metadata: { generated_via: 'chat' }
      })
      
      toast({
        title: "Context Saved",
        description: `Context "${newContext.name}" saved successfully.`,
      })
      
      setContextComplete(true)

    } catch (error: any) {
      clientLogger.error('Error saving context:', error)
      const errMsg = error.message || 'An unknown error occurred.'
      if (errMsg.includes('violates row-level security policy')) {
         setSaveError('Error: Permission denied. Could not save context due to security policy. Please check database rules.')
         toast({
            title: "Save Error: Permission Denied",
            description: "Check RLS policy for 'contexts' table.",
            variant: "destructive",
         })
      } else {
         setSaveError(`Failed to save context: ${errMsg}`)
         toast({
            title: "Save Error",
            description: `Failed to save context: ${errMsg}`,
            variant: "destructive",
         })
      }
    } finally {
      setIsSaving(false)
    }
  }
  
  // Reset state to create another context
  const handleCreateAnother = () => {
     setMessages([
        {
          id: uuidv4(),
          role: 'agent',
          content: "Hi there! I'll help you create a context for your project. Let's build it together through conversation. To start, could you tell me what this project is about?",
          timestamp: new Date()
        }
      ])
      setContextContent('')
      setContextName('')
      setActiveTab('chat')
      setContextComplete(false)
      setSaveError(null)
  }
  
  if (contextComplete) {
    return (
      <Card className="p-4">
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-medium">Context Created Successfully</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your context has been generated and saved.
          </p>
          <Button onClick={handleCreateAnother}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Create Another Context
          </Button>
        </div>
      </Card>
    )
  }
  
  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">Create Context from Conversation</h2>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 w-full grid grid-cols-2">
          <TabsTrigger value="chat">1. Chat with Agent</TabsTrigger>
          <TabsTrigger value="preview" disabled={!contextContent}>2. Preview & Save</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="flex flex-col h-[600px]">
          <div className="flex-grow overflow-y-auto space-y-4 pr-4 mb-4 border rounded-md p-4 bg-muted/40 min-h-[400px]">
            {messages.map((message) => (
              <div 
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`p-3 rounded-lg max-w-[75%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground border'}`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                 <div className="p-3 rounded-lg bg-background text-foreground border flex items-center">
                   <Loader2 className="h-4 w-4 animate-spin mr-2" />
                   <span className="text-sm italic">Agent is typing...</span>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <Separator className="my-4" />
          <div className="flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              disabled={loading || isSaving}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button onClick={handleSendMessage} disabled={loading || isSaving || !inputValue.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            variant="outline"
            onClick={handleGenerateContext} 
            disabled={loading || isSaving || messages.length < 2}
            className="mt-4 w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate Context Preview
          </Button>
        </TabsContent>
        
        <TabsContent value="preview" className="space-y-4">
          <div className="space-y-2">
             <Label htmlFor="contextName">Context Name</Label>
            <Input 
              id="contextName"
              value={contextName}
              onChange={(e) => setContextName(e.target.value)}
              placeholder="Enter a name for this context"
              disabled={isSaving}
            />
          </div>
           <div className="space-y-2">
            <Label>Generated Context Preview</Label>
            <Textarea 
              readOnly 
              value={contextContent}
              rows={15}
              className="font-mono text-sm bg-muted/40"
            />
          </div>
          {saveError && (
            <p className="text-sm text-destructive">{saveError}</p>
          )}
          <Button onClick={handleSaveContext} disabled={isSaving || !contextName.trim()}> 
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isSaving ? 'Saving...' : 'Save Context'}
          </Button>
        </TabsContent>
      </Tabs>
    </Card>
  )
} 