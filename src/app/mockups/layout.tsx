import { notFound } from "next/navigation";

/**
 * /mockups 는 개발용 화면 클론(scripts/capture-mockups.mjs 스크린샷 소스).
 * 프로덕션에서는 404 — 실제 앱과 혼동되거나 크롤링되지 않도록 차단.
 */
export default function MockupsLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <>{children}</>;
}
