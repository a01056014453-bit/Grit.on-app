/**
 * analysis-prompts-v3.ts — V3 분석 프롬프트 (연습 코칭 중심)
 *
 * V2와 달리 3단계만 사용:
 *   Phase A: Meta/Facts — 작품 식별 + 검증 사실 + work_type
 *   Phase B: Coaching — summary + technical_demands + musical_challenges + pitfalls + practice_plan
 *   Phase C: Guides + Recordings — movement_guides / collection_guides + recommended_recordings
 *
 * 원칙:
 *   - 백과사전 문장 금지
 *   - 범용 조언 금지 ("팔 무게를 사용하세요" 등)
 *   - 확인 안 된 마디 번호/화성/연도 추측 금지
 *   - 이 곡에 특화된 구체적 연습 조언만
 */

import {
  KOREAN_OUTPUT_RULE,
  HALLUCINATION_GUARD,
  getInstrumentAgent,
  getExpertRole,
  getFingeringRule,
} from "./analysis-prompts";

// ════════════════════════════════════════════════════════
// 작품 유형 판별 헬퍼
// ════════════════════════════════════════════════════════

const COLLECTION_KEYWORDS = [
  "pictures at an exhibition", "kinderszenen", "carnaval", "kreisleriana",
  "waldszenen", "papillons", "annees de pelerinage", "années de pèlerinage",
  "preludes op.28", "preludes op. 28", "well-tempered", "wohltemperierte",
  "songs without words", "lieder ohne worte", "moments musicaux",
  "consolations", "liebestraume", "liebesträume", "etudes-tableaux",
  "études-tableaux", "impromptus", "gymnopédies", "gymnopedies",
  "gnossiennes", "nocturnes op.9", "nocturnes op. 9", "préludes",
  "suite bergamasque", "children's corner", "miroirs", "gaspard de la nuit",
];

const MULTI_MOVEMENT_KEYWORDS = [
  "sonata", "sonatina", "concerto", "symphony", "trio", "quartet",
  "quintet", "sextet", "suite", "partita", "sonate", "konzert",
  "sinfonie", "symphonie",
];

const VARIATION_KEYWORDS = [
  "variation", "변주", "goldberg", "diabelli", "enigma",
  "symphonic etudes", "chaconne", "passacaglia", "theme and",
];

/** 모음곡/소품집 성격의 작품인지 제목으로 판별 */
export function isCollectionLikeWork(title: string): boolean {
  const lower = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return COLLECTION_KEYWORDS.some((k) => lower.includes(k));
}

/** 다악장 작품일 가능성이 높은지 판별 */
export function isMultiMovementLikely(title: string, referenceData?: string): boolean {
  const lower = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (MULTI_MOVEMENT_KEYWORDS.some((k) => lower.includes(k))) return true;
  if (referenceData) {
    const refLower = referenceData.toLowerCase();
    if (refLower.includes("movement") || refLower.includes("악장")) return true;
  }
  return false;
}

/** 변주곡인지 판별 */
export function isVariationSetLikely(title: string, referenceData?: string): boolean {
  const lower = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (VARIATION_KEYWORDS.some((k) => lower.includes(k))) return true;
  if (referenceData) {
    const refLower = referenceData.toLowerCase();
    if (refLower.includes("variation") || refLower.includes("변주")) return true;
  }
  return false;
}

/** work_type 힌트 문자열 생성 — 프롬프트에 주입용 */
export function inferWorkTypeHint(title: string, referenceData?: string): string {
  if (isVariationSetLikely(title, referenceData)) return "variation_set";
  if (isCollectionLikeWork(title)) return "suite_or_collection";
  if (isMultiMovementLikely(title, referenceData)) return "multi_movement_sonata";
  return "single_movement_piece";
}

// ════════════════════════════════════════════════════════
// Phase A: Meta / Facts
// ════════════════════════════════════════════════════════

