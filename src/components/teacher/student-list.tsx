"use client";

import { useState, useMemo } from "react";
import { Search, Users, UserPlus } from "lucide-react";
import { StudentCard } from "./student-card";
import { ManagedStudent } from "@/types";

interface StudentListProps {
  students: ManagedStudent[];
  onInvite: () => void;
}

type FilterType = "all" | "전공" | "취미";

export function StudentList({ students, onInvite }: StudentListProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = useMemo(() => {
    let result = students;

    if (filter !== "all") {
      result = result.filter((s) => s.type === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.nickname.toLowerCase().includes(q) ||
          s.currentPieces.some((p) => p.toLowerCase().includes(q))
      );
    }

    return result;
  }, [students, search, filter]);

  return (
    <div>
      {/* Search + Invite */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="학생 이름 또는 곡명 검색"
            className="w-full pl-9 pr-4 py-2.5 bg-white/60 backdrop-blur-sm border border-white/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={onInvite}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-medium hover:bg-orange-700 transition-colors"
          aria-label="학생 초대하기"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">초대</span>
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {(["all", "전공", "취미"] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? "bg-orange-600 text-white"
                : "bg-white text-slate-500 border border-slate-200"
            }`}
          >
            {f === "all" ? "전체" : f}
          </button>
        ))}
        <span className="flex items-center text-xs text-slate-400 ml-auto">
          {filtered.length}명
        </span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/60">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500 mb-1">
            {search ? "검색 결과가 없습니다" : "아직 등록된 학생이 없습니다"}
          </p>
          {!search && (
            <>
              <p className="text-xs text-gray-400 mb-4">
                학생을 초대해 학습 현황을 관리해보세요
              </p>
              <button
                onClick={onInvite}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-orange-600 text-white rounded-xl text-sm font-semibold hover:bg-orange-700 transition-colors"
                aria-label="학생 초대하기"
              >
                <UserPlus className="w-4 h-4" />
                학생 초대하기
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      )}
    </div>
  );
}
