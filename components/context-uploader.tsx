import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ContextUploaderProps {
  projectId: string
  onContextAdded?: (contextId: string) => void
}

export function ContextUploader({ projectId, onContextAdded }: ContextUploaderProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  
  // Handle direct text input
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    setFile(null) // Clear any existing file
  }
  
  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    
    setFile(selectedFile)
    
    // Read the file content
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        const content = event.target.result as string
        setContent(content)
        
        // Set a default title from filename if not set already
        if (!title) {
          const fileName = selectedFile.name.split('.')[0]
          setTitle(fileName.charAt(0).toUpperCase() + fileName.slice(1))
        }
      }
    }
    reader.readAsText(selectedFile)
  }
  
  // Process the content and convert to markdown
  const handleDigestToMarkdown = async () => {
    if (!content.trim()) return
    
    setIsProcessing(true)
    
    try {
      // In a real implementation, this would call the API
      // to process the content into markdown
      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate API call
      
      // Simulate markdown conversion
      const markdownPreview = formatMarkdownPreview(content, title)
      setPreview(markdownPreview)
    } catch (error) {
      console.error('Error processing content:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  // Save the processed context
  const handleSave = async () => {
    if (!content.trim() || !title.trim() || !preview) return
    
    try {
      // In a real implementation, this would call the API
      // to save the context to the database
      await new Promise(resolve => setTimeout(resolve, 800)) // Simulate API call
      
      // Simulate successful save with a generated ID
      const mockContextId = `ctx-${Date.now().toString(36)}`
      onContextAdded?.(mockContextId)
      
      // Reset the form
      setTitle('')
      setContent('')
      setFile(null)
      setPreview(null)
    } catch (error) {
      console.error('Error saving context:', error)
    }
  }
  
  // Basic markdown formatter for preview
  const formatMarkdownPreview = (content: string, title: string): string => {
    // Add title as heading
    let markdown = `# ${title}\n\n`
    
    // Take first 1000 chars for preview
    const previewContent = content.substring(0, 1000)
    
    // Split by double newlines to create paragraphs
    const paragraphs = previewContent.split(/\n\s*\n/)
    
    // Process each paragraph
    for (let i = 0; i < Math.min(paragraphs.length, 5); i++) {
      const para = paragraphs[i].trim()
      if (!para) continue
      
      markdown += `${para}\n\n`
    }
    
    // Add ellipsis if content was truncated
    if (content.length > 1000 || paragraphs.length > 5) {
      markdown += '...'
    }
    
    return markdown
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              type="text"
              className="w-full border rounded-md px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Project Requirements"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="file">
              Upload Document
            </label>
            <input
              id="file"
              type="file"
              className="w-full border rounded-md px-3 py-2"
              onChange={handleFileChange}
              accept=".txt,.md,.markdown,.html,.htm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Supported formats: .txt, .md, .markdown, .html
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="content">
              Or Paste Content
            </label>
            <textarea
              id="content"
              className="w-full border rounded-md px-3 py-2 h-32"
              value={content}
              onChange={handleTextChange}
              placeholder="Paste your content here..."
            ></textarea>
          </div>
          
          <Button 
            onClick={handleDigestToMarkdown} 
            disabled={!content.trim() || isProcessing}
            className="w-full"
          >
            {isProcessing ? 'Processing...' : 'Digest to Markdown'}
          </Button>
        </CardContent>
      </Card>
      
      {preview && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md p-4 bg-muted/50 whitespace-pre-wrap font-mono text-sm">
              {preview}
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave}>
                Save to Project
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 