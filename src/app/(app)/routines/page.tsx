"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Plus, X, Repeat, Trash2, Check } from "lucide-react";
import { mockDrillCards, groupDrillsBySong, mockSongs as initialSongs, composerList } from "@/data";

interface Drill {
  id: string;
  song: string;
  measures: string;
  title: string;
  mode: "duration" | "recurrence";
  duration: number;
  recurrence: number;
}

interface Routine {
  id: string;
  name: string;
  drills: Drill[];
  days: number[];
  createdAt: string;
}

export default function RoutinesPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [newRoutine, setNewRoutine] = useState({
    name: "",
    days: [] as number[],
    drills: [] as Drill[],
  });
  const [routineDrill, setRoutineDrill] = useState({
    selectedSong: "",
    isNewSong: false,
    composer: "",
    songTitle: "",
    measures: "",
    title: "",
    mode: "duration" as "duration" | "recurrence",
    duration: 5,
    recurrence: 3,
  });
  const [appliedRoutineId, setAppliedRoutineId] = useState<string | null>(null);

  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  // Build existing songs list from drills
  const groupedDrills = groupDrillsBySong(mockDrillCards);
  const mockDrills = groupedDrills.flatMap((g) => g.drills);

  // Load custom drills for song list
  const [customDrills, setCustomDrills] = useState<Drill[]>([]);

  useEffect(() => {
    const savedRoutines = localStorage.getItem("grit-on-routines");
    if (savedRoutines) {
      setRoutines(JSON.parse(savedRoutines));
    }
    const savedCustom = localStorage.getItem("grit-on-custom-drills");
    if (savedCustom) {
      setCustomDrills(JSON.parse(savedCustom));
    }
  }, []);

  const allDrills = [
    ...mockDrills,
    ...customDrills.map((d) => ({
      ...d,
      priority: "normal" as const,
      notes: "",
      tempo: 0,
    })),
  ];
  const existingSongs = Array.from(new Set(allDrills.map((d) => d.song)));

  // Routine CRUD
  const handleAddRoutineDrill = () => {
    let songName = "";
    if (routineDrill.isNewSong) {
      songName =
        routineDrill.composer.trim() && routineDrill.songTitle.trim()
          ? `${routineDrill.composer.trim()} ${routineDrill.songTitle.trim()}`
          : routineDrill.composer.trim() || routineDrill.songTitle.trim();
    } else {
      songName = routineDrill.selectedSong;
    }
    if (!songName || !routineDrill.measures.trim()) return;

    const drill: Drill = {
      id: `routine-drill-${Date.now()}`,
      song: songName,
      measures: routineDrill.measures.trim(),
      title: routineDrill.title.trim() || "연습",
      mode: routineDrill.mode,
      duration: routineDrill.mode === "duration" ? routineDrill.duration : 0,
      recurrence: routineDrill.mode === "recurrence" ? routineDrill.recurrence : 0,
    };

    setNewRoutine((prev) => ({ ...prev, drills: [...prev.drills, drill] }));
    setRoutineDrill({
      selectedSong: "",
      isNewSong: false,
      composer: "",
      songTitle: "",
      measures: "",
      title: "",
      mode: "duration",
      duration: 5,
      recurrence: 3,
    });
  };

  const handleSaveRoutine = () => {
    if (!newRoutine.name.trim() || newRoutine.drills.length === 0) return;

    const routine: Routine = {
      id: `routine-${Date.now()}`,
      name: newRoutine.name.trim(),
      drills: newRoutine.drills,
      days: newRoutine.days,
      createdAt: new Date().toISOString(),
    };

    const updatedRoutines = [...routines, routine];
    setRoutines(updatedRoutines);
    localStorage.setItem("grit-on-routines", JSON.stringify(updatedRoutines));
    setNewRoutine({ name: "", days: [], drills: [] });
    setIsRoutineModalOpen(false);
  };

  const handleDeleteRoutine = (routineId: string) => {
    const updatedRoutines = routines.filter((r) => r.id !== routineId);
    setRoutines(updatedRoutines);
    localStorage.setItem("grit-on-routines", JSON.stringify(updatedRoutines));
  };

  const handleApplyRoutine = (routine: Routine) => {
    const savedCustom = localStorage.getItem("grit-on-custom-drills");
    const currentDrills = savedCustom ? JSON.parse(savedCustom) : [];

    const newDrills = routine.drills.map((d) => ({
      ...d,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }));
    const updatedDrills = [...currentDrills, ...newDrills];
    localStorage.setItem("grit-on-custom-drills", JSON.stringify(updatedDrills));

    setAppliedRoutineId(routine.id);
    setTimeout(() => setAppliedRoutineId(null), 2000);
  };

  const handleToggleRoutineDay = (day: number) => {
    setNewRoutine((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day].sort(),
    }));
  };

  const closeModal = () => {
    setIsRoutineModalOpen(false);
    setNewRoutine({ name: "", days: [], drills: [] });
    setRoutineDrill({
      selectedSong: "",
      isNewSong: false,
      composer: "",
      songTitle: "",
      measures: "",
      title: "",
      mode: "duration",
      duration: 5,
      recurrence: 3,
    });
  };

  return (
    <div className="px-4 py-6 max-w-lg mx-auto bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 hover:bg-gray-200 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-black">연습 루틴</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            반복할 연습 세트를 만들고 관리하세요
          </p>
        </div>
      </div>

      {/* Routine List */}
      <div className="space-y-3">
        {routines.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <div className="w-14 h-14 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Repeat className="w-7 h-7 text-violet-600" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">
              아직 루틴이 없어요
            </p>
            <p className="text-xs text-gray-500 mb-4">
              자주 하는 연습을 루틴으로 저장해보세요
            </p>
            <button
              onClick={() => setIsRoutineModalOpen(true)}
              className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium"
            >
              첫 루틴 만들기
            </button>
          </div>
        ) : (
          <>
            {routines.map((routine) => {
              const isForToday =
                routine.days.length === 0 ||
                routine.days.includes(new Date().getDay());
              const isApplied = appliedRoutineId === routine.id;
              return (
                <div
                  key={routine.id}
                  className={`rounded-2xl border overflow-hidden bg-white ${
                    isForToday ? "border-violet-200" : "border-gray-200"
                  }`}
                >
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-black">
                          {routine.name}
                        </p>
                        {isForToday && (
                          <span className="text-[10px] bg-violet-100 text-violet-600 px-1.5 py-0.5 rounded-full font-medium">
                            오늘
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {routine.drills.length}개 항목
                        {routine.days.length > 0
                          ? ` · ${routine.days.map((d) => dayNames[d]).join(", ")}`
                          : " · 매일"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleApplyRoutine(routine)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isApplied
                            ? "bg-green-500 text-white"
                            : "bg-violet-600 text-white hover:bg-violet-700"
                        }`}
                      >
                        {isApplied ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            적용됨
                          </span>
                        ) : (
                          "적용"
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteRoutine(routine.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 group"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-500" />
                      </button>
                    </div>
                  </div>

                  {/* Drill list */}
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {routine.drills.map((drill, idx) => (
                      <div
                        key={drill.id}
                        className="px-4 py-2 flex items-center gap-2"
                      >
                        <span className="text-xs text-gray-400 w-4 shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-gray-700">
                            <span className="font-medium">{drill.song}</span>
                            <span className="text-gray-400 mx-1">·</span>
                            {drill.measures}
                            {drill.title !== "연습" && (
                              <>
                                <span className="text-gray-400 mx-1">·</span>
                                {drill.title}
                              </>
                            )}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 shrink-0">
                          {drill.mode === "duration"
                            ? `${drill.duration}분`
                            : `${drill.recurrence}회`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* FAB - New Routine */}
      {routines.length > 0 && (
        <button
          onClick={() => setIsRoutineModalOpen(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-black rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors z-40"
        >
          <Plus className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Routine Modal */}
      {isRoutineModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-md animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-black">루틴 만들기</h3>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Routine Name */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  루틴 이름
                </label>
                <input
                  type="text"
                  value={newRoutine.name}
                  onChange={(e) =>
                    setNewRoutine({ ...newRoutine, name: e.target.value })
                  }
                  placeholder="예: 아침 기초 연습"
                  className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Days Selection */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">
                  반복 요일 (선택 안하면 매일)
                </label>
                <div className="flex gap-1.5">
                  {dayNames.map((name, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleToggleRoutineDay(idx)}
                      className={`w-9 h-9 rounded-full text-xs font-medium transition-colors ${
                        newRoutine.days.includes(idx)
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drills in Routine */}
              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">
                  연습 항목 ({newRoutine.drills.length}개)
                </label>

                {newRoutine.drills.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {newRoutine.drills.map((drill, idx) => (
                      <div
                        key={drill.id}
                        className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2"
                      >
                        <span className="text-xs text-gray-400 w-4">
                          {idx + 1}
                        </span>
                        <div className="flex-1 text-sm">
                          <span className="font-medium text-black">
                            {drill.song}
                          </span>
                          <span className="text-gray-400 mx-1">·</span>
                          <span className="text-gray-600">
                            {drill.measures}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setNewRoutine((prev) => ({
                              ...prev,
                              drills: prev.drills.filter(
                                (_, i) => i !== idx
                              ),
                            }));
                          }}
                          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-100"
                        >
                          <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add drill to routine */}
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  {/* Song Selection for Routine */}
                  {!routineDrill.isNewSong ? (
                    <div className="space-y-1.5">
                      {existingSongs.slice(0, 3).map((song) => (
                        <button
                          key={song}
                          onClick={() =>
                            setRoutineDrill({
                              ...routineDrill,
                              selectedSong: song,
                            })
                          }
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                            routineDrill.selectedSong === song
                              ? "bg-black text-white"
                              : "bg-white text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {song}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setRoutineDrill({
                            ...routineDrill,
                            isNewSong: true,
                            selectedSong: "",
                          })
                        }
                        className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-black hover:text-black flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        다른 곡
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">
                          새 곡
                        </span>
                        <button
                          onClick={() =>
                            setRoutineDrill({
                              ...routineDrill,
                              isNewSong: false,
                              composer: "",
                              songTitle: "",
                            })
                          }
                          className="text-xs text-gray-500"
                        >
                          취소
                        </button>
                      </div>
                      <input
                        type="text"
                        value={routineDrill.composer}
                        onChange={(e) =>
                          setRoutineDrill({
                            ...routineDrill,
                            composer: e.target.value,
                          })
                        }
                        placeholder="작곡가"
                        className="w-full px-3 py-2 bg-white rounded-lg text-xs border border-gray-200"
                      />
                      <input
                        type="text"
                        value={routineDrill.songTitle}
                        onChange={(e) =>
                          setRoutineDrill({
                            ...routineDrill,
                            songTitle: e.target.value,
                          })
                        }
                        placeholder="곡명"
                        className="w-full px-3 py-2 bg-white rounded-lg text-xs border border-gray-200"
                      />
                    </div>
                  )}

                  <input
                    type="text"
                    value={routineDrill.measures}
                    onChange={(e) =>
                      setRoutineDrill({
                        ...routineDrill,
                        measures: e.target.value,
                      })
                    }
                    placeholder="마디 구간 (예: 1-16마디)"
                    className="w-full px-3 py-2 bg-white rounded-lg text-xs border border-gray-200"
                  />

                  <input
                    type="text"
                    value={routineDrill.title}
                    onChange={(e) =>
                      setRoutineDrill({
                        ...routineDrill,
                        title: e.target.value,
                      })
                    }
                    placeholder="연습 내용 (선택)"
                    className="w-full px-3 py-2 bg-white rounded-lg text-xs border border-gray-200"
                  />

                  <div className="flex gap-2">
                    <select
                      value={routineDrill.mode}
                      onChange={(e) =>
                        setRoutineDrill({
                          ...routineDrill,
                          mode: e.target.value as "duration" | "recurrence",
                        })
                      }
                      className="flex-1 px-3 py-2 bg-white rounded-lg text-xs border border-gray-200"
                    >
                      <option value="duration">시간 (분)</option>
                      <option value="recurrence">횟수 (회)</option>
                    </select>
                    <input
                      type="number"
                      value={
                        routineDrill.mode === "duration"
                          ? routineDrill.duration
                          : routineDrill.recurrence
                      }
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        if (routineDrill.mode === "duration") {
                          setRoutineDrill({ ...routineDrill, duration: val });
                        } else {
                          setRoutineDrill({
                            ...routineDrill,
                            recurrence: val,
                          });
                        }
                      }}
                      className="w-20 px-3 py-2 bg-white rounded-lg text-xs border border-gray-200 text-center"
                      min={1}
                    />
                  </div>

                  <button
                    onClick={handleAddRoutineDrill}
                    disabled={
                      (!routineDrill.isNewSong &&
                        !routineDrill.selectedSong) ||
                      (routineDrill.isNewSong &&
                        !routineDrill.composer.trim() &&
                        !routineDrill.songTitle.trim()) ||
                      !routineDrill.measures.trim()
                    }
                    className="w-full py-2 bg-violet-600 text-white rounded-lg text-xs font-medium disabled:opacity-30"
                  >
                    항목 추가
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveRoutine}
              disabled={
                !newRoutine.name.trim() || newRoutine.drills.length === 0
              }
              className="w-full mt-4 py-3 bg-black text-white rounded-xl font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
            >
              루틴 저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
