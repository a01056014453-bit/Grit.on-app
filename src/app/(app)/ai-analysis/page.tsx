"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Music, Search, Plus, ChevronRight, BookOpen, Clock, Sparkles } from "lucide-react";
import { getRecentAnalyzedSongs, type AnalyzedSong } from "@/lib/song-analysis-store";

// 분석 가능한 곡 목록 (미리 준비된 분석 데이터)
const availableSongs = [
  {
    id: "1",
    title: "Ballade No.1 in G minor",
    opus: "Op.23",
    composer: "F. Chopin",
  },
  {
    id: "2",
    title: "Piano Sonata No.8 in C minor",
    opus: "Op.13 'Pathétique'",
    composer: "L. v. Beethoven",
  },
  {
    id: "3",
    title: "Clair de Lune",
    opus: "Suite Bergamasque No.3",
    composer: "C. Debussy",
  },
  {
    id: "4",
    title: "Etude S.141 No.3",
    opus: "'La Campanella'",
    composer: "F. Liszt",
  },
];

export default function AIAnalysisPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSongs, setRecentSongs] = useState<AnalyzedSong[]>([]);

  useEffect(() => {
    setRecentSongs(getRecentAnalyzedSongs(5));
  }, []);

  const filteredAvailable = availableSongs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.composer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "오늘";
    if (diffDays === 1) return "어제";
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-black">AI 곡 분석하기</h1>
          <p className="text-xs text-gray-500">작품 정보와 연주 가이드</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-amber-600" />
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="곡 이름으로 검색 (2글자 이상)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        />
      </div>

      {/* New Analysis Button */}
      <Link
        href="/ai-analysis/new"
        className="block w-full py-4 mb-6 border-2 border-dashed border-gray-300 rounded-xl text-center text-gray-500 hover:border-violet-400 hover:text-violet-600 transition-colors"
      >
        <Plus className="w-5 h-5 inline mr-2" />
        새로운 곡 분석하기
      </Link>

      {/* Recent Analyzed Songs */}
      {recentSongs.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-black flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-gray-500" />
            최근 분석한 곡
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {recentSongs.map((song, idx) => (
              <Link
                key={song.id}
                href={`/ai-analysis/${song.id}`}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                  idx < recentSongs.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">
                    {song.composer} {song.title} {song.opus || ""}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(song.analyzedAt)}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Available Songs for Analysis */}
      <div>
        <h2 className="text-sm font-semibold text-black flex items-center gap-2 mb-3">
          <Music className="w-4 h-4 text-gray-500" />
          분석 가능한 곡
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filteredAvailable.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              검색 결과가 없습니다
            </div>
          ) : (
            filteredAvailable.map((song, idx) => (
              <Link
                key={song.id}
                href={`/ai-analysis/${song.id}`}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                  idx < filteredAvailable.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                  <Music className="w-5 h-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">
                    {song.composer} {song.title}
                  </p>
                  <p className="text-xs text-gray-500">AI 분석 정보 있음</p>
                </div>
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
