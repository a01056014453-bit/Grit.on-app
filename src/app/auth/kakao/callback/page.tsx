"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function KakaoCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-yellow-50 to-white">
        <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
      </div>
    }>
      <KakaoCallbackContent />
    </Suspense>
  );
}

function KakaoCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        setStatus("error");
        setErrorMsg(searchParams.get("error_description") || "카카오 인증이 취소되었습니다.");
        return;
      }

      if (!code) {
        setStatus("error");
        setErrorMsg("인가 코드가 없습니다.");
        return;
      }

      try {
        const redirectUri = `${window.location.origin}/auth/kakao/callback`;
        const res = await fetch("/api/auth/kakao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, redirectUri }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setErrorMsg(data.error || "인증에 실패했습니다.");
          return;
        }

        setStatus("success");

        // 부모 창에 결과 전달
        if (window.opener) {
          window.opener.postMessage(
            { type: "kakao-verify-result", success: true, user: data.user },
            window.location.origin,
          );
          setTimeout(() => window.close(), 1000);
        }
      } catch {
        setStatus("error");
        setErrorMsg("네트워크 오류가 발생했습니다.");
      }
    }

    handleCallback();
  }, [searchParams]);

  // 에러 시 부모에게 알림
  useEffect(() => {
    if (status === "error" && window.opener) {
      window.opener.postMessage(
        { type: "kakao-verify-result", success: false, error: errorMsg },
        window.location.origin,
      );
    }
  }, [status, errorMsg]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-yellow-50 to-white">
      <div className="text-center max-w-sm px-4">
        {status === "loading" && (
          <>
            <Loader2 className="w-10 h-10 text-yellow-500 animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">카카오 인증 처리 중...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-900">인증 완료</p>
            <p className="text-xs text-gray-400 mt-1">잠시 후 창이 닫힙니다.</p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <p className="text-sm font-semibold text-gray-900 mb-1">인증 실패</p>
            <p className="text-xs text-gray-500 mb-4">{errorMsg}</p>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-700"
            >
              닫기
            </button>
          </>
        )}
      </div>
    </div>
  );
}
