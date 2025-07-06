import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { auth } from '@/lib/auth'
import supabase from '@/lib/supabase'
import { BarChart3, LineChart, Users, Database } from 'lucide-react'
import { ApiUsageService } from '@/lib/api-usage-service'
import { FeedbackService } from '@/app/services/feedbackService'
import logger from '@/lib/logger'

export default async function Dashboard() {
  const session = await auth()

  if (!session) {
    redirect('/auth/signin')
  }

  const userId = session.user.id

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(5)

  // Count agents
  const { count: agentCount } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })

  // Fetch basic usage/feedback data
  let totalUsage = 0
  let avgRating: number | null = null
  try {
    const today = new Date()
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    const stats = await ApiUsageService.getUserDashboardStats(
      userId,
      thirtyDaysAgo,
      today,
    )
    totalUsage = stats.total_tokens
    avgRating = stats.avg_rating
  } catch (error) {
    logger.error({ err: error }, 'Dashboard data fetching error')
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all workspaces
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              <Link
                href="/dashboard/agent-performance"
                className="hover:underline"
              >
                View performance analytics
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">API Usage</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalUsage > 1000
                ? `${(totalUsage / 1000).toFixed(1)}K`
                : totalUsage}
            </div>
            <p className="text-xs text-muted-foreground">
              <Link href="/dashboard/usage" className="hover:underline">
                View usage details
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Agent Performance
            </CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgRating !== null ? avgRating.toFixed(1) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              <Link
                href="/dashboard/agent-performance"
                className="hover:underline"
              >
                View performance trends
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Recent Projects</h2>
        <Button asChild size="sm">
          <Link href="/projects/new">New Project</Link>
        </Button>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>
                  {project.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Last updated:{' '}
                  {new Date(project.updated_at).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href={`/projects/${project.id}`}>Open</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/projects/${project.id}/settings`}>
                    Settings
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <p className="text-xl text-center">
            You don&apos;t have any projects yet.
          </p>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/projects/new">Create Your First Project</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/onboarding">Guided Onboarding</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
