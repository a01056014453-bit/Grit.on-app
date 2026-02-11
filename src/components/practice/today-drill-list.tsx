"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Circle, CheckCircle2, Plus, Repeat, Play } from "lucide-react";
import { mockDrillCards, groupDrillsBySong, type GroupedDrills } from "@/data";
import type { DrillCard } from "@/types";

interface TodayDrillListProps {
  onDrillSelect?: (drill: DrillCard) => void;
  selectedDrillId?: string | null;
  showPlayButton?: boolean; // 홈 화면에서는 플레이 버튼 표시
}

export function TodayDrillList({ onDrillSelect, selectedDrillId, showPlayButton = true }: TodayDrillListProps) {
  const router = useRouter();
  const [completedDrills, setCompletedDrills] = useState<Set<string>>(new Set());
  const [customDrills, setCustomDrills] = useState<DrillCard[]>([]);

  // 플레이 버튼 클릭 - 연습 페이지로 이동
  const handleStartPractice = (drill: DrillCard) => {
    // drill 정보를 localStorage에 저장하고 연습 페이지로 이동
    localStorage.setItem("grit-on-active-drill", JSON.stringify(drill));
    router.push("/practice?drill=" + encodeURIComponent(drill.id));
  };

  // localStorage에서 완료된 드릴과 커스텀 드릴 로드
  useEffect(() => {
    const todayStr = getTodayStr();

    // 완료된 드릴 로드
    const savedCompleted = localStorage.getItem(`grit-on-completed-${todayStr}`);
    if (savedCompleted) {
      const data = JSON.parse(savedCompleted);
      setCompletedDrills(new Set(data.completedDrillIds || []));
    }

    // 커스텀 드릴 로드
    const savedCustom = localStorage.getItem("grit-on-custom-drills");
    if (savedCustom) {
      const drills = JSON.parse(savedCustom);
      // DrillCard 형식으로 변환
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
  }, []);

  function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  // 드릴 완료 토글
  const handleToggle = (drillId: string) => {
    setCompletedDrills(prev => {
      const newSet = new Set(prev);
      if (newSet.has(drillId)) {
        newSet.delete(drillId);
      } else {
        newSet.add(drillId);
      }
      // localStorage에 저장
      const todayStr = getTodayStr();
      localStorage.setItem(`grit-on-completed-${todayStr}`, JSON.stringify({
        date: todayStr,
        completedDrillIds: Array.from(newSet),
      }));
      return newSet;
    });
  };

  // 모든 드릴 합치기
  const allDrills = [...mockDrillCards, ...customDrills];
  const groupedDrills = groupDrillsBySong(allDrills);

  const totalCount = allDrills.length;
  const completedCount = allDrills.filter(d => completedDrills.has(d.id)).length;

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-black">오늘의 연습</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {completedCount}/{totalCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="w-7 h-7 bg-violet-100 rounded-full flex items-center justify-center hover:bg-violet-200 transition-colors"
            title="새로고침"
          >
            <Repeat className="w-4 h-4 text-violet-600" />
          </button>
          <button
            className="w-7 h-7 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* 곡별 그룹 리스트 */}
      <div className="space-y-3">
        {groupedDrills.map((group) => (
          <div key={group.song} className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Song Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-semibold text-black">{group.song}</p>
            </div>

            {/* Drills under this song */}
            <div className="divide-y divide-gray-100">
              {group.drills.map((drill) => {
                const isCompleted = completedDrills.has(drill.id);
                const isSelected = selectedDrillId === drill.id;

                return (
                  <div
                    key={drill.id}
                    onClick={() => !isCompleted && onDrillSelect?.(drill)}
                    className={`px-4 py-2.5 flex items-center gap-3 ${
                      isCompleted ? "bg-gray-50" : "bg-white"
                    } ${isSelected ? "bg-violet-50" : ""} ${
                      !isCompleted ? "cursor-pointer hover:bg-gray-50" : ""
                    }`}
                  >
                    {/* 플레이 버튼 - 왼쪽 */}
                    {showPlayButton && !isCompleted && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartPractice(drill);
                        }}
                        className="shrink-0 w-6 h-6 bg-gradient-to-r from-violet-600 to-primary rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
                      >
                        <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                      </button>
                    )}
                    <div className={`flex-1 min-w-0 ${isCompleted ? "opacity-50" : ""}`}>
                      <span className={`text-sm ${isCompleted ? "line-through text-gray-400" : "text-gray-700"}`}>
                        {drill.measures} · {drill.title}
                        {drill.tempo > 0 && ` 템포 ${drill.tempo}`}
                        {drill.recurrence > 0 && ` ${drill.recurrence}회`}
                      </span>
                    </div>
                    {/* 체크 버튼 - 오른쪽 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(drill.id);
                      }}
                      className="shrink-0"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 hover:text-violet-500 transition-colors" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
