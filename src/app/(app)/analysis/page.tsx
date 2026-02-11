"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Sparkles, Clock, Music, ChevronRight, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { mockSongs, mockSongAIInfo, composerList, pieceList, getAnalyzedSongs, type AnalyzedSong } from "@/data";

export default function AnalysisPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSong, setNewSong] = useState({ composer: "", title: "" });
  const [analyzedSongs, setAnalyzedSongs] = useState<AnalyzedSong[]>([]);

  // localStorage에서 분석 히스토리 불러오기
  useEffect(() => {
    setAnalyzedSongs(getAnalyzedSongs());
  }, []);

  // 검색 필터링 (기존 곡 + 분석한 곡)
  const filteredSongs = searchQuery.length >= 2
    ? [
        ...mockSongs.filter((song) =>
          song.title.toLowerCase().includes(searchQuery.toLowerCase())
        ).map((song) => ({
          id: song.id,
          title: song.title,
          hasAIInfo: !!mockSongAIInfo[song.id],
          isNew: false,
          composer: "",
        })),
        ...analyzedSongs.filter((song) =>
          song.fullTitle.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !mockSongs.some((m) => m.id === song.id)
        ).map((song) => ({
          id: song.id,
          title: song.fullTitle,
          hasAIInfo: true,
          isNew: true,
          composer: song.composer,
        })),
      ]
    : [];

  // 작곡가 자동완성
  const filteredComposers = newSong.composer.length >= 2
    ? composerList.filter((c) =>
        c.label.toLowerCase().includes(newSong.composer.toLowerCase()) ||
        c.key.includes(newSong.composer.toLowerCase())
      )
    : [];

  // 곡 제목 자동완성 (작곡가가 선택된 경우 해당 작곡가의 곡만, 아니면 전체 검색)
  const selectedComposerKey = composerList.find(
    (c) => c.label.toLowerCase() === newSong.composer.toLowerCase()
  )?.key;

  const filteredPieces = newSong.title.length >= 2
    ? pieceList
        .filter((p) => {
          const matchesTitle =
            p.title.toLowerCase().includes(newSong.title.toLowerCase()) ||
            p.searchKey.includes(newSong.title.toLowerCase().replace(/[^a-z0-9가-힣]/g, ""));
          // 작곡가가 선택되어 있으면 해당 작곡가의 곡만 필터링
          if (selectedComposerKey) {
            return matchesTitle && p.composer === selectedComposerKey;
          }
          return matchesTitle;
        })
        .slice(0, 8) // 최대 8개까지만 표시
    : [];

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">AI 곡 분석하기</h1>
          <p className="text-xs text-muted-foreground">작품 정보와 연주 가이드</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="곡 이름으로 검색 (2글자 이상)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Add Song Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 mb-6 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span className="font-medium">새로운 곡 분석하기</span>
      </button>

      {/* Search Results */}
      {searchQuery.length >= 2 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            검색 결과
          </h3>
          {filteredSongs.length > 0 ? (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {filteredSongs.map((song, index) => (
                <Link
                  key={song.id}
                  href={
                    song.isNew
                      ? `/songs/${song.id}?composer=${encodeURIComponent(song.composer)}&title=${encodeURIComponent(song.title.replace(`${song.composer} `, ""))}`
                      : `/songs/${song.id}`
                  }
                  className={`flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors ${
                    index !== filteredSongs.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Music className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{song.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {song.hasAIInfo ? "AI 분석 정보 있음" : "기본 정보"}
                    </p>
                  </div>
                  {song.hasAIInfo && (
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-secondary/50 rounded-xl p-6 text-center">
              <p className="text-muted-foreground text-sm">검색 결과가 없습니다</p>
            </div>
          )}
        </div>
      )}

      {/* Recent Analysis History & Song List */}
      {searchQuery.length < 2 && (
        <>
          {/* 최근 분석한 곡 (localStorage) */}
          {analyzedSongs.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                최근 분석한 곡
              </h3>
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                {analyzedSongs.slice(0, 5).map((item, index) => {
                  const isMockSong = mockSongs.some((s) => s.id === item.id);
                  return (
                    <Link
                      key={item.id}
                      href={
                        isMockSong
                          ? `/songs/${item.id}`
                          : `/songs/${item.id}?composer=${encodeURIComponent(item.composer)}&title=${encodeURIComponent(item.title)}`
                      }
                      className={`flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors ${
                        index !== Math.min(analyzedSongs.length, 5) - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{item.fullTitle}</p>
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Songs with AI Info */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Music className="w-4 h-4 text-muted-foreground" />
              분석 가능한 곡
            </h3>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {mockSongs.map((song, index) => {
                const hasAIInfo = !!mockSongAIInfo[song.id];
                return (
                  <Link
                    key={song.id}
                    href={`/songs/${song.id}`}
                    className={`flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors ${
                      index !== mockSongs.length - 1 ? "border-b border-border" : ""
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      hasAIInfo ? "bg-primary/10" : "bg-secondary"
                    }`}>
                      <Music className={`w-5 h-5 ${hasAIInfo ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{song.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {hasAIInfo ? "AI 분석 정보 있음" : "기본 정보"}
                      </p>
                    </div>
                    {hasAIInfo && (
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Add Song Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">새로운 곡 분석</h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNewSong({ composer: "", title: "" });
                }}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  작곡가
                </label>
                <input
                  type="text"
                  placeholder="2글자 이상 입력"
                  value={newSong.composer}
                  onChange={(e) => setNewSong({ ...newSong, composer: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  autoFocus
                />
                {filteredComposers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {filteredComposers.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => setNewSong({ ...newSong, composer: c.label })}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          newSong.composer === c.label
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary text-foreground border-border hover:bg-secondary/80"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  곡 이름
                </label>
                <input
                  type="text"
                  placeholder="2글자 이상 입력"
                  value={newSong.title}
                  onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                {filteredPieces.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                    {filteredPieces.map((p, idx) => (
                      <button
                        key={`${p.composer}-${p.title}-${idx}`}
                        onClick={() => setNewSong({ ...newSong, title: p.title })}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          newSong.title === p.title
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-secondary text-foreground border-border hover:bg-secondary/80"
                        }`}
                      >
                        {p.title.length > 30 ? p.title.substring(0, 30) + "..." : p.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                if (newSong.composer.length >= 2 && newSong.title.length >= 2) {
                  const newId = `new-${Date.now()}`;
                  router.push(`/songs/${newId}?composer=${encodeURIComponent(newSong.composer)}&title=${encodeURIComponent(newSong.title)}`);
                  setIsModalOpen(false);
                  setNewSong({ composer: "", title: "" });
                }
              }}
              disabled={newSong.composer.length < 2 || newSong.title.length < 2}
              className="w-full mt-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              분석하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
