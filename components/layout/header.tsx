'use client';

import { Search } from 'lucide-react';
import { Button } from '../ui/button';
import { DestinationSearch } from '../search/destination-search';
import { AuthStatus } from '../auth/auth-status';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    // Check if we're on client-side
    if (typeof window !== 'undefined') {
      const checkScreenSize = () => {
        setIsSmallScreen(window.innerWidth < 1024); // Changed from 768 to 1024 to include medium screens
      };
      
      // Initial check
      checkScreenSize();
      
      // Add event listener for window resize
      window.addEventListener('resize', checkScreenSize);
      
      // Cleanup
      return () => window.removeEventListener('resize', checkScreenSize);
    }
  }, []);

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between p-4 lg:p-6 bg-gradient-to-b from-[#1C1C25]/95 to-[#1C1C25]/98 backdrop-blur-xl border-b border-white/5">
      {/* Logo: Only show on mobile, not on desktop */}
      {isSmallScreen && (
        <div className="absolute inset-x-0 flex justify-center items-center pointer-events-none">
          <Image
            src="/logo.png"
            alt="AdventureTime.Ro Logo"
            width={180}
            height={50}
            className="transition-all duration-300"
            priority
          />
        </div>
      )}
      
      {/* Show empty div for spacing on desktop */}
      {!isSmallScreen && (
        <div className="flex-1 max-w-md lg:max-w-lg">
          <DestinationSearch />
        </div>
      )}
      
      <div className="flex items-center gap-3 lg:gap-6 ml-auto">
        {/* Account button */}
        <div className="flex items-center gap-2 lg:gap-4 pl-3 lg:pl-6">
          <AuthStatus />
        </div>
      </div>
    </div>
  );
} 