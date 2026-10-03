import { redirect } from "next/navigation";

// 무료 출시 기간에는 크레딧·Pro 화면을 노출하지 않는다 (docs/launch-checklist.md A1).
// 유료 전환(PG 연동) 시 이 파일을 지우면 page.tsx가 다시 보인다.
export default function CreditsLayout() {
  redirect("/");
}
