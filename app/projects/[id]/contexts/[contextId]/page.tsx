'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
// Remove direct ContextService import for most operations
// import { ContextService, ContextMetadata } from '@/lib/context-service' 
import type { Context, ContextMetadata } from '@/lib/context-service' // Keep types
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  CalendarIcon, 
  ClockIcon, 
  Share1Icon, 
  Pencil1Icon, 
  TrashIcon, 
  ArrowLeftIcon,
  Component1Icon,
  BookmarkIcon,
  ReloadIcon
} from '@radix-ui/react-icons'
import { formatDistanceToNow } from 'date-fns'
import { ContextExportMenu } from '@/components/context-export-menu'
import { useToast } from '@/components/ui/use-toast'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

// Local Context type can be simplified or rely on the imported one if it matches the API response structure
// For now, assuming the API will return a structure compatible with the Context type from lib/context-service

export default function ContextViewPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const contextId = params.contextId as string
  const projectId = params.id as string
  
  const [context, setContext] = useState<Context | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [isSavingVersion, setIsSavingVersion] = useState(false)
  const [versionDialogOpen, setVersionDialogOpen] = useState(false)
  const [versionName, setVersionName] = useState('')
  const [versionDescription, setVersionDescription] = useState('')
  
  useEffect(() => {
    const fetchContext = async () => {
      if (!contextId) return;
      try {
        setLoading(true);
        // Fetch from API endpoint
        const response = await fetch(`/api/contexts/${contextId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(errorData.message || `Error: ${response.status}`);
        }
        const data = await response.json();
        setContext(data.context as Context); // Assuming API returns { context: ContextData }
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load context');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContext();
  }, [contextId]);
  
  const handleBack = () => {
    router.push(`/projects/${projectId}/contexts`)
  }
  
  const handleShareClick = async () => {
    toast({
      title: "Share feature",
      description: "Sharing functionality would open a dialog here (Not implemented)",
    })
  }
  
  const handleDeleteClick = async () => {
    if (!contextId) return;
    if (confirm('Are you sure you want to delete this context? This action cannot be undone.')) {
      try {
        // Call API endpoint for delete
        const response = await fetch(`/api/contexts/${contextId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(errorData.message || `Error: ${response.status}`);
        }
        toast({
          title: "Context deleted",
          description: "The context has been successfully deleted.",
        });
        router.push(`/projects/${projectId}/contexts`);
      } catch (err: any) {
        toast({
          title: "Deletion failed",
          description: err.message || "Failed to delete context. Please try again.",
          variant: "destructive",
        });
        console.error(err);
      }
    }
  }
  
  const handleVersionHistoryClick = () => {
    router.push(`/projects/${projectId}/contexts/${contextId}/versions`)
  }
  
  const handleCreateVersionClick = () => {
    setVersionName(`Version ${new Date().toLocaleDateString()}`)
    setVersionDescription('')
    setVersionDialogOpen(true)
  }
  
  const handleSaveVersion = async () => {
    if (!versionName.trim() || !context) {
      toast({
        title: "Version name required",
        description: "Please provide a name for this version.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSavingVersion(true);
    try {
      // Call API endpoint for creating a version
      const response = await fetch(`/api/contexts/${contextId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionName,
          versionDescription: versionDescription || undefined,
          versionMetadata: context.metadata?.tags ? { tags: context.metadata.tags } : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      
      toast({
        title: "Version saved",
        description: "A new version has been created successfully.",
      });
      setVersionDialogOpen(false);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error saving version",
        description: err.message || "Failed to create a new version. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingVersion(false);
    }
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
        <Button onClick={handleBack} variant="outline" className="mt-4">
          <ArrowLeftIcon className="mr-2 h-4 w-4" /> Go Back
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
          onClick={handleBack}
          className="flex items-center gap-1"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Contexts
        </Button>
        
        <div className="flex items-center gap-2">
          <ContextExportMenu contextId={contextId} /> {/* Ensure this component exists and works client-side */}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push(`/projects/${projectId}/contexts/${contextId}/edit`)}
          >
            <Pencil1Icon className="mr-2 h-4 w-4" />
            Edit
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCreateVersionClick}
          >
            <BookmarkIcon className="mr-2 h-4 w-4" />
            Save Version
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleVersionHistoryClick}
          >
            <Component1Icon className="mr-2 h-4 w-4" />
            Version History
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleShareClick}
          >
            <Share1Icon className="mr-2 h-4 w-4" />
            Share
          </Button>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDeleteClick}
          >
            <TrashIcon className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">{context.name}</h1>
        <div className="flex items-center text-sm text-muted-foreground space-x-4 mb-1">
          <span>
            <ClockIcon className="inline mr-1 h-4 w-4" />
            Updated {formatDistanceToNow(new Date(context.updated_at), { addSuffix: true })}
          </span>
          <span>
            <CalendarIcon className="inline mr-1 h-4 w-4" />
            Created {new Date(context.created_at).toLocaleDateString()}
          </span>
        </div>
        {context.metadata?.tags && context.metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {context.metadata.tags.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}
      </div>

      <Card className="mb-6">
        <div className="p-6 prose dark:prose-invert max-w-none">
            <MarkdownRenderer content={context.content || 'No content available.'} />
        </div>
      </Card>

      {/* Version Creation Dialog */}
      <Dialog open={versionDialogOpen} onOpenChange={setVersionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save New Version</DialogTitle>
            <DialogDescription>
              Create a named version for the current state of this context.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="version-name" className="text-right">
                Version Name
              </Label>
              <Input 
                id="version-name" 
                value={versionName} 
                onChange={(e) => setVersionName(e.target.value)} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="version-description" className="text-right">
                Description
              </Label>
              <Textarea 
                id="version-description" 
                value={versionDescription} 
                onChange={(e) => setVersionDescription(e.target.value)} 
                className="col-span-3" 
                placeholder="Optional: Describe the changes in this version..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVersionDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveVersion} disabled={isSavingVersion || !versionName.trim()}>
              {isSavingVersion && <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />} Save Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
} 