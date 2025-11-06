'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Building2, Package, Target, MessageSquare, BarChart3, Search } from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    name: 'Companies',
    href: '/companies',
    icon: Building2,
  },
  {
    name: 'Products',
    href: '/products',
    icon: Package,
  },
  {
    name: 'Search',
    href: '/search',
    icon: Search,
  },
  {
    name: 'Feedback',
    href: '/feedback',
    icon: MessageSquare,
  },
  {
    name: 'Chat',
    href: '/chat',
    icon: Target,
  },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex space-x-8">
      {navigation.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
