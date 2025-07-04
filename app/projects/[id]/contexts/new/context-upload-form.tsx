'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import supabase from '@/lib/supabase'
import { processDocumentForAgents } from '@/lib/markdown'

interface ContextUploadFormProps {
  projectId: string
  userId: string
}

export default function ContextUploadForm({ projectId, userId }: ContextUploadFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    if (!name.trim()) {
      setError('Context name is required')
      setIsSubmitting(false)
      return
    }

    // For file upload
    if (file) {
      try {
        const reader = new FileReader()
        reader.onload = async (event) => {
          if (event.target?.result) {
            const fileContent = event.target.result as string
            await saveContext(fileContent, file.type.includes('markdown') ? 'markdown' : 'text')
          }
        }
        reader.readAsText(file)
      } catch (err) {
        console.error('Error reading file:', err)
        setError('Failed to read file. Please try a different format.')
        setIsSubmitting(false)
      }
    } else if (content.trim()) {
      // For direct text input
      await saveContext(content, 'text')
    } else {
      setError('Please either upload a file or enter content')
      setIsSubmitting(false)
    }
  }

  const saveContext = async (contentToSave: string, format: string) => {
    try {
      // Process the document for agent consumption
      const markdownContent = processDocumentForAgents(contentToSave, format)
      
      const { data, error } = await supabase
        .from('contexts')
        .insert({
          name,
          content: contentToSave, // Original content
          metadata: { 
            format: format,
            processedMarkdown: markdownContent 
          },
          project_id: projectId,
          user_id: userId
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/projects/${projectId}`)
      router.refresh()
    } catch (err) {
      console.error('Error saving context:', err)
      setError('Failed to save context. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Context Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          placeholder="e.g., Project Requirements"
          required
        />
      </div>

      <Tabs defaultValue="text">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text">Paste Text</TabsTrigger>
          <TabsTrigger value="file">Upload File</TabsTrigger>
        </TabsList>
        
        <TabsContent value="text" className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
            placeholder="Paste your content here..."
            rows={10}
          />
        </TabsContent>
        
        <TabsContent value="file" className="space-y-4">
          <div className="border-2 border-dashed rounded-md p-6 text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".txt,.md,.pdf,.doc,.docx"
            />
            {file ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFile(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                >
                  Change File
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p>Drag your file here or click to browse</p>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select File
                </Button>
                <p className="text-xs text-muted-foreground">
                  Supports TXT, MD, PDF, DOC, DOCX files
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="text-sm font-medium text-destructive">{error}</div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'Save Context'}
      </Button>
    </form>
  )
} 