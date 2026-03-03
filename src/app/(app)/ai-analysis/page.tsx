"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { safeBack } from "@/lib/navigation";
import {
  ArrowLeft,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  Clock,
  Sparkles,
  Music2,
  BarChart3,
  Target,
  Folder,
  FolderOpen
} from "lucide-react";
import {
  getAnalyzedPieces,
  getPieceAnalysis,
  getUserPracticeData,
} from "@/lib/queries/pieces";
import type { Piece, PieceAnalysis, PiecePracticeData } from "@/lib/queries/pieces";
import { getUserId } from "@/lib/user-id";
import { getUserAnalyses, type UserAnalysis } from "@/lib/user-analyses";

interface SectionData {
  startMeasure: number;
  endMeasure: number;
  sectionName: string;
  technicalDifficulty: string;
  dynamics: string;
}

interface MeasureProgressData {
  measureStart: number;
  mastery: string;
}

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  hard: "bg-orange-100 text-orange-700",
  very_hard: "bg-red-100 text-red-700",
};

const difficultyLabels: Record<string, string> = {
  easy: "쉬움",
  medium: "보통",
  hard: "어려움",
  very_hard: "매우 어려움",
};

const masteryColors: Record<string, string> = {
  not_started: "bg-gray-200",
  learning: "bg-yellow-400",
  practicing: "bg-blue-400",
  mastered: "bg-green-500",
};

