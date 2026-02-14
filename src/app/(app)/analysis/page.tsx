"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Sparkles, Music, ChevronRight, Plus, X, Camera, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { mockSongs, mockSongAIInfo, composerList } from "@/data";
import type { SongAnalysis } from "@/types/song-analysis";
import Image from "next/image";

/** 작곡가 초상화 (Wikimedia Commons, public domain) */
const COMPOSER_PORTRAITS: Record<string, string> = {
  chopin: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Frederic_Chopin_photo.jpeg/200px-Frederic_Chopin_photo.jpeg",
  beethoven: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Joseph_Karl_Stieler%27s_Beethoven_mit_dem_Manuskript_der_Missa_solemnis.jpg/200px-Joseph_Karl_Stieler%27s_Beethoven_mit_dem_Manuskript_der_Missa_solemnis.jpg",
  bach: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Johann_Sebastian_Bach.jpg/200px-Johann_Sebastian_Bach.jpg",
  mozart: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/The_Mozart_Family_-_Wolfgang_Amadeus_Mozart_headshot.jpg/200px-The_Mozart_Family_-_Wolfgang_Amadeus_Mozart_headshot.jpg",
  schubert: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Franz_Schubert_by_Wilhelm_August_Rieder_1875.jpg/200px-Franz_Schubert_by_Wilhelm_August_Rieder_1875.jpg",
  schumann: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Robert_Schumann_1839.jpg/200px-Robert_Schumann_1839.jpg",
  liszt: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Franz_Liszt_by_Herman_Biow-_1843.png/200px-Franz_Liszt_by_Herman_Biow-_1843.png",
  debussy: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Claude_Debussy_by_Atelier_Nadar.jpg/200px-Claude_Debussy_by_Atelier_Nadar.jpg",
  rachmaninoff: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Sergei_Rachmaninoff_cph.3a40575.jpg/200px-Sergei_Rachmaninoff_cph.3a40575.jpg",
  rachmaninov: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Sergei_Rachmaninoff_cph.3a40575.jpg/200px-Sergei_Rachmaninoff_cph.3a40575.jpg",
  tchaikovsky: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Tchaikovsky_by_Reutlinger_%28cropped%29.jpg/200px-Tchaikovsky_by_Reutlinger_%28cropped%29.jpg",
  ravel: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Maurice_Ravel_1925.jpg/200px-Maurice_Ravel_1925.jpg",
  brahms: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/JohannesBrahms.jpg/200px-JohannesBrahms.jpg",
  haydn: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Joseph_Haydn%2C_target_of_a_prank.jpg/200px-Joseph_Haydn%2C_target_of_a_prank.jpg",
  prokofiev: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Sergei_Prokofiev_circa_1918_over_Chair_%28cropped%29.jpg/200px-Sergei_Prokofiev_circa_1918_over_Chair_%28cropped%29.jpg",
  scriabin: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Scriabin_prometheus.jpg/200px-Scriabin_prometheus.jpg",
  grieg: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Edvard_Grieg_%281888%29_by_Elliot_and_Fry_-_02.jpg/200px-Edvard_Grieg_%281888%29_by_Elliot_and_Fry_-_02.jpg",
  mendelssohn: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Felix_Mendelssohn_Bartholdy.jpg/200px-Felix_Mendelssohn_Bartholdy.jpg",
};

function getComposerPortrait(composerName: string): string | null {
  const lower = composerName.toLowerCase();
  for (const [key, url] of Object.entries(COMPOSER_PORTRAITS)) {
    if (lower.includes(key)) return url;
  }
  return null;
}

// Stagger animation variants
const listContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const listItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

// Blur-in text animation variants (per character)
const charVariants: Variants = {
  hidden: { opacity: 0, filter: "blur(8px)" },
  show: (i: number) => ({
    opacity: 1,
    filter: "blur(0px)",
    transition: { delay: i * 0.04, duration: 0.4, ease: "easeOut" },
  }),
};

