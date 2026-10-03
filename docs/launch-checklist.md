# 출시 체크리스트 (2026-09-16 감사 기준)

> 코드·문서·운영 설정을 감사해 **결정할 것 / 결정 없이 고칠 것 / 코드 밖에서 확인할 것** 세 묶음으로 나눔.
> 항목이 끝나면 여기서 지우거나 ✅ 표시. 출시 준비 PR: #1 (`fix/local-dev-setup`, 머지 보류 중).

## 결정 (사용자)

| # | 항목 | 상태 |
|---|---|---|
| A1 | 무료 출시 스토리 — 크레딧 경제가 장식 상태(구매 불가, 가입 크레딧 0, 잔액 검사 없음)인데 `/credits` 가격표와 support FAQ("모든 기능 무료")가 충돌 | ✅ **완전 무료로 숨김** 결정 (2026-09-16). `fix/launch-batch2`에서 반영 — `/credits`는 `credits/layout.tsx`가 `/`로 리다이렉트, 피드백 요청 화면 크레딧 칩 제거·`credit_amount` 0 |
| A2 | 선생님 정책 — v1 정산(플랫폼 100% vs 70/30), AI 자동승인(신뢰도 0.85) 허용 여부, 담당 승인자, Kakao 실명인증 필수 여부 | 미결 |
| A3 | 피드백 요청 화면 얼굴 블러 토글이 기본 켜짐인데 실제 처리 없음 | ✅ **토글 제거 + "준비 중"** 결정. `fix/launch-batch2`에서 반영 (`feedback/new`, `help/new`, `rooms/[id]/upload`). 이후 요청은 `face_blurred=false`로 저장 |
| A4 | 법무 — 약관·개인정보처리방침에 상호·대표자·사업자등록번호·주소 없음. 방침이 미사용 PostHog·Gemini 명시, 실사용 Sentry 미기재. 만 14세 동의 미저장. 탈퇴 시 영상 버킷 잔존. 유저 영상 public URL. 크레딧 환불 정책 미정 | 미결. 단 PostHog·Gemini 삭제와 Sentry 추가는 `fix/launch-batch2`에서 정정 (Sentry 보유기간 "90일 이내"는 실제 플랜 설정과 대조 필요) |
| A5 | Vercel Pro — 피드백 만료 크론이 PRD는 5분, 실제 하루 1회(Hobby). 12h/48h SLA 유지 시 Pro 필요, 아니면 SLA 문구 변경 | 미결 |
| A6 | 기능 범위 — 저장 안 되는 언어 설정·알림 on/off·연습 계획, 링크 없는 완성 페이지 8개(`/help /credits /plans /goals /metronome /analysis /songs /records`), 룸 "DRM·워터마크" 과장 문구, 랭킹 동점·`grit_score` 정의 | 미결 |
| A7 | 출시일·목표(기록된 "2026-06"은 지남), 파트너 Wonart·Leanup·Piu 의무, seed할 학교 목록, Play 스토어(TWA 설정 전무) 여부 | 미결 |

## 수정 (결정 불필요)

