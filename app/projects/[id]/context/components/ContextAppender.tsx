'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, CheckCircle, RefreshCw } from 'lucide-react'
import { ContextDigest } from '@/app/services/contextService'
import { v4 as uuidv4 } from 'uuid'
import clientLogger from '@/lib/client-logger'

interface ContextAppenderProps {
  contextDigest: ContextDigest | null
  projectId: string
  userId: string
  onContextUpdated?: (newDigest: ContextDigest) => void
}

export default function ContextAppender({ 
  contextDigest, 
  projectId, 
  userId,
  onContextUpdated
}: ContextAppenderProps) {
  const [userContent, setUserContent] = useState('')
  const [aiContent, setAiContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('user')
  const [appendComplete, setAppendComplete] = useState(false)
  
  // Simulate AI-enhanced content generation based on user input
  const generateAiEnhancedContent = async (content: string) => {
    setLoading(true)
    
    try {
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // In a real implementation, this would call your LLM API
      // For now, we'll enhance the content with some mock additions
      const enhancedContent = `# Enhanced Context Append

## Original User Input
${content}

## AI-Enhanced Content
${content}

### Additional Information
- The context provided connects to several key themes in the primary document
- This information extends the existing knowledge in sections 2 and 4
- Several technical terms have been identified and defined for clarity
- Connections to existing entities have been established

### Recommended Integration Points
This content is most relevant to the following sections of the existing context:
1. Technical requirements
2. Implementation considerations
3. Future development plans

This enhanced context has been structured to integrate seamlessly with your existing documentation.`;
      
      setAiContent(enhancedContent)
      setActiveTab('ai')
    } catch (error) {
      clientLogger.error('Error generating AI content:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // Simulate appending the content to the existing context
  const handleAppendToContext = async () => {
    if (!contextDigest) return
    
    setLoading(true)
    
    try {
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // In a real implementation, this would:
      // 1. Call your API to append the content
      // 2. Get back the updated digest
      // 3. Update the parent component
      
      // Create a simulation of the updated digest
      const updatedDigest: ContextDigest = {
        ...contextDigest,
        id: uuidv4(), // New digest ID
        keyPoints: [
          ...contextDigest.keyPoints,
          "New information added via manual context append" // Add a new key point
        ],
        markdown: contextDigest.markdown + "\n\n" + aiContent,
        createdAt: new Date()
      }
      
      // Notify parent component
      if (onContextUpdated) {
        onContextUpdated(updatedDigest)
      }
      
      setAppendComplete(true)
    } catch (error) {
      clientLogger.error('Error appending to context:', error)
    } finally {
      setLoading(false)
    }
  }
  
  if (!contextDigest) {
    return (
      <Card className="p-4">
        <p className="text-center text-muted-foreground">
          Generate a context digest first to append content
        </p>
      </Card>
    )
  }
  
  return (
    <Card className="p-4">
      <h2 className="text-xl font-semibold mb-4">Append to Context</h2>
      
      {appendComplete ? (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 mx-auto text-primary mb-4" />
          <h3 className="text-lg font-medium">Context Updated Successfully</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your content has been appended to the context and processed with AI enhancement.
          </p>
          <Button onClick={() => {
            setUserContent('')
            setAiContent('')
            setActiveTab('user')
            setAppendComplete(false)
          }}>
            Add More Content
          </Button>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="user">User Content</TabsTrigger>
            <TabsTrigger value="ai" disabled={!aiContent}>AI Enhanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="user">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter additional content to append to your context. The AI will enhance and format it 
                to integrate with your existing context.
              </p>
              
              <Textarea
                placeholder="Enter text, notes, or information to add to your context..."
                value={userContent}
                onChange={e => setUserContent(e.target.value)}
                className="min-h-[200px]"
              />
              
              <div className="flex justify-end">
                <Button
                  onClick={() => generateAiEnhancedContent(userContent)}
                  disabled={!userContent.trim() || loading}
                >
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                  Enhance with AI
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="ai">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Review the AI-enhanced content below. This has been formatted and optimized to integrate 
                with your existing context.
              </p>
              
              <div className="bg-muted rounded p-4 max-h-[400px] overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap">{aiContent}</pre>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('user')}>
                  Edit Original
                </Button>
                <Button
                  onClick={handleAppendToContext}
                  disabled={loading}
                >
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Append to Context
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </Card>
  )
} 