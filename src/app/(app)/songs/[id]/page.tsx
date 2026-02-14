"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Music, Calendar, Sparkles, BookOpen, Lightbulb, Users, ChevronRight, User, Globe, Loader2, AlertTriangle, CheckCircle, Shield, Layers } from "lucide-react";
import { mockSongs, saveAnalyzedSong } from "@/data";
import type { SongAnalysis, AnalyzeSongResponse } from "@/types/song-analysis";
import { getDifficultyLabel, getVerificationLabel } from "@/types/song-analysis";
import { useState, useEffect, useCallback, Suspense } from "react";
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

function SongDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState<SongAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCached, setIsCached] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const songId = params.id as string;
  const song = mockSongs.find((s) => s.id === songId);

  const composerFromQuery = searchParams.get("composer");
  const titleFromQuery = searchParams.get("title");

  // mockSongs title에서 작곡가/곡명 자동 추출 (예: "F. Chopin Ballade Op.23 No.1")
  const extractComposerFromTitle = (fullTitle: string): { composer: string; title: string } => {
    const parts = fullTitle.split(" ");
    // 첫 2단어를 작곡가로 추출 (예: "F. Chopin", "L. v." → 3단어)
    if (parts.length >= 3 && parts[1].endsWith(".")) {
      // "L. v. Beethoven ..." 패턴
      return { composer: parts.slice(0, 3).join(" "), title: parts.slice(3).join(" ") };
    }
    if (parts.length >= 2) {
      return { composer: parts.slice(0, 2).join(" "), title: parts.slice(2).join(" ") };
    }
    return { composer: fullTitle, title: fullTitle };
  };

  const extracted = song ? extractComposerFromTitle(song.title) : null;
  const finalComposer = composerFromQuery || extracted?.composer || "";
  const finalTitle = titleFromQuery || extracted?.title || "";
  const songTitle = song?.title || (composerFromQuery && titleFromQuery
    ? `${composerFromQuery} ${titleFromQuery}`
    : titleFromQuery || "");

  const loadAIAnalysis = useCallback(async () => {
    if (!finalComposer || !finalTitle) {
      setIsLoading(false);
      setError("곡 정보가 부족합니다.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log("[AI Analysis V2] Calling API for:", finalComposer, finalTitle);

      // sessionStorage에서 악보 이미지 확인
      let sheetMusicImages: string[] | undefined;
      try {
        const stored = sessionStorage.getItem("sheetMusicImages");
        if (stored) {
          sheetMusicImages = JSON.parse(stored);
          sessionStorage.removeItem("sheetMusicImages");
          console.log("[AI Analysis V2] Sheet music images found:", sheetMusicImages?.length);
        }
      } catch { /* ignore */ }

      const controller = new AbortController();
      // 악보 이미지가 있으면 타임아웃을 더 길게 (Vision 분석은 시간이 더 걸림)
      const timeoutMs = sheetMusicImages?.length ? 120000 : 60000;
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const requestBody: Record<string, unknown> = { composer: finalComposer, title: finalTitle };
      if (sheetMusicImages?.length) {
        requestBody.sheetMusicImages = sheetMusicImages;
      }

      const res = await fetch("/api/analyze-song-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data: AnalyzeSongResponse = await res.json();
        if (data.success && data.data) {
          console.log("[AI Analysis V2] Success - cached:", data.cached);
          setAnalysis(data.data);
          setIsCached(data.cached || false);
        } else {
          setError(data.error || "분석에 실패했습니다.");
        }
      } else {
        setError(`서버 오류 (${res.status})`);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("분석 시간이 초과되었습니다. 다시 시도해주세요.");
      } else {
        setError("네트워크 오류가 발생했습니다.");
      }
      console.error("[AI Analysis V2] API call failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [finalComposer, finalTitle]);

  useEffect(() => {
    loadAIAnalysis();
  }, [loadAIAnalysis]);

  useEffect(() => {
    if (analysis) {
      saveAnalyzedSong(analysis.meta.composer, analysis.meta.title, songId);
    }
  }, [songId, analysis]);

  if (!song && !titleFromQuery) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <p className="text-muted-foreground">곡을 찾을 수 없습니다.</p>
      </div>
    );
  }

  // 검증 상태 배지 컬러
  const getVerificationColor = (status: SongAnalysis["verification_status"]) => {
    switch (status) {
      case "Verified":
        return "bg-violet-100/60 text-violet-700";
      case "Needs Review":
        return "bg-violet-100/40 text-violet-500";
      default:
        return "bg-white/30 text-gray-600";
    }
  };

  const getVerificationIcon = (status: SongAnalysis["verification_status"]) => {
    switch (status) {
      case "Verified":
        return <CheckCircle className="w-3 h-3" />;
      case "Needs Review":
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return <Shield className="w-3 h-3" />;
    }
  };

  // 난이도 배지 컬러
  const getDifficultyColor = (level: SongAnalysis["meta"]["difficulty_level"]) => {
    switch (level) {
      case "Beginner":
        return "bg-violet-100/40 text-violet-500";
      case "Intermediate":
        return "bg-violet-100/50 text-violet-600";
      case "Advanced":
        return "bg-violet-100/60 text-violet-700";
      case "Virtuoso":
        return "bg-violet-200/60 text-violet-800";
      default:
        return "bg-white/30 text-gray-600";
    }
  };

  // 로딩 또는 에러 UI
  if (isLoading || (!analysis && !error)) {
    return (
      <div className="min-h-screen bg-blob-violet">
        <div className="px-4 py-6 max-w-lg mx-auto pb-24">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">AI 곡 분석</h1>
              <p className="text-xs text-gray-500">작품 정보와 연주 가이드</p>
            </div>
          </div>
          <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-sm mb-6">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-md">
                  <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
                </div>
              </div>
              <div className="text-center mt-2">
                <p className="font-semibold text-gray-900">AI가 곡을 분석하고 있습니다</p>
                <p className="text-sm text-gray-500 mt-1">{songTitle}</p>
              </div>
            </div>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/30 backdrop-blur-sm rounded-2xl border border-white/30 mb-4 p-5">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-white/40 animate-pulse" />
                <div className="w-28 h-5 bg-white/40 rounded-lg animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="w-full h-4 bg-white/30 rounded animate-pulse" />
                <div className="w-5/6 h-4 bg-white/30 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 에러 UI
  if (error && !analysis) {
    return (
      <div className="min-h-screen bg-blob-violet">
        <div className="px-4 py-6 max-w-lg mx-auto pb-24">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">AI 곡 분석</h1>
            </div>
          </div>
          <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-sm text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="font-semibold text-gray-900 mb-2">분석 실패</p>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <button
              onClick={loadAIAnalysis}
              className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-medium text-sm hover:bg-violet-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="min-h-screen bg-blob-violet">
      <div className="px-4 py-6 max-w-lg mx-auto pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">AI 곡 분석</h1>
            <p className="text-xs text-gray-500">작품 정보와 연주 가이드</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Song Title Card */}
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/50 mb-6">
          <div className="flex items-start gap-4">
            {getComposerPortrait(analysis.meta.composer) ? (
              <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-white/60 shadow-md">
                <Image
                  src={getComposerPortrait(analysis.meta.composer)!}
                  alt={analysis.meta.composer}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-violet-200/50 flex items-center justify-center shrink-0 border-2 border-white/60">
                <Music className="w-8 h-8 text-violet-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{analysis.meta.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{analysis.meta.composer}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${getDifficultyColor(analysis.meta.difficulty_level)}`}>
                  {getDifficultyLabel(analysis.meta.difficulty_level)}
                </span>
                {analysis.meta.key && (
                  <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                    {analysis.meta.key}
                  </span>
                )}
                <span className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 ${getVerificationColor(analysis.verification_status)}`}>
                  {getVerificationIcon(analysis.verification_status)}
                  {getVerificationLabel(analysis.verification_status)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-gray-100">
            <div className="bg-violet-50/50 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-gray-900">{analysis.meta.opus || "-"}</p>
              <p className="text-xs text-gray-500 mt-0.5">작품번호</p>
            </div>
            <div className="bg-violet-50/50 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-gray-900">{analysis.meta.key || "-"}</p>
              <p className="text-xs text-gray-500 mt-0.5">조성</p>
            </div>
          </div>

          {isCached && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                저장된 분석 결과를 불러왔습니다
              </p>
            </div>
          )}
        </div>

        {/* Section 1: 작곡가 배경 */}
        <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 mb-4 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-violet-200/50 flex items-center justify-center">
              <User className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="font-bold text-gray-900">작곡가 배경</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {analysis.content.composer_background}
          </p>
        </div>

        {/* Section 2: 시대적 상황 */}
        <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 mb-4 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-violet-200/50 flex items-center justify-center">
              <Globe className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="font-bold text-gray-900">시대적 상황</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {analysis.content.historical_context}
          </p>
        </div>

        {/* Section 3: 작품 배경 */}
        <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 mb-4 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-violet-200/50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="font-bold text-gray-900">작품 배경</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {analysis.content.work_background}
          </p>
        </div>

        {/* Section 4: 곡 구조 */}
        <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 mb-4 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-violet-200/50 flex items-center justify-center">
              <Layers className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="font-bold text-gray-900">곡 구조</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-violet-200/30">
                  <th className="text-left py-2 px-2 font-semibold text-gray-700 w-24">섹션</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-700">특징</th>
                </tr>
              </thead>
              <tbody>
                {analysis.content.structure_analysis.map((s, i) => (
                  <tr key={i} className="border-b border-white/30 last:border-0">
                    <td className="py-3 px-2 align-top">
                      <span className="font-semibold text-violet-700">{s.section}</span>
                    </td>
                    <td className="py-3 px-2 text-gray-600">
                      {s.character && <span className="font-medium text-gray-800">{s.character}. </span>}
                      {s.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: 테크닉 솔루션 */}
        <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 mb-4 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-violet-200/50 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="font-bold text-gray-900">테크닉 솔루션</h3>
          </div>
          <div className="space-y-3">
            {analysis.content.technique_tips.map((tip, i) => (
              <div key={i} className="bg-white/40 backdrop-blur-xl rounded-2xl p-4 border border-white/50">
                <p className="text-sm font-bold text-violet-700 mb-3">{tip.section}</p>
                <div className="space-y-2.5">
                  {tip.problem && (
                    <div className="flex items-start gap-2.5">
                      <span className="text-xs font-semibold text-violet-600 bg-violet-100/60 px-1.5 py-0.5 rounded shrink-0 mt-0.5">문제</span>
                      <p className="text-sm text-gray-700">{tip.problem}</p>
                    </div>
                  )}
                  {tip.solution && (
                    <div className="flex items-start gap-2.5">
                      <span className="text-xs font-semibold text-violet-600 bg-violet-100/60 px-1.5 py-0.5 rounded shrink-0 mt-0.5">해결</span>
                      <p className="text-sm text-gray-700">{tip.solution}</p>
                    </div>
                  )}
                  {tip.practice && (
                    <div className="flex items-start gap-2.5">
                      <span className="text-xs font-semibold text-violet-600 bg-violet-100/60 px-1.5 py-0.5 rounded shrink-0 mt-0.5">연습</span>
                      <p className="text-sm text-gray-700">{tip.practice}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 6: 음악적 해석 */}
        <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 mb-4 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-violet-200/50 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="font-bold text-gray-900">음악적 해석</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {analysis.content.musical_interpretation}
          </p>
        </div>

        {/* Section 7: 추천 연주 */}
        <div className="bg-white/40 backdrop-blur-xl rounded-2xl border border-white/50 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-violet-200/50 flex items-center justify-center">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="font-bold text-gray-900">추천 연주</h3>
          </div>
          <p className="text-xs text-gray-500 mb-4">탭하면 YouTube에서 연주를 들을 수 있습니다</p>
          <div className="space-y-3">
            {analysis.content.recommended_performances.map((perf, i) => {
              const searchQuery = encodeURIComponent(`${perf.artist} ${analysis.meta.title} ${analysis.meta.composer}`);
              const youtubeUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;

              return (
                <a
                  key={i}
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/30 hover:bg-white/50 transition-colors border border-white/30"
                >
                  <div className="w-10 h-10 rounded-full bg-violet-200/50 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-violet-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{perf.artist}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {perf.year && `${perf.year}년`} {perf.comment && `· ${perf.comment}`}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SongDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-violet-50/50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    }>
      <SongDetailContent />
    </Suspense>
  );
}
