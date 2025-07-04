import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import NewProjectForm from './new-project-form'

export default async function NewProjectPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/signin')
  }
  
  return (
    <div className="container mx-auto py-10">
      <Link
        href="/dashboard"
        className="text-sm text-muted-foreground hover:text-foreground flex items-center mb-6"
      >
        ← Back to Dashboard
      </Link>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Project</CardTitle>
          <CardDescription>
            Start a new project to organize your agents and context
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewProjectForm userId={session.user.id} />
        </CardContent>
      </Card>
    </div>
  )
} 