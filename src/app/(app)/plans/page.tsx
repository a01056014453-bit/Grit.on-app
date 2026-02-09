"use client";

import { useState } from "react";
import { Calendar, Target, CheckCircle, Circle, Sparkles, Plus, X, Check } from "lucide-react";
import { weekDays, mockWeeklyData, initialTodayPlan, mockAISuggestions, mockSongs } from "@/data";
import type { TodayPlanItem } from "@/types";

const today = new Date().getDay();

export default function PlansPage() {
  const [todayPlan, setTodayPlan] = useState<TodayPlanItem[]>(initialTodayPlan);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [practiceContent, setPracticeContent] = useState("");

  const togglePlanComplete = (id: string) => {
    setTodayPlan((prev) =>
      prev.map((plan) =>
        plan.id === id ? { ...plan, completed: !plan.completed } : plan
      )
    );
  };

  const handleAddPlan = () => {
    const selectedSong = mockSongs.find((s) => s.id === selectedSongId);
    if (!selectedSong || !practiceContent) return;

    const plan: TodayPlanItem = {
      id: Date.now().toString(),
      piece: selectedSong.title,
      measures: practiceContent,
      duration: 15,
      priority: "medium",
      note: "",
      completed: false,
    };

    setTodayPlan((prev) => [...prev, plan]);
    setSelectedSongId(null);
    setPracticeContent("");
    setIsModalOpen(false);
  };

  const completedCount = todayPlan.filter((p) => p.completed).length;
  const totalDuration = todayPlan.reduce((acc, p) => acc + p.duration, 0);
  const completedDuration = todayPlan
    .filter((p) => p.completed)
    .reduce((acc, p) => acc + p.duration, 0);

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24">
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
                  className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    data.completed
                      ? "bg-primary text-white shadow-sm"
                      : isToday
                        ? "bg-primary/10 text-primary ring-2 ring-primary"
                        : data.minutes > 0
                          ? "bg-gray-100 text-gray-600"
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
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">오늘의 계획</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {completedCount}/{todayPlan.length} 완료
            </span>
            <span className="text-xs font-medium text-primary bg-primary/5 px-2 py-1 rounded-full">
              {completedDuration}/{totalDuration}분
            </span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-7 h-7 flex items-center justify-center bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(completedDuration / totalDuration) * 100}%` }}
          />
        </div>

        <div className="space-y-3">
          {todayPlan.map((plan) => (
            <div
              key={plan.id}
              onClick={() => togglePlanComplete(plan.id)}
              className={`rounded-xl p-4 border transition-all cursor-pointer active:scale-[0.99] ${
                plan.completed
                  ? "bg-gray-50 border-gray-100"
                  : "bg-white border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {plan.completed ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-300 hover:text-primary transition-colors" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`font-medium text-base ${
                        plan.completed ? "text-gray-400 line-through" : "text-gray-900"
                      }`}
                    >
                      {plan.piece}
                    </h4>
                    {plan.priority === "high" && !plan.completed && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full">
                        중요
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm mt-0.5 ${
                      plan.completed ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {plan.measures}
                  </p>
                  {!plan.completed && plan.note && (
                    <p className="text-xs text-primary/70 mt-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {plan.note}
                    </p>
                  )}
                </div>
                <div
                  className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${
                    plan.completed
                      ? "text-gray-400 bg-gray-100"
                      : "text-slate-500 bg-slate-50"
                  }`}
                >
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

      {/* Add Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl p-5 pb-24 animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">새 계획 추가</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* 곡 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  곡 선택
                </label>
                <div className="flex flex-wrap gap-2">
                  {mockSongs.map((song) => (
                    <button
                      key={song.id}
                      onClick={() => setSelectedSongId(song.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        selectedSongId === song.id
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {selectedSongId === song.id && (
                        <Check className="w-3 h-3 inline mr-1" />
                      )}
                      {song.title.length > 25 ? song.title.slice(0, 25) + "..." : song.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* 연습 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  연습 내용
                </label>
                <input
                  type="text"
                  value={practiceContent}
                  onChange={(e) => setPracticeContent(e.target.value)}
                  placeholder="예: mm. 23-28 코다 진입부 연습"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleAddPlan}
                disabled={!selectedSongId || !practiceContent}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed mt-2"
              >
                추가하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
