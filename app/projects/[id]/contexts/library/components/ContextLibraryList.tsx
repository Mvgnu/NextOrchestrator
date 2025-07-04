'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { ContextMetadata } from '@/lib/context-service'
import { formatDate, truncateString } from '@/lib/utils'
import { Pagination } from '@/components/ui/pagination'

interface Context {
  id: string
  name: string
  content: string
  created_at: string
  updated_at: string
  metadata: ContextMetadata | null
  project_id: string
  user_id: string
}

interface ContextLibraryListProps {
  contexts: Context[]
  loading: boolean
  error: string | null
  page: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function ContextLibraryList({
  contexts,
  loading,
  error,
  page,
  totalItems,
  pageSize,
  onPageChange
}: ContextLibraryListProps) {
  const router = useRouter()
  
  if (loading) {
    return <div className="py-8 text-center">Loading contexts...</div>
  }
  
  if (error) {
    return <div className="py-8 text-center text-red-500">{error}</div>
  }
  
  if (contexts.length === 0) {
    return (
      <div className="py-8 text-center">
        No contexts found. Try adjusting your filters or create a new context.
      </div>
    )
  }
  
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contexts.map((context) => (
            <TableRow key={context.id}>
              <TableCell className="font-medium">{context.name}</TableCell>
              <TableCell>
                {context.metadata?.category ? (
                  <Badge variant="outline">{context.metadata.category}</Badge>
                ) : (
                  <span className="text-muted-foreground">Uncategorized</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {context.metadata?.tags && context.metadata.tags.length > 0 ? (
                    context.metadata.tags.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="mr-1">
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No tags</span>
                  )}
                  {context.metadata?.tags && context.metadata.tags.length > 3 && (
                    <Badge variant="secondary">+{context.metadata.tags.length - 3}</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>{formatDate(context.created_at)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/projects/${context.project_id}/contexts/${context.id}`)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={onPageChange}
        className="mt-6"
        showSummary
      />
    </div>
  )
} 