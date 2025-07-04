import { ProjectNavigation } from '@/components/project/ProjectNavigation'

interface ProjectLayoutProps {
  children: React.ReactNode
  params: {
    id: string
  }
}

export default function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  return (
    <div className="flex flex-col md:flex-row h-screen">
      <ProjectNavigation />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
} 