export default function AIAnalysisPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPieceId, setExpandedPieceId] = useState<string | null>(null);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [analysisData, setAnalysisData] = useState<Record<string, PieceAnalysis>>({});
  const [practiceData, setPracticeData] = useState<Record<string, PiecePracticeData>>({});
  const [userAnalyses, setUserAnalyses] = useState<UserAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const userId = getUserId();
      setUserAnalyses(getUserAnalyses());
      const fetchedPieces = await getAnalyzedPieces();
      setPieces(fetchedPieces);

      const analyses: Record<string, PieceAnalysis> = {};
      const practices: Record<string, PiecePracticeData> = {};

      await Promise.all(
        fetchedPieces.map(async (piece: Piece) => {
          const analysis = await getPieceAnalysis(piece.id);
          if (analysis) {
            analyses[piece.id] = analysis;
          }
          if (userId) {
            const practice = await getUserPracticeData(userId, piece.id);
            if (practice) {
              practices[piece.id] = practice;
            }
          }
        })
      );

      setAnalysisData(analyses);
      setPracticeData(practices);
      setLoading(false);
    }
    load();
  }, []);

  const filteredPieces = pieces.filter(
    (piece) =>
      piece.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      piece.composerShortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      piece.composerFullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUserAnalyses = userAnalyses.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.composer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCount = userAnalyses.length + pieces.length;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}시간 ${mins}분`;
    }
    return `${minutes}분`;
  };

  const formatPracticeTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
  };

  const toggleExpand = (pieceId: string) => {
    setExpandedPieceId(expandedPieceId === pieceId ? null : pieceId);
  };

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
        <div className="bg-blob-extra" />
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-white/20 rounded-xl" />
          <div className="h-24 bg-white/20 rounded-xl" />
          <div className="h-48 bg-white/20 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => safeBack(router)}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-black">내 분석 보관함</h1>
          <p className="text-xs text-gray-500">AI 분석 완료된 곡 {totalCount}개</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
          <Folder className="w-5 h-5 text-violet-600" />
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="곡 이름, 작곡가로 검색"
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
        새로운 곡 분석 요청
      </Link>

      {/* User AI Analyses */}
      {filteredUserAnalyses.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-black flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-500" />
            AI 분석한 곡
          </h2>
          <div className="space-y-2">
            {filteredUserAnalyses.map((a) => (
              <Link
                key={a.id}
                href={`/ai-analysis/${a.id}`}
                className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:border-violet-300 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-100 to-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-black truncate">
                    {a.composer} - {a.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(a.analyzedAt).toLocaleDateString("ko-KR")} 분석
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Analyzed Pieces List */}
      {pieces.length > 0 && (
      <div>
        <h2 className="text-sm font-semibold text-black flex items-center gap-2 mb-3">
          <Music2 className="w-4 h-4 text-gray-500" />
          마디별 분석 곡
        </h2>

        <div className="space-y-3">
          {filteredPieces.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm bg-white rounded-xl border border-gray-200">
              검색 결과가 없습니다
            </div>
          ) : (
            filteredPieces.map((piece) => {
              const analysis = analysisData[piece.id];
              const practice = practiceData[piece.id];
              const isExpanded = expandedPieceId === piece.id;

              return (
                <div
                  key={piece.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  {/* Piece Header */}
                  <button
                    onClick={() => toggleExpand(piece.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                      {isExpanded ? (
                        <FolderOpen className="w-5 h-5 text-violet-600" />
                      ) : (
                        <Folder className="w-5 h-5 text-violet-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black truncate">
                        {piece.composerShortName} - {piece.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{piece.opus}</span>
                        {piece.key && (
                          <span className="text-xs text-gray-400">• {piece.key}</span>
                        )}
                        {analysis && analysis.overallDifficulty && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${difficultyColors[analysis.overallDifficulty]}`}>
                            {difficultyLabels[analysis.overallDifficulty]}
                          </span>
                        )}
                      </div>
                    </div>
                    {practice && (
                      <div className="text-right shrink-0 mr-2">
                        <p className="text-xs font-semibold text-violet-600">{practice.completionPercentage}%</p>
                        <p className="text-xs text-gray-400">완성도</p>
                      </div>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                    )}
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && analysis && (() => {
                    const sections = (Array.isArray(analysis.sections) ? analysis.sections : []) as unknown as SectionData[];
                    const measureProgress = (practice?.measureProgress ? (Array.isArray(practice.measureProgress) ? practice.measureProgress : []) : []) as unknown as MeasureProgressData[];
                    return (
                    <div className="border-t border-gray-100 bg-gray-50">
                      {/* Quick Stats */}
                      <div className="grid grid-cols-3 gap-2 p-4 border-b border-gray-100">
                        <div className="text-center">
                          <p className="text-lg font-bold text-black">{analysis.totalMeasures}</p>
                          <p className="text-xs text-gray-500">마디</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-black">{formatDuration(analysis.estimatedDuration ?? 0)}</p>
                          <p className="text-xs text-gray-500">연주시간</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-black">{sections.length}</p>
                          <p className="text-xs text-gray-500">섹션</p>
                        </div>
                      </div>

                      {/* Practice Stats (if available) */}
                      {practice && (
                        <div className="p-4 border-b border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-4 h-4 text-violet-500" />
                            <span className="text-xs font-semibold text-black">내 연습 현황</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <div>
                              <span className="text-gray-500">총 연습: </span>
                              <span className="font-medium">{formatPracticeTime(practice.totalPracticeTime)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">세션: </span>
                              <span className="font-medium">{practice.sessionCount}회</span>
                            </div>
                            {practice.averageAccuracy && (
                              <div>
                                <span className="text-gray-500">정확도: </span>
                                <span className="font-medium">{practice.averageAccuracy}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sections List */}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="w-4 h-4 text-gray-500" />
                          <span className="text-xs font-semibold text-black">마디별 분석</span>
                        </div>
                        <div className="space-y-2">
                          {sections.map((section, idx) => {
                            const sectionPractice = measureProgress.find(
                              (p) => p.measureStart === section.startMeasure
                            );

                            return (
                              <Link
                                key={idx}
                                href={`/ai-analysis/${piece.id}/section/${idx}`}
                                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-violet-200 transition-colors"
                              >
                                <div className="flex flex-col items-center shrink-0">
                                  <span className="text-xs font-bold text-gray-600">
                                    {section.startMeasure}-{section.endMeasure}
                                  </span>
                                  <span className="text-[10px] text-gray-400">마디</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-black truncate">
                                    {section.sectionName}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${difficultyColors[section.technicalDifficulty]}`}>
                                      {difficultyLabels[section.technicalDifficulty]}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                      {section.dynamics}
                                    </span>
                                  </div>
                                </div>
                                {sectionPractice && (
                                  <div className={`w-3 h-3 rounded-full shrink-0 ${masteryColors[sectionPractice.mastery]}`} />
                                )}
                                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                              </Link>
                            );
                          })}
                        </div>
                      </div>

                      {/* View Full Analysis Button */}
                      <div className="p-4 pt-0">
                        <Link
                          href={`/ai-analysis/${piece.id}`}
                          className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-violet-500 to-violet-900 text-white rounded-xl text-sm font-semibold"
                        >
                          <Sparkles className="w-4 h-4" />
                          전체 분석 보기
                        </Link>
                      </div>
                    </div>
                    );
                  })()}
                </div>
              );
            })
          )}
        </div>
      </div>
      )}

      {/* Empty State */}
      {filteredUserAnalyses.length === 0 && filteredPieces.length === 0 && (
        <div className="py-12 text-center text-gray-500 text-sm">
          {searchQuery ? "검색 결과가 없습니다" : "아직 분석한 곡이 없습니다"}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <p className="text-xs font-semibold text-gray-600 mb-2">진행도 표시</p>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${masteryColors.not_started}`} />
            <span>시작 전</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${masteryColors.learning}`} />
            <span>학습 중</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${masteryColors.practicing}`} />
            <span>연습 중</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${masteryColors.mastered}`} />
            <span>완성</span>
          </div>
        </div>
      </div>
    </div>
  );
}
