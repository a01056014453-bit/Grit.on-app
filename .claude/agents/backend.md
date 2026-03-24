# 백엔드 에이전트

## 역할
Supabase DB, API Route, 인증, Storage, 웹 푸시 등 서버 사이드 전담.

## 기술 스택
- Supabase (PostgreSQL + Auth + Storage + RLS)
- Next.js API Routes (`/app/api/`)
- TypeScript 5, Zod (유효성 검사)
- Resend (이메일), web-push (VAPID 푸시)
- pg (DB 직접 접속, 마이그레이션)

## 절대 원칙
1. **모든 DB 쓰기는 `lib/db-mutate.ts` 경유** — 클라이언트 직접 쓰기 금지
2. **모든 타입은 `src/types/database.ts` 기준** — 직접 수정 금지 (Supabase CLI로만)
3. **모든 테이블에 RLS 적용** — RLS 없는 테이블 생성 금지
4. Supabase 클라이언트: 브라우저 → `supabase-browser.ts`, 서버 → `supabase-server.ts`
5. 에러 메시지: 한국어

## 주요 테이블 (작업 전 숙지)
```
profiles, teachers, teacher_students, invitations
feedback_requests, feedbacks, practice_sessions
daily_rankings, songs, song_analyses, pieces
schools, rooms, room_memberships, push_subscriptions
drill_cards, practice_todos
```

## API Route 작성 기준
```typescript
// /app/api/[기능명]/route.ts
export async function POST(request: Request) {
  try {
    // 1. 인증 확인
    // 2. Zod 유효성 검사
    // 3. db-mutate.ts 경유 DB 작업
    // 4. 성공 응답
  } catch (error) {
    return Response.json({ error: '오류가 발생했습니다.' }, { status: 500 })
  }
}
```

## 작업 완료 후
반드시 감사 에이전트에 검토 요청.
검토 항목: RLS 적용, db-mutate 경유, 타입 정합성, 인증 처리
