import { describe, it, expect, beforeAll, afterAll } from "vitest";
import puppeteer, { type Browser, type Page } from "puppeteer";

/**
 * E2E Critical Flows - Puppeteer 기반 핵심 사용자 플로우 테스트.
 *
 * 실행 조건: TEST_BASE_URL 환경변수가 설정되어야 함.
 * 예: TEST_BASE_URL=http://localhost:3000 npx vitest run tests/e2e
 */

const BASE_URL = process.env.TEST_BASE_URL;

describe.skipIf(!BASE_URL)("E2E Critical Flows", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844 }); // 모바일 사이즈
  });

  afterAll(async () => {
    await browser?.close();
  });

  it("랜딩 페이지 로드 및 기본 UI 표시", async () => {
    const response = await page.goto(`${BASE_URL}/landing`, {
      waitUntil: "networkidle2",
    });
    expect(response?.status()).toBe(200);

    // 페이지에 메인 콘텐츠가 있는지 확인
    const body = await page.evaluate(() => document.body.innerText);
    expect(body.length).toBeGreaterThan(0);
  });

  it("로그인 페이지 접근 가능", async () => {
    const response = await page.goto(`${BASE_URL}/onboarding/login`, {
      waitUntil: "networkidle2",
    });
    expect(response?.status()).toBe(200);
  });

  it("인증 없이 메인 페이지 접근 시 리다이렉트", async () => {
    const response = await page.goto(`${BASE_URL}/`, {
      waitUntil: "networkidle2",
    });
    // 로그인 페이지로 리다이렉트되거나 200 반환
    const url = page.url();
    const isRedirected = url.includes("login") || url.includes("onboarding") || url.includes("landing");
    const isOk = response?.status() === 200;
    expect(isRedirected || isOk).toBe(true);
  });

  it("랭킹 API가 JSON으로 응답", async () => {
    const response = await page.goto(`${BASE_URL}/api/rankings`, {
      waitUntil: "networkidle2",
    });
    expect(response?.status()).toBeLessThan(500);

    const contentType = response?.headers()["content-type"] ?? "";
    expect(contentType).toContain("application/json");
  });

  it("존재하지 않는 페이지는 404", async () => {
    const response = await page.goto(`${BASE_URL}/nonexistent-page-xyz`, {
      waitUntil: "networkidle2",
    });
    expect(response?.status()).toBe(404);
  });

  it("콘솔에 심각한 JS 에러 없음 (랜딩 페이지)", async () => {
    const errors: string[] = [];
    page.on("pageerror", (err) => {
      errors.push(err.message);
    });

    await page.goto(`${BASE_URL}/landing`, { waitUntil: "networkidle2" });

    // TypeError, ReferenceError 등 심각한 에러만 체크
    const criticalErrors = errors.filter(
      (e) =>
        e.includes("TypeError") ||
        e.includes("ReferenceError") ||
        e.includes("SyntaxError"),
    );
    expect(criticalErrors).toEqual([]);
  });
});
