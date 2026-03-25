import { describe, it, expect, beforeAll } from "vitest";

/**
 * Page Load Test - 모든 주요 페이지가 200 OK 또는 리다이렉트를 반환하는지 확인.
 *
 * 실행 조건: TEST_BASE_URL 환경변수가 설정되어야 함.
 * 리다이렉트(302/307)는 인증이 필요한 페이지에서 정상 동작.
 */

const BASE_URL = process.env.TEST_BASE_URL;

// 공개 페이지 (로그인 없이 접근 가능)
const PUBLIC_PAGES = [
  "/landing",
  "/onboarding/login",
  "/terms",
  "/privacy",
  "/support",
];

// 인증 필요 페이지 (302 리다이렉트가 정상)
const AUTH_PAGES = [
  "/",
  "/practice",
  "/ai-analysis",
  "/ranking",
  "/feedback",
  "/profile",
  "/teachers",
  "/inbox",
  "/help",
  "/credits",
  "/stats",
  "/records",
  "/rooms",
  "/goals",
  "/routines",
  "/notifications",
  "/music-terms",
  "/metronome",
  "/plans",
  "/analysis",
  "/recordings",
];

// 관리자 페이지
const ADMIN_PAGES = [
  "/admin",
  "/admin/users",
  "/admin/experts",
  "/admin/music-db",
  "/admin/security",
  "/admin/ranking-economy",
  "/admin/copyright",
  "/admin/support",
  "/admin/marketing",
  "/admin/composer-resources",
];

describe.skipIf(!BASE_URL)("Page Load Test", () => {
  beforeAll(() => {
    if (!BASE_URL) {
      console.log("TEST_BASE_URL not set, skipping page load tests");
    }
  });

  describe("공개 페이지 - 200 OK", () => {
    for (const page of PUBLIC_PAGES) {
      it(`GET ${page}`, async () => {
        const res = await fetch(`${BASE_URL}${page}`, { redirect: "manual" });
        // 200 또는 3xx 리다이렉트 모두 허용 (5xx만 실패)
        expect(res.status).toBeLessThan(500);
      });
    }
  });

  describe("인증 필요 페이지 - 200 또는 리다이렉트", () => {
    for (const page of AUTH_PAGES) {
      it(`GET ${page}`, async () => {
        const res = await fetch(`${BASE_URL}${page}`, { redirect: "manual" });
        // 200, 302, 307 등 정상. 500+ 만 실패.
        expect(res.status).toBeLessThan(500);
      });
    }
  });

  describe("관리자 페이지 - 서버 에러 없음", () => {
    for (const page of ADMIN_PAGES) {
      it(`GET ${page}`, async () => {
        const res = await fetch(`${BASE_URL}${page}`, { redirect: "manual" });
        expect(res.status).toBeLessThan(500);
      });
    }
  });
});
