"use client";

import { useState } from "react";
import Link from "next/link";
import { Brain, Music, Search, Plus, ChevronRight, BookOpen, Clock, Sparkles } from "lucide-react";

// 사용자가 추가한 곡 목록 (분석 완료된 곡)
const analyzedSongs = [
  {
    id: "1",
    title: "Ballade No.1 in G minor",
    opus: "Op.23",
    composer: "F. Chopin",
    period: "Romantic",
    year: "1835",
    analysisDate: "2024-12-30",
  },
  {
    id: "2",
    title: "Piano Sonata No.8 in C minor",
    opus: "Op.13",
    composer: "L. v. Beethoven",
    period: "Classical",
    year: "1798",
    analysisDate: "2024-12-28",
  },
  {
    id: "3",
    title: "Clair de Lune",
    opus: "Suite Bergamasque No.3",
    composer: "C. Debussy",
    period: "Impressionist",
    year: "1905",
    analysisDate: "2024-12-25",
  },
];

export default function AIAnalysisPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const filteredSongs = analyzedSongs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.composer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          AI 곡 분석
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          곡의 배경, 형식, 화성 분석 및 연습 포인트를 확인하세요
        </p>
      </div>

      {/* Search / Add New Song */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="곡 또는 작곡가 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Link
            href="/ai-analysis/new"
            className="px-4 py-3 rounded-xl bg-primary text-white font-medium text-sm flex items-center gap-1.5 hover:bg-primary/90 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            분석
          </Link>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-primary/5 to-violet-500/5 rounded-xl border border-primary/10 p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">AI가 분석해드려요</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              곡 제목과 작곡가를 입력하면 곡의 역사적 배경, 형식 분석,
              화성 진행, 연습 포인트를 정확한 자료를 바탕으로 제공합니다.
            </p>
          </div>
        </div>
      </div>

      {/* Analyzed Songs List */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          분석된 곡 ({filteredSongs.length})
        </h2>

        {filteredSongs.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Music className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">
              {searchQuery ? "검색 결과가 없습니다" : "아직 분석된 곡이 없습니다"}
            </p>
            <Link
              href="/ai-analysis/new"
              className="text-primary text-sm font-medium hover:underline"
            >
              새 곡 분석하기
            </Link>
          </div>
        ) : (
          filteredSongs.map((song) => (
            <Link
              key={song.id}
              href={`/ai-analysis/${song.id}`}
              className="block bg-card rounded-xl p-4 border border-border hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Music className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{song.composer}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {song.title} {song.opus}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                      {song.period}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {song.year}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
