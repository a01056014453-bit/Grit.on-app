// Practice To-do 스토어 (localStorage 기반)

import type { PracticeTodo } from "@/types";

const STORAGE_KEY = "griton_practice_todos";

// 모든 To-do 가져오기
export function getPracticeTodos(): PracticeTodo[] {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// 오늘의 To-do만 가져오기
export function getTodayTodos(): PracticeTodo[] {
  const todos = getPracticeTodos();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return todos.filter((todo) => {
    const createdDate = new Date(todo.createdAt);
    createdDate.setHours(0, 0, 0, 0);
    return createdDate.getTime() === today.getTime();
  }).sort((a, b) => a.order - b.order);
}

// To-do 저장
export function savePracticeTodos(todos: PracticeTodo[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// 새 To-do 추가
export function addPracticeTodo(
  todo: Omit<PracticeTodo, "id" | "createdAt" | "completedRepetitions" | "isCompleted" | "order">
): PracticeTodo {
  const todos = getPracticeTodos();
  const todayTodos = getTodayTodos();

  const newTodo: PracticeTodo = {
    ...todo,
    id: `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    completedRepetitions: 0,
    isCompleted: false,
    order: todayTodos.length,
  };

  todos.push(newTodo);
  savePracticeTodos(todos);
  return newTodo;
}

// To-do 업데이트
export function updatePracticeTodo(
  id: string,
  updates: Partial<PracticeTodo>
): PracticeTodo | null {
  const todos = getPracticeTodos();
  const index = todos.findIndex((t) => t.id === id);

  if (index === -1) return null;

  todos[index] = { ...todos[index], ...updates };
  savePracticeTodos(todos);
  return todos[index];
}

// To-do 완료 처리
export function completePracticeTodo(id: string): PracticeTodo | null {
  return updatePracticeTodo(id, {
    isCompleted: true,
    completedAt: new Date().toISOString(),
  });
}

// To-do 완료 취소
export function uncompletePracticeTodo(id: string): PracticeTodo | null {
  return updatePracticeTodo(id, {
    isCompleted: false,
    completedAt: undefined,
  });
}

// 반복 횟수 증가
export function incrementRepetition(id: string): PracticeTodo | null {
  const todos = getPracticeTodos();
  const todo = todos.find((t) => t.id === id);

  if (!todo) return null;

  const newCount = todo.completedRepetitions + 1;
  const updates: Partial<PracticeTodo> = {
    completedRepetitions: newCount,
  };

  // 목표 반복 횟수에 도달하면 자동 완료
  if (todo.targetRepetitions && newCount >= todo.targetRepetitions) {
    updates.isCompleted = true;
    updates.completedAt = new Date().toISOString();
  }

  return updatePracticeTodo(id, updates);
}

// To-do 삭제
export function deletePracticeTodo(id: string): boolean {
  const todos = getPracticeTodos();
  const filtered = todos.filter((t) => t.id !== id);

  if (filtered.length === todos.length) return false;

  savePracticeTodos(filtered);
  return true;
}

// To-do 순서 변경
export function reorderPracticeTodos(todoIds: string[]): void {
  const todos = getPracticeTodos();

  todoIds.forEach((id, index) => {
    const todo = todos.find((t) => t.id === id);
    if (todo) {
      todo.order = index;
    }
  });

  savePracticeTodos(todos);
}

// 오늘의 완료된 To-do 개수
export function getTodayCompletedCount(): { completed: number; total: number } {
  const todayTodos = getTodayTodos();
  const completed = todayTodos.filter((t) => t.isCompleted).length;
  return { completed, total: todayTodos.length };
}

// 지난 To-do 정리 (7일 이상 된 완료된 항목 삭제)
export function cleanupOldTodos(): void {
  const todos = getPracticeTodos();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const filtered = todos.filter((todo) => {
    if (!todo.isCompleted) return true;
    const completedDate = todo.completedAt ? new Date(todo.completedAt) : null;
    if (!completedDate) return true;
    return completedDate > sevenDaysAgo;
  });

  savePracticeTodos(filtered);
}
