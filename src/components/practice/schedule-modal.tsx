"use client";

import { useState, useMemo } from "react";
import { X, Plus } from "lucide-react";
import { composerList, mockSongs } from "@/data";
import { getAllAvailableDrills } from "@/lib/drill-records";

interface NewDrillForm {
  isNewSong: boolean;
  selectedSong: string;
  composer: string;
  songTitle: string;
  measures: string;
  title: string;
  mode: "duration" | "recurrence";
  duration: number;
  recurrence: number;
}

const INITIAL_FORM: NewDrillForm = {
  isNewSong: false,
  selectedSong: "",
  composer: "",
  songTitle: "",
  measures: "",
  title: "",
  mode: "duration",
  duration: 5,
  recurrence: 3,
};

export function ScheduleModal({
  dateStr,
  dateLabel,
  onClose,
  onSave,
}: {
  dateStr: string;
  dateLabel: string;
  onClose: () => void;
  onSave: (ids: string[]) => void;
}) {
  const [form, setForm] = useState<NewDrillForm>(INITIAL_FORM);

  // 기존 곡 목록 추출
  const existingSongs = useMemo(() => {
    const allDrills = getAllAvailableDrills();
    const songs = new Set<string>();
    allDrills.forEach((d) => songs.add(d.song));
    return Array.from(songs);
  }, []);

  // 작곡가 자동완성
  const filteredComposers = form.composer.length >= 2
    ? composerList.filter(
        (c) =>
          c.label.toLowerCase().includes(form.composer.toLowerCase()) ||
          c.key.includes(form.composer.toLowerCase())
      )
    : [];

  // 곡 자동완성
  const filteredSongSuggestions = form.songTitle.length >= 2
    ? mockSongs.filter((s) => {
        const matchesTitle = s.title.toLowerCase().includes(form.songTitle.toLowerCase());
        const matchesComposer = form.composer
          ? s.title.toLowerCase().includes(form.composer.toLowerCase())
          : true;
        return matchesTitle && matchesComposer;
      })
    : [];

  // 새 연습 추가
  const handleAddDrill = () => {
    let songName = "";
    if (form.isNewSong) {
      songName =
        form.composer.trim() && form.songTitle.trim()
          ? `${form.composer.trim()} ${form.songTitle.trim()}`
          : form.composer.trim() || form.songTitle.trim();
    } else {
      songName = form.selectedSong;
    }
    if (!songName || !form.measures.trim()) return;

    const drill = {
      id: `custom-${Date.now()}`,
      song: songName,
      measures: form.measures.trim(),
      title: form.title.trim() || "연습",
      mode: form.mode,
      duration: form.mode === "duration" ? form.duration : 0,
      recurrence: form.mode === "recurrence" ? form.recurrence : 0,
    };

    // localStorage에 커스텀 드릴 저장
    const saved = localStorage.getItem("grit-on-custom-drills");
    const existing = saved ? JSON.parse(saved) : [];
    existing.push(drill);
    localStorage.setItem("grit-on-custom-drills", JSON.stringify(existing));

    // 기존 스케줄에 새 드릴 추가
    const scheduledRaw = localStorage.getItem(`grit-on-scheduled-${dateStr}`);
    const scheduledIds: string[] = scheduledRaw ? JSON.parse(scheduledRaw) : [];
    scheduledIds.push(drill.id);

    onSave(scheduledIds);
  };

  const canAdd =
    ((form.isNewSong && (form.composer.trim() || form.songTitle.trim())) ||
      (!form.isNewSong && form.selectedSong)) &&
    form.measures.trim();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-5 w-full max-w-md animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-black">연습 항목 추가</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="space-y-3">
          {/* 곡 선택 */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">곡 선택</label>

            {/* 기존 곡 목록 */}
            {existingSongs.length > 0 && !form.isNewSong && (
              <div className="space-y-1.5 mb-3">
                {existingSongs.map((song) => (
                  <button
                    key={song}
                    onClick={() => setForm({ ...form, selectedSong: song, isNewSong: false })}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      form.selectedSong === song
                        ? "bg-black text-white"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {song}
                  </button>
                ))}
              </div>
            )}

            {/* 새 곡 추가 버튼 / 입력 필드 */}
            {!form.isNewSong ? (
              <button
                onClick={() => setForm({ ...form, isNewSong: true, selectedSong: "" })}
                className="w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-black hover:text-black transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                새 곡 추가
              </button>
            ) : (
              <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-600">새 곡 정보</span>
                  <button
                    onClick={() => setForm({ ...form, isNewSong: false, composer: "", songTitle: "" })}
                    className="text-xs text-gray-500 hover:text-black"
                  >
                    취소
                  </button>
                </div>
                <input
                  type="text"
                  value={form.composer}
                  onChange={(e) => setForm({ ...form, composer: e.target.value })}
                  placeholder="작곡가 (2글자 이상)"
                  className="w-full px-3 py-2 bg-white rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black"
                  autoFocus
                />
                {filteredComposers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {filteredComposers.slice(0, 4).map((c) => (
                      <button
                        key={c.key}
                        onClick={() => setForm({ ...form, composer: c.label })}
                        className={`text-xs px-2 py-1 rounded-full transition-colors ${
                          form.composer === c.label
                            ? "bg-black text-white"
                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                )}
                <input
                  type="text"
                  value={form.songTitle}
                  onChange={(e) => setForm({ ...form, songTitle: e.target.value })}
                  placeholder="곡 이름 (2글자 이상)"
                  className="w-full px-3 py-2 bg-white rounded-lg text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black"
                />
                {filteredSongSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {filteredSongSuggestions.slice(0, 3).map((s) => {
                      const parts = s.title.split(" ");
                      const songOnly = parts.slice(2).join(" ") || s.title;
                      const composerOnly = parts.slice(0, 2).join(" ");
                      return (
                        <button
                          key={s.id}
                          onClick={() => setForm({ ...form, composer: composerOnly, songTitle: songOnly })}
                          className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 truncate max-w-[150px]"
                        >
                          {s.title}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 마디 구간 */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">마디 구간</label>
            <input
              type="text"
              value={form.measures}
              onChange={(e) => setForm({ ...form, measures: e.target.value })}
              placeholder="예: 23-26마디"
              className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* 연습 내용 */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-1 block">연습 내용 (선택)</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="예: 양손 어긋남"
              className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Mode Toggle */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block">연습 목표</label>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setForm({ ...form, mode: "duration" })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  form.mode === "duration"
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                시간 (분)
              </button>
              <button
                onClick={() => setForm({ ...form, mode: "recurrence" })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  form.mode === "recurrence"
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                횟수 (회)
              </button>
            </div>

            {form.mode === "duration" ? (
              <div className="flex items-center justify-center gap-3 bg-gray-50 rounded-lg py-3">
                <button
                  onClick={() => setForm({ ...form, duration: Math.max(1, form.duration - 1) })}
                  className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-lg font-medium"
                >
                  -
                </button>
                <span className="text-2xl font-bold text-black w-16 text-center">{form.duration}</span>
                <span className="text-gray-500">분</span>
                <button
                  onClick={() => setForm({ ...form, duration: Math.min(60, form.duration + 1) })}
                  className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-lg font-medium"
                >
                  +
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 bg-gray-50 rounded-lg py-3">
                <button
                  onClick={() => setForm({ ...form, recurrence: Math.max(1, form.recurrence - 1) })}
                  className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-lg font-medium"
                >
                  -
                </button>
                <span className="text-2xl font-bold text-black w-16 text-center">{form.recurrence}</span>
                <span className="text-gray-500">회</span>
                <button
                  onClick={() => setForm({ ...form, recurrence: Math.min(20, form.recurrence + 1) })}
                  className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-lg font-medium"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleAddDrill}
          disabled={!canAdd}
          className="w-full mt-4 py-3 bg-black text-white rounded-xl font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
        >
          추가하기
        </button>
      </div>
    </div>
  );
}
