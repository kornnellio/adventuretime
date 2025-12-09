"use client";

import { ReactNode, useState } from "react";
import ControlPanelSidebar from "@/components/control-panel/sidebar";
import ControlPanelHeader from "@/components/control-panel/header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <ControlPanelSidebar />
      </div>
      
      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64 max-w-[80vw]">
          <ControlPanelSidebar />
        </SheetContent>
      </Sheet>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Modified Header with Mobile Menu Button */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background px-2 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          
          <ControlPanelHeader />
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
} 