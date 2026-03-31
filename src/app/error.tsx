"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import * as Sentry from "@sentry/nextjs";
import { trackEvent } from "@/lib/analytics";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
    Sentry.captureException(error);
    trackEvent({
      event: "error_occurred",
      properties: {
        page: typeof window !== "undefined" ? window.location.pathname : "unknown",
        error_message: error.message,
        error_digest: error.digest,
      },
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <AlertTriangle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          문제가 발생했습니다
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          일시적인 오류입니다. 잠시 후 다시 시도해주세요.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="px-6 py-3 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors"
          >
            다시 시도
          </button>
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            홈으로 돌아가기
          </Link>
          <a
            href="mailto:support@withsempre.com"
            className="text-xs text-gray-300 hover:text-violet-500 transition-colors"
          >
            문제가 계속되면 support@withsempre.com
          </a>
        </div>
      </div>
    </div>
  );
}
