"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <AlertTriangle className="w-12 h-12 text-amber-400 mb-4" />
      <h2 className="text-lg font-bold text-gray-900 mb-2">오류가 발생했습니다</h2>
      <p className="text-sm text-gray-500 mb-1">{error.message || "알 수 없는 오류"}</p>
      <p className="text-xs text-gray-400 mb-6">어드민 페이지에서 문제가 발생했습니다.</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700"
        >
          다시 시도
        </button>
        <Link
          href="/admin"
          className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
        >
          어드민 홈으로
        </Link>
      </div>
    </div>
  );
}
