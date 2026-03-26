"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, Play, User, Zap, Trophy, Inbox, Users, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeacherMode } from "@/hooks/useTeacherMode";
import { isPracticeRecording, guardNavigation, subscribePracticeState } from "@/hooks/usePracticeGuard";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
}

const studentNavItems: NavItem[] = [
  { href: "/", icon: Home, label: "홈", exact: true },
  { href: "/practice", icon: Play, label: "연습" },
  { href: "/analysis", icon: Zap, label: "AI분석" },
  { href: "/ranking", icon: Trophy, label: "랭킹" },
  { href: "/profile", icon: User, label: "프로필" },
];

const teacherNavItems: NavItem[] = [
  { href: "/", icon: LayoutDashboard, label: "대시보드", exact: true },
  { href: "/inbox", icon: Inbox, label: "인박스" },
  { href: "/teacher/students", icon: Users, label: "학생관리" },
  { href: "/profile", icon: User, label: "프로필" },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { isTeacher, teacherMode } = useTeacherMode();
  const [recording, setRecording] = useState(false);

  // 연습 상태 구독
  useEffect(() => {
    setRecording(isPracticeRecording());
    return subscribePracticeState(() => {
      setRecording(isPracticeRecording());
    });
  }, []);

  const navItems = useMemo(
    () => (isTeacher && teacherMode ? teacherNavItems : studentNavItems),
    [isTeacher, teacherMode]
  );

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleNavClick = useCallback((e: React.MouseEvent, href: string) => {
    e.preventDefault();

    // 이미 현재 페이지면 무시
    const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
    if (active) return;

    // 연습 중이면 가드
    if (recording) {
      guardNavigation(href, () => router.push(href));
      return;
    }

    router.push(href);
  }, [pathname, recording, router]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-bottom">
      {/* 연습 중 인디케이터 — 다른 탭에 있을 때 표시 */}
      {recording && !pathname.startsWith("/practice") && (
        <button
          onClick={() => router.push("/practice")}
          className="w-full bg-red-500 text-white text-center py-1.5 text-[11px] font-medium flex items-center justify-center gap-1.5"
        >
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          연습 세션 진행 중 — 탭하여 돌아가기
        </button>
      )}

      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            const isPracticeTab = item.href === "/practice";
            const showRecordingIndicator = recording && isPracticeTab && !active;

            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-full transition-colors relative",
                  active ? "text-black" : "text-gray-400"
                )}
              >
                {/* 연습 중 빨간 점 */}
                {showRecordingIndicator && (
                  <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse ring-2 ring-white" />
                )}

                <item.icon
                  className={cn("w-6 h-6", showRecordingIndicator && "text-red-400")}
                  strokeWidth={active ? 2 : 1.5}
                />
                <span className={cn(
                  "text-[10px] font-medium mt-1",
                  showRecordingIndicator && "text-red-400"
                )}>
                  {showRecordingIndicator ? "연습중" : item.label}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
