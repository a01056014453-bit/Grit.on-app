import { createRateLimiter } from "./rate-limit";

const ONE_HOUR = 60 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

/** AI 곡 분석 v2 (GPT-4o + Perplexity — 고비용) */
export const songAnalysisV2Limiter = createRateLimiter({
  interval: ONE_HOUR,
  maxRequests: 5,
});

/** AI 곡 분석 v1 */
export const songAnalysisV1Limiter = createRateLimiter({
  interval: ONE_HOUR,
  maxRequests: 10,
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

/** 도움 요청 생성 */
export const helpRequestLimiter = createRateLimiter({
  interval: TEN_MINUTES,
  maxRequests: 10,
});