export function createV3MetaPrompt(
  composer: string,
  title: string,
  instrument: string,
  referenceData: string,
  visionLockedBlock: string,
): string {
  const workTypeHint = inferWorkTypeHint(title, referenceData);

  return `
당신은 음악학 박사이자 음반 DB 전문가입니다.

작곡가: ${composer}
곡 제목: ${title}
악기: ${instrument}

${visionLockedBlock}

${referenceData ? `[🔍 레퍼런스 데이터]\n${referenceData.slice(0, 12000)}` : ""}

${KOREAN_OUTPUT_RULE}
${HALLUCINATION_GUARD}

[Phase A: 작품 메타 + 검증 사실]

작품 유형 힌트: "${workTypeHint}" (참고용 — 레퍼런스로 확인 후 수정 가능)

🚨 규칙:
- verified_facts는 최소 3개 이상 작성하라.
- work 객체에 적은 key(조성)와 opus_catalogue(작품번호)는 반드시 verified_facts에도 포함하라.
- 작곡 연도, 악장 수, 형식, 조성, 작품번호, 박자 등 기본 사실은 "Model-Inferred"라도 넣어라.
- 완전한 추측만 금지. 널리 알려진 사실은 source="Model-Inferred", confidence="medium"으로 포함 가능.
- source는 반드시 "IMSLP" | "MusicXML" | "Manual" | "Model-Inferred" 중 하나.
- confidence는 "high" | "medium" | "low".
- work_type은 실제 곡 구조에 맞게 판단하라.
- 제목에 "No.X"가 있으면 해당 곡 하나만.

JSON만 출력:
{
  "work": {
    "composer_display": "작곡가 전체 이름 (원어)",
    "composer_normalized": "소문자 영문 성 (예: beethoven)",
    "canonical_title": "정식 곡 제목 (원어)",
    "subtitle": "별칭 (없으면 빈 문자열)",
    "opus_catalogue": "작품번호 (예: Op. 57)",
    "work_number": null,
    "key": "조성 (예: F minor)",
    "source_work_id": null
  },
  "work_type": "single_movement_piece | multi_movement_sonata | suite_or_collection | variation_set | unknown",
  "verified_facts": [
    { "label": "조성", "value": "F minor", "source": "IMSLP", "confidence": "high" },
    { "label": "작곡 연도", "value": "1804-1805", "source": "IMSLP", "confidence": "high" }
  ]
}
  `.trim();
}

// ════════════════════════════════════════════════════════
// Few-shot 블록 — Phase B에 주입
// ════════════════════════════════════════════════════════

const FEW_SHOT_BLOCK = `
[✅ 이 수준으로 작성하라 — BAD vs GOOD 예시]

━━━ technical_demand 예시 ━━━
❌ BAD: { "title": "빠른 패시지의 명확성", "description": "손목을 이완하고 팔 무게를 균등하게 전달하세요." }
✅ GOOD: { "title": "알레그로 아르페지오 상행 시 양손 타이밍 불일치", "description": "오른손 아르페지오가 올라가는 동안 왼손 베이스가 반박자 늦게 따라오는 구조다.", "why_hard": "두 손이 서로 다른 방향으로 동시에 움직여야 하는데 뇌가 둘 중 하나에만 집중하기 때문이다.", "root_cause": "왼손을 리듬 중심으로 인식하는 것이 진짜 원인이다. 이 곡에서 왼손은 오른손의 메아리로 인식해야 한다." }

━━━ practice task 예시 ━━━
❌ BAD: { "instruction": "전체 곡을 연주하며 다이내믹을 점검한다" }
✅ GOOD: { "instruction": "서주 아르페지오 첫 8마디를 오른손만 떼어 최상성부가 혼자 노래하듯 들리는지 확인한다. 나머지 음은 받침이고 최상성부만 선율이다.", "target": "서주 첫 8마디", "minutes": 15 }

━━━ pitfall 예시 ━━━
❌ BAD: { "title": "리듬의 불안정", "cause": "메트로놈 사용 부족", "fix": "메트로놈을 활용하세요" }
❌ BAD: { "title": "빠른 부분에서의 손목 경직", "cause": "손목의 이완이 부족하여 팔의 무게가 제대로 전달되지 않는다", "fix": "손목을 의도적으로 이완시키고 연습한다" }
✅ GOOD: { "title": "빠른 부분 종료 직후 서정적 재진입 시 연결 끊김", "mistake": "빠른 구간이 끝나고 서정적 부분으로 넘어올 때 멈칫하거나 템포가 흔들린다.", "cause": "두 섹션의 성격이 너무 달라서 머릿속에서 다음 장면 준비를 하다가 연결이 끊긴다.", "fix": "전환 2마디 전부터 이미 다음 섹션의 호흡으로 들어가는 연습을 한다." }

━━━ 범용 vs 특화 예시 (가장 중요!) ━━━
❌ BAD (범용 — 아무 곡에나 붙일 수 있음):
  "손목 경직" / "성부 간 밸런스 부족" / "다이내믹 변화의 부정확성" / "음색의 다양성 부족"
  → 이런 내용은 쇼팽이든 베토벤이든 모차르트든 동일하게 적용 가능 → 가치 없음

✅ GOOD (특화 — 이 곡에서만 해당):
  크라이슬레리아나 1번: "D단조 옥타브 트레몰로가 2페이지 동안 지속되는데, 4번째 줄부터 왼손이 반음계 하행을 동시에 해야 함"
  크라이슬레리아나 2번: "B♭장조의 빠른 3도 병진행이 legato를 요구하는데, 중간에 갑자기 sfz가 끼어들어 legato 흐름이 깨지기 쉬움"
  → 이 곡의 이 부분에서만 나타나는 고유한 도전 → 가치 있음
`;

