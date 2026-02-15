"use client";

import { useState, useMemo } from "react";
import { Search, Users } from "lucide-react";
import { StudentCard } from "./student-card";
import { ManagedStudent } from "@/types";

interface StudentListProps {
  students: ManagedStudent[];
}

type FilterType = "all" | "전공" | "취미";

export function StudentList({ students }: StudentListProps) {
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
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="학생 이름 또는 곡명 검색"
          className="w-full pl-9 pr-4 py-2.5 bg-white/60 backdrop-blur-sm border border-white/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
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
        <div className="text-center py-12 bg-white rounded-xl border border-slate-100">
          <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400">
            {search ? "검색 결과가 없습니다" : "등록된 학생이 없습니다"}
          </p>
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
