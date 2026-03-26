import { AppShell } from "@/components/app/app-shell";
import AuthGuard from "@/components/AuthGuard";
import { TrackPageView } from "@/components/track-page-view";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <TrackPageView />
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