// ════════════════════════════════════════════════════════
// Phase B: Coaching Core
// ════════════════════════════════════════════════════════

export function createV3CoachingPrompt(
  composer: string,
  title: string,
  opus: string,
  instrument: string,
  workType: string,
  verifiedFactsJson: string,
  sourceBlock: string,
): string {
  const instrumentAgent = getInstrumentAgent(instrument);

  return `
당신은 ${getExpertRole(instrument)}

작곡가: ${composer}
곡 제목: ${title} ${opus}
악기: ${instrument}
작품 유형: ${workType}

[🎹 악기 에이전트]
${instrumentAgent}

[검증된 사실]
${verifiedFactsJson}

${KOREAN_OUTPUT_RULE}
${HALLUCINATION_GUARD}
🚨 ${getFingeringRule(instrument)}

${FEW_SHOT_BLOCK}

[Phase B: 연습 코칭 핵심]

🚨 절대 금지 — 이 규칙을 어기면 분석 실패로 간주한다:
- "베토벤은 고전과 낭만을 잇는 다리" 같은 백과사전 문장
- "팔 무게를 실어주세요", "프레이즈를 살려서", "감정을 담아서" 같은 범용 조언
- "메트로놈을 사용하세요", "느리게 연습하세요" 같은 일반론
- "손목 이완", "성부 간 밸런스", "다이내믹 조절" 같은 어떤 곡에나 적용되는 일반적 기교 문제
- "음색 변화를 위한 손가락과 팔의 조절" 같은 구체성 없는 원인/해결
- 모든 항목에 동일하거나 유사한 내용 반복
- 확인 안 된 마디 번호 생성

🚨 핵심 원칙 — 악장별/소품별 특화:
- 다악장 작품(소나타, 모음곡 등)은 반드시 각 악장/소품의 고유한 특징을 개별적으로 다뤄라.
- 예: 크라이슬레리아나 Op.16이면 8개 소품 각각의 고유한 기교적 도전을 별도로 서술.
- technical_demands의 각 항목은 "이 곡의 어느 구간에서, 어떤 음형/패턴 때문에" 어려운지 명시해야 한다.
- pitfalls도 "이 곡의 어느 부분에서 구체적으로 어떤 실수가 나오는지" 써야 한다.
- "빠른 패시지에서 손목이 경직" 같은 어떤 곡에나 해당하는 진술 금지. 이 곡의 어떤 패시지인지 특정하라.

✅ 반드시 지킬 것:
- technical_demands: why_hard + root_cause 필수 — 최소 4개, 각 항목이 곡의 다른 구간/특징을 다뤄야 함
- musical_challenges: 참고 연주자의 구체적 접근법 포함 — 최소 3개
- pitfalls: 이 곡 고유의 실수 + 구체적 동작 수준 해결법 — 최소 3개, 범용 조언 금지
- practice_plan: 각 task는 위 GOOD 예시 수준의 구체성, 악장/소품별로 구분하여 작성

[소스 레퍼런스 — 아래 정보를 활용하여 이 곡에 특화된 코칭을 생성하라]
${sourceBlock}

[practice_plan 규칙]
- 반드시 4주(week) 단위로 구성. phase 4개 = 1주차, 2주차, 3주차, 4주차.
- 각 주에 3~6개 task.
- 모음곡/소품집이면 모든 소품을 4주에 걸쳐 배분하라. 일부만 다루면 실패.
- "전체 곡 연주", "기초 연습", "느리게 연습" 같은 추상적 과제 금지.
- 각 task는 특정 소품/구간에서 무엇을 어떻게 연습하는지 구체적으로.

🚨 배열 최소 개수:
- technical_demands: 4개 이상
- musical_challenges: 3개 이상
- pitfalls: 3개 이상
- practice_plan.phases: 반드시 4개 (4주)

JSON만 출력:
{
  "summary": {
    "one_liner": "이 곡만의 정체성 한 줄",
    "context_for_practice": "3-5문장",
    "structural_overview": "3-5문장",
    "artistic_intent": "2-3문장"
  },
  "technical_demands": [
    { "title": "난관1", "description": "...", "why_hard": "...", "root_cause": "..." },
    { "title": "난관2", "description": "...", "why_hard": "...", "root_cause": "..." },
    { "title": "난관3", "description": "...", "why_hard": "...", "root_cause": "..." },
    { "title": "난관4", "description": "...", "why_hard": "...", "root_cause": "..." }
  ],
  "musical_challenges": [
    { "title": "과제1", "description": "...", "reference_interpretation": "..." },
    { "title": "과제2", "description": "...", "reference_interpretation": "..." },
    { "title": "과제3", "description": "..." }
  ],
  "pitfalls": [
    { "title": "함정1", "mistake": "...", "fix": "..." },
    { "title": "함정2", "mistake": "...", "fix": "..." },
    { "title": "함정3", "mistake": "...", "fix": "..." }
  ],
  "practice_plan": {
    "phases": [
      { "phase": 1, "title": "1주차", "goal": "...", "tasks": [
        { "instruction": "과제1", "target": "구간" },
        { "instruction": "과제2", "target": "구간" }
      ]},
      { "phase": 2, "title": "2주차", "goal": "...", "tasks": [
        { "instruction": "과제1", "target": "구간" },
        { "instruction": "과제2", "target": "구간" }
      ]},
      { "phase": 3, "title": "3주차", "goal": "...", "tasks": [
        { "instruction": "과제1", "target": "구간" },
        { "instruction": "과제2", "target": "구간" }
      ]},
      { "phase": 4, "title": "4주차", "goal": "...", "tasks": [
        { "instruction": "과제1", "target": "구간" },
        { "instruction": "과제2", "target": "구간" }
      ]}
    ]
  }
}
  `.trim();
}

