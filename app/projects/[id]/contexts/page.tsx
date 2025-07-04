'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Context, ContextCategory } from '@/lib/context-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { PlusIcon, MagnifyingGlassIcon, SliderIcon } from '@radix-ui/react-icons'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Pagination } from '@/components/ui/pagination'

export default function ContextsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  
  const [contexts, setContexts] = useState<Context[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<ContextCategory[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [limit] = useState(9)
  const [totalContexts, setTotalContexts] = useState(0)
  
  const categories: ContextCategory[] = ['documentation', 'research', 'notes', 'meeting', 'reference', 'other']
  
  const fetchContexts = useCallback(async (currentPage = page) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        project_id: projectId,
        limit: String(limit),
        offset: String((currentPage - 1) * limit),
      });
      if (searchQuery) queryParams.append('search', searchQuery);
      if (selectedCategories.length > 0) queryParams.append('categories', selectedCategories.join(','));
      if (selectedTags.length > 0) queryParams.append('tags', selectedTags.join(','));

      const response = await fetch(`/api/contexts?${queryParams.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      const data = await response.json();
      setContexts(data.contexts as Context[]);
      setTotalContexts(data.total);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching contexts:', err);
      setError(err.message || 'Failed to load contexts');
    } finally {
      setLoading(false);
    }
  }, [projectId, limit, page, searchQuery, selectedCategories, selectedTags]);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tags`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `Error: ${response.status}`);
      }
      const data = await response.json();
      setAvailableTags(data.tags || []);
    } catch (err: any) {
      console.error('Error fetching tags:', err);
    }
  }, [projectId]);
  
  useEffect(() => {
    if (projectId) {
      fetchContexts(page);
      fetchTags();
    }
  }, [page, projectId, fetchContexts, fetchTags]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchContexts(1);
  };
  
  const toggleCategory = (category: ContextCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };
  
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };
  
  const applyFilters = () => {
    setPage(1);
    fetchContexts(1);
  };
  
  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedTags([]);
    setSearchQuery('');
    setShowFilters(false);
    setPage(1);
  };
  
  const createNewContext = () => {
    router.push(`/projects/${projectId}/contexts/new`)
  }
  
  const getContentPreview = (content: string) => {
    if (!content) return ''
    return content.length > 150 ? content.substring(0, 150) + '...' : content
  }
  
  const getFormattedDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (err) {
      return 'Unknown date'
    }
  }
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading && contexts.length === 0) { 
    return <div className="container py-6 text-center">Loading contexts...</div>;
  }

  if (error) {
    return (
      <div className="container py-6 text-center text-red-500">
        <p>Error loading contexts: {error}</p>
        <Button onClick={() => fetchContexts(page)} variant="outline" className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Contexts</h1>
        <Button onClick={createNewContext}>
          <PlusIcon className="mr-2 h-4 w-4" />
          New Context
        </Button>
      </div>
      
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search contexts..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline">Search</Button>
          <Button 
            type="button" 
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-secondary' : ''}
          >
            <SliderIcon className="h-4 w-4" />
            <span className="ml-2">Filters</span>
          </Button>
        </form>
        
        {showFilters && (
          <Card className="mt-4">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center gap-2">
                        <Checkbox 
                          id={`category-${category}`} 
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => toggleCategory(category)}
                        />
                        <Label 
                          htmlFor={`category-${category}`}
                          className="capitalize text-sm font-normal"
                        >
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {availableTags.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map((tag) => (
                        <div key={tag} className="flex items-center gap-2">
                          <Checkbox 
                            id={`tag-${tag}`} 
                            checked={selectedTags.includes(tag)}
                            onCheckedChange={() => toggleTag(tag)}
                          />
                          <Label 
                            htmlFor={`tag-${tag}`}
                            className="text-sm font-normal"
                          >
                            {tag}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              <Separator className="my-4" />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={resetFilters}>Reset Filters</Button>
                <Button onClick={applyFilters}>Apply Filters</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {loading && <div className="text-center py-4">Updating contexts...</div>} 

      {!loading && contexts.length === 0 && (
        <div className="text-center py-10 border rounded-md bg-muted/20">
          <h3 className="text-xl font-semibold mb-2">No Contexts Found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search or filters, or create a new context.</p>
          <Button onClick={createNewContext}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create First Context
          </Button>
        </div>
      )}
      
      {contexts.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contexts.map((context) => (
            <Card key={context.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="truncate" title={context.name}>{context.name}</CardTitle>
                {context.metadata?.category && (
                  <Badge variant="outline" className="mt-1 w-fit">{context.metadata.category}</Badge>
                )}
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {getContentPreview(context.content || '')}
                </p>
                {context.metadata?.tags && context.metadata.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {context.metadata.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                    {context.metadata.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">...</Badge>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between items-center mt-auto pt-0">
                <span className="text-xs text-muted-foreground">
                  Updated {getFormattedDate(context.updated_at)}
                </span>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/projects/${projectId}/contexts/${context.id}`}>
                    View
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {totalContexts > limit && (
          <Pagination 
          className="mt-8"
            currentPage={page}
            totalItems={totalContexts}
            pageSize={limit}
            onPageChange={handlePageChange}
        />
      )}
    </div>
  )
} 