import { Metadata } from "next";
import { ReactNode } from "react";
import ClientLayout from "@/components/control-panel/client-layout";

// Force all control panel pages to be dynamic (no static generation)
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Control Panel - AdventureTime.Ro",
  description: "Admin control panel for AdventureTime.Ro",
};

export default function ControlPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
} 