// ════════════════════════════════════════════════════════
// Phase C: Guides + Recordings
// ════════════════════════════════════════════════════════

export function createV3GuidesPrompt(
  composer: string,
  title: string,
  opus: string,
  instrument: string,
  workType: string,
  verifiedFactsJson: string,
  sourceBlock: string,
): string {
  const instrumentAgent = getInstrumentAgent(instrument);

  // work_type별 가이드 지시
  let guideInstruction: string;
  if (workType === "multi_movement_sonata") {
    guideInstruction = `
[movement_guides 작성]
각 악장에 대해:
- number, title (템포 지시어), key, form, character (1문장)
- technical_demands: 이 악장 고유의 기술 과제 2-3개
- musical_challenges: 해석 과제 1-2개
- pitfalls: 이 악장에서 흔한 실수 1-2개
- connection_to_next: 다음 악장과의 연결 (attacca 등)

🚨 각 악장의 내용이 서로 달라야 한다. 동일 내용 반복 금지.`;
  } else if (workType === "suite_or_collection") {
    guideInstruction = `
[collection_guides 작성]
각 곡/소품에 대해:
- number, title, key, character (1문장)
- technical_focus: 핵심 기술 과제 1-3개 (문자열 배열)
- practice_note: 연습 시 주의점 1-2문장

🚨 각 곡의 고유한 성격을 반영하라. 동일한 조언 반복 금지.`;
  } else if (workType === "variation_set") {
    guideInstruction = `
[collection_guides 작성 — 변주곡]
주제 + 각 변주에 대해:
- number (0=주제, 1=변주1, ...), title ("주제" 또는 "변주 1"), key, character
- technical_focus: 이 변주의 핵심 기교 1-3개
- practice_note: 연습 시 주의점 1-2문장`;
  } else {
    guideInstruction = `
단악장 소품이므로 movement_guides와 collection_guides 모두 빈 배열.`;
  }

  return `
당신은 ${getExpertRole(instrument)}

작곡가: ${composer}
곡 제목: ${title} ${opus}
악기: ${instrument}
작품 유형: ${workType}

[🎹 악기 에이전트]
${instrumentAgent}

[검증된 사실]
${verifiedFactsJson}

[소스 레퍼런스]
${sourceBlock}

${KOREAN_OUTPUT_RULE}
${HALLUCINATION_GUARD}
🚨 ${getFingeringRule(instrument)}

[Phase C: 가이드 + 추천 음반]

${guideInstruction}

[recommended_recordings 규칙]
- 최소 4명, 최대 7명
- 한국인 연주자 1명 이상 포함
- 역사적 명연 + 현대 연주 + 독특한 해석 다양하게
- why: 이 녹음을 왜 들어야 하는지 1-2문장
- listen_for: 이 녹음에서 주목할 포인트 (선택)
- year, label은 확인된 것만. 추측 금지.
- youtube_url은 빈 문자열 (후처리에서 채움)

JSON만 출력:
{
  "movement_guides": [
    {
      "number": 1,
      "title": "Allegro assai",
      "key": "F minor",
      "form": "소나타 형식",
      "character": "성격 1문장",
      "technical_demands": [{ "category": "...", "title": "...", "description": "...", "severity": "..." }],
      "musical_challenges": [{ "title": "...", "description": "..." }],
      "pitfalls": [{ "title": "...", "mistake": "...", "cause": "...", "fix": "..." }],
      "connection_to_next": ""
    }
  ],
  "collection_guides": [
    {
      "number": 1,
      "title": "곡 제목",
      "key": "조성",
      "character": "성격 1문장",
      "technical_focus": ["기술 과제 1", "기술 과제 2"],
      "practice_note": "연습 주의점"
    }
  ],
  "recommended_recordings": [
    {
      "artist": "연주자명",
      "year": "2003",
      "label": "Deutsche Grammophon",
      "why": "추천 이유 1-2문장",
      "youtube_url": "",
      "listen_for": "주목 포인트 (선택)"
    }
  ]
}
  `.trim();
}

