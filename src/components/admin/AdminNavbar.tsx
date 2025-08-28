'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import {
  Shield,
  ShieldClose,
  Users,
  Settings,
  Database,
  Activity,
  Heart,
  Home,
  ArrowLeft,
  Crown,
  Puzzle,
  UserCog
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminNavbarProps {
  userRole?: 'super_admin' | 'admin' | 'moderator';
  className?: string;
}

const adminNavItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: Home,
    description: 'Admin dashboard overview'
  },
  {
    title: 'Users',
    href: '/admin/users', 
    icon: Users,
    description: 'Manage users and permissions'
  },
  {
    title: 'Plugins',
    href: '/admin/plugins',
    icon: Puzzle,
    description: 'Plugin management and configuration'
  }
];

const roleIcons = {
  super_admin: Crown,
  admin: Shield,
  moderator: UserCog
};

const roleBadgeVariants = {
  super_admin: 'default',
  admin: 'secondary', 
  moderator: 'outline'
} as const;

export function AdminNavbar({ userRole = 'admin', className }: AdminNavbarProps) {
  const pathname = usePathname();
  const RoleIcon = roleIcons[userRole];

  return (
    <nav className={cn('border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left section - Admin branding and navigation */}
          <div className="flex items-center space-x-6">
            
            <Link href="/" className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">Familying</span>
            </Link>
            
          
          </div>

          {/* Right section - User role and actions */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <NavigationMenu>
                <NavigationMenuList className="flex items-center space-x-1">
                  {adminNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    
                    return (
                      <NavigationMenuItem key={item.href}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={item.href}
                            className={cn(
                              'group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50',
                              isActive && 'bg-accent text-accent-foreground'
                            )}
                          >
                            <Icon className="mr-2 h-4 w-4" />
                            {item.title}
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    );
                  })}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <ShieldClose className="mr-2 h-4 w-4" />
                Exit Admin
              </Link>
            </Button>
            <UserButton />
            
          </div>
        </div>
      </div>
    </nav>
  );
}

// Alternative mobile-friendly admin navbar
export function AdminNavbarMobile({ userRole = 'admin', className }: AdminNavbarProps) {
  const pathname = usePathname();
  const RoleIcon = roleIcons[userRole];

  return (
    <nav className={cn('border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60', className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold">Admin</span>
            <Badge variant={roleBadgeVariants[userRole]} className="ml-2">
              <RoleIcon className="mr-1 h-3 w-3" />
              {userRole.replace('_', ' ')}
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <UserButton />
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <ShieldClose className="mr-1 h-4 w-4" />
                Exit Admin
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile navigation menu */}
        <div className="pb-4">
          <div className="flex space-x-1 overflow-x-auto">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button 
                    variant={isActive ? 'default' : 'ghost'} 
                    size="sm"
                    className="flex-shrink-0"
                  >
                    <Icon className="mr-1 h-4 w-4" />
                    {item.title}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
