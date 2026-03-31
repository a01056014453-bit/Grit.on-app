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
- 확인된 사실만 verified_facts에 넣어라. 추측 금지.
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
// Phase B: Coaching Core
// ════════════════════════════════════════════════════════

export function createV3CoachingPrompt(
  composer: string,
  title: string,
  opus: string,
  instrument: string,
  workType: string,
  verifiedFactsJson: string,
  referenceData: string,
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

[레퍼런스]
${referenceData.slice(0, 10000)}

${KOREAN_OUTPUT_RULE}
${HALLUCINATION_GUARD}
🚨 ${getFingeringRule(instrument)}

[Phase B: 연습 코칭 핵심]

🚨 절대 금지:
- "베토벤은 고전과 낭만을 잇는 다리" 같은 백과사전 문장
- "팔 무게를 실어주세요", "프레이즈를 살려서" 같은 범용 조언
- 모든 항목에 동일한 내용 반복
- 확인 안 된 마디 번호 생성
- 다른 곡에도 적용되는 일반론

✅ 이 곡에서만 유효한 구체적 내용만:
- summary: 이 곡을 연습하는 사람이 알아야 할 핵심 맥락
- technical_demands: 이 곡 고유의 기술적 난관 (카테고리 + 구체적 위치 + 설명)
- musical_challenges: 해석적으로 어려운 지점
- pitfalls: 이 곡에서 흔히 빠지는 실수 (원인 + 해결 포함)
- practice_plan: 단계별 연습 과제 (각 task는 구체적 동작 수준)

[practice_plan 규칙]
- 3~6개 phase
- 각 phase에 3~5개 task
- task의 instruction은 "mm.1-8 왼손만 느리게, 각 음의 무게감 확인" 수준의 구체성
- 마디 번호는 확인된 경우만. 불확실하면 "1악장 제시부" 같은 구간명 사용.
- 추상적 과제 금지: "스케일 연습", "테크닉 훈련" 금지

[technical_demands category 목록]
tone_production | articulation | dynamic_control | tempo_rhythm | passage_work | polyphony | pedaling | physical_endurance | memorization | other

[severity]
critical | major | moderate

JSON만 출력:
{
  "summary": {
    "one_liner": "이 곡의 핵심 성격 한 줄 (예: 격렬한 정열과 비극적 긴장의 소나타)",
    "context_for_practice": "연습 전 알아야 할 배경 3-5문장",
    "structural_overview": "전체 구조 흐름 3-5문장",
    "artistic_intent": "작곡가 의도 / 음악적 핵심 2-3문장"
  },
  "technical_demands": [
    {
      "category": "passage_work",
      "title": "과제 제목",
      "description": "구체적 설명 2-3문장",
      "location": "확인된 위치만 (없으면 생략)",
      "severity": "critical"
    }
  ],
  "musical_challenges": [
    {
      "title": "과제 제목",
      "description": "구체적 설명 2-4문장",
      "location": "확인된 위치만",
      "reference_interpretation": "참고 연주자 접근법 (선택)"
    }
  ],
  "pitfalls": [
    {
      "title": "함정 제목",
      "mistake": "어떤 실수인지 1-2문장",
      "cause": "왜 발생하는지 1-2문장",
      "fix": "해결법 1-2문장",
      "location": "위치 (선택)"
    }
  ],
  "practice_plan": {
    "estimated_duration": "4-6주",
    "recommended_order": "연습 순서 권장 (선택)",
    "phases": [
      {
        "phase": 1,
        "title": "단계 이름",
        "goal": "이 단계 목표 1-2문장",
        "duration": "3-5일",
        "tasks": [
          {
            "instruction": "구체적 동작 수준 과제",
            "target": "mm.1-8 또는 구간명",
            "minutes": 15,
            "related_demand": "passage_work"
          }
        ]
      }
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
  referenceData: string,
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

[레퍼런스]
${referenceData.slice(0, 8000)}

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