function SpotlightCard({
  children,
  className = "",
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <Link
      ref={cardRef}
      href={href}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(200px circle at ${mousePos.x}px ${mousePos.y}px, rgba(139,92,246,0.12), transparent 60%)`,
          }}
        />
      )}
      <div className="relative z-10 flex items-center gap-3 w-full">{children}</div>
    </Link>
  );
}

export default function AnalysisPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSong, setNewSong] = useState({ composer: "", title: "" });
  const [sheetImages, setSheetImages] = useState<string[]>([]);
  const [savedAnalyses, setSavedAnalyses] = useState<SongAnalysis[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SongAnalysis | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (item: SongAnalysis) => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/analyze-song-v2", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ composer: item.meta.composer, title: item.meta.title }),
      });
      if (res.ok) {
        setSavedAnalyses((prev) => prev.filter((a) => a.id !== item.id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert("파일 크기는 10MB 이하여야 합니다.");
        return;
      }
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 업로드 가능합니다.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setSheetImages((prev) => {
          if (prev.length >= 5) {
            alert("최대 5장까지 첨부 가능합니다.");
            return prev;
          }
          return [...prev, dataUrl];
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  // Supabase에서 저장된 분석 목록 불러오기
  useEffect(() => {
    async function fetchSavedAnalyses() {
      try {
        const res = await fetch("/api/analyze-song-v2");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setSavedAnalyses(data.data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch saved analyses:", err);
      } finally {
        setIsLoadingSaved(false);
      }
    }
    fetchSavedAnalyses();
  }, []);

  // 검색 필터링 (기존 곡 + DB 저장된 곡)
  const filteredSongs = searchQuery.length >= 2
    ? [
        ...mockSongs.filter((song) =>
          song.title.toLowerCase().includes(searchQuery.toLowerCase())
        ).map((song) => ({
          id: song.id,
          title: song.title,
          hasAIInfo: !!mockSongAIInfo[song.id] || savedAnalyses.some(
            (a) => song.title.toLowerCase().includes(a.meta.title.toLowerCase())
          ),
          isNew: false,
          composer: "",
        })),
        ...savedAnalyses.filter((a) =>
          (`${a.meta.composer} ${a.meta.title}`).toLowerCase().includes(searchQuery.toLowerCase()) &&
          !mockSongs.some((m) => m.title.toLowerCase().includes(a.meta.title.toLowerCase()))
        ).map((a) => ({
          id: a.id,
          title: `${a.meta.composer} ${a.meta.title}`,
          hasAIInfo: true,
          isNew: true,
          composer: a.meta.composer,
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

  const titleText = "AI 곡 분석하기";

  return (
    <div className="min-h-screen bg-blob-violet px-4 py-6 max-w-lg mx-auto pb-24">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center hover:bg-white/50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 flex">
            {titleText.split("").map((char, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={charVariants}
                initial="hidden"
                animate="show"
                className={char === " " ? "inline-block w-1.5" : ""}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </h1>
          <motion.p
            className="text-xs text-gray-500"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            작품 정보와 연주 가이드
          </motion.p>
        </div>
        <motion.div
          className="relative w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </motion.div>
        </motion.div>
      </div>

      {/* Search Bar */}
      <motion.div
        className="relative mb-4"
        animate={{ scale: isSearchFocused ? 1.02 : 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
        <input
          type="text"
          placeholder="곡 이름으로 검색 (2글자 이상)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/30 bg-white/40 backdrop-blur-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300/40 placeholder:text-gray-400 shadow-sm"
        />
      </motion.div>

      {/* Add Song Button */}
      <motion.button
        onClick={() => setIsModalOpen(true)}
        className="group w-full flex items-center justify-center gap-2 py-3 mb-6 rounded-2xl border-2 border-dashed border-violet-300/50 bg-white/15 backdrop-blur-sm text-violet-600 relative overflow-hidden hover:bg-white/25 transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Plus className="w-5 h-5 relative z-10" />
        <span className="font-medium relative z-10">새로운 곡 분석하기</span>
      </motion.button>

      {/* Search Results */}
      {searchQuery.length >= 2 && (
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="inline-block font-bold text-sm text-violet-700 bg-violet-100/60 backdrop-blur-sm px-3.5 py-1 rounded-full mb-3">검색 결과</span>
          {filteredSongs.length > 0 ? (
            <motion.div
              className="bg-white/40 backdrop-blur-xl rounded-3xl border border-white/50 shadow-sm overflow-hidden"
              variants={listContainer}
              initial="hidden"
              animate="show"
            >
              {filteredSongs.map((song, index) => (
                <motion.div key={song.id} variants={listItem}>
                  <SpotlightCard
                    href={
                      song.isNew
                        ? `/songs/${song.id}?composer=${encodeURIComponent(song.composer)}&title=${encodeURIComponent(song.title.replace(`${song.composer} `, ""))}`
                        : `/songs/${song.id}`
                    }
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-white/30 transition-colors ${
                      index !== filteredSongs.length - 1 ? "border-b border-white/30" : ""
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      song.hasAIInfo ? "bg-violet-200/60" : "bg-white/30"
                    }`}>
                      <Music className={`w-4 h-4 ${song.hasAIInfo ? "text-violet-600" : "text-gray-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{song.title}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                  </SpotlightCard>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/30">
              <p className="text-gray-500 text-sm">검색 결과가 없습니다</p>
            </div>
          )}
        </motion.div>
      )}

      {/* 내 보관함 (Supabase DB) */}
      {searchQuery.length < 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="inline-block font-bold text-sm text-violet-700 bg-violet-100/60 backdrop-blur-sm px-3.5 py-1 rounded-full">내 보관함</span>
            {savedAnalyses.length > 0 && (
              <button
                onClick={() => setEditMode(!editMode)}
                className="text-xs text-violet-500 font-medium px-2 py-1 rounded-lg hover:bg-violet-100/40 transition-colors"
              >
                {editMode ? "완료" : "편집"}
              </button>
            )}
          </div>
          {isLoadingSaved ? (
            <div className="bg-white/40 backdrop-blur-xl rounded-3xl border border-white/50 shadow-sm p-8 flex items-center justify-center">
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-4 h-4 border-2 border-violet-300 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">불러오는 중...</span>
              </div>
            </div>
          ) : savedAnalyses.length > 0 ? (
            <motion.div
              className="bg-white/40 backdrop-blur-xl rounded-3xl border border-white/50 shadow-sm overflow-hidden"
              variants={listContainer}
              initial="hidden"
              animate="show"
            >
              {savedAnalyses.map((item, index) => (
                <motion.div key={item.id} variants={listItem} className="flex items-center">
                  {editMode && (
                    <motion.button
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 40 }}
                      exit={{ opacity: 0, width: 0 }}
                      onClick={() => setDeleteTarget(item)}
                      className="shrink-0 flex items-center justify-center w-10 h-full text-red-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  )}
                  <SpotlightCard
                    href={editMode ? "#" : `/songs/${item.id}?composer=${encodeURIComponent(item.meta.composer)}&title=${encodeURIComponent(item.meta.title)}`}
                    className={`flex-1 flex items-center gap-3 px-4 py-3 hover:bg-white/30 transition-colors ${
                      index !== savedAnalyses.length - 1 ? "border-b border-white/30" : ""
                    }`}
                  >
                    {getComposerPortrait(item.meta.composer) ? (
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/60 shadow-sm">
                        <Image
                          src={getComposerPortrait(item.meta.composer)!}
                          alt={item.meta.composer}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-violet-200/60 flex items-center justify-center shrink-0">
                        <Music className="w-4 h-4 text-violet-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {item.meta.composer} - {item.meta.title}
                      </p>
                      {item.meta.opus && (
                        <p className="text-xs text-gray-400 truncate">{item.meta.opus}</p>
                      )}
                    </div>
                    {!editMode && <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                  </SpotlightCard>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/30">
              <Music className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">아직 분석한 곡이 없습니다</p>
              <p className="text-gray-400 text-xs mt-1">새로운 곡을 분석해보세요</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setDeleteTarget(null);
            }}
          >
            <motion.div
              className="bg-white rounded-2xl w-full max-w-xs p-5 shadow-xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">분석 삭제</h3>
                <p className="text-sm text-gray-500">
                  <span className="font-medium text-gray-700">{deleteTarget.meta.composer} - {deleteTarget.meta.title}</span>
                  <br />보관함에서 삭제할까요?
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-medium text-sm hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => handleDelete(deleteTarget)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {isDeleting ? "삭제 중..." : "삭제"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Song Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsModalOpen(false);
                setNewSong({ composer: "", title: "" });
              }
            }}
          >
            <motion.div
              className="bg-gradient-to-b from-violet-200 via-violet-100/80 to-white rounded-2xl w-full max-w-sm p-5 shadow-xl border border-white/50"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">새로운 곡 분석</h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setNewSong({ composer: "", title: "" });
                  }}
                  className="w-8 h-8 rounded-full bg-white/40 backdrop-blur-sm flex items-center justify-center hover:bg-white/60"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    작곡가
                  </label>
                  <input
                    type="text"
                    placeholder="2글자 이상 입력"
                    value={newSong.composer}
                    onChange={(e) => setNewSong({ ...newSong, composer: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-white/30 bg-white/40 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-violet-300/40 placeholder:text-gray-400 transition-all"
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
                              ? "bg-violet-600 text-white border-violet-600"
                              : "bg-white/40 text-gray-700 border-white/30 hover:bg-white/60"
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    곡 제목
                  </label>
                  <input
                    type="text"
                    placeholder="예) Ballade Op.23 No.1"
                    value={newSong.title}
                    onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-white/30 bg-white/40 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-violet-300/40 placeholder:text-gray-400 transition-all"
                  />
                </div>

                {/* 악보 이미지 첨부 */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    악보 첨부 <span className="text-gray-400 font-normal">(선택)</span>
                  </label>
                  <label className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-violet-300/50 bg-white/20 text-violet-600 text-sm cursor-pointer hover:bg-white/30 transition-colors">
                    <Camera className="w-4 h-4" />
                    <span>악보 이미지 추가 (최대 5장)</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  {sheetImages.length > 0 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                      {sheetImages.map((img, idx) => (
                        <div key={idx} className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-white/40">
                          <Image src={img} alt={`악보 ${idx + 1}`} width={64} height={64} className="w-full h-full object-cover" unoptimized />
                          <button
                            onClick={() => setSheetImages((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/50 flex items-center justify-center"
                          >
                            <X className="w-2.5 h-2.5 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <motion.button
                onClick={() => {
                  if (newSong.composer.length >= 2 && newSong.title.length >= 2) {
                    // 악보 이미지가 있으면 sessionStorage에 저장
                    if (sheetImages.length > 0) {
                      sessionStorage.setItem("sheetMusicImages", JSON.stringify(sheetImages));
                    } else {
                      sessionStorage.removeItem("sheetMusicImages");
                    }
                    const newId = `new-${Date.now()}`;
                    router.push(`/songs/${newId}?composer=${encodeURIComponent(newSong.composer)}&title=${encodeURIComponent(newSong.title)}`);
                    setIsModalOpen(false);
                    setNewSong({ composer: "", title: "" });
                    setSheetImages([]);
                  }
                }}
                disabled={newSong.composer.length < 2 || newSong.title.length < 2}
                className="group/btn relative w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden transition-all"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Hover shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                <span className="relative z-10">분석하기</span>
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
