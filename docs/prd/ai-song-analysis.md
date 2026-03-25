# PRD: AI 곡 분석 시스템

> 기획 에이전트 산출물 | 2026-03-25

---

## 기능명
AI 기반 클래식 음악 곡 분석 (V2 파이프라인)

## 배경 및 목적
학생이 연습하는 곡의 작곡 배경, 구조, 화성, 연습법을 AI가 분석하여 제공. 선생님 레슨 없이도 곡에 대한 깊은 이해와 체계적 연습이 가능하도록 지원.

## 타겟 유저
- **학생**: 연습 곡의 배경, 구조, 연습법을 알고 싶은 입시생/재학생
- **선생님**: 학생에게 곡 분석 자료를 공유하여 레슨 보조

---

## 핵심 플로우

```
학생: /ai-analysis/new
→ 작곡가 + 곡 제목 입력 (+ 선택: 악보 PDF/MusicXML)
→ POST /api/analyze-song-v2
→ [캐시 확인] 같은 곡 있으면 즉시 반환
→ [캐시 미스] 5단계 AI 파이프라인 실행 (1~3분)
→ song_analyses 테이블에 저장
→ /ai-analysis/[id] 상세 페이지로 이동
→ 재방문 시 DB에서 즉시 조회 (API 재호출 없음)
```

---

## V2 파이프라인 구조

```
Phase 0: 팩트 수집 (병렬)
  ├─ 학술자료 DB 검색
  └─ Perplexity 웹 검색 (선택)
    ↓
Phase 1: 메타 검증 + 곡 개요
  ├─ 조성, 작품번호, 난이도 확정
  └─ Perplexity 교차검증
    ↓
Phase 2: 인문학적 배경
  ├─ 작곡가 생애 + 타임라인
  ├─ 시대적 배경
  └─ 곡 특징 (형식, 기법, 극적 흐름)
    ↓
Phase 3: 구조/화성 분석
  ├─ sections (구간별 조성, 박자, 분위기, 설명)
  └─ harmony_table (핵심 전조점 3-5행)
    ↓
Phase 4a: 연습법 + 추천 연주
  ├─ technique_summary (4카테고리)
  ├─ section_guides (섹션별 4문장 가이드)
  └─ recommended_performances_v2 (5-7명)
    ↓
Phase 4b: 4주 연습 루틴
  └─ 28일 × 5가지 작업 카테고리
    ↓
YouTube URL 검색 (Perplexity)
```

---

## 악기별 분기

| 악기 | 전문가 역할 | 연습 키워드 |
|------|------------|------------|
| piano | 피아노 교수법 전문가 | 손목/팔/터치/페달링 |
| violin | 바이올린 전문가 | 보잉/포지션/비브라토/더블스탑 |
| cello | 첼로 전문가 | 엄지 포지션/보잉/음색 |
| flute | 플루트 전문가 | 앙부쉬어/호흡/텅잉 |
| clarinet | 클라리넷 전문가 | 앙부쉬어/음역 전환/레지스터 |
| guitar | 클래식 기타 전문가 | 아포얀도/티란도/바레/하모닉스 |
| vocal | 성악 전문가 | 파사조/호흡/딕션/공명 |

API 요청 시 `instrument` 파라미터로 전문가 역할이 자동 전환됨. 미전달 시 기본값 `piano`.

---

## 멀티 프로바이더 폴백

```
1순위: OpenAI GPT-4o
  ├─ 성공 → 결과 반환
  ├─ 401/quota → 즉시 Claude 폴백
  └─ 429 → 3회 재시도 → 실패 시 Claude 폴백
    ↓
2순위: Anthropic Claude Sonnet
  ├─ 성공 → 결과 반환
  └─ 실패 → 에러 반환
```

환경변수: `OPENAI_API_KEY` + `ANTHROPIC_API_KEY` (둘 다 설정 권장)

---

## 캐시 시스템

| 항목 | 내용 |
|------|------|
| 저장소 | `song_analyses` 테이블 (Supabase) |
| 캐시 키 | composer + title (ilike 매칭, 대소문자 무시) |
| 부분 매칭 | 작곡가 성(last name) + 곡명 부분 일치도 히트 |
| 캐시 히트 | 즉시 반환 (1-2초), `cached: true` 플래그 |
| 캐시 미스 | AI 파이프라인 실행 (1-3분), 완료 후 자동 저장 |
| 강제 갱신 | `forceRefresh: true` 파라미터 |

---

## 환각 방지 (Hallucination Guard)

