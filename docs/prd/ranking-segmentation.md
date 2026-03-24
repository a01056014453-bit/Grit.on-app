# PRD: 랭킹 세분화 — 학교별 · 전공(악기)별

> 기획 에이전트 산출물 | 2026-03-25

---

## 현재 랭킹 (AS-IS)

- **기준**: `net_practice_time`(순연습시간) 내림차순
- **대상**: 전체 유저 (필터 없음)
- **데이터**: `daily_rankings` 테이블, KST 기준 일별
- **UI**: 포디움(1~3위) + 리스트(4위~) + 내 순위 카드
- **실시간**: 1초마다 타이머 업데이트, 60초마다 서버 재조회

---

## 랭킹 카테고리 (TO-BE)

| 카테고리 | 필터 기준 | 설명 |
|----------|-----------|------|
| **전체** | 없음 | 현행 유지 |
| **악기별** | `profiles.instrument` | 같은 악기 유저끼리 |
| **학교별** | `room_memberships → rooms → schools` | 같은 입시룸 유저끼리 |
| **학교+악기** | 위 두 가지 교차 | 서울대 피아노과 등 |

---

## 유저 스토리

### 입시생으로서
> "서울대 입시룸에 가입한 피아노 지원자 20명 중 내가 7등이구나"

### 피아노 전공생으로서
> "전체 피아노 전공생 150명 중 상위 12%"

### 선생님으로서
> "내 학생이 같은 학교 지원자 대비 연습량이 어떤지 확인"

---

## DB 변경

**스키마 변경 없음** — 기존 `room_memberships → rooms → schools` 경로 활용

```sql
-- 인덱스만 추가 (성능)
CREATE INDEX idx_profiles_instrument ON profiles(instrument);
CREATE INDEX idx_room_memberships_user_id ON room_memberships(user_id);
CREATE INDEX idx_rooms_school_id ON rooms(school_id);
```

---

## API 변경

`GET /api/rankings` 파라미터 확장:

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `schoolId` | string (optional) | 학교별 필터 |
| `instrument` | InstrumentType (optional) | 악기별 필터 |

### 쿼리 전략

**악기별**: profiles JOIN 후 `.eq("instrument", val)` — 단순

**학교별**: 2단계 쿼리
1. `room_memberships + rooms`에서 해당 학교 `user_id[]` 추출
2. `daily_rankings`에서 `.in("user_id", ids)` 필터

---

## UI 설계

### 필터 칩
```
[전체]  [학교 ▾]  [악기 ▾]
```

선택 시:
```
[전체]  [서울대 ✕]  [피아노 ✕]
```

### 학교 선택 바텀시트
- 가입한 입시룸의 학교만 표시
- 각 학교의 활성 유저 수 표시
- 미가입 시 "입시룸 둘러보기" CTA

### 악기 선택 바텀시트
- 7개 악기 + 각 악기의 유저 수
- 유저 0인 악기는 비활성

### MyStatusCard 변경
```
📊 서울대 피아노 12명 중 3위 (상위 25%)
```

---

## 엣지 케이스

| 상황 | 처리 |
|------|------|
| 입시룸 미가입 | "입시룸에 가입하면 학교별 순위를 확인할 수 있어요" |
| 필터 결과 5명 미만 | "인원이 적어요. 전체 랭킹도 확인해 보세요" 배너 |
| 3명 미만 | 포디움 대신 리스트만 표시 |
| 여러 학교 가입 | 드롭다운에 모든 학교 표시, 각 학교 랭킹에 모두 포함 |

---

## 구현 순서

| Phase | 내용 | 공수 |
|-------|------|------|
| 1 | 악기별 랭킹 (JOIN 불필요, 가장 쉬움) | 0.5일 |
| 2 | 학교별 랭킹 (room_memberships JOIN) | 1일 |
| 3 | 교차 필터 (학교+악기) | 0.5일 |
| 4 | 홈 위젯 확장 ("내 학교 랭킹") | 1일 |

---

## 수정 대상 파일

| 파일 | 변경 |
|------|------|
| `src/app/api/rankings/route.ts` | 필터 파라미터 + 조건부 쿼리 |
| `src/lib/ranking-queries.ts` | filter 옵션 추가 |
| `src/types/ranking.ts` | RankingFilter 타입 |
| `src/app/(app)/ranking/page.tsx` | 필터 UI + 상태 관리 |
| `src/components/app/RankingFilterBar.tsx` (신규) | 필터 칩 + 바텀시트 |
