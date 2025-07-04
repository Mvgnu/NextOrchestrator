'use client'

import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  ChatBubbleIcon, 
  CubeIcon, 
  DashboardIcon, 
  FileTextIcon, 
  LayersIcon, 
  BookmarkIcon,
  RocketIcon,
  GearIcon,
} from '@radix-ui/react-icons'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

export function ProjectNavigation() {
  const params = useParams()
  const pathname = usePathname()
  const projectId = params.id as string
  
  const navItems: NavItem[] = [
    {
      title: 'Overview',
      href: `/projects/${projectId}`,
      icon: <DashboardIcon className="h-4 w-4" />,
    },
    {
      title: 'Chat',
      href: `/projects/${projectId}/chat`,
      icon: <ChatBubbleIcon className="h-4 w-4" />,
    },
    {
      title: 'Agents',
      href: `/projects/${projectId}/agents`,
      icon: <RocketIcon className="h-4 w-4" />,
    },
    {
      title: 'Contexts',
      href: `/projects/${projectId}/contexts`,
      icon: <FileTextIcon className="h-4 w-4" />,
    },
    {
      title: 'Context Builder',
      href: `/projects/${projectId}/context`,
      icon: <LayersIcon className="h-4 w-4" />,
    },
    {
      title: 'Settings',
      href: `/projects/${projectId}/settings`,
      icon: <GearIcon className="h-4 w-4" />,
    },
  ]
  
  return (
    <nav className="flex overflow-auto md:flex-col py-2 md:py-6 px-2 md:space-y-1 border-b md:border-r md:h-screen md:w-56">
      <div className="flex-1 space-y-1">
        {navItems.map((item) => {
          // Check if the current path matches the nav item
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          
          return (
            <Button
              key={item.href}
              variant={isActive ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start',
                isActive ? 'bg-secondary' : 'hover:bg-secondary/50'
              )}
              asChild
            >
              <Link href={item.href} aria-current={isActive ? 'page' : undefined}>
                {item.icon}
                <span className="ml-2">{item.title}</span>
              </Link>
            </Button>
          )
        })}
      </div>
    </nav>
  )
} 