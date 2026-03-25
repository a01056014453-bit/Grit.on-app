/**
 * localStorage / IndexedDB 키 마이그레이션
 * grit-on-* / griton_* → sempre-*
 *
 * 기존 유저 데이터를 보존하면서 새 키로 이관.
 * 이미 마이그레이션된 경우 스킵.
 */

const MIGRATION_FLAG = "sempre-migration-v1";

/** localStorage 키 매핑 (구 → 신) */
const LS_KEY_MAP: Record<string, string> = {
  "grit-on-profile": "sempre-profile",
  "grit-on-logged-in": "sempre-logged-in",
  "grit-on-user-id": "sempre-user-id",
  "grit-on-daily-goal": "sempre-daily-goal",
  "grit-on-custom-drills": "sempre-custom-drills",
  "grit-on-hidden-drills": "sempre-hidden-drills",
  "grit-on-my-library": "sempre-my-library",
  "grit-on-routines": "sempre-routines",
  "grit-on-notifications": "sempre-notifications",
  "grit-on-active-drill": "sempre-active-drill",
  "grit-on-onboarding-complete": "sempre-onboarding-complete",
  "grit-on-teacher-verification": "sempre-teacher-verification",
  "grit-on-teacher-verifications-list": "sempre-teacher-verifications-list",
  "grit-on-teacher-students": "sempre-teacher-students",
  "grit-on-teacher-profile-data": "sempre-teacher-profile-data",
  "grit-on-pending-invite-token": "sempre-pending-invite-token",
  "griton_practice_todos": "sempre-practice-todos",
  "griton-analyzed-songs": "sempre-analyzed-songs",
};

/** 날짜 패턴 키 접두사 매핑 */
const LS_PREFIX_MAP: Record<string, string> = {
  "grit-on-completed-": "sempre-completed-",
  "grit-on-scheduled-": "sempre-scheduled-",
  "grit-on-drills-": "sempre-drills-",
  "grit-on-carryover-dismissed-": "sempre-carryover-dismissed-",
};

/** IndexedDB 이름 변경 */
const OLD_DB_NAME = "griton_db";
const NEW_DB_NAME = "sempre_db";

/**
 * 앱 시작 시 호출. 기존 데이터를 새 키로 마이그레이션.
 */
export function runStorageMigration(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATION_FLAG)) return; // 이미 완료

  try {
    // 1. 고정 키 마이그레이션
    for (const [oldKey, newKey] of Object.entries(LS_KEY_MAP)) {
      const value = localStorage.getItem(oldKey);
      if (value !== null && localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, value);
      }
    }

    // 2. 날짜 패턴 키 마이그레이션 (grit-on-completed-2026-03-25 등)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      for (const [oldPrefix, newPrefix] of Object.entries(LS_PREFIX_MAP)) {
        if (key.startsWith(oldPrefix)) {
          const suffix = key.slice(oldPrefix.length);
          const newKey = newPrefix + suffix;
          const value = localStorage.getItem(key);
          if (value !== null && localStorage.getItem(newKey) === null) {
            localStorage.setItem(newKey, value);
          }
        }
      }
    }

    // 3. sempre-user-profile 호환 (이미 있으면 스킵)
    if (!localStorage.getItem("sempre-user-profile")) {
      const oldProfile = localStorage.getItem("grit-on-profile");
      if (oldProfile) {
        localStorage.setItem("sempre-user-profile", oldProfile);
      }
    }

    localStorage.setItem(MIGRATION_FLAG, new Date().toISOString());
    console.log("[Migration] localStorage 마이그레이션 완료");
  } catch (err) {
    console.error("[Migration] 오류:", err);
  }
}

/** IndexedDB 이름 변경용 헬퍼 */
export { OLD_DB_NAME, NEW_DB_NAME };
