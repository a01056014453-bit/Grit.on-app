/**
 * sync-user-data.ts
 * localStorage ↔ Supabase Storage 동기화
 * 동일 계정이면 기기가 달라도 같은 데이터를 보여줌
 */

import { getUserId } from "./user-id";

// ─── 동기화 대상 키 ────────────────────────────────────────────────────────

/** 단일 키 (항상 동기화) */
const SINGLE_KEYS = [
  "grit-on-custom-drills",
  "grit-on-hidden-drills",
  "grit-on-daily-goal",
  "griton_practice_todos",
  "grit-on-my-library",
  "grit-on-profile",
  "grit-on-routines",
] as const;

/** 날짜별 키 접두사 */
const DATE_PREFIXES = [
  "grit-on-scheduled-",
  "grit-on-completed-",
] as const;

/** 날짜별 키 최대 보관 일수 (90일) */
const MAX_DATE_DAYS = 90;

// ─── Push (로컬 → 서버) ────────────────────────────────────────────────────

/** 변경된 키만 서버에 push */
export async function pushUserData(keys?: string[]): Promise<void> {
  if (typeof window === "undefined") return;

  const userId = getUserId();
  if (!userId) return;

  const targetKeys = keys ?? collectAllSyncKeys();
  if (targetKeys.length === 0) return;

  const data: Record<string, unknown> = {};
  for (const key of targetKeys) {
    const raw = localStorage.getItem(key);
    if (raw === null) continue;
    try {
      data[key] = JSON.parse(raw);
    } catch {
      data[key] = raw;
    }
  }

  if (Object.keys(data).length === 0) return;

  try {
    const res = await fetch("/api/sync-user-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, data }),
    });

    if (!res.ok) {
      console.error("[sync-user-data] push 실패:", res.status);
    }
  } catch (err) {
    console.error("[sync-user-data] push 오류:", err);
  }
}

/** 특정 키가 변경되었을 때 호출 (debounced) */
const pushTimers = new Map<string, NodeJS.Timeout>();

export function pushUserDataDebounced(key: string, delayMs = 1500): void {
  const existing = pushTimers.get(key);
  if (existing) clearTimeout(existing);

  pushTimers.set(
    key,
    setTimeout(() => {
      pushTimers.delete(key);
      pushUserData([key]).catch(console.error);
    }, delayMs)
  );
}

// ─── Pull (서버 → 로컬) ────────────────────────────────────────────────────

/** 서버에서 데이터를 가져와서 localStorage에 반영 */
export async function pullUserData(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const userId = getUserId();
  if (!userId) return false;

  try {
    const res = await fetch(`/api/sync-user-data?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) {
      console.error("[sync-user-data] pull 실패:", res.status);
      return false;
    }

    const result = await res.json();
    if (!result.success || !result.data) return false;

    const serverData: Record<string, unknown> = result.data;
    delete serverData._updatedAt; // 메타데이터 제외

    let applied = 0;
    for (const [key, value] of Object.entries(serverData)) {
      const serverValue = typeof value === "string"
        ? value
        : JSON.stringify(value);

      const localValue = localStorage.getItem(key);

      // 로컬에 없으면 서버 값 적용
      if (localValue === null) {
        localStorage.setItem(key, serverValue);
        applied++;
        continue;
      }

      // 로컬 값과 같으면 스킵
      if (localValue === serverValue) continue;

      // 날짜별 완료/스케줄 데이터는 병합 (union)
      if (key.startsWith("grit-on-completed-")) {
        mergeCompleted(key, value);
        applied++;
        continue;
      }
      if (key.startsWith("grit-on-scheduled-")) {
        mergeScheduled(key, value);
        applied++;
        continue;
      }

      // 커스텀 드릴은 병합 (ID 기준 union)
      if (key === "grit-on-custom-drills") {
        mergeCustomDrills(value);
        applied++;
        continue;
      }

      // 그 외: 서버 값 우선
      localStorage.setItem(key, serverValue);
      applied++;
    }

    if (applied > 0) {
      console.log(`[sync-user-data] pull 완료: ${applied}개 키 반영`);
    }
    return applied > 0;
  } catch (err) {
    console.error("[sync-user-data] pull 오류:", err);
    return false;
  }
}

// ─── Full Sync (pull → push) ────────────────────────────────────────────────

/** 앱 시작 시 호출: 서버에서 pull → 로컬 변경사항 push */
export async function syncUserData(): Promise<void> {
  if (typeof window === "undefined") return;

  const userId = getUserId();
  if (!userId) return;

  // 1. 서버 데이터 pull
  await pullUserData();

  // 2. 로컬 데이터 push (서버에 없는 키 포함)
  await pushUserData();
}

// ─── Merge Helpers ──────────────────────────────────────────────────────────

function mergeCompleted(key: string, serverValue: unknown): void {
  try {
    const local = JSON.parse(localStorage.getItem(key) || "{}");
    const server = typeof serverValue === "object" && serverValue !== null
      ? serverValue as Record<string, unknown>
      : JSON.parse(String(serverValue));

    const localIds: string[] = (local as { completedDrillIds?: string[] }).completedDrillIds || [];
    const serverIds: string[] = (server as { completedDrillIds?: string[] }).completedDrillIds || [];
    const merged = [...new Set([...localIds, ...serverIds])];

    localStorage.setItem(key, JSON.stringify({
      ...local,
      ...server,
      completedDrillIds: merged,
    }));
  } catch {
    localStorage.setItem(key, JSON.stringify(serverValue));
  }
}

function mergeScheduled(key: string, serverValue: unknown): void {
  try {
    const local: string[] = JSON.parse(localStorage.getItem(key) || "[]");
    const server: string[] = Array.isArray(serverValue)
      ? serverValue as string[]
      : JSON.parse(String(serverValue));

    const merged = [...new Set([...local, ...server])];
    localStorage.setItem(key, JSON.stringify(merged));
  } catch {
    localStorage.setItem(key, JSON.stringify(serverValue));
  }
}

function mergeCustomDrills(serverValue: unknown): void {
  try {
    const local: Array<{ id: string }> = JSON.parse(
      localStorage.getItem("grit-on-custom-drills") || "[]"
    );
    const server: Array<{ id: string }> = Array.isArray(serverValue)
      ? serverValue as Array<{ id: string }>
      : JSON.parse(String(serverValue));

    // ID 기준 union (로컬 우선)
    const localIds = new Set(local.map((d) => d.id));
    const merged = [...local, ...server.filter((d) => !localIds.has(d.id))];
    localStorage.setItem("grit-on-custom-drills", JSON.stringify(merged));
  } catch {
    localStorage.setItem("grit-on-custom-drills", JSON.stringify(serverValue));
  }
}

// ─── 키 수집 ────────────────────────────────────────────────────────────────

/** 동기화 대상 localStorage 키 전체 수집 */
function collectAllSyncKeys(): string[] {
  const keys: string[] = [];

  // 단일 키
  for (const key of SINGLE_KEYS) {
    if (localStorage.getItem(key) !== null) {
      keys.push(key);
    }
  }

  // 날짜별 키 (최근 MAX_DATE_DAYS일)
  const today = new Date();
  for (let i = 0; i < MAX_DATE_DAYS; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    for (const prefix of DATE_PREFIXES) {
      const key = `${prefix}${dateStr}`;
      if (localStorage.getItem(key) !== null) {
        keys.push(key);
      }
    }
  }

  return keys;
}