| 방어선 | 내용 |
|--------|------|
| **프롬프트** | "확인되지 않은 수치 생성 금지", "모르면 빈 문자열" |
| **출처 우선순위** | 학술자료 DB > Perplexity > 모델 지식 |
| **교차검증** | Phase 1 meta를 Perplexity로 재검증 |
| **런타임 필터** | "확인 필요" 문구 자동 제거 |
| **화성 분석** | "확신할 수 없는 분석은 하지 마라" 명시 |

---

## JSON 파싱 복구 (3단계)

```
1차: 직접 JSON.parse()
    ↓ 실패
2차: 잘린 JSON 자동 복구 (브래킷 닫기)
    ↓ 실패
3차: GPT로 재포맷 (최후 수단)
    ↓ 실패
빈 객체 반환 (에러 전파하지 않음)
```

---

## 분석 결과 구조 (V2)

```typescript
{
  meta: { composer, title, opus, key, difficulty_level }
  content: {
    // V1 호환
    composer_background, historical_context, work_background,
    structure_analysis, technique_tips, musical_interpretation,
    recommended_performances,
    // V2 확장
    song_overview,
    composer_life: { summary, timeline, at_composition },
    historical_background: { era_characteristics, contemporary_composers, musical_movement },
    song_characteristics: { composition_background, form_and_structure, technique, literary_dramatic, conclusion },
    structure_analysis_v2: { sections[], harmony_table[] },
    practice_method: { technique_summary, section_guides, weekly_routine },
    recommended_performances_v2[]
  }
  schema_version: 2
}
```

---

## 토큰 예산

| Phase | max_tokens | 모델 | 비고 |
|-------|-----------|------|------|
| 0 (레퍼런스) | 4,096 | Perplexity sonar-pro | 선택 |
| 1 (메타) | 4,096 | GPT-4o | |
| 2 (배경) | 8,192 | GPT-4o | temp 0.3 |
| 3 (구조/화성) | 12,000 | GPT-4o | temp 0.1 |
| 4a (연습법) | 8,192 | GPT-4o | temp 0.3 |
| 4b (4주 루틴) | 12,000 | GPT-4o | temp 0.3 |
| **1회 분석 비용** | **~$0.50-0.80** | | 입출력 합산 |

---

## 크레딧 소비
- AI 곡 분석 1건 = **1크레딧** (₩1,000)
- 캐시 히트 = **0크레딧** (무료)
- Free 유저 제한: 활동 보상 크레딧으로만 이용

---

## 엣지 케이스

1. **같은 곡 재분석** → 캐시 히트, API 비호출, 0크레딧
2. **작곡가 이름 변형** (Chopin vs Frédéric Chopin) → 부분 매칭으로 캐시 히트
3. **No.X 포함 제목** → 해당 곡만 분석 (모음집 전체 분석 방지)
4. **대규모 작품** (골드베르크 변주곡 등) → isLargeWork() 감지
5. **MusicXML 60,000자 초과** → 자동 truncate + 후반부 누락 가능
6. **OpenAI 키 만료** → Claude Sonnet 자동 폴백
7. **Rate limit (429)** → 3회 재시도 (15초/30초/45초) → 폴백
8. **JSON 잘림** → 3단계 복구 (직접→브래킷닫기→GPT재포맷)

---

## 수정 이력 (2026-03-25)

| 변경 | 내용 |
|------|------|
| 악기별 분기 추가 | 7개 악기별 전문가 역할 자동 전환 |
| 멀티 폴백 | OpenAI → Claude Sonnet 자동 전환 |
| 환각 방지 강화 | "추측 금지", "확인된 것만" 명시 |
| harmony_table 축소 | 20-40행 → 3-5행 핵심만 |
| section_guides 축소 | 6문장 → 4문장 |
| JSON 복구 | 잘린 JSON 자동 브래킷 닫기 추가 |

---

## 관련 파일

| 파일 | 역할 |
|------|------|
| `src/app/api/analyze-song-v2/route.ts` | V2 파이프라인 (1136줄) |
| `src/lib/analysis-prompts.ts` | Phase 0~4b 프롬프트 (730줄) |
| `src/lib/song-analysis-db.ts` | 캐시 저장/조회 |
| `src/app/(app)/ai-analysis/new/page.tsx` | 새 분석 요청 페이지 |
| `src/app/(app)/ai-analysis/[id]/page.tsx` | 분석 결과 상세 |
| `src/types/song-analysis.ts` | SongAnalysis 타입 |
