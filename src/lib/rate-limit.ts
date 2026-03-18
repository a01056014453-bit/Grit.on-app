interface RateLimitConfig {
  readonly interval: number; // window in ms
  readonly maxRequests: number;
}

interface RateLimitResult {
  readonly success: boolean;
  readonly remaining: number;
  readonly resetAt: number;
}

/**
 * 인메모리 슬라이딩 윈도우 Rate Limiter 팩토리.
 * Vercel 단일 인스턴스에서 충분하며, 다중 인스턴스 시 Upstash Redis로 교체 가능.
 */
export function createRateLimiter(config: RateLimitConfig) {
  const store = new Map<string, readonly number[]>();

  // 만료된 엔트리 주기적 정리 (5분마다)
  if (typeof globalThis !== "undefined") {
    const cleanup = () => {
      const now = Date.now();
      for (const [key, timestamps] of store.entries()) {
        const valid = timestamps.filter((t) => t > now - config.interval);
        if (valid.length === 0) {
          store.delete(key);
        } else {
          store.set(key, valid);
        }
      }
    };
    setInterval(cleanup, 5 * 60 * 1000).unref?.();
  }

  return function checkRateLimit(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - config.interval;
    const existing = store.get(key) ?? [];
    const validTimestamps = existing.filter((t) => t > windowStart);

    if (validTimestamps.length >= config.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetAt: validTimestamps[0] + config.interval,
      };
    }

    store.set(key, [...validTimestamps, now]);
    return {
      success: true,
      remaining: config.maxRequests - validTimestamps.length - 1,
      resetAt: now + config.interval,
    };
  };
}
