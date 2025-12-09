'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export function AuthStatus() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Add console log to track session status
  useEffect(() => {
    console.log('AuthStatus - Session Status:', status);
  }, [status]);
  
  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks
    
    setIsLoggingOut(true);
    console.log('Logout initiated from AuthStatus');
    
    // Simple redirect to the logout page
    window.location.href = '/logout';
  };
  
  if (status === 'loading') {
    return (
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-muted animate-pulse" />
        <div className="hidden md:block h-4 w-24 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  // Handle both explicit unauthenticated status and corrupted session state
  if (status === 'unauthenticated' || !session || (!session?.user || session.user === null)) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-white/5">
            <UserIcon className="h-5 w-5 text-gray-300" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48" align="end">
          <Link href="/login" className="w-full">
            <DropdownMenuItem>
              Log in
            </DropdownMenuItem>
          </Link>
          <Link href="/register" className="w-full">
            <DropdownMenuItem>
              Sign up
            </DropdownMenuItem>
          </Link>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-7 w-7 md:h-8 md:w-8 rounded-full p-0">
          <Avatar className="h-7 w-7 md:h-8 md:w-8">
            <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || ''} />
            <AvatarFallback>
              {session?.user?.name?.charAt(0) || session?.user?.username?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 md:w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {session?.user?.name} {session?.user?.surname}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              @{session?.user?.username || session?.user?.email?.split('@')[0]}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/profile">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-600"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 