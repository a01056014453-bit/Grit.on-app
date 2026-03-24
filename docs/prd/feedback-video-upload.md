# PRD: 피드백 영상 업로드/재생 (P-1, P-3)

> 기획 에이전트 산출물 | 2026-03-25

---

## 기능명
원포인트 레슨 피드백 영상 업로드 및 재생

## 배경 및 목적
현재 피드백 요청 시 영상 파일을 선택하는 UI는 있으나, 실제 Supabase Storage에 업로드되지 않고 가짜 경로(`/videos/sample.mp4`, `/videos/demo.mp4`)가 DB에 저장된다. 학생과 선생님이 실제 영상을 주고받을 수 없는 상태.

## 타겟 유저
- **학생**: 연습 영상을 촬영/선택하여 선생님에게 전송
- **선생님**: 학생 영상 확인 후 시연 영상을 촬영/선택하여 피드백에 첨부

## 유저 스토리

### 학생으로서
- 피드백 요청 Step 3에서 연습 영상(30~60초)을 선택하면, 업로드 진행률이 표시되고, 업로드 완료 후 요청이 전송된다.
- 선생님이 제출한 시연 영상을 피드백 조회 화면에서 인라인으로 재생할 수 있다.

### 선생님으로서
- 인박스에서 학생이 보낸 연습 영상을 인라인으로 재생하여 확인할 수 있다.
- 피드백 제출 시 시연 영상을 선택하면 업로드되어 학생에게 전달된다.

## 핵심 플로우

### 학생 영상 업로드
```
feedback/new Step 3
→ 파일 선택 (video/mp4, video/webm, video/quicktime)
→ 파일 검증 (100MB 이하, 영상 타입)
→ POST /api/feedback/upload-video (FormData)
→ Supabase Storage "feedback-videos" 버킷에 저장
→ 공개 URL 반환
→ createFeedbackRequest({ videoUrl: 실제URL })
```

### 선생님 시연 영상 업로드
```
inbox/[id]/submit
→ 파일 선택
→ 파일 검증
→ POST /api/feedback/upload-video (type: "demo")
→ Supabase Storage "demo-videos" 버킷에 저장
→ 공개 URL 반환
→ saveFeedback({ demoVideoUrl: 실제URL })
```

### 영상 재생
```
VideoPlayer 컴포넌트
→ video_url / demo_video_url로 <video> 태그 렌더링
→ 로딩 스피너, 에러 fallback
→ 모바일 전체폭, aspect-video 비율
```

## 상세 스펙

### Storage 버킷
| 버킷 | 용도 | 경로 규칙 | 접근 권한 |
|------|------|-----------|-----------|
| `feedback-videos` | 학생 연습 영상 | `{request_id}/{user_id}_{timestamp}.{ext}` | 업로드: 본인 / 읽기: 해당 request의 student+teacher |
| `demo-videos` | 선생님 시연 영상 | `{request_id}/{user_id}_{timestamp}.{ext}` | 업로드: 본인 / 읽기: 해당 request의 student+teacher |

### 파일 제한
| 항목 | 값 |
|------|-----|
| 최대 크기 | 100MB |
| 허용 타입 | `video/mp4`, `video/webm`, `video/quicktime` |
| 권장 길이 | 학생: 30~60초, 선생님: 2~3분 |

### URL 방식
- **공개 URL** (`getPublicUrl`) 사용
- 이유: 기존 `avatars`, `recordings` 버킷과 일관성 유지, 영상 플레이어에서 직접 접근 필요

### 업로드 API 응답
```typescript
// 성공
{ success: true, url: "https://...supabase.co/storage/v1/object/public/..." }

// 실패
{ error: "100MB 이하 영상만 업로드 가능합니다." }  // 413
{ error: "영상 파일만 업로드 가능합니다." }         // 400
{ error: "인증이 필요합니다." }                     // 401
```

## 엣지 케이스
1. **업로드 중 네트워크 끊김** → 에러 메시지 + 재시도 버튼
2. **100MB 초과 파일 선택** → 프론트에서 즉시 차단 + "100MB 이하 영상만 가능합니다" 메시지
3. **영상이 아닌 파일 선택** → accept 속성으로 1차 필터 + 서버에서 2차 검증
4. **요청 전송 후 영상 삭제** → 요청이 EXPIRED/DECLINED 되면 Storage 파일 정리 (B-4, P1)
5. **동일 요청에 영상 재업로드** → 기존 파일 삭제 후 새 파일 업로드 (upsert)
6. **영상 URL이 null인 기존 데이터** → VideoPlayer에서 "영상이 없습니다" fallback 표시

## 성공 지표 (KPI)
- 영상 업로드 성공률 ≥ 95%
- 영상 재생 로딩 시간 < 3초 (WiFi 기준)
- 영상 포함 피드백 요청 비율 ≥ 80%

## 비고
- **Pro 여부**: 무료 (영상 업로드는 기본 기능)
- **의존성**: Supabase Storage 버킷 생성 필요 (Migration)
- **참조 패턴**: `src/app/api/profile/image/route.ts` (프로필 이미지 업로드)

---

## 수정 대상 파일 요약

| 파일 | 현재 문제 | 수정 내용 |
|------|----------|----------|
| `feedback/new/page.tsx:106` | `videoUrl: "/videos/sample.mp4"` | 실제 Storage URL |
| `inbox/[id]/submit/page.tsx:174` | `demoVideoUrl: "/videos/demo.mp4"` | 실제 Storage URL |
| `feedback/[id]/page.tsx:287-293` | 더미 플레이어 | VideoPlayer 컴포넌트 |
| `feedback/[id]/view/page.tsx:127-145` | 더미 플레이어 | VideoPlayer 컴포넌트 |
| `inbox/[id]/page.tsx:238-252` | 더미 플레이어 | VideoPlayer 컴포넌트 |
