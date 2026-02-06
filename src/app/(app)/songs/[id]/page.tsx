"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Music, Clock, Calendar, Sparkles, BookOpen, Lightbulb, Users, ChevronDown, ChevronUp, ChevronRight, User, Globe, Loader2 } from "lucide-react";
import { mockSongs, mockSongAIInfo, generateSongAIInfo, saveAnalyzedSong, getCachedAIAnalysis, getCachedAIAnalysisByComposerTitle, setCachedAIAnalysis } from "@/data";
import type { SongAIInfo } from "@/data/mock-songs";
import { useState, useEffect, useCallback } from "react";

export default function SongDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedSection, setExpandedSection] = useState<string | null>("background");
  const [aiInfo, setAiInfo] = useState<SongAIInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const songId = params.id as string;
  const song = mockSongs.find((s) => s.id === songId);

  // 새로운 곡인 경우 query parameter에서 작곡가/제목 가져오기
  const composerFromQuery = searchParams.get("composer");
  const titleFromQuery = searchParams.get("title");
  const songTitle = song?.title || (composerFromQuery && titleFromQuery
    ? `${composerFromQuery} ${titleFromQuery}`
    : titleFromQuery || "");

  const loadAIAnalysis = useCallback(async () => {
    // 1. 기존 mockSongAIInfo 확인 (ID 1~5)
    const existingMock = mockSongAIInfo[songId];
    if (existingMock) {
      setAiInfo(existingMock);
      setIsLoading(false);
      return;
    }

    const composer = composerFromQuery || "";
    const title = titleFromQuery || song?.title || "";

    // 2. localStorage 캐시 확인
    const cachedById = getCachedAIAnalysis(songId);
    if (cachedById) {
      setAiInfo(cachedById);
      setIsLoading(false);
      return;
    }

    if (composer && title) {
      const cachedByComposerTitle = getCachedAIAnalysisByComposerTitle(composer, title);
      if (cachedByComposerTitle) {
        setAiInfo({ ...cachedByComposerTitle, id: songId });
        setIsLoading(false);
        return;
      }
    }

    // 3. API 호출
    if (composer && title) {
      setIsLoading(true);
      try {
        console.log("[AI Analysis] Calling API for:", composer, title);
        const res = await fetch("/api/analyze-song", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ composer, title, id: songId }),
        });

        console.log("[AI Analysis] API response status:", res.status, res.ok);

        if (res.ok) {
          const data: SongAIInfo = await res.json();
          console.log("[AI Analysis] API success - year:", data.year, "duration:", data.duration, "opus:", data.opus);
          setCachedAIAnalysis(songId, composer, title, data);
          setAiInfo(data);
          setIsLoading(false);
          return;
        } else {
          const errorData = await res.json().catch(() => ({}));
          console.log("[AI Analysis] API error response:", errorData);
        }
      } catch (err) {
        console.error("[AI Analysis] API call failed:", err);
      }
    }

    // 4. 폴백: 기존 템플릿 데이터
    console.log("[AI Analysis] Using fallback template data");
    const fallback = generateSongAIInfo(songId, title, composer || undefined);
    setAiInfo(fallback);
    setIsLoading(false);
  }, [songId, composerFromQuery, titleFromQuery, song?.title]);

  useEffect(() => {
    loadAIAnalysis();
  }, [loadAIAnalysis]);

  // 분석한 곡 자동 저장
  useEffect(() => {
    if (aiInfo) {
      saveAnalyzedSong(aiInfo.composer, aiInfo.title, songId);
    }
  }, [songId, aiInfo]);

  if (!song && !titleFromQuery) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <p className="text-muted-foreground">곡을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // 로딩 스켈레톤 UI
  if (isLoading || !aiInfo) {
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

        {/* Loading Card */}
        <div className="bg-gradient-to-br from-primary/10 to-violet-500/10 rounded-2xl p-8 border border-primary/20 mb-4">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">AI가 곡을 분석하고 있습니다</p>
              <p className="text-xs text-muted-foreground mt-1">{songTitle}</p>
            </div>
          </div>
        </div>

        {/* Skeleton blocks */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl p-3 border border-border text-center">
              <div className="w-4 h-4 bg-muted rounded mx-auto mb-1 animate-pulse" />
              <div className="w-12 h-4 bg-muted rounded mx-auto mb-1 animate-pulse" />
              <div className="w-8 h-3 bg-muted rounded mx-auto animate-pulse" />
            </div>
          ))}
        </div>

        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-xl border border-border mb-3 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-muted animate-pulse" />
              <div className="w-24 h-4 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

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

      {/* Song Title Card */}
      <div className="bg-gradient-to-br from-primary/10 to-violet-500/10 rounded-2xl p-5 border border-primary/20 mb-4">
        <div className="flex items-start gap-4">
          {aiInfo.composerImage ? (
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
              <img
                src={aiInfo.composerImage}
                alt={aiInfo.composer}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Music className="w-7 h-7 text-primary" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">{songTitle}</h2>
            <p className="text-sm text-muted-foreground mt-1">{aiInfo.composerFull}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary font-medium">
                {aiInfo.period}
              </span>
              {aiInfo.keySignature && (
                <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                  {aiInfo.keySignature}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-card rounded-xl p-3 border border-border text-center">
              <Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-sm font-bold text-foreground">{aiInfo.year || "-"}</p>
              <p className="text-[10px] text-muted-foreground">작곡년도</p>
            </div>
            <div className="bg-card rounded-xl p-3 border border-border text-center">
              <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-sm font-bold text-foreground">{aiInfo.duration || "-"}</p>
              <p className="text-[10px] text-muted-foreground">연주시간</p>
            </div>
            <div className="bg-card rounded-xl p-3 border border-border text-center">
              <Music className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-sm font-bold text-foreground">{aiInfo.opus || "-"}</p>
              <p className="text-[10px] text-muted-foreground">작품번호</p>
            </div>
          </div>

          {/* Composer Background Section */}
          <div className="bg-card rounded-xl border border-border mb-3 overflow-hidden">
            <button
              onClick={() => toggleSection("composer")}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-violet-600" />
                </div>
                <span className="font-semibold text-foreground">작곡가 배경</span>
              </div>
              {expandedSection === "composer" ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            {expandedSection === "composer" && (
              <div className="px-4 pb-4">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {aiInfo.composerBackground}
                </p>
              </div>
            )}
          </div>

          {/* Historical Context Section */}
          <div className="bg-card rounded-xl border border-border mb-3 overflow-hidden">
            <button
              onClick={() => toggleSection("historical")}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-amber-600" />
                </div>
                <span className="font-semibold text-foreground">시대적 상황</span>
              </div>
              {expandedSection === "historical" ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            {expandedSection === "historical" && (
              <div className="px-4 pb-4">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {aiInfo.historicalContext}
                </p>
              </div>
            )}
          </div>

          {/* Work Background Section */}
          <div className="bg-card rounded-xl border border-border mb-3 overflow-hidden">
            <button
              onClick={() => toggleSection("background")}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-semibold text-foreground">작품 배경</span>
              </div>
              {expandedSection === "background" ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            {expandedSection === "background" && (
              <div className="px-4 pb-4">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {aiInfo.workBackground}
                </p>
              </div>
            )}
          </div>

          {/* Structure Section */}
          <div className="bg-card rounded-xl border border-border mb-3 overflow-hidden">
            <button
              onClick={() => toggleSection("structure")}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Music className="w-4 h-4 text-purple-600" />
                </div>
                <span className="font-semibold text-foreground">곡 구조</span>
              </div>
              {expandedSection === "structure" ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            {expandedSection === "structure" && (
              <div className="px-4 pb-4 space-y-3">
                {aiInfo.structure.map((s, i) => (
                  <div key={i} className="bg-secondary/50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground text-sm">{s.section}</span>
                      <span className="text-xs text-muted-foreground">{s.measures}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Technical Tips Section */}
          <div className="bg-card rounded-xl border border-border mb-3 overflow-hidden">
            <button
              onClick={() => toggleSection("technical")}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-orange-600" />
                </div>
                <span className="font-semibold text-foreground">테크닉 팁</span>
              </div>
              {expandedSection === "technical" ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            {expandedSection === "technical" && (
              <div className="px-4 pb-4 space-y-2">
                {aiInfo.technicalTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-muted-foreground">{tip}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Musical Tips Section */}
          <div className="bg-card rounded-xl border border-border mb-3 overflow-hidden">
            <button
              onClick={() => toggleSection("musical")}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-green-600" />
                </div>
                <span className="font-semibold text-foreground">음악적 해석</span>
              </div>
              {expandedSection === "musical" ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            {expandedSection === "musical" && (
              <div className="px-4 pb-4 space-y-2">
                {aiInfo.musicalTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-muted-foreground">{tip}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Famous Performers Section */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => toggleSection("performers")}
              className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center">
                  <Users className="w-4 h-4 text-pink-600" />
                </div>
                <span className="font-semibold text-foreground">추천 연주</span>
              </div>
              {expandedSection === "performers" ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            {expandedSection === "performers" && (
              <div className="px-4 pb-4 space-y-2">
                <p className="text-xs text-muted-foreground mb-3">탭하면 YouTube에서 연주를 들을 수 있습니다</p>
                {aiInfo.famousPerformers.map((performer, i) => {
                  // 연주자 이름에서 괄호 안의 내용 제거하여 검색어 생성
                  const performerName = performer.split(" (")[0];
                  const searchQuery = encodeURIComponent(`${performerName} ${aiInfo.title} ${aiInfo.composer}`);
                  const youtubeUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;

                  return (
                    <a
                      key={i}
                      href={youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{performerName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {performer.includes("(") ? performer.split(" (")[1].replace(")", "") : "YouTube에서 검색"}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>
    </div>
  );
}
