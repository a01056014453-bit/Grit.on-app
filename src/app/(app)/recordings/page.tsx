import { Music, Clock, TrendingUp } from "lucide-react";

const mockRecordings = [
  {
    id: "1",
    pieceTitle: "발라드 1번 G단조",
    composer: "F. Chopin",
    opus: "Op. 23",
    duration: 1845,
    score: 84,
    date: "2024-12-30",
    focusAreas: 2,
    improvement: "+3",
  },
  {
    id: "2",
    pieceTitle: "발라드 1번 G단조",
    composer: "F. Chopin",
    opus: "Op. 23",
    duration: 1520,
    score: 81,
    date: "2024-12-29",
    focusAreas: 3,
    improvement: "+2",
  },
  {
    id: "3",
    pieceTitle: "피아노 소나타 8번 '비창'",
    composer: "L. v. Beethoven",
    opus: "Op. 13",
    duration: 2340,
    score: 86,
    date: "2024-12-28",
    focusAreas: 1,
    improvement: "+5",
  },
  {
    id: "4",
    pieceTitle: "달빛 (Clair de lune)",
    composer: "C. Debussy",
    opus: "Suite bergamasque",
    duration: 980,
    score: 91,
    date: "2024-12-27",
    focusAreas: 0,
    improvement: "+4",
  },
  {
    id: "5",
    pieceTitle: "발라드 1번 G단조",
    composer: "F. Chopin",
    opus: "Op. 23",
    duration: 1680,
    score: 79,
    date: "2024-12-26",
    focusAreas: 4,
    improvement: "+1",
  },
  {
    id: "6",
    pieceTitle: "라 캄파넬라",
    composer: "F. Liszt",
    opus: "S. 141",
    duration: 890,
    score: 72,
    date: "2024-12-25",
    focusAreas: 5,
    improvement: "-2",
  },
  {
    id: "7",
    pieceTitle: "피아노 소나타 8번 '비창'",
    composer: "L. v. Beethoven",
    opus: "Op. 13",
    duration: 2100,
    score: 81,
    date: "2024-12-24",
    focusAreas: 2,
    improvement: "+3",
  },
  {
    id: "8",
    pieceTitle: "환상즉흥곡",
    composer: "F. Chopin",
    opus: "Op. 66",
    duration: 720,
    score: 88,
    date: "2024-12-23",
    focusAreas: 1,
    improvement: "+6",
  },
];

// Calculate stats
const totalMinutes = Math.floor(mockRecordings.reduce((acc, r) => acc + r.duration, 0) / 60);
const avgScore = Math.round(mockRecordings.reduce((acc, r) => acc + r.score, 0) / mockRecordings.length);

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}분 ${secs}초`;
}

export default function RecordingsPage() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">녹음 기록</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          연습 녹음과 AI 분석 결과를 확인하세요
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="text-2xl font-bold text-gray-900">
            {mockRecordings.length}
          </div>
          <div className="text-xs text-gray-500">총 녹음</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="text-2xl font-bold text-primary">{avgScore}</div>
          <div className="text-xs text-gray-500">평균 점수</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="text-2xl font-bold text-gray-900">{totalMinutes}</div>
          <div className="text-xs text-gray-500">총 분</div>
        </div>
      </div>

      {/* Recordings List */}
      <div className="space-y-3">
        {mockRecordings.map((recording) => (
          <div
            key={recording.id}
            className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                <Music className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">
                  {recording.pieceTitle}
                </h3>
                <p className="text-sm text-slate-400">{recording.composer}</p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                    <Clock className="w-3 h-3" />
                    {formatDuration(recording.duration)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary font-bold bg-primary/5 px-2 py-1 rounded-md">
                    <TrendingUp className="w-3 h-3" />
                    {recording.score}점
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="text-xs text-slate-400">{recording.date}</div>
                <div className="text-xs text-orange-500 font-medium mt-1 bg-orange-50 px-2 py-1 rounded-md">
                  {recording.focusAreas}개 집중구간
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
