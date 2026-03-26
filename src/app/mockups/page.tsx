"use client";

import Link from "next/link";

const features = [
  { id: "home", label: "홈 대시보드" },
  { id: "practice", label: "연습 타이머" },
  { id: "ai-analysis", label: "AI 분석" },
  { id: "stats", label: "통계" },
  { id: "feedback", label: "레슨 피드백" },
  { id: "help", label: "도움 요청" },
  { id: "ranking", label: "랭킹" },
  { id: "metronome", label: "메트로놈" },
  { id: "music-terms", label: "음악 용어" },
  { id: "rooms", label: "연습실" },
  { id: "teachers", label: "선생님" },
  { id: "recordings", label: "녹음" },
  { id: "records", label: "연습 기록" },
  { id: "goals", label: "목표" },
  { id: "routines", label: "루틴" },
  { id: "profile", label: "프로필" },
  { id: "songs", label: "곡 관리" },
  { id: "notifications", label: "알림" },
];

export default function MockupsIndex() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">App Store 스크린샷 목업</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {features.map((f) => (
          <Link
            key={f.id}
            href={`/mockups/${f.id}`}
            className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <p className="font-semibold text-sm">{f.label}</p>
            <p className="text-xs text-gray-400 mt-1">/mockups/{f.id}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
