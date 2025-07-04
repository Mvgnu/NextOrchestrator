'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ContextCategory } from '@/lib/context-service'

const CATEGORY_OPTIONS: { value: ContextCategory; label: string }[] = [
  { value: 'documentation', label: 'Documentation' },
  { value: 'research', label: 'Research' },
  { value: 'notes', label: 'Notes' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'reference', label: 'Reference' },
  { value: 'other', label: 'Other' },
]

interface ContextFiltersProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategories: ContextCategory[]
  onCategoryChange: (categories: ContextCategory[]) => void
  selectedTags: string[]
  availableTags: string[]
  onTagChange: (tags: string[]) => void
  sortBy: string
  onSortChange: (value: string) => void
  onSearch: (e: React.FormEvent) => void
}

export function ContextFilters({
  searchQuery,
  setSearchQuery,
  selectedCategories,
  onCategoryChange,
  selectedTags,
  availableTags,
  onTagChange,
  sortBy,
  onSortChange,
  onSearch,
}: ContextFiltersProps) {
  const [showAllTags, setShowAllTags] = useState(false)
  
  const handleCategoryToggle = (category: ContextCategory) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter(c => c !== category))
    } else {
      onCategoryChange([...selectedCategories, category])
    }
  }
  
  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagChange(selectedTags.filter(t => t !== tag))
    } else {
      onTagChange([...selectedTags, tag])
    }
  }
  
  const clearFilters = () => {
    setSearchQuery('')
    onCategoryChange([])
    onTagChange([])
  }
  
  const displayedTags = showAllTags ? availableTags : availableTags.slice(0, 10)
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-2">Search</h3>
        <form onSubmit={onSearch} className="flex space-x-2">
          <Input
            placeholder="Search contexts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="sm">
            Search
          </Button>
        </form>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="font-medium mb-2">Sort By</h3>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Separator />
      
      <div>
        <h3 className="font-medium mb-2">Categories</h3>
        <div className="space-y-2">
          {CATEGORY_OPTIONS.map((category) => (
            <div key={category.value} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.value}`}
                checked={selectedCategories.includes(category.value)}
                onCheckedChange={() => handleCategoryToggle(category.value)}
              />
              <Label htmlFor={`category-${category.value}`} className="cursor-pointer">
                {category.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
      
      {availableTags.length > 0 && (
        <>
          <Separator />
          
          <div>
            <h3 className="font-medium mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {displayedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </Badge>
              ))}
              
              {availableTags.length > 10 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllTags(!showAllTags)}
                >
                  {showAllTags ? 'Show Less' : `Show All (${availableTags.length})`}
                </Button>
              )}
            </div>
          </div>
        </>
      )}
      
      <Separator />
      
      <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
        Clear Filters
      </Button>
    </div>
  )
} 