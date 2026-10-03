/** 첫 무료 출시는 연습·기록·AI 분석·랭킹에 집중한다. */
export const LESSONS_ENABLED = false;
const deferredPages = ['/teachers', '/teacher', '/rooms', '/feedback', '/help', '/inbox', '/invite', '/profile/teacher-register', '/profile/teacher-profile'];
const deferredApis = ['/api/teacher-verification', '/api/teachers', '/api/rooms', '/api/feedback', '/api/help-requests', '/api/help-proposals'];
export function isDeferredReleaseRoute(path: string): boolean {
  return !LESSONS_ENABLED && [...deferredPages, ...deferredApis].some(prefix => path === prefix || path.startsWith(prefix + '/'));
}