| # | 항목 | 상태 |
|---|---|---|
| B1 | `api/teacher-verification` 미인증 요청이 body.userId로 타인 명의 신청 생성 + 클라이언트 id로 타인 행 덮어쓰기 | ✅ `fix/launch-security` |
| B2 | `/mockups` 프로덕션 무인증 노출 | ✅ `fix/launch-security` (layout에서 404) |
| B3 | 크론 4개 fail-open (`daily-report`, `check-sla`, `pre-analyze`, `analyze-designated`) | ✅ `fix/launch-security` |
| B4 | `expire-check` 만료 푸시가 Bearer 없이 호출돼 401. `check-sla`의 중복 만료 로직 | ✅ `fix/launch-security` |
| B5 | 만료 시 `payment_status=refunded`만 찍고 잔액·거래 기록 없음 | A1 결정으로 크레딧 숨김 → 우선순위 하락 |
| B6 | 프로필 설정 비올라 → `"violin"` 매핑(악기별 랭킹 오염). 원인은 DB enum `instrument_type`에 값이 7개뿐이라는 것 — 트럼펫 등 목록 밖 악기는 `"piano"`로 저장됨 | **DB 선행 필요**. `supabase/migrations/20261004_extend_instrument_type.sql` 초안 작성(미적용). 적용 → 타입 재생성 → 매핑 3곳 수정 순 |
| B7 | 룸 목록 `deadline` null → `Invalid Date` | ✅ `fix/launch-batch2` (목록은 칩 미표시, 상세는 "미정") |
| B8 | 룸 영상 클라 500MB / 서버 50MB / Vercel 바디 ~4.5MB 불일치, 연습 오디오 용량 상한 없음 | 룸 영상 ✅ `fix/launch-batch2` — signed URL 직접 업로드로 전환, 50MB 통일, `member_count` 초기화 버그 수정. **남음**: `help/new`·`help/[id]/submit`은 여전히 서버 경유 업로드(`/api/feedback/upload-video`, 4.5MB 초과 시 실패 — `/help`는 링크 없는 페이지라 A6 종속), 연습 오디오 상한 |
| B9 | `griton-app.vercel.app` 폴백 3곳(`auto-approve-teachers`, `dev-report`, `morning-brief`) | ✅ `fix/launch-batch2` |
| B10 | 곡 분석 UI 경로(start→v2 내부 호출)에 한도가 전혀 없었음 | ✅ `fix/launch-security` — start에 DB 기반 일일 한도. OpenAI·Perplexity 스펜드 캡은 C |
| B11 | `/admin` 미들웨어 `ADMIN_USER_IDS` 비면 fail-open | ✅ `fix/launch-security` |
| B12 | `/api/help-requests` 리미터 미적용, `/api/analytics/track` 무제한 insert | ✅ `fix/launch-security` |
| B13 | `agreed_age` 저장, 탈퇴 시 영상 버킷·이벤트 로그 삭제 확장 | A4 종속 |
| B14 | 문서 정합 — `AGENTS.md` 구 도메인·구 오디오 상수, README·DEVELOPER_GUIDE·`docs/prd/ai-song-analysis.md`의 "Claude로 곡 분석", 가격 3종(₩23,900/15,900/9,900 — `planner.md`, `slack/prompts.ts`, `ABOUT.md`) | 대기 |
| B15 | dead code — `lib/admin/mock-data.ts`, `seedMockSessions`, `NewOnboardingFlow`, 룸 업로드 모달 2개, `NEXT_PUBLIC_GA_ID`, `resend` 의존성, `lib/reward-notify.ts`(호출처 없음, `/credits` 링크 포함) | 대기 |

## 확인 (코드 밖, 사용자만 가능)

- [ ] Vercel 프로덕션 env: `CRON_SECRET`·`INTERNAL_CALL_SECRET`(16자 이상), `ADMIN_USER_IDS`, `NEXT_PUBLIC_APP_URL`, OAuth 키, VAPID
- [ ] Supabase 프로덕션 DB: `teachers`·`schools`·`designated_pieces` 실데이터 유무(리포에 seed 없음). `schools.year/deadline` 2026 입시 stale 여부
- [ ] Storage 버킷 5개(`recordings`, `feedback-videos`, `demo-videos`, `room-videos`, `avatars`) 생성·용량·MIME·RLS. 영상 3개 버킷은 signed URL 직접 업로드라 **버킷의 file size limit(50MB)·allowed MIME이 유일한 서버 측 상한**
- [ ] Google/Kakao/Apple 콘솔에 `https://withsempre.com` 리다이렉트 등록
- [ ] `support@`·`contact@withsempre.com` 메일함 실존·모니터링
- [ ] OpenAI·Perplexity 스펜드 리밋
