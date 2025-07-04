'use client'

import { useState } from 'react'
import { contextTemplates, ContextTemplate } from '@/lib/context-templates'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ContextCategory } from '@/lib/context-service'

interface TemplateSelectorProps {
  onSelectTemplate: (template: ContextTemplate) => void
}

export function TemplateSelector({ onSelectTemplate }: TemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ContextCategory | 'all'>('all')
  
  // Filter templates based on search query and selected category
  const filteredTemplates = contextTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    if (selectedCategory === 'all') {
      return matchesSearch
    }
    
    return matchesSearch && template.category === selectedCategory
  })
  
  // Get unique categories from templates
  const categories = Array.from(new Set(contextTemplates.map(template => template.category)))
  
  const handleSelectTemplate = (template: ContextTemplate) => {
    onSelectTemplate(template)
    setDialogOpen(false)
  }
  
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Use Template</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
          <DialogDescription>
            Select a template to quickly create structured content
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4">
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />
          
          <Tabs defaultValue="all" onValueChange={(value) => setSelectedCategory(value as ContextCategory | 'all')}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              {categories.map(category => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTemplates.length > 0 ? (
                    filteredTemplates.map((template) => (
                      <TemplateCard 
                        key={template.id} 
                        template={template} 
                        onSelect={handleSelectTemplate} 
                      />
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                      No templates found. Try a different search term.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            {categories.map(category => (
              <TabsContent key={category} value={category} className="mt-0">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTemplates.length > 0 ? (
                      filteredTemplates.map((template) => (
                        <TemplateCard 
                          key={template.id} 
                          template={template} 
                          onSelect={handleSelectTemplate} 
                        />
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-muted-foreground">
                        No templates found. Try a different search term.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface TemplateCardProps {
  template: ContextTemplate
  onSelect: (template: ContextTemplate) => void
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{template.name}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-1 mb-2">
          <Badge variant="outline" className="capitalize">
            {template.category}
          </Badge>
          {template.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {template.content.split('\n\n')[0].replace(/[#*`]/g, '')}
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onSelect(template)} className="w-full">
          Use Template
        </Button>
      </CardFooter>
    </Card>
  )
} 