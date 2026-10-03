import { NextResponse } from "next/server";

/**
 * POST /api/credits/charge
 * 크레딧 충전 (PG 결제 완료 후 호출)
 *
 * ⚠️ 현재 비활성화 상태 (무료 출시 정책)
 * PG(토스페이먼츠) 연동 전까지는 어떤 요청도 크레딧을 적립하지 않는다.
 * 과거 구현은 결제 검증 없이 크레딧을 즉시 적립하는 보안 구멍이 있어 제거됨.
 *
 * 재활성화 시 필요한 것:
 * 1. 토스페이먼츠 결제 검증 (paymentKey/orderId/amount 서버 검증)
 * 2. 주문(orders) 테이블 + 멱등성 보장 (orderId 중복 적립 방지)
 * 3. 적립은 lib/queries/credits.ts의 chargeCredits 경유
 */
export async function POST() {
  return NextResponse.json(
    { error: "결제 시스템을 준비 중입니다. 곧 이용 가능합니다." },
    { status: 501 },
  );
}
