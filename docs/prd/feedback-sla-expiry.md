# PRD: SLA 만료 자동 처리 (P-1, P-2)

> 기획 에이전트 산출물 | 2026-03-25

---

## 기능명
피드백 요청 SLA 만료 자동 전환

## 배경 및 목적
현재 SLA 마감 시간(수락 12시간, 피드백 48시간)이 DB에 저장되고 프론트에서 카운트다운이 표시되지만, 마감 시간이 지나도 상태가 자동으로 EXPIRED로 전환되지 않는다. 수동 확인 없이는 만료된 요청이 계속 "전송됨" 또는 "수락됨" 상태로 남아있다.

## 타겟 유저
- **학생**: 선생님이 응답하지 않은 요청이 자동 만료되어 다른 선생님에게 재요청 가능
- **선생님**: 수락 후 기한 내 미제출 시 자동 만료 처리

## 유저 스토리

### 학생으로서
- 선생님이 12시간 내 수락하지 않으면, 자동으로 "만료됨" 상태가 되고 알림을 받는다.
- 만료된 요청에서 "다른 선생님에게 요청" 버튼을 눌러 재요청할 수 있다.
- 크레딧이 차감되었다면 자동 환불된다.

### 선생님으로서
- 수락 후 48시간 내 피드백을 제출하지 않으면 자동 만료된다.
- 만료 1시간 전에 리마인더 푸시 알림을 받는다.

## 핵심 플로우

### 자동 만료 처리 (Vercel Cron, 5분 간격)
```
/api/feedback/expire-check (GET, CRON_SECRET 검증)
    ↓
1. SENT 상태 + accept_deadline < now → EXPIRED
   - payment_status → "refunded"
   - 학생에게 푸시: "피드백 요청이 만료되었습니다"
    ↓
2. ACCEPTED 상태 + submit_deadline < now → EXPIRED
   - payment_status → "refunded"
   - 학생에게 푸시: "선생님이 기한 내 피드백을 제출하지 않았습니다"
   - 선생님에게 푸시: "피드백 제출 기한이 만료되었습니다"
```

### 프론트 만료 감지
```
feedback/[id]/page.tsx
→ useEffect로 마감 시간 모니터링
→ 마감 도달 시 서버에서 최신 상태 재조회
→ EXPIRED면 만료 UI 표시
```

## 상태 머신 (갱신)

```
DRAFT
  ↓ (학생이 전송)
SENT ──────────────────→ EXPIRED (accept_deadline 12h 초과)
  ↓ (선생님 수락)          ↓
  ↓                    payment_status → "refunded"
  ↓ (선생님 거절)
  ↓──→ DECLINED
  ↓    payment_status → "refunded"
ACCEPTED ──────────────→ EXPIRED (submit_deadline 48h 초과)
  ↓ (선생님 제출)          ↓
  ↓                    payment_status → "refunded"
SUBMITTED
  ↓ (학생 확인)
COMPLETED
  payment_status → "released"
```

## 상세 스펙

### Vercel Cron 설정
```json
// vercel.json
{
  "crons": [{
    "path": "/api/feedback/expire-check",
    "schedule": "*/5 * * * *"
  }]
}
```

### API 보안
- `CRON_SECRET` 환경변수로 인증
- `Authorization: Bearer ${CRON_SECRET}` 헤더 검증
- 외부 임의 호출 차단

### 만료 처리 쿼리
```sql
-- SENT 상태, 수락 마감 초과
UPDATE feedback_requests
SET status = 'EXPIRED', payment_status = 'refunded', updated_at = now()
WHERE status = 'SENT' AND accept_deadline < now();

-- ACCEPTED 상태, 제출 마감 초과
UPDATE feedback_requests
SET status = 'EXPIRED', payment_status = 'refunded', updated_at = now()
WHERE status = 'ACCEPTED' AND submit_deadline < now();
```

### 리마인더 알림 (P1, 향후)
- 마감 1시간 전 리마인더 푸시
- SENT 상태: 선생님에게 "수락 마감 1시간 전입니다"
- ACCEPTED 상태: 선생님에게 "피드백 제출 마감 1시간 전입니다"

## 엣지 케이스
1. **Cron 실행 지연** → 5분 간격이므로 최대 5분 지연 허용
2. **만료 직전 수락/제출** → DB 트랜잭션으로 race condition 방지 (status 확인 후 업데이트)
3. **Cron 중복 실행** → 멱등성 보장 (이미 EXPIRED인 건은 skip)
4. **Vercel 무료 플랜 Cron 제한** → Hobby: 1일 1회, Pro: 무제한 → Pro 필요

## 성공 지표 (KPI)
- 만료 처리 정확도 100% (마감 초과 건이 SENT/ACCEPTED로 남아있지 않음)
- 만료→알림 지연 < 10분

## 비고
- **Pro 여부**: 무료 (SLA 관리는 기본 기능)
- **의존성**: Vercel Pro 플랜 (Cron 5분 간격), CRON_SECRET 환경변수
- **대안**: Supabase pg_cron (서버리스 대안이나 푸시 알림 발송이 어려움)
