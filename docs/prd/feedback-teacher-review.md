# PRD: 선생님 평가/리뷰 (P-1)

> 기획 에이전트 산출물 | 2026-03-25

---

## 기능명
원포인트 레슨 후 선생님 평가

## 배경 및 목적
피드백 완료(COMPLETED) 후 학생이 선생님을 평가하는 기능이 UI만 존재하고(하드코딩 별 5개) 실제 동작하지 않는다. 평가 데이터는 선생님의 rating과 신뢰도에 직결되므로 구현 필요.

## 타겟 유저
- **학생**: 피드백 품질에 대한 평가를 남김
- **선생님**: 평균 평점이 프로필에 표시되어 신뢰도 향상
- **다른 학생**: 선생님 선택 시 평점/리뷰 참고

## 유저 스토리

### 학생으로서
- 피드백 확인 완료 후, 1~5점 별점과 선택적 한줄평을 남길 수 있다.
- 이미 리뷰를 남겼으면 수정 없이 읽기 전용으로 표시된다.

### 선생님으로서
- 내 프로필에 평균 평점과 리뷰 수가 표시된다.
- 개별 리뷰 내용은 선생님에게 직접 보이지 않는다 (v1).

## 핵심 플로우
```
feedback/[id]/view (COMPLETED 상태)
→ TeacherReviewForm 표시
→ 별점 터치 (1~5)
→ 한줄평 입력 (선택, 100자)
→ "평가 남기기" 버튼
→ POST createTeacherReview()
→ teachers 테이블 rating/review_count 갱신
→ "평가가 등록되었습니다" 토스트
→ 읽기 전용으로 전환
```

## 상세 스펙

### teacher_reviews 테이블
```sql
CREATE TABLE teacher_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES feedback_requests(id) UNIQUE,
  student_id UUID NOT NULL REFERENCES profiles(id),
  teacher_id UUID NOT NULL REFERENCES teachers(user_id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: 학생 본인만 INSERT, 본인 리뷰만 SELECT
```

### teachers 테이블 갱신
- `rating`: 평균 평점 (리뷰 생성/삭제 시 재계산)
- `review_count`: 리뷰 수

### UI 스펙
- 별점: 터치 가능한 Star 아이콘 5개, 선택 시 amber-400 fill
- 한줄평: textarea, placeholder "피드백이 어떠셨나요? (선택)", maxLength 100
- 버튼: "평가 남기기" (violet-500)
- 제출 후: 별점 읽기 전용 + "감사합니다!" 메시지

## 엣지 케이스
1. **중복 리뷰 방지** → `request_id UNIQUE` 제약 + 프론트에서 기존 리뷰 체크
2. **COMPLETED 아닌 상태에서 접근** → 리뷰 폼 숨김
3. **빈 별점 제출** → 별점 필수, 버튼 비활성화
4. **한줄평만 수정하고 싶을 때** → v1은 수정 불가, v2에서 고려

## 성공 지표 (KPI)
- 리뷰 작성률 ≥ 40% (완료된 피드백 대비)
- 평균 평점 ≥ 4.0 (서비스 품질 지표)

## 비고
- **Pro 여부**: 무료
- **의존성**: feedback_requests가 COMPLETED 상태여야 함
- **현재 코드**: `feedback/[id]/view/page.tsx:220-235` 하드코딩 별점 교체 필요
