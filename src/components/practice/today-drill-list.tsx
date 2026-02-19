"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Plus, Repeat, Play, Trash2 } from "lucide-react";
import { mockDrillCards, groupDrillsBySong } from "@/data";
import { savePracticeSession, getAllSessions, deleteSession } from "@/lib/db";
import type { DrillCard } from "@/types";

interface TodayDrillListProps {
  onDrillSelect?: (drill: DrillCard) => void;
  selectedDrillId?: string | null;
  showPlayButton?: boolean;
  date?: Date; // 특정 날짜의 드릴 완료 기록 표시
  completedOnly?: boolean; // 완료된 드릴만 표시
  onAddDrill?: () => void;
  onSessionSaved?: () => void; // 세션 저장 후 콜백 (캘린더 갱신용)
}

// 스와이프 삭제 가능한 드릴 아이템
function SwipeableDrillItem({
  drill,
  isCompleted,
  isSelected,
  isToday,
  showPlayButton,
  onDrillSelect,
  onStartPractice,
  onToggle,
  onDelete,
  isCustom,
}: {
  drill: DrillCard;
  isCompleted: boolean;
  isSelected: boolean;
  isToday: boolean;
  showPlayButton: boolean;
  onDrillSelect?: (drill: DrillCard) => void;
  onStartPractice: (drill: DrillCard) => void;
  onToggle: (drillId: string) => void;
  onDelete: (drillId: string) => void;
  isCustom: boolean;
}) {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const isHorizontalRef = useRef<boolean | null>(null);
  const DELETE_THRESHOLD = 70;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isCustom || !isToday) return;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    currentXRef.current = 0;
    isHorizontalRef.current = null;
    setIsSwiping(false);
  }, [isCustom, isToday]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isCustom || !isToday) return;
    const dx = e.touches[0].clientX - startXRef.current;
    const dy = e.touches[0].clientY - startYRef.current;

    // 방향 판별 (처음 한 번만)
    if (isHorizontalRef.current === null && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      isHorizontalRef.current = Math.abs(dx) > Math.abs(dy);
    }

    if (!isHorizontalRef.current) return;

    e.preventDefault();
    const clampedX = Math.min(0, Math.max(-DELETE_THRESHOLD, dx));
    currentXRef.current = clampedX;
    setOffsetX(clampedX);
    setIsSwiping(true);
  }, [isCustom, isToday]);

  const handleTouchEnd = useCallback(() => {
    if (!isCustom || !isToday) return;
    // 충분히 스와이프했으면 열린 상태 유지
    if (currentXRef.current <= -DELETE_THRESHOLD * 0.6) {
      setOffsetX(-DELETE_THRESHOLD);
    } else {
      setOffsetX(0);
    }
    setIsSwiping(false);
    isHorizontalRef.current = null;
  }, [isCustom, isToday]);

  const handleDelete = useCallback(() => {
    setOffsetX(0);
    onDelete(drill.id);
  }, [drill.id, onDelete]);

  // 다른 곳 클릭 시 닫기
  const handleClick = useCallback(() => {
    if (offsetX < 0) {
      setOffsetX(0);
      return;
    }
    if (isToday && !isCompleted) {
      onDrillSelect?.(drill);
    }
  }, [offsetX, isToday, isCompleted, onDrillSelect, drill]);

  return (
    <div className="relative overflow-hidden">
      {/* 삭제 버튼 (스와이프 중일 때만 렌더링) */}
      {isCustom && isToday && offsetX < 0 && (
        <div className="absolute inset-y-0 right-0 flex items-center">
          <button
            onClick={handleDelete}
            className="h-full w-[70px] bg-red-500 flex items-center justify-center"
          >
            <Trash2 className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {/* 드릴 아이템: [체크박스] [내용] [미니재생] */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? "none" : "transform 0.2s ease-out",
        }}
        className={`px-4 py-2.5 flex items-center gap-2.5 relative ${
          isSelected ? "bg-violet-50/30" : ""
        } ${isToday && !isCompleted ? "cursor-pointer" : ""}`}
      >
        {/* 체크박스 - 왼쪽 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle(drill.id);
          }}
          className="shrink-0"
          disabled={!isToday}
        >
          {isCompleted ? (
            <div className="w-[18px] h-[18px] rounded-md bg-violet-500 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
          ) : (
            <div className={`w-[18px] h-[18px] rounded-md border-[1.5px] ${
              isToday ? "border-gray-300 hover:border-violet-400" : "border-gray-200"
            } transition-colors`} />
          )}
        </button>

        {/* 내용 */}
        <div className={`flex-1 min-w-0 ${isCompleted ? "opacity-50" : ""}`}>
          <p className={`text-[12px] leading-tight truncate ${isCompleted ? "line-through text-gray-400" : "text-gray-700"}`}>
            {drill.measures} · {drill.title}
          </p>
          {(drill.tempo > 0 || drill.recurrence > 0) && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              {drill.tempo > 0 && `템포 ${drill.tempo}`}
              {drill.tempo > 0 && drill.recurrence > 0 && " · "}
              {drill.recurrence > 0 && `${drill.recurrence}회`}
            </p>
          )}
        </div>

        {/* 미니 재생 버튼 - 우측 (오늘만, 미완료만) */}
        {isToday && showPlayButton && !isCompleted && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartPractice(drill);
            }}
            className="shrink-0 w-6 h-6 rounded-full bg-violet-100/50 flex items-center justify-center hover:bg-violet-200/60 transition-colors"
          >
            <Play className="w-3 h-3 text-violet-500 fill-violet-500 ml-0.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function TodayDrillList({ onDrillSelect, selectedDrillId, showPlayButton = true, date, completedOnly = false, onAddDrill, onSessionSaved }: TodayDrillListProps) {
  const router = useRouter();
  const [completedDrills, setCompletedDrills] = useState<Set<string>>(new Set());
  const [customDrills, setCustomDrills] = useState<DrillCard[]>([]);
  const [hiddenDrills, setHiddenDrills] = useState<Set<string>>(new Set());

  const now = new Date();
  const isToday = !date || (date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate());

  function formatDateStr(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // 플레이 버튼 클릭 - 연습 페이지로 이동
  const handleStartPractice = (drill: DrillCard) => {
    localStorage.setItem("grit-on-active-drill", JSON.stringify(drill));
    router.push("/practice?drill=" + encodeURIComponent(drill.id));
  };

  // localStorage에서 완료된 드릴과 커스텀 드릴 로드
  useEffect(() => {
    const targetDate = date || new Date();
    const dateStr = formatDateStr(targetDate);

    // 완료된 드릴 로드
    const savedCompleted = localStorage.getItem(`grit-on-completed-${dateStr}`);
    if (savedCompleted) {
      const data = JSON.parse(savedCompleted);
      setCompletedDrills(new Set(data.completedDrillIds || []));
    } else {
      setCompletedDrills(new Set());
    }

    // 커스텀 드릴 로드
    const savedCustom = localStorage.getItem("grit-on-custom-drills");
    if (savedCustom) {
      const drills = JSON.parse(savedCustom);
      const converted: DrillCard[] = drills.map((d: any) => ({
        id: d.id,
        type: "custom",
        icon: "",
        song: d.song,
        title: d.title || "연습",
        measures: d.measures,
        action: "",
        tempo: d.tempo || 0,
        duration: d.duration || 0,
        recurrence: d.recurrence || 1,
        confidence: 0,
      }));
      setCustomDrills(converted);
    }

    // 숨긴 드릴 로드
    const savedHidden = localStorage.getItem("grit-on-hidden-drills");
    if (savedHidden) {
      setHiddenDrills(new Set(JSON.parse(savedHidden)));
    } else {
      setHiddenDrills(new Set());
    }
  }, [date]);

  // 드릴 삭제 (커스텀: localStorage에서 제거, 기본: 숨김 처리)
  const handleDeleteDrill = useCallback((drillId: string) => {
    const isCustomDrill = customDrills.some(d => d.id === drillId);
    if (isCustomDrill) {
      const savedCustom = localStorage.getItem("grit-on-custom-drills");
      if (savedCustom) {
        const drills = JSON.parse(savedCustom);
        const updated = drills.filter((d: any) => d.id !== drillId);
        localStorage.setItem("grit-on-custom-drills", JSON.stringify(updated));
      }
      setCustomDrills(prev => prev.filter(d => d.id !== drillId));
    } else {
      setHiddenDrills(prev => {
        const newSet = new Set(prev);
        newSet.add(drillId);
        localStorage.setItem("grit-on-hidden-drills", JSON.stringify(Array.from(newSet)));
        return newSet;
      });
    }
  }, [customDrills]);

  // 드릴 완료 토글 (오늘만 가능)
  const handleToggle = async (drillId: string) => {
    if (!isToday) return;

    const drill = allDrills.find(d => d.id === drillId);
    const wasCompleted = completedDrills.has(drillId);

    setCompletedDrills(prev => {
      const newSet = new Set(prev);
      if (newSet.has(drillId)) {
        newSet.delete(drillId);
      } else {
        newSet.add(drillId);
      }
      const dateStr = formatDateStr(new Date());
      localStorage.setItem(`grit-on-completed-${dateStr}`, JSON.stringify({
        date: dateStr,
        completedDrillIds: Array.from(newSet),
      }));
      return newSet;
    });

    // 완료 체크 시 연습 세션 자동 저장
    if (!wasCompleted && drill) {
      try {
        const now = new Date();
        const durationSec = (drill.duration || 3) * 60; // 분 → 초
        const startTime = new Date(now.getTime() - durationSec * 1000);
        await savePracticeSession({
          pieceId: `drill-${drill.id}`,
          pieceName: drill.song,
          startTime,
          endTime: now,
          totalTime: durationSec,
          practiceTime: durationSec,
          synced: false,
          practiceType: "partial",
          label: "드릴 완료",
          todoNote: `${drill.measures} · ${drill.title}`,
        });
      } catch (err) {
        console.error("Failed to save drill session:", err);
      }
    }

    // 완료 해제 시 해당 드릴의 오늘 연습 세션 삭제
    if (wasCompleted && drill) {
      try {
        const allSessions = await getAllSessions();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const drillPieceId = `drill-${drill.id}`;
        const matchingSessions = allSessions.filter(s => {
          if (s.pieceId !== drillPieceId) return false;
          const sessionDate = new Date(s.startTime);
          sessionDate.setHours(0, 0, 0, 0);
          return sessionDate.getTime() === today.getTime();
        });
        for (const session of matchingSessions) {
          if (session.id != null) {
            await deleteSession(session.id);
          }
        }
      } catch (err) {
        console.error("Failed to delete drill session:", err);
      }
    }

    // 항상 부모에게 데이터 갱신 알림 (IndexedDB 성공/실패 무관)
    onSessionSaved?.();
  };

  // 커스텀 드릴 ID 목록
  const customDrillIds = new Set(customDrills.map(d => d.id));

  // 모든 드릴 합치기 (숨긴 드릴 제외)
  const allDrills = [...mockDrillCards, ...customDrills].filter(d => !hiddenDrills.has(d.id));
  const groupedDrills = groupDrillsBySong(allDrills);

  const totalCount = allDrills.length;
  const completedCount = allDrills.filter(d => completedDrills.has(d.id)).length;

  // completedOnly 모드이거나 과거 날짜에 완료 기록이 없으면 표시하지 않음
  if (completedOnly && completedCount === 0) return null;
  if (!completedOnly && !isToday && completedCount === 0) return null;

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-violet-700 bg-violet-100 px-3.5 py-1 rounded-full">
            {completedOnly ? "완료한 연습" : isToday ? "오늘의 To do list" : "연습 드릴"}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {completedCount}/{totalCount}
          </span>
        </div>
        {isToday && !completedOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/routines")}
              className="w-7 h-7 bg-violet-100 rounded-full flex items-center justify-center hover:bg-violet-200 transition-colors"
              title="루틴 만들기"
            >
              <Repeat className="w-4 h-4 text-violet-600" />
            </button>
            <button
              onClick={onAddDrill}
              className="w-7 h-7 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>

      {/* 단일 글래스카드 플랫 리스트 */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.6)",
          boxShadow: "0 8px 32px rgba(124,58,237,0.08)",
        }}
      >
        {groupedDrills.map((group, groupIdx) => {
          // completedOnly 또는 과거 날짜: 완료된 드릴만 표시
          const visibleDrills = (completedOnly || !isToday)
            ? group.drills.filter(d => completedDrills.has(d.id))
            : group.drills;
          if (visibleDrills.length === 0) return null;

          const groupCompletedCount = visibleDrills.filter(d => completedDrills.has(d.id)).length;
          const isLast = groupIdx === groupedDrills.length - 1;

          return (
            <div
              key={group.song}
              style={!isLast ? { borderBottom: "1px solid rgba(124,58,237,0.06)" } : undefined}
            >
              {/* 곡 헤더 */}
              <div className="px-4 py-2 flex items-center justify-between" style={{ background: "rgba(0,0,0,0.015)" }}>
                <p className="font-semibold text-[13px] text-gray-800">{group.song}</p>
                <span className="text-[11px] text-gray-300">
                  {groupCompletedCount}/{visibleDrills.length}
                </span>
              </div>

              {/* 곡 내 드릴 리스트 */}
              {visibleDrills.map((drill) => {
                const isCompleted = completedDrills.has(drill.id);
                const isSelected = selectedDrillId === drill.id;
                const isCustom = customDrillIds.has(drill.id);

                return (
                  <SwipeableDrillItem
                    key={drill.id}
                    drill={drill}
                    isCompleted={isCompleted}
                    isSelected={isSelected}
                    isToday={isToday}
                    showPlayButton={showPlayButton}
                    onDrillSelect={onDrillSelect}
                    onStartPractice={handleStartPractice}
                    onToggle={handleToggle}
                    onDelete={handleDeleteDrill}
                    isCustom={isCustom}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
