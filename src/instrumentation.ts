import * as Sentry from "@sentry/nextjs";

/**
 * Next.js instrumentation — 서버/엣지 런타임에서 Sentry 초기화.
 * @sentry/nextjs v10부터 sentry.server.config / sentry.edge.config는
 * 여기 register()에서 명시적으로 로드해야 실제로 실행된다.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

/** 서버 컴포넌트/라우트 핸들러 에러를 Sentry로 전송 */
export const onRequestError = Sentry.captureRequestError;
