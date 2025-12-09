import { Metadata } from "next";
import { ReactNode } from "react";
import ClientLayout from "@/components/control-panel/client-layout";

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