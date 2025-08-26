import { UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Crown, UserCog } from "lucide-react";
import { checkIsAdmin, type Admin } from '@/lib/admin';

interface NavbarProps {
  variant?: 'home' | 'dashboard' | 'admin';
  showAuthButtons?: boolean;
}

export async function Navbar({ variant = 'home', showAuthButtons = true }: NavbarProps) {
  const { userId } = await auth();
  const admin = userId ? await checkIsAdmin(userId) : null;
  const isAdmin = !!admin;

  const getRoleIcon = (role: Admin['role']) => {
    switch (role) {
      case 'super_admin':
        return <Crown className="h-3 w-3" />;
      case 'admin':
        return <Shield className="h-3 w-3" />;
      case 'moderator':
        return <UserCog className="h-3 w-3" />;
      default:
        return <Shield className="h-3 w-3" />;
    }
  };

  const formatRoleName = (role: string | undefined): string => {
    if (!role) return 'Unknown';
    return role.replace('_', ' ');
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">Familying</span>
            </Link>
            
            {variant === 'admin' && (
              <Badge variant="destructive" className="flex items-center space-x-1">
                <Shield className="h-3 w-3" />
                <span>Admin Panel</span>
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Navigation Links */}
            {userId && (
              <>
                {variant !== 'dashboard' && (
                  <Button variant="ghost" asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                )}
                
                {isAdmin && variant !== 'admin' && (
                  <Button variant="ghost" asChild className="flex items-center space-x-1">
                    <Link href="/admin">
                      <Shield className="h-4 w-4 mr-1" />
                      Admin
                    </Link>
                  </Button>
                )}
                
                {variant === 'admin' && (
                  <>
                    <Button variant="ghost" asChild>
                      <Link href="/admin/plugins">Plugins</Link>
                    </Button>
                    <Button variant="ghost" asChild>
                      <Link href="/admin/users">Users</Link>
                    </Button>
                    {admin && (
                      <Badge variant="outline" className="flex items-center space-x-1">
                        {getRoleIcon(admin.role)}
                        <span className="capitalize">{formatRoleName(admin.role)}</span>
                      </Badge>
                    )}
                  </>
                )}
              </>
            )}
            
            {/* Auth Section */}
            {showAuthButtons && (
              <>
                {userId ? (
                  <UserButton />
                ) : (
                  <>
                    <Button variant="ghost" asChild>
                      <Link href="/sign-in">Sign In</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/sign-up">Get Started</Link>
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
