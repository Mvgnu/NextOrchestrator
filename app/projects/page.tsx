import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { auth } from "@/lib/auth"
import supabase from '@/lib/supabase'

export default async function ProjectsPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }
  
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', session.user.id)
    .order('updated_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching projects:', error)
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Projects</h1>
        <Button asChild>
          <Link href="/projects/new">New Project</Link>
        </Button>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-medium mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-4">Create your first project to get started</p>
          <Button asChild>
            <Link href="/projects/new">Create Project</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link 
              key={project.id} 
              href={`/projects/${project.id}`}
              className="block border rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(project.updated_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
          
          <Link 
            href="/projects/new"
            className="block border border-dashed rounded-lg p-6 flex items-center justify-center hover:shadow-md transition-shadow"
          >
            <div className="text-center">
              <span className="block text-3xl mb-2">+</span>
              <span>New Project</span>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
} 