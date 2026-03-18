import type { Metadata } from "next";
import Link from "next/link";
import { Music } from "lucide-react";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <Music className="w-16 h-16 text-violet-300 mx-auto mb-4" />
        <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-lg text-gray-600 mb-2">
          페이지를 찾을 수 없습니다
        </p>
        <p className="text-sm text-gray-400 mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
