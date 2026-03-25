import { describe, it, expect, beforeAll } from "vitest";

/**
 * API Health Check - 모든 GET 엔드포인트가 서버 에러 없이 응답하는지 확인.
 *
 * 실행 조건: TEST_BASE_URL 환경변수가 설정되어야 함.
 * 예: TEST_BASE_URL=http://localhost:3000 npx vitest run tests/api
 *
 * 인증이 필요한 엔드포인트는 401을 반환하는 것이 정상.
 * 500 이상의 서버 에러만 실패로 간주.
 */

const BASE_URL = process.env.TEST_BASE_URL;

// 인증 없이 GET 가능한 엔드포인트
const PUBLIC_GET_ENDPOINTS = [
  "/api/rankings",
  "/api/credits/balance",
  "/api/rewards/history",
  "/api/analyses",
  "/api/help-requests",
];

// 인증이 필요하여 401이 정상인 엔드포인트
const AUTH_REQUIRED_ENDPOINTS = [
  "/api/credits/balance",
  "/api/profile",
  "/api/teacher/students",
  "/api/teacher/invitations",
];

// POST 엔드포인트 (body 없이 보내면 400 또는 401이 정상)
const POST_ENDPOINTS = [
  "/api/credits/charge",
  "/api/push/subscribe",
  "/api/push/send",
  "/api/feedback/upload-video",
  "/api/sync-practice",
  "/api/db/query",
  "/api/db/mutate",
];

// Cron 엔드포인트 (인증 없이 호출하면 401이 정상)
const CRON_ENDPOINTS = [
  "/api/feedback/expire-check",
  "/api/cron/daily-rewards",
  "/api/cron/weekly-rewards",
  "/api/cron/morning-brief",
  "/api/cron/auto-approve-teachers",
];

describe.skipIf(!BASE_URL)("API Health Check", () => {
  beforeAll(() => {
    if (!BASE_URL) {
      console.log("TEST_BASE_URL not set, skipping API tests");
    }
  });

  describe("GET 엔드포인트 - 서버 에러 없음", () => {
    for (const endpoint of PUBLIC_GET_ENDPOINTS) {
      it(`GET ${endpoint} - 5xx 아님`, async () => {
        const res = await fetch(`${BASE_URL}${endpoint}`);
        expect(res.status).toBeLessThan(500);
      });
    }
  });

  describe("인증 필요 엔드포인트 - 401 또는 정상 응답", () => {
    for (const endpoint of AUTH_REQUIRED_ENDPOINTS) {
      it(`GET ${endpoint} - 401 또는 200`, async () => {
        const res = await fetch(`${BASE_URL}${endpoint}`);
        expect([200, 401, 403]).toContain(res.status);
      });
    }
  });

  describe("POST 엔드포인트 - 서버 에러 없음", () => {
    for (const endpoint of POST_ENDPOINTS) {
      it(`POST ${endpoint} - 5xx 아님`, async () => {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        expect(res.status).toBeLessThan(500);
      });
    }
  });

  describe("Cron 엔드포인트 - 인증 없이 401", () => {
    for (const endpoint of CRON_ENDPOINTS) {
      it(`GET ${endpoint} - 401 (인증 없음)`, async () => {
        const res = await fetch(`${BASE_URL}${endpoint}`);
        expect(res.status).toBe(401);
      });
    }
  });
});
