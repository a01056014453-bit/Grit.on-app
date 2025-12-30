import { Calendar, Target, CheckCircle, Circle } from "lucide-react";

const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
const today = new Date().getDay();

const mockWeeklyData = [
  { day: 0, minutes: 45, target: 60, completed: true },
  { day: 1, minutes: 60, target: 60, completed: true },
  { day: 2, minutes: 30, target: 60, completed: false },
  { day: 3, minutes: 0, target: 60, completed: false },
  { day: 4, minutes: 0, target: 60, completed: false },
  { day: 5, minutes: 0, target: 60, completed: false },
  { day: 6, minutes: 0, target: 60, completed: false },
];

const mockTodayPlan = [
  {
    id: "1",
    piece: "쇼팽 발라드 1번",
    measures: "23-28마디",
    duration: 15,
    completed: false,
  },
  {
    id: "2",
    piece: "쇼팽 발라드 1번",
    measures: "88-92마디",
    duration: 20,
    completed: false,
  },
  {
    id: "3",
    piece: "베토벤 소나타 Op.13",
    measures: "1-16마디",
    duration: 25,
    completed: false,
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
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-6">
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
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium ${
                    data.completed
                      ? "bg-primary text-white"
                      : isToday
                        ? "bg-primary/10 text-primary ring-2 ring-primary"
                        : "bg-gray-100 text-gray-400"
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
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">오늘의 계획</h3>
          <span className="text-xs text-primary">
            총 {mockTodayPlan.reduce((acc, p) => acc + p.duration, 0)}분
          </span>
        </div>
        <div className="space-y-2">
          {mockTodayPlan.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <button className="mt-0.5">
                  {plan.completed ? (
                    <CheckCircle className="w-5 h-5 text-primary" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300" />
                  )}
                </button>
                <div className="flex-1">
                  <h4
                    className={`font-medium ${plan.completed ? "text-gray-400 line-through" : "text-gray-900"}`}
                  >
                    {plan.piece}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {plan.measures}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Target className="w-3 h-3" />
                  {plan.duration}분
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Suggestion */}
      <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-sm">🤖</span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 text-sm">AI 추천</h4>
            <p className="text-xs text-gray-600 mt-1">
              88-92마디의 템포 과속 경향이 있어요. 메트로놈을 켜고 천천히
              연습해보세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
