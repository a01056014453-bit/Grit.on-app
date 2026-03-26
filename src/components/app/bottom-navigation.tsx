"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, Play, User, Zap, Trophy, Inbox, Users, LayoutDashboard, Pause, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTeacherMode } from "@/hooks/useTeacherMode";
import {
  isPracticeRecording,
  isPracticePaused,
  executeGuardAction,
  subscribePracticeState,
  type GuardAction,
} from "@/hooks/usePracticeGuard";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
}

const studentNavItems: NavItem[] = [
  { href: "/", icon: Home, label: "홈", exact: true },
  { href: "/practice", icon: Play, label: "연습" },
  { href: "/ai-analysis", icon: Zap, label: "AI분석" },
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
  const [paused, setPaused] = useState(false);

  // 가드 모달
  const [guardModal, setGuardModal] = useState<{ href: string } | null>(null);

  useEffect(() => {
    setRecording(isPracticeRecording());
    setPaused(isPracticePaused());
    return subscribePracticeState(() => {
      setRecording(isPracticeRecording());
      setPaused(isPracticePaused());
    });
  }, []);

  const navItems = useMemo(
    () => (isTeacher && teacherMode ? teacherNavItems : studentNavItems),
    [isTeacher, teacherMode],
  );

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const handleNavClick = useCallback(
    (e: React.MouseEvent, href: string, exact?: boolean) => {
      e.preventDefault();
      if (exact ? pathname === href : pathname.startsWith(href)) return;

      if (recording && !paused) {
        // 녹음 중 → 모달 표시
        setGuardModal({ href });
        return;
      }

      if (recording && paused) {
        // 일시정지 상태 → 바로 이동 가능 (세션은 유지됨)
        router.push(href);
        return;
      }

      router.push(href);
    },
    [pathname, recording, paused, router],
  );

  const [guardError, setGuardError] = useState<string | null>(null);

  const handleGuardAction = useCallback(
    (action: GuardAction) => {
      if (!guardModal) return;
      const { href } = guardModal;
      setGuardModal(null);
      setGuardError(null);

      const result = executeGuardAction(action, () => router.push(href));
      if (!result.success && result.error) {
        setGuardError(result.error);
        // 3초 후 에러 메시지 제거
        setTimeout(() => setGuardError(null), 3000);
      }
    },
    [guardModal, router],
  );

  return (
    <>
      {/* 연습 보호 모달 */}
      {guardModal && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setGuardModal(null)} />
          <div className="relative w-full max-w-sm mx-4 mb-20 sm:mb-0 bg-white rounded-2xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* 헤더 */}
            <div className="p-5 pb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Play className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">연습 중입니다</h3>
                  <p className="text-xs text-gray-500">어떻게 할까요?</p>
                </div>
              </div>
            </div>

            {/* 선택지 */}
            <div className="px-5 pb-5 space-y-2">
              {/* 일시정지하고 이동 */}
              <button
                onClick={() => handleGuardAction("pause")}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors text-left"
              >
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <Pause className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">일시정지하고 이동</p>
                  <p className="text-[11px] text-blue-600">돌아오면 이어서 연습할 수 있어요</p>
                </div>
              </button>

              {/* 연습 종료 후 저장 */}
              <button
                onClick={() => handleGuardAction("stop")}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors text-left"
              >
                <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                  <Square className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-orange-900">연습 종료 후 저장</p>
                  <p className="text-[11px] text-orange-600">현재까지의 기록이 저장됩니다</p>
                </div>
              </button>

              {/* 취소 */}
              <button
                onClick={() => setGuardModal(null)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                <span className="text-sm font-medium">연습 계속하기</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-bottom">
        {/* 에러 메시지 */}
        {guardError && (
          <div className="bg-red-100 text-red-700 text-center py-1.5 text-[11px] font-medium">
            {guardError}
          </div>
        )}

        {/* 연습 중/일시정지 인디케이터 */}
        {recording && !pathname.startsWith("/practice") && (
          <button
            onClick={() => router.push("/practice")}
            className={cn(
              "w-full text-white text-center py-1.5 text-[11px] font-medium flex items-center justify-center gap-1.5",
              paused ? "bg-amber-500" : "bg-red-500",
            )}
          >
            <span className={cn("w-2 h-2 bg-white rounded-full", !paused && "animate-pulse")} />
            {paused ? "연습 일시정지 중 — 탭하여 이어하기" : "연습 세션 진행 중 — 탭하여 돌아가기"}
          </button>
        )}

        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-around h-16 px-2">
            {navItems.map((item) => {
              const active = isActive(item.href, item.exact);
              const isPracticeTab = item.href === "/practice";
              const showIndicator = recording && isPracticeTab && !active;

              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href, item.exact)}
                  className={cn(
                    "flex flex-col items-center justify-center w-16 h-full transition-colors relative",
                    active ? "text-black" : "text-gray-400",
                  )}
                >
                  {showIndicator && (
                    <span
                      className={cn(
                        "absolute top-1.5 right-2 w-2.5 h-2.5 rounded-full ring-2 ring-white",
                        paused ? "bg-amber-500" : "bg-red-500 animate-pulse",
                      )}
                    />
                  )}
                  <item.icon
                    className={cn(
                      "w-6 h-6",
                      showIndicator && (paused ? "text-amber-400" : "text-red-400"),
                    )}
                    strokeWidth={active ? 2 : 1.5}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-medium mt-1",
                      showIndicator && (paused ? "text-amber-400" : "text-red-400"),
                    )}
                  >
                    {showIndicator ? (paused ? "일시정지" : "연습중") : item.label}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
