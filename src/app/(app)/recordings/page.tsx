import { Music, Clock, TrendingUp } from "lucide-react";

const mockRecordings = [
  {
    id: "1",
    pieceTitle: "쇼팽 발라드 1번",
    composer: "F. Chopin",
    duration: 1245,
    score: 78,
    date: "2024-01-15",
    focusAreas: 3,
  },
  {
    id: "2",
    pieceTitle: "베토벤 소나타 Op.13",
    composer: "L. v. Beethoven",
    duration: 892,
    score: 82,
    date: "2024-01-14",
    focusAreas: 2,
  },
  {
    id: "3",
    pieceTitle: "드뷔시 달빛",
    composer: "C. Debussy",
    duration: 456,
    score: 85,
    date: "2024-01-13",
    focusAreas: 1,
  },
];

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
          <div className="text-2xl font-bold text-primary">82</div>
          <div className="text-xs text-gray-500">평균 점수</div>
        </div>
        <div className="bg-white rounded-xl p-3 border border-gray-100 text-center">
          <div className="text-2xl font-bold text-gray-900">43</div>
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
                <h3 className="font-semibold text-gray-900 truncate">
                  {recording.pieceTitle}
                </h3>
                <p className="text-xs text-gray-500">{recording.composer}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatDuration(recording.duration)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary">
                    <TrendingUp className="w-3 h-3" />
                    {recording.score}점
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">{recording.date}</div>
                <div className="text-xs text-orange-500 mt-1">
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
