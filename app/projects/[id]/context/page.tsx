import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from "@/lib/auth"
import * as ProjectService from '@/lib/project-service'
import ContextDigester from './components/ContextDigester'
import ContextCreator from './components/ContextCreator'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Context Management',
  description: 'Upload and manage context for your project',
}

interface ProjectContextPageProps {
  params: {
    id: string
  }
}

export default async function ProjectContextPage({ params }: ProjectContextPageProps) {
  const projectId = params.id
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }
  const userId = session.user.id

  let project;
  try {
    project = await ProjectService.getProject(projectId, userId);
    if (!project) {
       redirect('/dashboard?error=project_not_found')
    }
  } catch (error) {
     console.error('Failed to fetch project:', error)
     redirect('/dashboard?error=project_fetch_failed')
  }
  
  const projectName = project.name

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{projectName} - Context</h1>
        <p className="text-muted-foreground">
          Upload files, create through conversation, or manage context for your project
        </p>
      </div>
      
      <Tabs defaultValue="upload" className="space-y-4">
        <Card className="p-4">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="upload">Upload &amp; Digest</TabsTrigger>
            <TabsTrigger value="create">Create with Chat</TabsTrigger>
          </TabsList>
        </Card>
        
        <TabsContent value="upload">
          <div className="mb-4 flex justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/projects/${projectId}/contexts/new`} passHref>
                    <Button variant="outline" size="sm">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Proceed without digest (not recommended)
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Creating context without AI digestion may result in less structured data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <ContextDigester projectId={projectId} userId={userId} />
        </TabsContent>
        
        <TabsContent value="create">
          <ContextCreator projectId={projectId} userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  )
} 