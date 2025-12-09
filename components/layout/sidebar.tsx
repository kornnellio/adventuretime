'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { signOut, useSession } from 'next-auth/react';
import { 
  Home,
  Calendar,
  BookOpen,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Compass,
  Menu,
  X,
  Bookmark,
  Gift
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';

const mainNavItems = [
  { icon: Home, label: 'Acasa', href: '/dashboard' },
  { icon: Compass, label: 'Despre Noi', href: '/about' },
  { icon: BookOpen, label: 'Blog', href: '/blog' },
  { icon: Calendar, label: 'Aventurile viitoare', href: '/adventures' },
  { icon: Gift, label: 'Vouchere', href: '/vouchere' },
];

const settingsNavItems = [
  { icon: User, label: 'Profil', href: '/dashboard/profile' },
  { icon: Bookmark, label: 'Rezervările Mele', href: '/dashboard/bookings' },
  { icon: Settings, label: 'Setari', href: '/dashboard/settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
  // Only consider authenticated if status is explicitly 'authenticated' AND user is not null
  const isAuthenticated = status === 'authenticated' && session?.user !== null;

  useEffect(() => {
    console.log('Sidebar - Session Status:', status);
    console.log('Sidebar - Is Authenticated:', isAuthenticated);
    
    // Check if we're on client-side
    if (typeof window !== 'undefined') {
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth < 1024);
      };
      
      // Initial check
      checkIsMobile();
      
      // Add event listener for window resize
      window.addEventListener('resize', checkIsMobile);
      
      // Cleanup
      return () => window.removeEventListener('resize', checkIsMobile);
    }
  }, [status, session, isAuthenticated]);

  const handleLogout = () => {
    console.log('Sidebar - Logout initiated');
    // Simple redirect to the logout page
    window.location.href = '/logout';
  };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2 mb-12">
        <Link href="/dashboard">
          <Image
            src="/logo.png"
            alt="AdventureTime.Ro Logo"
            width={250}
            height={100}
            className="transition-all duration-300 hover:scale-105"
          />
        </Link>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-xs uppercase text-gray-400 font-semibold mb-3 tracking-wider">MAIN</h2>
          <nav className="space-y-1.5">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ease-in-out',
                  (pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href)))
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                )}
                onClick={() => isMobile && setIsOpen(false)}
              >
                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  (pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href))) ? "scale-110" : ""
                )} />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {isAuthenticated && (
          <div>
            <h2 className="text-xs uppercase text-gray-400 font-semibold mb-3 tracking-wider">SETTINGS</h2>
            <nav className="space-y-1.5">
              {settingsNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ease-in-out',
                    pathname === item.href
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  )}
                  onClick={() => isMobile && setIsOpen(false)}
                >
                  <item.icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    pathname === item.href ? "scale-110" : ""
                  )} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>

      <div className="mt-auto space-y-1.5">
        <Link
          href="/dashboard/contact"
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
            pathname === "/dashboard/contact"
              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          )}
          onClick={() => isMobile && setIsOpen(false)}
        >
          <HelpCircle className={cn(
            "h-5 w-5 transition-transform duration-200",
            pathname === "/dashboard/contact" ? "scale-110" : ""
          )} />
          Contact
        </Link>
        {isAuthenticated && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Logout Account
          </button>
        )}
      </div>
    </>
  );

  // Mobile sidebar with Sheet component
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden fixed left-4 top-4 z-50 text-white hover:bg-white/10"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[240px] bg-gradient-to-b from-[#1C1C25]/95 to-[#1C1C25]/98 backdrop-blur-xl border-r border-white/5 text-white">
          <div className="flex flex-col h-full p-6">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop sidebar
  return (
    <div className="hidden lg:flex flex-col h-screen w-[240px] bg-gradient-to-b from-[#1C1C25]/95 to-[#1C1C25]/98 backdrop-blur-xl border-r border-white/5 text-white p-6 sticky top-0">
      <SidebarContent />
    </div>
  );
} 