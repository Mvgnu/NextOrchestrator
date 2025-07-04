'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ContextService, type ContextMetadata, type ContextCategory } from '@/lib/context-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeftIcon, ReloadIcon } from '@radix-ui/react-icons'
import { Badge } from '@/components/ui/badge'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'

type Context = {
  id: string
  name: string
  content: string
  created_at: string
  updated_at: string
  project_id: string
  user_id: string
  metadata: ContextMetadata
}

export default function ContextEditPage() {
  const params = useParams()
  const router = useRouter()
  const contextId = params.contextId as string
  const projectId = params.id as string
  
  const [context, setContext] = useState<Context | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: '',
    tags: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  
  useEffect(() => {
    const fetchContext = async () => {
      try {
        setLoading(true)
        const data = await ContextService.getContext(contextId)
        if (data) {
          setContext(data as Context)
          const metadata = data.metadata as ContextMetadata
          setFormData({
            name: data.name,
            content: data.content,
            category: metadata?.category || '',
            tags: metadata?.tags?.join(', ') || ''
          })
        } else {
          setError('Context not found')
        }
      } catch (err) {
        setError('Failed to load context')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchContext()
  }, [contextId])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      
      // Parse tags from comma-separated string
      const tags = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : []
      
      // Create metadata object
      const metadata: ContextMetadata = {}
      
      // Only set category if it's a valid ContextCategory or undefined
      if (formData.category && ['documentation', 'research', 'notes', 'meeting', 'reference', 'other'].includes(formData.category)) {
        metadata.category = formData.category as ContextCategory
      }
      
      // Only add tags if there are any
      if (tags.length > 0) {
        metadata.tags = tags
      }
      
      await ContextService.updateContext(contextId, {
        name: formData.name,
        content: formData.content,
        metadata
      })
      
      router.push(`/projects/${projectId}/contexts/${contextId}`)
    } catch (err) {
      console.error(err)
      setError('Failed to update context')
    } finally {
      setSaving(false)
    }
  }
  
  const handleCancel = () => {
    router.push(`/projects/${projectId}/contexts/${contextId}`)
  }
  
  const togglePreview = () => {
    setPreviewMode(!previewMode)
  }
  
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse p-6">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="h-4 bg-muted rounded w-1/4"></div>
        <div className="h-96 bg-muted rounded w-full mt-6"></div>
      </div>
    )
  }
  
  if (error || !context) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-red-500">{error || 'Context not found'}</h2>
        <p className="mt-2">The requested context could not be loaded.</p>
        <Button 
          onClick={() => router.push(`/projects/${projectId}/contexts`)} 
          variant="outline" 
          className="mt-4"
        >
          <ArrowLeftIcon className="mr-2 h-4 w-4" /> Go Back to Contexts
        </Button>
      </div>
    )
  }
  
  return (
    <div className="container max-w-4xl py-6">
      <div className="flex items-center justify-between mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCancel}
          className="flex items-center gap-1"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Cancel
        </Button>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={togglePreview}
          >
            {previewMode ? 'Edit Mode' : 'Preview'}
          </Button>
        </div>
      </div>
      
      <h1 className="text-3xl font-bold tracking-tight mb-6">Edit Context</h1>
      
      {previewMode ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">{formData.name}</h2>
            
            {formData.category && (
              <Badge className="mt-2" variant="outline">
                {formData.category}
              </Badge>
            )}
            
            {formData.tags && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.split(',').map((tag, index) => (
                  <Badge key={index} variant="secondary">{tag.trim()}</Badge>
                ))}
              </div>
            )}
          </div>
          
          <Separator />
          
          <Card className="p-6">
            <MarkdownRenderer 
              content={formData.content} 
              showTableOfContents={true} 
              className="w-full"
            />
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={() => setPreviewMode(false)}>
              Back to Edit
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Context Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category (Optional)</Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="mt-1"
                  placeholder="e.g. Documentation"
                />
              </div>
              
              <div>
                <Label htmlFor="tags">Tags (Comma separated, Optional)</Label>
                <Input
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="mt-1"
                  placeholder="e.g. api, reference, tutorial"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                className="mt-1 font-mono h-[500px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supports Markdown formatting including tables, code blocks, and more.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={togglePreview}
            >
              Preview
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      )}
    </div>
  )
} 