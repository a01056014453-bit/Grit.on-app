"use client";

import { useState, useMemo } from "react";
import { Check, X } from "lucide-react";
import { groupDrillsBySong } from "@/data";
import { getAllAvailableDrills, loadScheduledDrillIds } from "@/lib/drill-records";

export function ScheduleModal({
  dateStr,
  dateLabel,
  onClose,
  onSave,
}: {
  dateStr: string;
  dateLabel: string;
  onClose: () => void;
  onSave: (ids: string[]) => void;
}) {
  const allDrills = useMemo(() => getAllAvailableDrills(), []);
  const grouped = useMemo(() => groupDrillsBySong(allDrills), [allDrills]);
  const [selected, setSelected] = useState<Set<string>>(() => loadScheduledDrillIds(dateStr));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(allDrills.map((d) => d.id)));
  const clearAll = () => setSelected(new Set());

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-t-[24px] max-h-[75vh] flex flex-col"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h3 className="text-[16px] font-bold text-gray-900">연습 일정 추가</h3>
            <p className="text-[12px] text-gray-400 mt-0.5">{dateLabel}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 px-5 pb-3">
          <button
            onClick={selectAll}
            className="text-[11px] px-3 py-1 rounded-full bg-violet-100 text-violet-600 font-medium"
          >
            전체 선택
          </button>
          <button
            onClick={clearAll}
            className="text-[11px] px-3 py-1 rounded-full bg-gray-100 text-gray-500 font-medium"
          >
            전체 해제
          </button>
        </div>

        {/* Drill list */}
        <div className="flex-1 overflow-y-auto px-5 pb-3">
          {grouped.map((group) => (
            <div key={group.song} className="mb-3">
              <p className="text-[12px] font-semibold text-gray-500 mb-1.5">{group.song}</p>
              {group.drills.map((drill) => {
                const isSelected = selected.has(drill.id);
                return (
                  <button
                    key={drill.id}
                    onClick={() => toggle(drill.id)}
                    className="w-full flex items-center gap-2.5 py-2 text-left"
                  >
                    <div
                      className={`w-[20px] h-[20px] rounded-md flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? "bg-violet-500" : "border-[1.5px] border-gray-300"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-gray-700 truncate">
                        {drill.measures} · {drill.title}
                      </p>
                      {(drill.tempo > 0 || drill.recurrence > 0) && (
                        <p className="text-[11px] text-gray-400">
                          {drill.tempo > 0 && `템포 ${drill.tempo}`}
                          {drill.tempo > 0 && drill.recurrence > 0 && " · "}
                          {drill.recurrence > 0 && `${drill.recurrence}회`}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Save button */}
        <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <button
            onClick={() => onSave(Array.from(selected))}
            className="w-full py-3 rounded-xl bg-violet-600 text-white font-bold text-[14px] active:bg-violet-700 transition-colors"
          >
            저장 ({selected.size}개)
          </button>
        </div>
      </div>
    </div>
  );
}
