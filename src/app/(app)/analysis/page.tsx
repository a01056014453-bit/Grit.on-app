"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Music, TrendingUp, AlertCircle, CheckCircle, BarChart2 } from "lucide-react";

// Focus area data from the home page
const mockFocusAreas = [
  { measure: 3, type: "high", issue: "왼손 아르페지오 불안정" },
  { measure: 6, type: "high", issue: "코다 진입부 템포 불안정" },
  { measure: 7, type: "mid", issue: "다이나믹 부족" },
  { measure: 9, type: "low", issue: "페달링 불균형" },
  { measure: 10, type: "low", issue: "왼손 베이스 약함" },
  { measure: 12, type: "mid", issue: "리듬 불안정" },
  { measure: 16, type: "mid", issue: "프레이징 끊김" },
  { measure: 19, type: "high", issue: "템포 과속 경향" },
  { measure: 23, type: "mid", issue: "아르페지오 불균등" },
  { measure: 26, type: "low", issue: "페달 과다 사용" },
  { measure: 30, type: "high", issue: "코다 진입 실수" },
];

const mockOverallAnalysis = {
  currentPiece: "발라드 1번 G단조",
  composer: "F. Chopin",
  totalSessions: 23,
  averageScore: 82,
  improvement: "+12",
  weakAreas: 4,
  strongAreas: 8,
  recentTrend: "상승",
  recommendations: [
    "23-28마디 코다 진입부에서 왼손 아르페지오 연습에 집중하세요",
    "88-92마디 프레스토 구간의 템포를 메트로놈으로 제어하세요",
    "다이나믹 범위를 pp에서 ff까지 더 넓게 사용해보세요",
  ],
};

export default function AnalysisPage() {
  const router = useRouter();

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
        <div>
          <h1 className="text-lg font-bold text-foreground">AI 분석 리포트</h1>
          <p className="text-xs text-muted-foreground">연습 패턴과 개선점을 확인하세요</p>
        </div>
      </div>

      {/* Current Piece */}
      <div className="bg-card rounded-xl p-4 border border-border shadow-sm mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Music className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-card-foreground">{mockOverallAnalysis.currentPiece}</h2>
            <p className="text-sm text-muted-foreground">{mockOverallAnalysis.composer}</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">{mockOverallAnalysis.totalSessions}회 연습</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <div className="text-xl font-bold text-primary">{mockOverallAnalysis.averageScore}</div>
          <div className="text-xs text-muted-foreground">평균 점수</div>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <div className="text-xl font-bold text-green-600">{mockOverallAnalysis.improvement}</div>
          <div className="text-xs text-muted-foreground">성장</div>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <div className="text-xl font-bold text-orange-500">{mockOverallAnalysis.weakAreas}</div>
          <div className="text-xs text-muted-foreground">취약 구간</div>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <div className="text-xl font-bold text-blue-500">{mockOverallAnalysis.strongAreas}</div>
          <div className="text-xs text-muted-foreground">강점 구간</div>
        </div>
      </div>

      {/* Focus Areas Grid */}
      <div className="bg-card rounded-xl border border-border shadow-sm mb-4 overflow-hidden">
        <div className="px-4 py-3 bg-muted/50 border-b border-border">
          <h3 className="font-semibold text-card-foreground flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            마디별 분석
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">총 32마디 중 집중 필요 구간</p>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-8 gap-1.5 mb-4">
            {[...Array(32)].map((_, i) => {
              const focusArea = mockFocusAreas.find((f) => f.measure === i + 1);
              let bgClass = "bg-muted";
              if (focusArea?.type === "high") bgClass = "bg-orange-500";
              else if (focusArea?.type === "mid") bgClass = "bg-amber-400";
              else if (focusArea?.type === "low") bgClass = "bg-blue-400";

              return (
                <div
                  key={i}
                  className={`aspect-square rounded-md ${bgClass} transition-all hover:scale-110 hover:shadow-sm cursor-pointer relative group`}
                  title={focusArea?.issue || `소절 ${i + 1}`}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-medium opacity-0 group-hover:opacity-100">
                    {i + 1}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>집중 연습</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <span>리듬 불안</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <span>템포 흔들림</span>
            </div>
          </div>
        </div>
      </div>

      {/* Focus Areas List */}
      <div className="bg-card rounded-xl border border-border shadow-sm mb-4 overflow-hidden">
        <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
          <h3 className="font-semibold text-orange-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            집중 연습 구간 상세
          </h3>
        </div>

        <div className="divide-y divide-border">
          {mockFocusAreas
            .filter((f) => f.type === "high")
            .map((area, index) => (
              <div key={index} className="p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-orange-700">{area.measure}</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-card-foreground">{area.measure}번 마디</p>
                  <p className="text-sm text-muted-foreground">{area.issue}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-600">
                  집중
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-primary/5 border-b border-primary/10">
          <h3 className="font-semibold text-card-foreground flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary" />
            AI 추천 연습 방법
          </h3>
        </div>

        <div className="p-4 space-y-3">
          {mockOverallAnalysis.recommendations.map((rec, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">{index + 1}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trend Chart Placeholder */}
      <div className="mt-4 bg-card rounded-xl border border-border shadow-sm p-4">
        <h3 className="font-semibold text-card-foreground mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          최근 점수 추이
        </h3>
        <div className="h-32 flex items-end justify-between gap-2">
          {[72, 75, 78, 76, 80, 82, 84].map((score, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-primary/20 rounded-t-md relative"
                style={{ height: `${(score / 100) * 100}%` }}
              >
                <div
                  className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-md"
                  style={{ height: `${(score - 70) * 3.33}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{i + 1}일</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}