'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import clientLogger from '@/lib/client-logger'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardDescription } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import * as ProjectClient from '@/lib/project-client'

interface NewProjectFormProps {
  userId: string
}

export default function NewProjectForm({ userId }: NewProjectFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!userId) {
      setError("User not authenticated.")
      setIsLoading(false)
      return
    }

    if (!name.trim()) {
      setError("Project name is required.")
      setIsLoading(false)
      return
    }

    try {
      const newProject = await ProjectClient.createProject({
        name: name.trim(),
        description: description.trim() || null,
      })

      toast({
        title: "Project Created",
        description: `Project "${newProject.name}" has been successfully created.`,
      })
      router.push(`/projects/${newProject.id}`)
    } catch (err: any) {
      clientLogger.error("Error creating project:", err)
      const errorMessage = err.message || "An unexpected error occurred."
      setError(errorMessage)
      toast({
        title: "Error",
        description: `Failed to create project: ${errorMessage}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardDescription>Enter the details for your new project.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm p-3 bg-red-100 dark:bg-red-900/30 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Marketing Campaign Q3"
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectDescription">Description (Optional)</Label>
            <Textarea
              id="projectDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose or goals of this project."
              rows={4}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Project'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 