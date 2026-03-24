# PRD: 크레딧 & 구독 수익 시스템 (P-4)

> 기획 에이전트 산출물 | 2026-03-25

---

## 기능명
셈프레 크레딧 & Pro 구독 단계적 수익 구조

## 배경 및 목적
무료 유저가 순연습시간 측정으로 서비스 가치를 체감한 후, 유료 기능(AI 리포트, 곡 분석, 원포인트 레슨)을 크레딧으로 이용하며, 반복 구매 시점에 Pro 구독으로 자연 전환되는 퍼널을 설계한다.

## 단계적 전환 퍼널

```
[Free 유저]
  순연습시간 측정 (핵심 무료 기능)
  ↓ 가치 체감
[크레딧 첫 구매]
  AI 리포트, 곡 분석, 원포인트 레슨 등 건별 결제
  1크레딧 = ₩1,000
  ↓ 반복 구매 (크레딧 소진 패턴 감지)
[Pro 구독 전환 유도]
  "매달 크레딧을 구매하고 계시네요. Pro로 전환하면 더 저렴해요!"
  ↓
[Pro 구독]
  ₩23,900/월, 매월 10크레딧 자동 지급
  + 추가 Pro 전용 혜택
```

## 타겟 유저
- **Free 유저**: 순연습 측정 무료 이용 → 크레딧 구매로 유료 기능 체험
- **크레딧 유저**: 건별 결제 → 반복 구매 시 Pro 구독 전환
- **Pro 유저**: 월 ₩23,900, 매월 10크레딧 자동 지급 + 전용 혜택

## 유저 스토리

### Free 유저로서
- 순연습시간 측정, 기본 통계를 무료로 이용한다.
- AI 곡 분석이나 원포인트 레슨을 이용하려면 크레딧 구매가 필요하다.
- 크레딧이 부족하면 충전 화면으로 안내된다.

### 크레딧 유저로서
- 1크레딧(₩1,000) 단위로 충전하여 원하는 기능을 건별로 이용한다.
- 3회 이상 크레딧을 구매하면 Pro 구독 전환 배너가 노출된다.

### Pro 유저로서
- 월 ₩23,900을 결제하면 매월 10크레딧이 자동 지급된다.
- 10크레딧 초과 사용 시 추가 크레딧을 구매한다.
- 구독 전용 혜택을 받는다.

## 크레딧 소비 단가

| 기능 | 소비 크레딧 | 원화 환산 |
|------|------------|----------|
| 원포인트 레슨 피드백 1건 | 2크레딧 | ₩2,000 |
| AI 곡 분석 1건 | 1크레딧 | ₩1,000 |
| AI 연습 리포트 1건 | 1크레딧 | ₩1,000 |

## 구독 플랜

| 플랜 | 가격 | 크레딧 | 비고 |
|------|------|--------|------|
| Free | ₩0 | 0 | 순연습 측정, 기본 통계 |
| 크레딧 충전 | 건별 | 1크레딧 = ₩1,000 | 원하는 만큼 구매 |
| Pro | ₩23,900/월 | 매월 10크레딧 지급 | 크레딧 단가 ₩2,390 → 41% 할인 효과 |

## 핵심 플로우

### 크레딧 라이프사이클
```
충전 (charge) — 직접 구매 또는 Pro 월간 지급
→ 잔액 증가 (profiles.credit_balance)
→ 기능 이용 시 홀드 (hold)
  → 잔액 차감, 홀드 금액 기록
  → payment_status: "held"
→ 완료 시 릴리스 (release)
  → 플랫폼 100% 수익 (v1)
  → payment_status: "released"
→ 거절/만료 시 환불 (refund)
  → 잔액 복원
  → payment_status: "refunded"
```

### Pro 구독 전환 유도 트리거
```
크레딧 구매 3회 이상
→ "Pro 구독으로 전환하면 매월 10크레딧 자동 지급! (41% 할인)"
→ 프로필 페이지, 크레딧 충전 화면, 크레딧 소진 시점에 배너 노출
```

## 상세 스펙

### credit_transactions 테이블
```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'charge',         -- 직접 충전
    'subscription',   -- Pro 월간 지급
    'hold',           -- 기능 이용 시 홀드
    'release',        -- 완료 확정
    'refund'          -- 거절/만료 환불
  )),
  reference_id UUID,          -- feedback_request_id 등
  description TEXT,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### profiles 테이블 추가 컬럼
```sql
ALTER TABLE profiles ADD COLUMN credit_balance INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN subscription_plan TEXT DEFAULT 'free'
  CHECK (subscription_plan IN ('free', 'pro'));
ALTER TABLE profiles ADD COLUMN subscription_started_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN total_credit_purchases INTEGER DEFAULT 0;
```

### 크레딧 단가
| 항목 | 값 |
|------|-----|
| 1크레딧 | ₩1,000 |
| 원포인트 레슨 피드백 1건 | 2크레딧 |
| AI 곡 분석 1건 | 1크레딧 |
| AI 연습 리포트 1건 | 1크레딧 |
| Pro 구독 | ₩23,900/월 (매월 10크레딧 지급) |
| 수익 배분 | 플랫폼 100% (v1) |

> v2에서 선생님 정산 비율 도입 예정

### feedback/new 수정
```
Step 1 (선생님 확인)
→ "필요 크레딧: 2" 표시
→ 잔액 부족 시 "크레딧 충전" 버튼

제출 시
→ creditAmount: 2 (하드코딩 0 → 동적)
→ paymentStatus: "pending" (하드코딩 "released" → 동적)
→ SENT 전환 시 paymentStatus: "held"
```

## 엣지 케이스
1. **잔액 부족 상태에서 이용 시도** → 프론트에서 차단 + "크레딧이 부족합니다" + 충전 안내
2. **동시 요청으로 잔액 초과 차감** → DB 트랜잭션 (SELECT FOR UPDATE)
3. **Pro 구독 해지 후 남은 크레딧** → 크레딧은 유지, 다음 달 지급만 중단
4. **Pro 월간 지급 시점** → 구독 시작일 기준 매월 동일일
5. **크레딧 충전 후 미사용 환불** → v2에서 환불 정책 정의
6. **Pro 유저가 10크레딧 초과 사용** → 추가 크레딧 구매 가능

## 성공 지표 (KPI)
- Free → 크레딧 첫 구매 전환율 ≥ 15%
- 크레딧 → Pro 구독 전환율 ≥ 20% (3회 이상 구매자 기준)
- Pro 구독 유지율 ≥ 80% (3개월)
- 크레딧 충전 ARPU ≥ ₩10,000/월

## 비고
- **Free/크레딧/Pro 3단계**: 크레딧은 Free·Pro 모두 사용 (Pro는 월 10크레딧 포함)
- **우선순위**: P2 (영상 업로드/만료 처리 후)
- **수익 배분**: v1은 플랫폼 100%, v2에서 선생님 정산 도입
- **의존성**: PG 연동 (토스페이먼츠/카카오페이 등) — v1은 관리자 수동 충전
- **현재 하드코딩**: `feedback/new/page.tsx:101-102` (`creditAmount: 0`, `paymentStatus: "released"`)
