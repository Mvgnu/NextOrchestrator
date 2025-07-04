'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { type ContextMetadata, type ContextCategory } from '@/lib/context-service'
import * as ContextClient from '@/lib/context-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeftIcon, ReloadIcon } from '@radix-ui/react-icons'
import { useToast } from '@/components/ui/use-toast'
import { TemplateSelector } from '@/components/template-selector'
import { ContextTemplate } from '@/lib/context-templates'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function NewContextPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const projectId = params.id as string
  
  const { data: session, status: sessionStatus } = useSession()

  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: '',
    tags: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!formData.name.trim()) {
      setError('Context name is required.')
      return
    }
    if (!formData.content.trim()) {
      setError('Context content cannot be empty.')
      return
    }
    if (!projectId) {
      setError('Project ID is missing.')
      return
    }
    if (sessionStatus !== 'authenticated' || !session?.user?.id) {
      setError('Authentication required.')
      return
    }

    setLoading(true)
    
    try {
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
      
      await ContextClient.createContext({
        name: formData.name,
        content: formData.content,
        project_id: projectId,
        metadata
      })
      
      // Redirect back to project page's context tab upon success
      router.push(`/projects/${projectId}?tab=contexts`)
      router.refresh()
    } catch (err: any) {
      console.error("Error creating context:", err)
      setError(err.message || 'Failed to create context. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleCancel = () => {
    router.push(`/projects/${projectId}/contexts`)
  }
  
  const handleTemplateSelect = (template: ContextTemplate) => {
    setFormData({
      name: template.name,
      content: template.content,
      category: template.category,
      tags: template.tags.join(', ')
    })
    
    toast({
      title: "Template applied",
      description: `The "${template.name}" template has been applied.`,
    })
  }
  
  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="p-4 text-lg text-muted-foreground">Loading session...</p>
      </div>
    )
  }
  
  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="p-4 text-lg text-muted-foreground">Authentication required to create contexts.</p>
        <Button asChild>
          <Link href="/auth/signin">Sign In</Link>
        </Button>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-6">
        <Link href={`/projects/${projectId}?tab=contexts`} className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block">
          ← Back to Project Contexts
        </Link>
        <h1 className="text-3xl font-bold">Add New Context</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg border shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="context-name">Context Name</Label>
          <Input
            id="context-name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Project Specification Document v1.2"
            required
            disabled={loading}
            className="text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="context-content">Content (Markdown Supported)</Label>
          <Textarea
            id="context-content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            placeholder="Enter or paste your context content here..."
            required
            rows={15}
            disabled={loading}
            className="font-mono text-sm leading-relaxed"
          />
          <p className="text-xs text-muted-foreground">
            Provide the full text content. This raw content will be used by agents when selected in the chat.
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">Error: {error}</p>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !formData.name.trim() || !formData.content.trim()}>
            {loading ? 'Saving Context...' : 'Save Context'}
          </Button>
        </div>
      </form>
    </div>
  )
} 