import { createRateLimiter } from "./rate-limit";

const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

/** AI 곡 분석 — Free (하루 1회) */
export const songAnalysisV2Limiter = createRateLimiter({
  interval: ONE_DAY,
  maxRequests: 1,
});

/** AI 곡 분석 — Pro (하루 5회) */
export const songAnalysisProLimiter = createRateLimiter({
  interval: ONE_DAY,
  maxRequests: 5,
});

/** AI 곡 분석 v1 (하루 1회) */
export const songAnalysisV1Limiter = createRateLimiter({
  interval: ONE_DAY,
  maxRequests: 1,
});

/** AI 연습 분석 */
export const practiceAnalysisLimiter = createRateLimiter({
  interval: ONE_HOUR,
  maxRequests: 10,
});

/** PDF 변환 */
export const pdfConvertLimiter = createRateLimiter({
  interval: ONE_HOUR,
  maxRequests: 10,
});

/**
 * AI 곡 분석 rate limit 확인
 * @param identifier — userId 또는 IP
 * @param tier — "free" | "pro" (어드민은 호출하지 않음)
 */
export function checkRateLimit(identifier: string, tier: "free" | "pro" = "free"): boolean {
  const limiter = tier === "pro" ? songAnalysisProLimiter : songAnalysisV2Limiter;
  return limiter(identifier).success;
}

/** 도움 요청 생성 */
export const helpRequestLimiter = createRateLimiter({
  interval: TEN_MINUTES,
  maxRequests: 10,
});
