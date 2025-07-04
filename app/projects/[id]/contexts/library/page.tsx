'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ContextService, ContextCategory, ContextMetadata } from '@/lib/context-service'
import { formatDate, timeAgo } from '@/lib/utils'
import { ContextLibraryList } from './components/ContextLibraryList'
import { ContextFilters } from './components/ContextFilters'
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

export default function ContextLibraryPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [contexts, setContexts] = useState<Context[]>([])
  const [totalContexts, setTotalContexts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<ContextCategory[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  
  // Fetch contexts and tags
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Get all project tags
        const tags = await ContextService.getProjectTags(projectId)
        setAvailableTags(tags)
        
        // Get contexts with filters
        const result = await ContextService.searchProjectContexts(projectId, {
          search: searchQuery,
          categories: selectedCategories.length > 0 ? selectedCategories : undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          limit,
          offset: (page - 1) * limit
        })
        
        // Cast the metadata to the correct type
        const typedContexts = result.contexts.map(context => ({
          ...context,
          metadata: context.metadata as unknown as ContextMetadata | null
        }))
        
        setContexts(typedContexts)
        setTotalContexts(result.total)
        setError(null)
      } catch (err) {
        console.error('Error fetching contexts:', err)
        setError('Failed to load contexts. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [projectId, searchQuery, selectedCategories, selectedTags, sortBy, page, limit])
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1) // Reset to first page on new search
  }
  
  // Handle category selection
  const handleCategoryChange = (categories: ContextCategory[]) => {
    setSelectedCategories(categories)
    setPage(1)
  }
  
  // Handle tag selection
  const handleTagChange = (tags: string[]) => {
    setSelectedTags(tags)
    setPage(1)
  }
  
  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }
  
  // Navigate to create new context
  const handleCreateContext = () => {
    router.push(`/projects/${projectId}/contexts/new`)
  }
  
  const totalPages = Math.ceil(totalContexts / limit)
  
  return (
    <div className="p-6 container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Context Library</h1>
          <p className="text-muted-foreground">
            Manage and organize your project contexts
          </p>
        </div>
        <Button onClick={handleCreateContext}>Add New Context</Button>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="grid">Grid View</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Filters sidebar */}
            <div className="md:col-span-1">
              <ContextFilters 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
                selectedTags={selectedTags}
                availableTags={availableTags}
                onTagChange={handleTagChange}
                sortBy={sortBy}
                onSortChange={(value: string) => setSortBy(value as 'newest' | 'oldest' | 'name')}
                onSearch={handleSearch}
              />
            </div>
            
            {/* Context list */}
            <div className="md:col-span-3">
              <Tabs defaultValue="list">
                <TabsContent value="list" className="mt-0">
                  <ContextLibraryList
                    contexts={contexts}
                    loading={loading}
                    error={error}
                    page={page}
                    totalItems={totalContexts}
                    pageSize={limit}
                    onPageChange={handlePageChange}
                  />
                </TabsContent>
                
                <TabsContent value="grid" className="mt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {loading ? (
                      <p className="col-span-full text-center py-8">Loading contexts...</p>
                    ) : error ? (
                      <p className="col-span-full text-center text-red-500 py-8">{error}</p>
                    ) : contexts.length === 0 ? (
                      <p className="col-span-full text-center py-8">No contexts found. Try adjusting your filters or create a new context.</p>
                    ) : (
                      contexts.map((context) => (
                        <Card key={context.id} className="h-full flex flex-col">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{context.name}</CardTitle>
                            <CardDescription>
                              Created {timeAgo(context.created_at)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex-grow">
                            <p className="line-clamp-3 text-sm">{context.content.slice(0, 150)}...</p>
                          </CardContent>
                          <CardFooter className="flex justify-between pt-2 border-t">
                            <div className="flex gap-1 flex-wrap">
                              {context.metadata?.category && (
                                <Badge variant="outline">{context.metadata.category}</Badge>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/projects/${projectId}/contexts/${context.id}`)}>
                              View
                            </Button>
                          </CardFooter>
                        </Card>
                      ))
                    )}
                  </div>
                  
                  {/* Pagination for grid view */}
                  {!loading && !error && contexts.length > 0 && (
                    <Pagination
                      currentPage={page}
                      totalItems={totalContexts}
                      pageSize={limit}
                      onPageChange={handlePageChange}
                      className="mt-6"
                      showSummary
                    />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 