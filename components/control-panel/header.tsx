"use client";

import { AuthStatus } from "@/components/auth/auth-status";

export default function ControlPanelHeader() {
  return (
    <div className="w-full flex items-center justify-end">
      <div className="flex items-center gap-2">
        <AuthStatus />
      </div>
    </div>
  );
} 