'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import versionService, { Version, ContentType } from '@/lib/version-service'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  CalendarIcon, 
  ClockIcon, 
  Pencil1Icon, 
  TrashIcon, 
  ArrowLeftIcon,
  Component1Icon,
  ArrowRightIcon,
  ReloadIcon,
  TimerIcon
} from '@radix-ui/react-icons'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from '@/components/ui/use-toast'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

export default function VersionViewPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const versionId = params.versionId as string
  const projectId = params.id as string
  
  const [version, setVersion] = useState<Version | null>(null)
  const [contentSnapshot, setContentSnapshot] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmRestore, setConfirmRestore] = useState(false)
  
  useEffect(() => {
    const fetchVersion = async () => {
      try {
        setLoading(true)
        const data = await versionService.getVersion(versionId)
        if (data) {
          setVersion(data)
          setContentSnapshot(data.content_snapshot)
        } else {
          setError('Version not found')
        }
      } catch (err) {
        setError('Failed to load version')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchVersion()
  }, [versionId])
  
  const handleBack = () => {
    // Navigate back to the content item based on content_type
    if (version) {
      const contentType = version.content_type as ContentType
      
      if (contentType === 'context') {
        router.push(`/projects/${projectId}/contexts/${version.content_id}`)
      } else if (contentType === 'agent') {
        router.push(`/projects/${projectId}/agents/${version.content_id}`)
      } else {
        // Default fallback
        router.push(`/projects/${projectId}`)
      }
    } else {
      router.push(`/projects/${projectId}`)
    }
  }
  
  const handleVersionHistoryClick = () => {
    if (version) {
      const contentType = version.content_type as ContentType
      
      if (contentType === 'context') {
        router.push(`/projects/${projectId}/contexts/${version.content_id}/versions`)
      } else if (contentType === 'agent') {
        router.push(`/projects/${projectId}/agents/${version.content_id}/versions`)
      }
    }
  }
  
  const handleRestoreVersion = async () => {
    if (!version) return
    
    try {
      await versionService.setAsCurrent(version.id)
      toast({
        title: "Version restored",
        description: "This version has been set as the current version.",
      })
      setConfirmRestore(false)
      
      // Refresh the version to update UI (is_current flag)
      const updatedVersion = await versionService.getVersion(versionId)
      setVersion(updatedVersion)
    } catch (err) {
      console.error(err)
      toast({
        title: "Restore failed",
        description: "Failed to restore this version. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  const handleDeleteClick = async () => {
    if (!version) return
    
    if (confirm('Are you sure you want to delete this version? This action cannot be undone.')) {
      try {
        await versionService.deleteVersion(versionId)
        toast({
          title: "Version deleted",
          description: "The version has been successfully deleted.",
        })
        handleBack() // Navigate back after deletion
      } catch (err) {
        toast({
          title: "Deletion failed",
          description: "Failed to delete version. Please try again.",
          variant: "destructive",
        })
        console.error(err)
      }
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
  
  if (error || !version || !contentSnapshot) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold text-red-500">{error || 'Version not found'}</h2>
        <p className="mt-2">The requested version could not be loaded.</p>
        <Button onClick={handleBack} variant="outline" className="mt-4">
          <ArrowLeftIcon className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    )
  }
  
  // Helper function to format metadata displays
  const renderMetadata = () => {
    const metadata = version.metadata as any || {}
    return (
      <>
        {metadata.tags && metadata.tags.length > 0 && (
          <div className="mt-2">
            <h3 className="text-sm font-medium mb-1">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {metadata.tags.map((tag: string, index: number) => (
                <Badge key={index} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>
        )}
        
        {metadata.categories && metadata.categories.length > 0 && (
          <div className="mt-2">
            <h3 className="text-sm font-medium mb-1">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {metadata.categories.map((category: string, index: number) => (
                <Badge key={index} variant="secondary">{category}</Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Render custom metadata fields */}
        {Object.entries(metadata)
          .filter(([key]) => !['tags', 'categories'].includes(key))
          .map(([key, value]) => (
            <div key={key} className="mt-2">
              <h3 className="text-sm font-medium mb-1">{key.charAt(0).toUpperCase() + key.slice(1)}</h3>
              <p className="text-sm">{JSON.stringify(value)}</p>
            </div>
          ))}
      </>
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
          Back to {version.content_type.charAt(0).toUpperCase() + version.content_type.slice(1)}
        </Button>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleVersionHistoryClick}
          >
            <Component1Icon className="mr-2 h-4 w-4" />
            Version History
          </Button>
          
          {!version.is_current && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmRestore(true)}
            >
              <ReloadIcon className="mr-2 h-4 w-4" />
              Restore This Version
            </Button>
          )}
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleDeleteClick}
            disabled={version.is_current} // Prevent deleting current version
          >
            <TrashIcon className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {version.name}
          {version.is_current && (
            <Badge className="ml-2" variant="outline">Current</Badge>
          )}
        </h1>
        {version.description && (
          <p className="text-muted-foreground mt-1">{version.description}</p>
        )}
        
        <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Created {formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}
          </div>
          
          {version.parent_version_id && (
            <div className="flex items-center">
              <ArrowRightIcon className="mr-2 h-4 w-4" />
              Has parent version
            </div>
          )}
          
          <div className="flex items-center">
            <TimerIcon className="mr-2 h-4 w-4" />
            {version.content_type.charAt(0).toUpperCase() + version.content_type.slice(1)} version
          </div>
        </div>
      </div>
      
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Version Metadata</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium">Version Details</h3>
            <div className="mt-2 space-y-1 text-sm">
              <p><span className="font-medium">ID:</span> {version.id}</p>
              <p><span className="font-medium">Content ID:</span> {version.content_id}</p>
              <p><span className="font-medium">Content Type:</span> {version.content_type}</p>
              <p><span className="font-medium">Is Current:</span> {version.is_current ? 'Yes' : 'No'}</p>
              {version.parent_version_id && (
                <p><span className="font-medium">Parent Version:</span> {version.parent_version_id}</p>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium">Custom Metadata</h3>
            {renderMetadata()}
          </div>
        </div>
      </Card>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Content Snapshot</h2>
        <Card className="p-6">
          {contentSnapshot.content ? (
            <MarkdownRenderer content={contentSnapshot.content} showTableOfContents={true} />
          ) : contentSnapshot.name ? (
            <div>
              <h3 className="text-xl font-medium mb-4">{contentSnapshot.name}</h3>
              {contentSnapshot.description && (
                <p className="mb-4">{contentSnapshot.description}</p>
              )}
              <pre className="bg-muted p-4 rounded-md overflow-auto">
                {JSON.stringify(contentSnapshot, null, 2)}
              </pre>
            </div>
          ) : (
            <pre className="bg-muted p-4 rounded-md overflow-auto">
              {JSON.stringify(contentSnapshot, null, 2)}
            </pre>
          )}
        </Card>
      </div>
      
      {/* Restore confirmation dialog */}
      <Dialog open={confirmRestore} onOpenChange={setConfirmRestore}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Version</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore this version? This will make it the current version.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRestore(false)}>Cancel</Button>
            <Button onClick={handleRestoreVersion}>Restore</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 