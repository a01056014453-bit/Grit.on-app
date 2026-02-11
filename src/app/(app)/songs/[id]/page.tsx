"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Music, Calendar, Sparkles, BookOpen, Lightbulb, Users, ChevronRight, User, Globe, Loader2, AlertTriangle, CheckCircle, Shield, Layers } from "lucide-react";
import { mockSongs, saveAnalyzedSong } from "@/data";
import type { SongAnalysis, AnalyzeSongResponse } from "@/types/song-analysis";
import { getDifficultyLabel, getVerificationLabel } from "@/types/song-analysis";
import { useState, useEffect, useCallback, Suspense } from "react";

function SongDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState<SongAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCached, setIsCached] = useState(false);

  const songId = params.id as string;
  const song = mockSongs.find((s) => s.id === songId);

  const composerFromQuery = searchParams.get("composer");
  const titleFromQuery = searchParams.get("title");
  const songTitle = song?.title || (composerFromQuery && titleFromQuery
    ? `${composerFromQuery} ${titleFromQuery}`
    : titleFromQuery || "");

  const loadAIAnalysis = useCallback(async () => {
    const composer = composerFromQuery || "";
    const title = titleFromQuery || song?.title || "";

    if (!composer || !title) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      console.log("[AI Analysis V2] Calling API for:", composer, title);
      const res = await fetch("/api/analyze-song-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ composer, title }),
      });

      if (res.ok) {
        const data: AnalyzeSongResponse = await res.json();
        if (data.success && data.data) {
          console.log("[AI Analysis V2] Success - cached:", data.cached);
          setAnalysis(data.data);
          setIsCached(data.cached || false);
        }
      }
    } catch (err) {
      console.error("[AI Analysis V2] API call failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [composerFromQuery, titleFromQuery, song?.title]);

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
        return "bg-green-100 text-green-700";
      case "Needs Review":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-600";
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
        return "bg-green-100 text-green-700";
      case "Intermediate":
        return "bg-blue-100 text-blue-700";
      case "Advanced":
        return "bg-orange-100 text-orange-700";
      case "Virtuoso":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // 로딩 스켈레톤 UI
  if (isLoading || !analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50/50 to-white">
        <div className="px-4 py-6 max-w-lg mx-auto pb-24">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
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

          {/* Loading Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-violet-100 mb-6">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md">
                  <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
                </div>
              </div>
              <div className="text-center mt-2">
                <p className="font-semibold text-gray-900">AI가 곡을 분석하고 있습니다</p>
                <p className="text-sm text-gray-500 mt-1">{songTitle}</p>
              </div>
            </div>
          </div>

          {/* Skeleton blocks */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 mb-4 p-5 shadow-sm">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                <div className="w-28 h-5 bg-gray-100 rounded-lg animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="w-full h-4 bg-gray-50 rounded animate-pulse" />
                <div className="w-5/6 h-4 bg-gray-50 rounded animate-pulse" />
                <div className="w-4/6 h-4 bg-gray-50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50/50 to-white">
      <div className="px-4 py-6 max-w-lg mx-auto pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
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
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-violet-100 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center shrink-0">
              <Music className="w-8 h-8 text-violet-600" />
            </div>
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
        <div className="bg-white rounded-2xl border border-gray-100 mb-4 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
              <User className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="font-bold text-gray-900">작곡가 배경</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {analysis.content.composer_background}
          </p>
        </div>

        {/* Section 2: 시대적 상황 */}
        <div className="bg-white rounded-2xl border border-gray-100 mb-4 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Globe className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-bold text-gray-900">시대적 상황</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {analysis.content.historical_context}
          </p>
        </div>

        {/* Section 3: 작품 배경 */}
        <div className="bg-white rounded-2xl border border-gray-100 mb-4 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900">작품 배경</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {analysis.content.work_background}
          </p>
        </div>

        {/* Section 4: 곡 구조 - 통합 테이블 */}
        <div className="bg-white rounded-2xl border border-gray-100 mb-4 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Layers className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900">곡 구조</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-semibold text-gray-700 w-24">섹션</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-700">특징</th>
                </tr>
              </thead>
              <tbody>
                {analysis.content.structure_analysis.map((s, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-2 align-top">
                      <span className="font-semibold text-purple-700">{s.section}</span>
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

        {/* Section 5: 테크닉 솔루션 - 3가지 카테고리 */}
        <div className="bg-white rounded-2xl border border-gray-100 mb-4 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-bold text-gray-900">테크닉 솔루션</h3>
          </div>
          <div className="space-y-4">
            {analysis.content.technique_tips.map((tip, i) => {
              const getCategoryStyle = (cat?: string) => {
                switch (cat) {
                  case "Physiological": return "bg-rose-100 text-rose-700";
                  case "Interpretative": return "bg-violet-100 text-violet-700";
                  case "Structural": return "bg-teal-100 text-teal-700";
                  default: return "bg-gray-100 text-gray-600";
                }
              };
              const getCategoryLabel = (cat?: string) => {
                switch (cat) {
                  case "Physiological": return "신체적";
                  case "Interpretative": return "해석적";
                  case "Structural": return "구조적";
                  default: return "";
                }
              };
              return (
                <div key={i} className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className="text-xs font-bold text-orange-700 bg-orange-200 px-2 py-0.5 rounded">
                      {tip.section}
                    </span>
                    {tip.category && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${getCategoryStyle(tip.category)}`}>
                        {getCategoryLabel(tip.category)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {tip.problem && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-semibold text-red-600 bg-red-100 px-1.5 py-0.5 rounded shrink-0">문제</span>
                        <p className="text-sm text-gray-700">{tip.problem}</p>
                      </div>
                    )}
                    {tip.solution && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded shrink-0">해결</span>
                        <p className="text-sm text-gray-700">{tip.solution}</p>
                      </div>
                    )}
                    {tip.practice && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-semibold text-green-600 bg-green-100 px-1.5 py-0.5 rounded shrink-0">연습</span>
                        <p className="text-sm text-gray-700">{tip.practice}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 6: 음악적 해석 */}
        <div className="bg-white rounded-2xl border border-gray-100 mb-4 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900">음악적 해석</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {analysis.content.musical_interpretation}
          </p>
        </div>

        {/* Section 7: 추천 연주 */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-pink-600" />
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
                  className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="currentColor">
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
