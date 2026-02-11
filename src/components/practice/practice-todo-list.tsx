"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  Plus,
  Music,
  X,
  ChevronRight,
  Edit3,
  Repeat,
} from "lucide-react";
import type { PracticeTodo } from "@/types";
import {
  getTodayTodos,
  completePracticeTodo,
  uncompletePracticeTodo,
  addPracticeTodo,
  deletePracticeTodo,
  getTodayCompletedCount,
} from "@/lib/practice-todo-store";
import { mockSongs } from "@/data";

interface PracticeTodoListProps {
  isRecording?: boolean;
  onTodoSelect?: (todo: PracticeTodo) => void;
  selectedTodoId?: string | null;
}

export function PracticeTodoList({
  isRecording = false,
  onTodoSelect,
  selectedTodoId,
}: PracticeTodoListProps) {
  const [todos, setTodos] = useState<PracticeTodo[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [completedCount, setCompletedCount] = useState({ completed: 0, total: 0 });

  // 폼 상태
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [isNewSong, setIsNewSong] = useState(false);
  const [newSongTitle, setNewSongTitle] = useState("");
  const [newMeasureStart, setNewMeasureStart] = useState("");
  const [newMeasureEnd, setNewMeasureEnd] = useState("");
  const [newNote, setNewNote] = useState("");

  // 데이터 로드
  useEffect(() => {
    const loadTodos = () => {
      setTodos(getTodayTodos());
      setCompletedCount(getTodayCompletedCount());
    };
    loadTodos();
  }, []);

  // 선택된 곡 정보
  const selectedSong = selectedSongId ? mockSongs.find(s => s.id === selectedSongId) : null;

  // 완료/미완료 토글
  const handleToggleComplete = (todo: PracticeTodo) => {
    if (isRecording) return;

    if (todo.isCompleted) {
      uncompletePracticeTodo(todo.id);
    } else {
      completePracticeTodo(todo.id);
    }
    setTodos(getTodayTodos());
    setCompletedCount(getTodayCompletedCount());
  };

  // 폼 초기화
  const resetForm = () => {
    setSelectedSongId(null);
    setIsNewSong(false);
    setNewSongTitle("");
    setNewMeasureStart("");
    setNewMeasureEnd("");
    setNewNote("");
  };

  // 새 To-do 추가
  const handleAddTodo = () => {
    const songTitle = isNewSong ? newSongTitle.trim() : (selectedSong?.title || "");
    if (!songTitle) return;

    addPracticeTodo({
      songId: isNewSong ? `song_${Date.now()}` : (selectedSongId || `song_${Date.now()}`),
      songTitle,
      measureStart: newMeasureStart ? parseInt(newMeasureStart) : 0,
      measureEnd: newMeasureEnd ? parseInt(newMeasureEnd) : 0,
      note: newNote.trim() || undefined,
    });

    resetForm();
    setIsAddingNew(false);
    setTodos(getTodayTodos());
    setCompletedCount(getTodayCompletedCount());
  };

  // To-do 삭제
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRecording) return;
    deletePracticeTodo(id);
    setTodos(getTodayTodos());
    setCompletedCount(getTodayCompletedCount());
  };

  // To-do 선택 (연습 시작용)
  const handleSelect = (todo: PracticeTodo) => {
    if (isRecording || todo.isCompleted) return;
    onTodoSelect?.(todo);
  };

  // 곡 선택
  const handleSelectSong = (songId: string) => {
    setSelectedSongId(songId);
    setIsNewSong(false);
    setNewSongTitle("");
  };

  // 새 곡 입력 모드
  const handleNewSongMode = () => {
    setIsNewSong(true);
    setSelectedSongId(null);
  };

  // 곡별로 그룹핑
  const groupedBySong: Record<string, PracticeTodo[]> = {};
  todos.forEach((todo) => {
    if (!groupedBySong[todo.songTitle]) {
      groupedBySong[todo.songTitle] = [];
    }
    groupedBySong[todo.songTitle].push(todo);
  });

  const currentSongTitle = isNewSong ? newSongTitle : (selectedSong?.title || "");
  const canAdd = currentSongTitle.trim();
  const progress = completedCount.total > 0
    ? (completedCount.completed / completedCount.total) * 100
    : 0;

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200 mb-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-black">오늘의 연습</span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {completedCount.completed}/{completedCount.total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            title="루틴에서 가져오기"
          >
            <Repeat className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setIsAddingNew(true)}
            className="w-7 h-7 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-black to-violet-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 추가 폼 */}
      {isAddingNew && (
        <div className="mb-4 p-4 rounded-xl border border-violet-200 bg-violet-50/30">
          {!isNewSong && !selectedSongId ? (
            // 곡 선택 목록
            <div className="space-y-2">
              {mockSongs.slice(0, 4).map((song) => (
                <button
                  key={song.id}
                  onClick={() => handleSelectSong(song.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white hover:bg-gray-50 transition-colors text-left border border-gray-100"
                >
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shrink-0">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{song.title}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
              <button
                onClick={handleNewSongMode}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-violet-400 hover:text-violet-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                새 곡 추가
              </button>
              <button
                onClick={() => setIsAddingNew(false)}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                취소
              </button>
            </div>
          ) : (
            // 선택된 곡 또는 새 곡 입력
            <div className="space-y-3">
              {isNewSong ? (
                <input
                  type="text"
                  value={newSongTitle}
                  onChange={(e) => setNewSongTitle(e.target.value)}
                  placeholder="곡명"
                  autoFocus
                  className="w-full px-4 py-3 bg-white rounded-xl text-sm border-2 border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              ) : (
                <button
                  onClick={() => {
                    setSelectedSongId(null);
                    setIsNewSong(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white text-left border border-gray-200"
                >
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shrink-0">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{selectedSong?.title}</p>
                    <p className="text-xs text-gray-500">탭해서 변경</p>
                  </div>
                  <Edit3 className="w-4 h-4 text-gray-400" />
                </button>
              )}

              {/* 마디 범위 (선택) */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={newMeasureStart}
                  onChange={(e) => setNewMeasureStart(e.target.value)}
                  placeholder="시작 마디"
                  min={1}
                  className="flex-1 px-3 py-3 bg-white rounded-xl text-sm text-center border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <span className="text-gray-400">~</span>
                <input
                  type="number"
                  value={newMeasureEnd}
                  onChange={(e) => setNewMeasureEnd(e.target.value)}
                  placeholder="끝 마디"
                  min={1}
                  className="flex-1 px-3 py-3 bg-white rounded-xl text-sm text-center border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* 메모 (선택) */}
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="메모 (예: 붓점, 양손 맞추기)"
                className="w-full px-4 py-3 bg-white rounded-xl text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />

              {/* 버튼 */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    resetForm();
                    setIsAddingNew(false);
                  }}
                  className="flex-1 py-3 text-sm text-gray-600 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleAddTodo}
                  disabled={!canAdd}
                  className="flex-1 py-3 text-sm text-white bg-black rounded-xl hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  추가
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 곡별 그룹 리스트 */}
      {Object.keys(groupedBySong).length > 0 ? (
        <div className="space-y-3">
          {Object.entries(groupedBySong).map(([songName, songTodos]) => (
            <div key={songName} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Song Header */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <p className="text-sm font-semibold text-black">{songName}</p>
              </div>
              {/* Todos under this song */}
              <div className="divide-y divide-gray-100">
                {songTodos.map((todo) => {
                  const isCompleted = todo.isCompleted;
                  const measureText = todo.measureStart > 0 && todo.measureEnd > 0
                    ? `${todo.measureStart}-${todo.measureEnd}마디`
                    : "전체";

                  return (
                    <div
                      key={todo.id}
                      onClick={() => handleSelect(todo)}
                      className={`px-4 py-2.5 flex items-center gap-3 ${
                        isCompleted ? "bg-gray-50" : "bg-white"
                      } ${selectedTodoId === todo.id ? "bg-violet-50" : ""} ${
                        !isRecording && !isCompleted ? "cursor-pointer hover:bg-gray-50" : ""
                      }`}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleComplete(todo);
                        }}
                        disabled={isRecording}
                        className="shrink-0"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300 hover:text-violet-500 transition-colors" />
                        )}
                      </button>
                      <div className={`flex-1 min-w-0 ${isCompleted ? "opacity-50" : ""}`}>
                        <span className={`text-sm ${isCompleted ? "line-through text-gray-400" : "text-gray-700"}`}>
                          {measureText}
                          {todo.note && ` · ${todo.note}`}
                        </span>
                      </div>
                      {!isRecording && (
                        <button
                          onClick={(e) => handleDelete(todo.id, e)}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all"
                        >
                          <X className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : !isAddingNew ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-400 mb-3">
            오늘 연습할 목표를 추가해보세요
          </p>
          <button
            onClick={() => setIsAddingNew(true)}
            className="px-4 py-2 text-sm text-violet-600 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors"
          >
            + 연습 목표 추가
          </button>
        </div>
      ) : null}
    </div>
  );
}
