"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Search, SlidersHorizontal, Star, Clock, Coins, X, ArrowLeft, Inbox, ChevronRight } from "lucide-react";
import { TeacherCard } from "@/components/feedback/teacher-card";
import { getTeachers, filterTeachers } from "@/lib/feedback-store";

type SortOption = "rating" | "price" | "responseTime" | "completedCount";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "rating", label: "평점순" },
  { value: "completedCount", label: "인기순" },
  { value: "responseTime", label: "응답속도순" },
  { value: "price", label: "가격순" },
];

const specialtyFilters = [
  "전체",
  "쇼팽",
  "베토벤",
  "바흐",
  "테크닉",
  "입시",
  "리듬",
];

export default function TeachersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("전체");
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);

  const allTeachers = getTeachers();

  const filteredTeachers = useMemo(() => {
    let result = filterTeachers({
      specialty: selectedSpecialty === "전체" ? undefined : selectedSpecialty,
      minRating,
      maxPrice,
      sortBy,
    });

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(lowerQuery) ||
          t.title.toLowerCase().includes(lowerQuery) ||
          t.specialty.some((s) => s.toLowerCase().includes(lowerQuery))
      );
    }

    return result;
  }, [selectedSpecialty, sortBy, minRating, maxPrice, searchQuery]);

  const clearFilters = () => {
    setMinRating(undefined);
    setMaxPrice(undefined);
    setSelectedSpecialty("전체");
    setSearchQuery("");
  };

  const hasActiveFilters = minRating || maxPrice || selectedSpecialty !== "전체";

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center hover:bg-white/60 transition-colors border border-white/50"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900">선생님 찾기</h1>
          <p className="text-xs text-gray-500">나에게 맞는 선생님을 찾아 1:1 피드백을 요청하세요</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Users className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-3 border border-white/60 shadow-sm text-center">
          <Users className="w-5 h-5 text-violet-600 mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-900">{allTeachers.length}</div>
          <div className="text-[10px] text-gray-500">등록 선생님</div>
        </div>
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-3 border border-white/60 shadow-sm text-center">
          <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-900">4.7</div>
          <div className="text-[10px] text-gray-500">평균 평점</div>
        </div>
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-3 border border-white/60 shadow-sm text-center">
          <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
          <div className="text-lg font-bold text-gray-900">3.2h</div>
          <div className="text-[10px] text-gray-500">평균 응답</div>
        </div>
      </div>

      {/* 내 피드백 보관함 */}
      <Link
        href="/feedback"
        className="flex items-center gap-3 mb-6 bg-white/50 backdrop-blur-xl rounded-2xl p-4 border border-white/60 shadow-sm hover:bg-white/70 transition-all active:scale-[0.98]"
      >
        <div className="w-10 h-10 rounded-xl bg-violet-100/70 flex items-center justify-center shrink-0">
          <Inbox className="w-5 h-5 text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-gray-900">내 피드백 보관함</h3>
          <p className="text-[11px] text-gray-500">요청한 피드백 진행 상황 확인</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
      </Link>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="이름, 전공, 전문 분야 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/60 backdrop-blur-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 border border-white/60 shadow-sm"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${
            showFilters ? "bg-violet-600 text-white" : "text-gray-400 hover:bg-white/60"
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-white/50 backdrop-blur-xl rounded-2xl p-4 border border-white/60 shadow-sm mb-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">상세 필터</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-violet-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                초기화
              </button>
            )}
          </div>

          {/* Min Rating Filter */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              최소 평점
            </label>
            <div className="flex gap-2">
              {[4.0, 4.5, 4.7].map((rating) => (
                <button
                  key={rating}
                  onClick={() =>
                    setMinRating(minRating === rating ? undefined : rating)
                  }
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    minRating === rating
                      ? "bg-amber-100 text-amber-700 border border-amber-200"
                      : "bg-white/40 text-gray-600 hover:bg-white/60"
                  }`}
                >
                  <Star className="w-3 h-3" />
                  {rating}+
                </button>
              ))}
            </div>
          </div>

          {/* Max Price Filter */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">
              최대 가격
            </label>
            <div className="flex gap-2">
              {[30, 50, 70].map((price) => (
                <button
                  key={price}
                  onClick={() =>
                    setMaxPrice(maxPrice === price ? undefined : price)
                  }
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    maxPrice === price
                      ? "bg-violet-100 text-violet-700 border border-violet-200"
                      : "bg-white/40 text-gray-600 hover:bg-white/60"
                  }`}
                >
                  <Coins className="w-3 h-3" />
                  {price} 이하
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Specialty Filter Tags */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        {specialtyFilters.map((specialty) => (
          <button
            key={specialty}
            onClick={() => setSelectedSpecialty(specialty)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              selectedSpecialty === specialty
                ? "bg-violet-100 text-violet-700"
                : "bg-white/40 text-gray-600 hover:bg-white/60"
            }`}
          >
            {specialty}
          </button>
        ))}
      </div>

      {/* Sort Options */}
      <div className="flex gap-2 mb-4">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSortBy(option.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              sortBy === option.value
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-white/40 text-gray-600 hover:bg-white/60"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Teacher List */}
      <div className="space-y-3">
        {filteredTeachers.length === 0 ? (
          <div className="text-center py-12 bg-white/50 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">조건에 맞는 선생님이 없습니다</p>
            <button
              onClick={clearFilters}
              className="mt-3 text-sm text-violet-600 font-medium"
            >
              필터 초기화
            </button>
          </div>
        ) : (
          filteredTeachers.map((teacher) => (
            <TeacherCard key={teacher.id} teacher={teacher} />
          ))
        )}
      </div>

      {/* Results count */}
      {filteredTeachers.length > 0 && (
        <p className="text-center text-xs text-muted-foreground mt-4">
          총 {filteredTeachers.length}명의 선생님
        </p>
      )}
    </div>
  );
}
