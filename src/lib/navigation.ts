import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * WebView 안전한 뒤로가기
 *
 * WebView에서 처음 페이지로 직접 진입하면 history가 비어있어
 * router.back()이 빈 화면을 보여줍니다.
 * history.length <= 1이면 홈으로 이동합니다.
 */
export function safeBack(router: AppRouterInstance): void {
  if (typeof window !== "undefined" && window.history.length <= 1) {
    router.push("/");
  } else {
    router.back();
  }
}
