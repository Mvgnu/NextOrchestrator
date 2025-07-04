'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// Define the structure for navigation items
interface NavItem {
  href: string;
  label: string;
}

// List of documentation sections
const docNavItems: NavItem[] = [
  { href: '/docs', label: 'Introduction' },
  { href: '/docs/getting-started', label: 'Getting Started' },
  { href: '/docs/projects', label: 'Projects' },
  { href: '/docs/agents', label: 'Agents' },
  { href: '/docs/contexts', label: 'Contexts' },
  { href: '/docs/chat', label: 'Chat Interface' },
  { href: '/docs/analytics', label: 'Analytics' },
  { href: '/docs/settings', label: 'Settings' },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] lg:grid-cols-[250px_1fr] gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full">
          <nav className="space-y-1 sticky top-16">
            <h4 className="font-medium text-sm text-muted-foreground mb-2 px-3">Documentation</h4>
            {docNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={cn(
                    'block px-3 py-1.5 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-muted font-medium text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="prose dark:prose-invert max-w-none">
          {children}
        </main>
      </div>
    </div>
  );
} 