/**
 * localStorage 키 상수 정의
 * 하드코딩 방지를 위해 모든 localStorage 키를 여기서 관리
 */

export const STORAGE_KEYS = {
  /** 사용자가 AI 분석한 곡 목록 */
  USER_ANALYSES: "sempre-user-analyses",
  /** 사용자 곡 보관함 (composer__title 형태) */
  MY_LIBRARY: "grit-on-my-library",
  /** localStorage → DB 마이그레이션 완료 플래그 */
  MIGRATION_DONE: "sempre-analysis-migrated",
} as const;
