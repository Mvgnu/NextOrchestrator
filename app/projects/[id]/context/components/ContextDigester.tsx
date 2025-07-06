'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Upload, Download, FileText, Check, AlertCircle, RefreshCw, Loader2, Save } from 'lucide-react'
import contextService, { ContextFile, ContextDigest } from '@/app/services/contextService'
import * as ContextClient from '@/lib/context-client'
import AgentAssignmentPanel from './AgentAssignmentPanel'
import ContextAppender from './ContextAppender'
import { useToast } from '@/components/ui/use-toast'
import clientLogger from '@/lib/client-logger'
import * as AgentClient from '@/lib/agent-client'

interface ContextDigesterProps {
  projectId: string
  userId: string
}

export default function ContextDigester({ projectId, userId }: ContextDigesterProps) {
  const [files, setFiles] = useState<ContextFile[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [digest, setDigest] = useState<ContextDigest | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [uploadLoading, setUploadLoading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>('upload')
  const [digestSaved, setDigestSaved] = useState<boolean>(false)
  const [selectedAgentId, setSelectedAgentId] = useState<string>('')
  const [agents, setAgents] = useState<AgentClient.Agent[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  
  // Load agents for this project
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const projectAgents = await AgentClient.getProjectAgents(projectId)
        setAgents(projectAgents)
        if (projectAgents.length > 0) {
          setSelectedAgentId(projectAgents[0].id)
        }
      } catch (error) {
        clientLogger.error('Failed to load agents:', error)
      }
    }
    
    loadAgents()
  }, [projectId])
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    setUploadLoading(true)
    
    try {
      const newFiles: ContextFile[] = []
      
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i]
        const contextFile = await contextService.uploadContextFile(file, projectId, userId)
        newFiles.push(contextFile)
      }
      
      setFiles(prev => [...prev, ...newFiles])
      // Reset input value to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      clientLogger.error('Error uploading files:', error)
    } finally {
      setUploadLoading(false)
    }
  }
  
  const handleDigest = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a name for the context',
        variant: 'destructive'
      })
      return
    }
    
    if (files.length === 0) {
      toast({
        title: 'Error',
        description: 'Please upload at least one file',
        variant: 'destructive'
      })
      return
    }
    
    setLoading(true)
    
    try {
      // Read content from files
      const fileContents = await Promise.all(
        files.map(async (file) => {
          // This would need to be implemented to actually read file content
          // For now, let's assume we have the content in file.content
          return file.content || `Content from ${file.fileName}`
        })
      )
      
      // Combine file contents
      const combinedContent = fileContents.join('\n\n---\n\n')
      const title = `Files: ${files.map(f => f.fileName).join(', ')}`
      
      // Use our new API endpoint for digestion
      const digestedContent = await ContextClient.digestContent(combinedContent, title)
      
      // Since we now have real markdown but might not have all the digest parts,
      // we'll create a digest object with all required properties
      const result: ContextDigest = {
        id: crypto.randomUUID(),
        name,
        description,
        summary: "Summary generated from uploaded files",
        keyPoints: ["AI-generated digest from your files"],
        entities: files.map(f => f.fileName),
        sourceFileIds: files.map(f => f.id),
        createdAt: new Date(),
        projectId: projectId
      }
      
      setDigest(result)
      setActiveTab('digest')
    } catch (error) {
      clientLogger.error('Error generating digest:', error)
      toast({
        title: "Digest Error",
        description: "Failed to generate content digest. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleContextUpdated = (newDigest: ContextDigest) => {
    setDigest(newDigest)
    setActiveTab('digest')
  }
  
  const handleSaveDigest = async () => {
    if (!digest) return;

    setIsSaving(true);
    try {
      const savedContext = await ContextClient.createContext({
        name: `Digest: ${new Date().toLocaleString()}`,
        content: digest.markdown,
        project_id: projectId,
        metadata: {
          type: 'digest',
          summary: digest.summary,
          keyPoints: digest.keyPoints,
          entities: digest.entities,
          sourceFileIds: digest.sourceFileIds,
        }
      });

      setDigestSaved(true);
      toast({
        title: "Digest Saved",
        description: "Context digest has been saved successfully.",
      });
    } catch (error: any) {
      clientLogger.error("Error saving digest:", error);
      toast({
        title: "Save Error",
        description: error.message || "Failed to save digest",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSaveContext = async () => {
    if (!digest) return
    
    setIsSaving(true)
    try {
      const contextData = {
        name: digest.name,
        description: digest.description,
        metadata: {
          digest: {
            summary: digest.summary,
            keyPoints: digest.keyPoints,
            entities: digest.entities,
            sourceFileIds: digest.sourceFileIds
          },
          agent_id: selectedAgentId || null
        },
        project_id: projectId
      }
      
      const response = await fetch('/api/contexts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contextData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save context')
      }
      
      const { context } = await response.json()
      
      // Update digest with real ID
      setDigest({
        ...digest,
        id: context.id
      })
      
      toast({
        title: 'Success',
        description: 'Context saved successfully',
      })
    } catch (error) {
      clientLogger.error('Error saving context:', error)
      toast({
        title: 'Error',
        description: 'Failed to save context',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Files for Context</CardTitle>
          <CardDescription>
            Upload document files to create contextual knowledge
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g., Project Documentation" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this context"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agent">Select Agent for Digestion (Optional)</Label>
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.length === 0 ? (
                    <SelectItem value="none" disabled>No agents available</SelectItem>
                  ) : (
                    agents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Selecting an agent will use its capabilities to analyze your content
              </p>
            </div>
            
            <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center">
              <Input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <Label 
                htmlFor="file-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                <span className="text-sm font-medium">
                  Click to upload files
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  PDF, DOCX, TXT, MD files accepted
                </span>
              </Label>
            </div>
            
            {files.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Selected Files:</h4>
                <ul className="space-y-1">
                  {files.map((file, index) => (
                    <li key={index} className="text-sm flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                      {file.fileName}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleDigest}
            disabled={loading || files.length === 0 || !name.trim()}
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate Digest
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {digest && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Context Digest</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveContext}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Digest
                    </>
                  )}
                </Button>
              </CardTitle>
              <CardDescription>
                AI-generated summary and key insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Summary</h3>
                  <p className="text-sm">{digest.summary}</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Key Points</h3>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {digest.keyPoints.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Extracted Entities</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(digest.entities).map(([category, items]) => (
                      <div key={category}>
                        <h4 className="text-sm font-medium capitalize">{category}</h4>
                        <ul className="text-xs text-muted-foreground">
                          {items.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <AgentAssignmentPanel
            contextDigest={digest}
            projectId={projectId}
            userId={userId}
          />
        </>
      )}
    </div>
  )
} 