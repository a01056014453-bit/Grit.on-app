import { Calendar, Target, CheckCircle, Circle } from "lucide-react";

const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
const today = new Date().getDay();

const mockWeeklyData = [
  { day: 0, minutes: 75, target: 60, completed: true },
  { day: 1, minutes: 60, target: 60, completed: true },
  { day: 2, minutes: 45, target: 60, completed: false },
  { day: 3, minutes: 90, target: 60, completed: true },
  { day: 4, minutes: 55, target: 60, completed: false },
  { day: 5, minutes: 0, target: 60, completed: false },
  { day: 6, minutes: 0, target: 60, completed: false },
];

const mockTodayPlan = [
  {
    id: "1",
    piece: "발라드 1번 G단조",
    composer: "F. Chopin",
    measures: "23-28마디 (코다 진입부)",
    duration: 15,
    priority: "high",
    completed: true,
    note: "왼손 아르페지오 정확성 향상",
  },
  {
    id: "2",
    piece: "발라드 1번 G단조",
    composer: "F. Chopin",
    measures: "88-92마디 (프레스토)",
    duration: 20,
    priority: "high",
    completed: false,
    note: "템포 과속 방지, 메트로놈 필수",
  },
  {
    id: "3",
    piece: "피아노 소나타 8번 '비창'",
    composer: "L. v. Beethoven",
    measures: "1악장 1-16마디",
    duration: 15,
    priority: "medium",
    completed: false,
    note: "그라베 템포 유지",
  },
  {
    id: "4",
    piece: "피아노 소나타 8번 '비창'",
    composer: "L. v. Beethoven",
    measures: "2악장 전체 통주",
    duration: 10,
    priority: "low",
    completed: false,
    note: "아다지오 칸타빌레 표현",
  },
];

const mockAISuggestions = [
  {
    id: "1",
    type: "tempo",
    title: "템포 과속 경향 감지",
    description: "88-92마디에서 평균 15% 빠르게 연주하는 경향이 있어요. 메트로놈을 ♩=168로 설정하고 연습해보세요.",
    priority: "high",
  },
  {
    id: "2",
    type: "dynamics",
    title: "다이나믹 범위 확대 필요",
    description: "전체적으로 mf-f 범위에서만 연주하고 있어요. pp-p 구간의 표현력을 높여보세요.",
    priority: "medium",
  },
  {
    id: "3",
    type: "practice",
    title: "연습 패턴 분석",
    description: "최근 5일간 코다 부분 연습 비중이 낮아요. 오늘은 23-28마디에 집중해보세요.",
    priority: "low",
  },
];

export default function PlansPage() {
  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">연습 계획</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          주간 연습 계획을 확인하세요
        </p>
      </div>

      {/* Weekly Calendar */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 text-sm">이번 주</h3>
          <Calendar className="w-4 h-4 text-gray-400" />
        </div>
        <div className="grid grid-cols-7 gap-2">
          {mockWeeklyData.map((data, index) => {
            const isToday = index === today;
            return (
              <div key={index} className="text-center">
                <div
                  className={`text-xs mb-1 ${isToday ? "font-bold text-primary" : "text-gray-500"}`}
                >
                  {weekDays[index]}
                </div>
                <div
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    data.completed
                      ? "bg-primary text-white shadow-sm"
                      : isToday
                        ? "bg-primary/10 text-primary ring-2 ring-primary"
                        : "bg-gray-50 text-gray-300"
                  }`}
                >
                  {data.minutes > 0 ? data.minutes : "-"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Plan */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">오늘의 계획</h3>
          <span className="text-xs font-medium text-primary bg-primary/5 px-2 py-1 rounded-full">
            총 {mockTodayPlan.reduce((acc, p) => acc + p.duration, 0)}분
          </span>
        </div>
        <div className="space-y-3">
          {mockTodayPlan.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-xl p-4 border transition-all ${
                plan.completed 
                  ? "bg-gray-50 border-gray-100 opacity-70" 
                  : "bg-white border-gray-100 shadow-sm"
              }`}
            >
              <div className="flex items-start gap-3">
                <button className="mt-0.5 transition-colors hover:text-primary">
                  {plan.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300" />
                  )}
                </button>
                <div className="flex-1">
                  <h4
                    className={`font-medium text-base ${
                      plan.completed ? "text-gray-400 line-through" : "text-gray-900"
                    }`}
                  >
                    {plan.piece}
                  </h4>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {plan.measures}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                  <Target className="w-3.5 h-3.5" />
                  {plan.duration}분
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">AI 분석 및 추천</h3>
        {mockAISuggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={`rounded-xl p-4 border ${
              suggestion.priority === "high"
                ? "bg-orange-50 border-orange-200"
                : suggestion.priority === "medium"
                  ? "bg-blue-50 border-blue-200"
                  : "bg-primary/5 border-primary/10"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  suggestion.priority === "high"
                    ? "bg-orange-100"
                    : suggestion.priority === "medium"
                      ? "bg-blue-100"
                      : "bg-primary/10"
                }`}
              >
                <span className="text-sm">
                  {suggestion.type === "tempo" ? "⏱️" : suggestion.type === "dynamics" ? "🎵" : "📊"}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">{suggestion.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