// ════════════════════════════════════════════════════════
// Phase 0: Context Search (Perplexity용 맥락 쿼리)
// ════════════════════════════════════════════════════════

export function createContextSearchPrompt(composer: string, title: string): string {
  return `I need rich historical and musicological context for this classical piano work:

Composer: ${composer}
Title: ${title}

Search Grove Dictionary, RILM, musicology journals, composer biographies, and Urtext preface texts for:

1. BIOGRAPHICAL CONTEXT AT TIME OF COMPOSITION
- Where was ${composer} living when this was written? (specific city, place)
- What was happening in their personal life? (relationships, health, finances, losses)
- What triggered or inspired this specific work? (a person, place, event, letter, diary entry)
- Any documented statements by the composer about this work?

2. HISTORICAL & CULTURAL CONTEXT
- What was happening in music history at this moment?
- Which contemporaries influenced or were influenced by this work?
- Did this work directly influence later composers? (be specific: who, which work)
- How was it received at premiere/publication?

3. MUSICOLOGICAL SIGNIFICANCE
- What makes this work structurally or harmonically innovative for its time?
- What do major scholars say? (cite specific scholars if possible)
- How does this work fit within the composer's larger output?

4. PERFORMANCE HISTORY
- Notable premieres or dedications
- Famous performances or recordings that shaped its interpretation

Be specific. Avoid generic statements like "a masterpiece of Romantic piano music."
If ${composer} kept diaries or wrote letters about this work, quote or paraphrase directly.`;
}
