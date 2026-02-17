"use client";

import { BottomNavigation } from "./bottom-navigation";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="safe-top" />
      <main className="pb-20">{children}</main>
      <BottomNavigation />
    </div>
  );
}
