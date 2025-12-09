"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import {
  BarChart3,
  Compass,
  Users,
  ShoppingCart,
  Tag,
  FileText,
  Settings,
  LogOut,
  FolderOpen,
  Gift,
} from "lucide-react";

const navItems = [
  {
    title: "Dashboard",
    href: "/control-panel",
    icon: BarChart3,
  },
  {
    title: "Adventures",
    href: "/control-panel/adventures",
    icon: Compass,
  },
  {
    title: "Adventure Categories",
    href: "/control-panel/adventure-categories",
    icon: FolderOpen,
  },
  {
    title: "Users",
    href: "/control-panel/users",
    icon: Users,
  },
  {
    title: "Orders",
    href: "/control-panel/orders",
    icon: ShoppingCart,
  },
  {
    title: "Coupons",
    href: "/control-panel/coupons",
    icon: Tag,
  },
  {
    title: "Voucher Purchases",
    href: "/control-panel/voucher-purchases",
    icon: Gift,
  },
  {
    title: "Blogs",
    href: "/control-panel/blogs",
    icon: FileText,
  },
  {
    title: "Settings",
    href: "/control-panel/settings",
    icon: Settings,
  },
];

export default function ControlPanelSidebar() {
  const pathname = usePathname();

  return (
    <div className="h-screen w-64 flex-col bg-card border-r flex">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/control-panel" className="flex items-center gap-2 font-semibold">
          <Compass className="h-6 w-6" />
          <span>AdventureTime Admin</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 gap-1">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
                pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "transparent"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4 border-t">
        <Link
          href="/logout"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-all hover:text-primary"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Link>
      </div>
    </div>
  );
} 