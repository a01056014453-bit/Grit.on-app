"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { safeBack } from "@/lib/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Music2,
  Gauge,
  Volume2,
  Sparkles,
  Clock,
  Target,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  BarChart3
} from "lucide-react";
import {
  getPieceById,
  getPieceAnalysis,
  getUserPracticeData,
} from "@/lib/queries/pieces";
import type { Piece, PieceAnalysis, PiecePracticeData } from "@/lib/queries/pieces";
import { getUserId } from "@/lib/user-id";

interface SectionData {
  startMeasure: number;
  endMeasure: number;
  sectionName: string;
  technicalDifficulty: string;
  dynamics: string;
  rhythmPattern?: string;
  suggestedTempo?: { practice: number; min: number; max: number };
  techniques?: string[];
  expression?: string[];
  practiceNotes?: string;
}

interface MeasureProgressData {
  measureStart: number;
  mastery: string;
  practiceCount: number;
  practiceTime: number;
  lastPracticedAt?: string;
}

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  hard: "bg-orange-100 text-orange-700 border-orange-200",
  very_hard: "bg-red-100 text-red-700 border-red-200",
};

const difficultyLabels: Record<string, string> = {
  easy: "쉬움",
  medium: "보통",
  hard: "어려움",
  very_hard: "매우 어려움",
};

const masteryBg: Record<string, string> = {
  not_started: "bg-gray-100",
  learning: "bg-yellow-50",
  practicing: "bg-blue-50",
  mastered: "bg-green-50",
};

const masteryLabels: Record<string, string> = {
  not_started: "시작 전",
  learning: "학습 중",
  practicing: "연습 중",
  mastered: "완성",
};

export default function SectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const pieceId = params.id as string;
  const sectionIndex = parseInt(params.sectionIndex as string, 10);

  const [piece, setPiece] = useState<Piece | null>(null);
  const [analysis, setAnalysis] = useState<PieceAnalysis | null>(null);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [section, setSection] = useState<SectionData | null>(null);
  const [practiceProgress, setPracticeProgress] = useState<MeasureProgressData | null>(null);

  useEffect(() => {
    async function load() {
      const userId = getUserId();
      const pieceData = await getPieceById(pieceId);
      if (pieceData) setPiece(pieceData);

      const analysisData = await getPieceAnalysis(pieceId);
      if (analysisData) {
        setAnalysis(analysisData);
        const parsedSections = (Array.isArray(analysisData.sections) ? analysisData.sections : []) as unknown as SectionData[];
        setSections(parsedSections);
        if (parsedSections[sectionIndex]) {
          const sectionData = parsedSections[sectionIndex];
          setSection(sectionData);

          if (userId) {
            const practiceData = await getUserPracticeData(userId, pieceId);
            if (practiceData) {
              const measureProgress = (practiceData.measureProgress ? (Array.isArray(practiceData.measureProgress) ? practiceData.measureProgress : []) : []) as unknown as MeasureProgressData[];
              const progress = measureProgress.find(
                (p) => p.measureStart === sectionData.startMeasure
              );
              if (progress) setPracticeProgress(progress);
            }
          }
        }
      }
    }
    load();
  }, [pieceId, sectionIndex]);

  if (!piece || !analysis || !section) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
        <div className="text-center py-12 text-gray-500">
          섹션 정보를 불러오는 중...
        </div>
      </div>
    );
  }

  const hasPrevSection = sectionIndex > 0;
  const hasNextSection = sectionIndex < sections.length - 1;

  const formatPracticeTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
  };

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
          <p className="text-xs text-gray-500">{piece.composerShortName}</p>
          <h1 className="text-lg font-bold text-black truncate">{piece.title}</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">섹션 {sectionIndex + 1}/{sections.length}</p>
        </div>
      </div>

      {/* Section Title */}
      <div className={`rounded-xl p-4 mb-4 ${practiceProgress ? masteryBg[practiceProgress.mastery] : "bg-gray-50"}`}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-black">{section.sectionName}</h2>
          <span className={`text-xs px-2 py-1 rounded-full border ${difficultyColors[section.technicalDifficulty]}`}>
            {difficultyLabels[section.technicalDifficulty]}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="font-medium">{section.startMeasure} - {section.endMeasure} 마디</span>
          <span>|</span>
          <span>{section.rhythmPattern}</span>
          <span>|</span>
          <span>{section.dynamics}</span>
        </div>
        {practiceProgress && (
          <div className="mt-3 pt-3 border-t border-gray-200/50">
            <p className="text-xs text-gray-500">
              현재 상태: <span className="font-semibold">{masteryLabels[practiceProgress.mastery]}</span>
              {practiceProgress.practiceCount > 0 && (
                <> · {practiceProgress.practiceCount}회 연습</>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Tempo Info */}
      {section.suggestedTempo && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-black">템포 가이드</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">연습 템포</p>
              <p className="text-xl font-bold text-violet-600">{section.suggestedTempo.practice}</p>
              <p className="text-xs text-gray-400">BPM</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">최소</p>
              <p className="text-xl font-bold text-gray-600">{section.suggestedTempo.min}</p>
              <p className="text-xs text-gray-400">BPM</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">최대</p>
              <p className="text-xl font-bold text-gray-600">{section.suggestedTempo.max}</p>
              <p className="text-xs text-gray-400">BPM</p>
            </div>
          </div>
        </div>
      )}

      {/* Techniques */}
      {section.techniques && section.techniques.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Music2 className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-black">필요 테크닉</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {section.techniques.map((technique, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-full text-xs font-medium"
              >
                {technique}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Expression */}
      {section.expression && section.expression.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Volume2 className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-black">표현 지시어</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {section.expression.map((exp, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium italic"
              >
                {exp}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Practice Notes */}
      {section.practiceNotes && (
        <div className="bg-gradient-to-br from-violet-50 to-white rounded-xl border border-violet-100 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-black">AI 연습 조언</h3>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {section.practiceNotes}
          </p>
        </div>
      )}

      {/* My Practice Stats */}
      {practiceProgress && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-black">내 연습 기록</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">연습 횟수</p>
              <p className="text-xl font-bold text-black">{practiceProgress.practiceCount}회</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">연습 시간</p>
              <p className="text-xl font-bold text-black">{formatPracticeTime(practiceProgress.practiceTime)}</p>
            </div>
          </div>
          {practiceProgress.lastPracticedAt && (
            <p className="text-xs text-gray-400 mt-3 text-center">
              마지막 연습: {new Date(practiceProgress.lastPracticedAt).toLocaleDateString("ko-KR")}
            </p>
          )}
        </div>
      )}

      {/* Section Navigation */}
      <div className="flex items-center gap-3 mb-4">
        {hasPrevSection ? (
          <Link
            href={`/ai-analysis/${pieceId}/section/${sectionIndex - 1}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            이전 섹션
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        {hasNextSection ? (
          <Link
            href={`/ai-analysis/${pieceId}/section/${sectionIndex + 1}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            다음 섹션
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      {/* Practice Button */}
      <Link
        href={`/practice?piece=${pieceId}&measures=${section.startMeasure}-${section.endMeasure}`}
        className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-violet-500 to-violet-900 text-white rounded-xl text-base font-semibold"
      >
        <Play className="w-5 h-5 fill-white" />
        이 구간 연습하기
      </Link>
    </div>
  );
}
