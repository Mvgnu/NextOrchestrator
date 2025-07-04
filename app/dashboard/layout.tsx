'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/usage', label: 'Usage Analytics' },
    { href: '/dashboard/agent-performance', label: 'Agent Performance' },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
        <aside className="w-full">
          <Card className="p-4">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.href}
                    href={item.href} 
                    className={cn(
                      'block px-3 py-2 rounded-md transition-colors',
                      isActive
                        ? 'bg-muted font-medium'
                        : 'hover:bg-muted'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </Card>
        </aside>
        <main>
          {children}
        </main>
      </div>
    </div>
  );
} 