/**
 * AI 곡 분석 프롬프트 모듈
 * Phase 0 (레퍼런스 검색) + 4-Phase 파이프라인 + 기존 호환 프롬프트
 */

// ── 공통 자기 검증 프로토콜 ──

const SELF_VERIFICATION_PROTOCOL = `
[자기 검증 프로토콜]
응답을 최종 출력하기 전에 반드시 아래 3단계 검증을 수행하십시오:
1차: 작품번호(Opus), 작곡 연도, 초연 데이터가 문헌과 일치하는가?
2차: 마디 번호와 조성이 Urtext(원전판) 기반인가?
3차: 한국어 출력이 완전한가? (영어 문장이 섞여 있지 않은가?)

검증 실패 시: 불확실한 항목은 "문헌 확인 필요"로 표기하되, 구조와 내용 자체는 반드시 완성할 것.
`;

const KOREAN_OUTPUT_RULE = `🚨 **모든 출력은 반드시 한국어로 작성하십시오.** (고유명사, 음악 용어만 원어 병기 가능)`;

// ── Phase 0: 레퍼런스 데이터 검색 (Perplexity용) ──

export function createReferenceSearchPrompt(composer: string, title: string): string {
  return `I need accurate, verified musical reference data for this classical piano piece:

Composer: ${composer}
Title: ${title}

Search IMSLP, Wikipedia, Henle Verlag, and music theory databases for the following FACTUAL information.

**Required output format — fill in every field for EVERY movement:**

PIECE INFO:
- Full title: [original language title]
- Opus/Catalogue: [e.g., Op.10 No.3]
- Overall key: [e.g., D major]
- Year composed: [e.g., 1798]
- Number of movements: [e.g., 4]
- Henle difficulty: [e.g., Level 7, if available]

MOVEMENT 1:
- Tempo marking: [e.g., Presto]
- Key: [e.g., D major]
- Time signature: [e.g., 2/2]
- Form: [e.g., Sonata-allegro form]
- Number of measures: [e.g., 353]
- Notable modulations: [e.g., to A major in second theme, to B minor in development]

MOVEMENT 2:
- Tempo marking: [e.g., Largo e mesto]
- Key: [e.g., D minor]
- Time signature: [e.g., 6/8]
- Form: [e.g., Sonata form]
- Number of measures: [e.g., 87]
- Notable modulations: [e.g., to B-flat major, to F major]

MOVEMENT 3:
(same fields)

MOVEMENT 4:
(same fields)

(Continue for all movements.)

🚨 CRITICAL RULES:
- You MUST provide key, time signature, and tempo marking for EVERY movement — these are the most important fields.
- Search specifically for "[composer] [piece] analysis", "[piece] IMSLP", and "[piece] score" to find structural info.
- For time signatures: these are standard musical knowledge for well-known classical repertoire. If you know the typical time signature (e.g., a Presto sonata movement is commonly in 2/2, a Menuetto is in 3/4), PROVIDE IT directly. Do NOT write "not specified" or "verify via score" — just give the value.
- For measure counts: provide approximate counts if exact counts aren't available. Write "approx. 350" rather than "not found".
- Do NOT hedge or add "verify via IMSLP" caveats. Give the best available answer directly.
- Do NOT skip any movement.`;
}

// ── Phase 1: 데이터 검증 + 곡 개요 ──

export function createPhase1Prompt(composer: string, title: string, musicXml?: string, referenceData?: string): string {
  const xmlSection = musicXml
    ? `\n\n[MusicXML 데이터]\n아래 MusicXML 데이터에서 조성, 박자, 템포, 마디 수를 직접 읽어 사용하십시오.\n\`\`\`xml\n${musicXml.substring(0, 30000)}\n\`\`\``
    : '';

  const refSection = referenceData
    ? `\n\n[🔍 웹 검색 레퍼런스 데이터 — 이 데이터를 1차 출처로 사용하십시오]\n${referenceData}\n\n🚨 위 레퍼런스의 조성, 작품번호, 작곡시기 등 팩트 데이터를 반드시 따르십시오.\n레퍼런스와 상충하는 정보를 생성하지 마십시오.`
    : '\n\n🚨 확실하지 않은 정보(조성, 작품번호, 작곡시기)는 추측하지 말고 "문헌 확인 필요"로 표기하십시오.';

  return `당신은 세계적인 음악학자(Musicologist)입니다.

작곡가: ${composer}
곡 제목: ${title}
${xmlSection}
${refSection}

${KOREAN_OUTPUT_RULE}

**[Phase 1 임무: 데이터 검증 + 곡의 개요]**

이 곡의 기본 정보를 학술적으로 검증하고, 곡의 개요를 작성하십시오.

**검증 항목:**
- 작곡가 이름의 정확한 표기 (원어)
- 작품번호(Opus/Catalogue), 조성, 작곡 시기
- 난이도 평가 근거

${SELF_VERIFICATION_PROTOCOL}

JSON만 출력:
{
  "meta": {
    "composer": "작곡가 이름 (원어 표기)",
    "title": "곡 제목 (원어)",
    "opus": "작품번호 (예: Op.23, BWV 846)",
    "key": "조성 (예: G minor, C major)",
    "difficulty_level": "Beginner/Intermediate/Advanced/Virtuoso"
  },
  "song_overview": {
    "title_original": "원어 정식 제목",
    "title_korean": "한국어 제목 (있다면)",
    "composition_period": "작곡 시기 (예: 1831-1835년)",
    "tempo_marking": "템포 지시어 (예: Largo - Moderato - Presto con fuoco)",
    "genre": "장르 (예: 발라드, 소나타, 에튀드)",
    "form": "형식 (예: 소나타 형식 변형, 자유로운 서사 구조)",
    "musical_features": ["한국어로 핵심 음악적 특징 3-5개"]
  }
}

JSON만 출력하십시오.`;
}

// ── Phase 2: 인문학적 배경 (생애, 시대, 곡 특징) ──

export function createPhase2Prompt(composer: string, title: string, opus: string): string {
  return `당신은 세계적인 음악학자(Musicologist)이자 음악사 전문가입니다.

작곡가: ${composer}
곡 제목: ${title}
작품번호: ${opus}

${KOREAN_OUTPUT_RULE}

**[Phase 2 임무: 인문학적 배경 — 작곡가 생애, 시대적 배경, 곡의 특징]**

**참조 문헌:**
- Grove Dictionary of Music and Musicians
- New Grove Online, RILM
- 각 작곡가별 전문 연구서 (예: Chopin → Jim Samson, Eigeldinger / Schumann → John Daverio)
- Urtext 원전판 서문 (Henle, Bärenreiter, Wiener)

${SELF_VERIFICATION_PROTOCOL}

JSON만 출력:
{
  "composer_life": {
    "summary": "한국어 8-10문장 — 작곡가 생애 전체 요약 (출생, 교육, 활동기, 주요 작품, 말년)",
    "timeline": [
      { "period": "시기 (예: 1810-1825, 유년기~청년기)", "description": "한국어 2-3문장 설명" },
      { "period": "시기", "description": "설명" },
      { "period": "시기", "description": "설명" },
      { "period": "시기", "description": "설명" },
      { "period": "시기", "description": "설명" }
    ],
    "at_composition": "한국어 5-8문장 — 이 곡을 작곡하던 당시 작곡가의 상황, 생활, 건강, 인간관계, 예술적 지향점을 구체적으로"
  },
  "historical_background": {
    "era_characteristics": "한국어 5-8문장 — 작곡 당시 시대의 음악적/문화적 특징",
    "contemporary_composers": "한국어 3-5문장 — 동시대 활동한 주요 작곡가들과의 관계/영향",
    "musical_movement": "한국어 3-5문장 — 해당 시기의 음악 사조 (낭만주의, 인상주의 등)와 이 곡의 위치"
  },
  "song_characteristics": {
    "composition_background": "한국어 5-8문장 — 작곡 동기, 헌정, 초연, 출판 경위",
    "form_and_structure": "한국어 5-8문장 — 형식적 특징과 구조의 독창성",
    "technique": "한국어 5-8문장 — 이 곡이 요구하는 핵심 피아노 기교",
    "literary_dramatic": "한국어 3-5문장 — 문학적/극적 측면 (시적 영감, 표제적 요소 등)",
    "conclusion": "한국어 3-5문장 — 이 곡의 음악사적 의의와 현대적 가치"
  }
}

JSON만 출력하십시오.`;
}

// ── Phase 3: 구조/화성 분석 ──

export function createPhase3Prompt(composer: string, title: string, opus: string, musicXml?: string, referenceData?: string): string {
  const xmlSection = musicXml
    ? `\n\n[MusicXML 데이터]\n아래 MusicXML에서 정확한 마디 번호, 조성, 박자, 음형을 직접 읽어 사용하십시오.\n\`\`\`xml\n${musicXml.substring(0, 60000)}\n\`\`\``
    : '';

  const refSection = referenceData
    ? `\n\n[🔍 웹 검색 레퍼런스 데이터 — 이 데이터가 1차 출처입니다. 반드시 사용하십시오.]\n${referenceData}\n\n🚨 절대 규칙:\n1. 레퍼런스에 명시된 조성(key), 박자(time signature), 템포(tempo marking), 마디 수를 **그대로** 사용하십시오.\n2. 레퍼런스에 "Key: D major, Time signature: 2/2"라고 되어 있으면, key_signature는 "D major", time_signature는 "2/2"여야 합니다.\n3. 레퍼런스에 "typically 6/8" 또는 "approx. 87 measures" 등이 있으면, 그 값을 그대로 사용하십시오 (6/8, mm. 1-87).\n4. "문헌 확인 필요"는 레퍼런스에 해당 정보가 전혀 없을 때만 사용하십시오.\n5. 레퍼런스와 상충하는 정보를 절대 생성하지 마십시오.`
    : '\n\n🚨 확실하지 않은 조성, 박자, 마디 번호는 추측하지 말고 "문헌 확인 필요"로 표기하십시오.';

  return `당신은 세계적인 음악 이론가(Music Theorist)이자 화성학 전문가입니다.

작곡가: ${composer}
곡 제목: ${title}
작품번호: ${opus}
${xmlSection}
${refSection}

${KOREAN_OUTPUT_RULE}

**[Phase 3 임무: 구조 분석 + 화성 분석]**

**🚨 절대 규칙:**
- 모든 섹션/악장/변주를 빠짐없이 나열할 것
- 변주곡이면 Theme + 모든 Variation, 모음곡이면 모든 곡
- **소나타/다악장 작품이면 반드시 모든 악장을 각각 별도의 section으로 나열할 것**
  - 예: Beethoven Piano Sonata → 보통 3~4개 악장
  - 각 악장을 "제1악장 (Presto)", "제2악장 (Largo e mesto)" 등으로 표기
  - 악장 내부 세부 구조(제시부/발전부/재현부 등)는 description 안에 서술
- 하나라도 누락하면 분석 실패
- 각 악장/섹션의 조성(key), 박자(time signature), 템포(tempo)는 반드시 정확해야 합니다
- 확신이 없으면 "문헌 확인 필요"로 표기하십시오

**참조:**
- Urtext 원전판 기반 마디 번호
- 실제 악보의 조표, 박자표, 템포 지시어 사용
- Schenkerian analysis 관점 참조 가능

${SELF_VERIFICATION_PROTOCOL}

JSON만 출력:
{
  "structure_analysis_v2": {
    "sections": [
      {
        "section": "섹션명 (형식에 맞는 용어: Exposition, Theme, Variation 1 등)",
        "measures": "마디 범위 (예: mm. 1-8)",
        "key_signature": "조성 (예: G minor)",
        "time_signature": "박자 (예: 6/4)",
        "tempo": "템포 지시어 (예: Largo)",
        "mood": "한국어로 분위기/성격 (예: 서정적이고 내밀한)",
        "description": "한국어 2-3문장 — 음악적 특징, 주요 동기, 텍스처"
      }
    ],
    "harmony_table": [
      {
        "measure": "마디 번호",
        "beat": "박 위치 (예: 1, 2.5)",
        "chord": "코드명 (예: Gm, D7, Eb+)",
        "roman_numeral": "로마숫자 분석 (예: i, V7, bVI)",
        "function": "기능 (예: Tonic, Dominant, Neapolitan)",
        "voice_leading": "성부진행 특이사항 (예: 소프라노 하행 반음계)",
        "pedal": "페달 포인트 여부 (예: G pedal, -)",
        "note": "한국어 비고 (예: 반음계적 경과, 조바꿈 피벗)"
      }
    ]
  }
}

**화성 분석 테이블 지침:**
- 전체 곡을 커버하되, 모든 마디가 아닌 **화성적으로 중요한 지점** 위주로 (15-30행)
- 조바꿈, 감7화음, 증6화음, 나폴리탄, 페달 포인트 등 주목할 화성 반드시 포함
- 화성이 단순 반복되는 구간은 대표 마디만 기재

JSON만 출력하십시오.`;
}

// ── Phase 4: 연습법 + 4주 루틴 + 추천 연주 ──

export function createPhase4Prompt(
  composer: string,
  title: string,
  opus: string,
  sectionNames: string[]
): string {
  return `당신은 세계적인 피아노 교수법 전문가이자 연주 코치입니다.

작곡가: ${composer}
곡 제목: ${title}
작품번호: ${opus}

이 곡의 구조 (총 ${sectionNames.length}개 섹션):
${sectionNames.map((s, i) => `${i + 1}. ${s}`).join('\n')}

${KOREAN_OUTPUT_RULE}

**[Phase 4 임무: 연습법 + 4주 루틴 + 추천 연주]**

**금지:**
- "느리게 연습하세요", "반복 연습하세요" 등 일반론
- 동일한 솔루션을 여러 섹션에 반복 사용
- YouTube URL 추측/생성 (확실한 경우만 포함)

${SELF_VERIFICATION_PROTOCOL}

JSON만 출력:
{
  "practice_method": {
    "technique_summary": [
      {
        "category": "카테고리명 (예: 스케일/아르페지오, 옥타브, 트릴, 폴리포니, 페달링, 음색조절)",
        "items": ["한국어로 구체적 기술 항목 2-4개"]
      }
    ],
    "section_guides": [
      {
        "section": "섹션명",
        "guide": "한국어 3-5문장 — 이 섹션의 핵심 난점과 구체적 연습법. 손가락 번호, 손목/팔 동작, 페달링, 음색 처리 등 즉각 적용 가능한 솔루션."
      }
    ],
    "weekly_routine": [
      {
        "week": 1,
        "theme": "한국어 주간 테마 (예: 기본 구조 파악 및 읽보기)",
        "days": [
          {
            "day": "Day 1",
            "focus": "한국어 집중 영역",
            "tasks": ["한국어 구체적 과제 2-4개"]
          },
          {
            "day": "Day 2",
            "focus": "집중 영역",
            "tasks": ["과제들"]
          }
        ]
      },
      {
        "week": 2,
        "theme": "주간 테마",
        "days": [...]
      },
      {
        "week": 3,
        "theme": "주간 테마",
        "days": [...]
      },
      {
        "week": 4,
        "theme": "주간 테마",
        "days": [...]
      }
    ]
  },
  "recommended_performances_v2": [
    {
      "artist": "연주자 이름 (세계적 프로 연주자만)",
      "year": "녹음/영상 연도",
      "comment": "한국어로 이 연주의 해석적 특징과 추천 이유 2-3문장",
      "youtube_url": "정확한 YouTube URL (확실한 경우만, 불확실하면 빈 문자열)"
    }
  ]
}

**4주 루틴 지침:**
- Week 1: 읽보기/구조 파악 단계 (느린 템포, 섹션별 분리)
- Week 2: 테크닉 집중 단계 (어려운 패시지 집중 연습)
- Week 3: 음악적 해석 단계 (프레이징, 다이내믹, 페달링)
- Week 4: 통합/완성 단계 (인템포 연주, 무대 연습)
- 각 주 5-6일 (1-2일 휴식)
- 각 일의 tasks는 30-60분 연습 기준

**추천 연주 (필수 준수):**
- 반드시 세계적으로 인정받는 프로 연주자(피아니스트)의 공연/녹음만 추천할 것
- 예시: Martha Argerich, Krystian Zimerman, Maurizio Pollini, Vladimir Horowitz, Sviatoslav Richter, Lang Lang, Yuja Wang, Daniil Trifonov, Grigory Sokolov, Claudio Arrau 등 국제 콩쿠르 우승자급 또는 세계적 명성의 연주자
- 절대 금지: 튜토리얼 채널, 레슨 영상, 음악 이론 강의, 아마추어 연주, 무명 연주자
- 3-5개의 명연주를 추천하되, 다양한 해석 스타일 포함 (역사적 거장 vs 현대 스타, 테크닉형 vs 서정형 등)
- YouTube URL은 해당 연주자의 실제 공연 영상이 확실한 경우만 포함

JSON만 출력하십시오.`;
}

// ── 기존 호환 프롬프트 (route.ts에서 이전) ──

/** 대형 작품 감지 */
export function isLargeWork(title: string): boolean {
  const lower = title.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (lower.includes("variation") || lower.includes("변주")) return true;
  const largeKeywords = [
    "kreisleriana", "kinderszenen", "carnaval", "papillons", "waldszenen",
    "novelletten", "études-tableaux", "etudes-tableaux", "etudes d'execution",
    "transcendental", "paganini etude", "preludes op.28", "preludes, op.28",
    "well-tempered", "평균율", "wohltemperierte", "scenes from childhood",
    "pictures at an exhibition", "전람회의 그림", "goyescas", "iberia",
    "annees de pelerinage", "순례의 해", "goldberg", "diabelli",
    "enigma", "symphonic etudes", "교향적 연습곡",
    "festin d'esope", "festin d esope", "le festin",
    "rhapsody on a theme", "rapsodie sur un theme",
    "chaconne", "passacaglia",
  ];
  return largeKeywords.some((k) => lower.includes(k));
}

/** 구조 분석 전용 프롬프트 (대형 작품용) */
export function createStructureOnlyPrompt(composer: string, title: string): string {
  return `당신은 세계적인 음악학자(Musicologist)입니다.

작곡가: ${composer}
곡 제목: ${title}

${KOREAN_OUTPUT_RULE}

이 곡의 **모든 섹션/악장/변주/소품**을 빠짐없이 분석하십시오.

🚨 **절대 규칙**: 하나라도 누락하면 분석 실패로 간주합니다.
- 변주곡 → Theme + 모든 Variation
- 모음곡/다곡 구성 → 모든 곡을 개별 항목으로
- 소나타 다악장 → 각 악장 내부 구조까지

각 항목에 포함할 내용:
- section: 형식에 맞는 섹션명
- measures: 마디 범위
- key_tempo: 조성, 박자, 템포 지시
- character: 한 문장 성격 묘사
- description: 1-2문장 핵심 특징

${SELF_VERIFICATION_PROTOCOL}

JSON만 출력:
{
  "structure_analysis": [
    {
      "section": "섹션명",
      "measures": "마디 범위",
      "key_tempo": "조성/박자/템포",
      "character": "한 문장 성격",
      "description": "1-2문장 설명"
    }
  ]
}`;
}

/** 상세 분석 프롬프트 (대형 작품용 — 구조 확보 후) */
export function createDetailAnalysisPrompt(
  composer: string,
  title: string,
  sectionNames: string[]
): string {
  return `당신은 **세계적인 피아노 교수법 전문가**이자 **음악학자**입니다.

작곡가: ${composer}
곡 제목: ${title}

이 곡의 구조는 이미 분석되었습니다 (총 ${sectionNames.length}개 섹션):
${sectionNames.map((s, i) => `${i + 1}. ${s}`).join("\n")}

${KOREAN_OUTPUT_RULE}

${SELF_VERIFICATION_PROTOCOL}

JSON 출력:
{
  "meta": {
    "composer": "작곡가",
    "title": "곡 제목 (원어)",
    "opus": "작품번호",
    "key": "조성",
    "difficulty_level": "Beginner/Intermediate/Advanced/Virtuoso"
  },
  "content": {
    "composer_background": "한국어 5-8문장",
    "historical_context": "한국어 5-8문장",
    "work_background": "한국어 5-8문장",
    "technique_tips": [
      {
        "section": "섹션명 (mm. 마디범위, 화성 정보)",
        "problem": "한국어 — 기술적 난관",
        "category": "Physiological/Interpretative/Structural",
        "solution": "한국어 — 구체적 해결책",
        "practice": "한국어 — 변형 연습법"
      }
    ],
    "musical_interpretation": "한국어 5-8문장",
    "recommended_performances": [
      { "artist": "연주자 이름", "year": "연도", "comment": "한국어 특징 설명" }
    ]
  },
  "verification_status": "Verified/Needs Review"
}

### technique_tips 지침
- 최소 ${Math.min(sectionNames.length, 15)}개 작성
- 중복 금지, 각 섹션 고유의 솔루션
- [Physiological]: 근육 이완, 손가락 독립, 팔 무게, 손목 회전
- [Interpretative]: 페달링, Voicing, Agogic, 루바토
- [Structural]: 형식 호흡법, 섹션별 연습 전략, 템포 설계

JSON만 출력하십시오.`;
}

/** 추가 technique_tips 프롬프트 (대형 작품 — 누락 섹션 보완) */
export function createExtraTechniquePrompt(
  composer: string,
  title: string,
  sectionNames: string[],
  batchIndex: number,
  totalBatches: number
): string {
  return `당신은 **세계적인 피아노 교수법 전문가**입니다.

작곡가: ${composer}
곡 제목: ${title}

${KOREAN_OUTPUT_RULE}

아래 섹션들에 대한 technique_tips를 작성하십시오 (${batchIndex + 1}/${totalBatches} 배치):

${sectionNames.map((s, i) => `${i + 1}. ${s}`).join("\n")}

각 섹션마다 반드시 1개의 technique_tip을 작성하십시오.

${SELF_VERIFICATION_PROTOCOL}

JSON만 출력:
{
  "technique_tips": [
    {
      "section": "섹션명 (mm. 마디범위, 화성 정보)",
      "problem": "한국어 — 기술적 난관",
      "category": "Physiological/Interpretative/Structural",
      "solution": "한국어 — 구체적 해결책",
      "practice": "한국어 — 변형 연습법"
    }
  ]
}

JSON만 출력하십시오.`;
}

/** 기존 단일 호출 프롬프트 (V1 호환) */
export function createMusicologistPrompt(composer: string, title: string): string {
  return `당신은 **세계적인 피아노 교수법 전문가**이자 **음악학자(Musicologist)**입니다.

작곡가: ${composer}
곡 제목: ${title}

${KOREAN_OUTPUT_RULE}

${SELF_VERIFICATION_PROTOCOL}

JSON 출력:
{
  "meta": {
    "composer": "작곡가 이름",
    "title": "곡 제목 (원어)",
    "opus": "작품번호",
    "key": "조성",
    "difficulty_level": "Beginner/Intermediate/Advanced/Virtuoso"
  },
  "content": {
    "composer_background": "한국어 8-10문장",
    "historical_context": "한국어 8-10문장",
    "work_background": "한국어 8-10문장",
    "structure_analysis": [
      {
        "section": "섹션명",
        "measures": "마디 범위",
        "key_tempo": "조성/박자/템포",
        "character": "한국어 성격 묘사",
        "description": "한국어 상세 설명"
      }
    ],
    "technique_tips": [
      {
        "section": "섹션명 (mm. 마디범위)",
        "problem": "한국어 기술적 난관",
        "category": "Physiological/Interpretative/Structural",
        "solution": "한국어 구체적 해결책",
        "practice": "한국어 변형 연습법"
      }
    ],
    "musical_interpretation": "한국어 8-10문장",
    "recommended_performances": [
      { "artist": "연주자 이름", "year": "연도", "comment": "한국어 특징 설명" }
    ]
  },
  "verification_status": "Verified/Needs Review"
}

🚨 모든 섹션/악장/변주를 빠짐없이 분석할 것!

JSON만 출력하십시오.`;
}

/** MusicXML 기반 분석 프롬프트 */
export function createMusicXmlPrompt(composer: string, title: string, musicXml: string): string {
  const truncated = musicXml.length > 60000 ? musicXml.substring(0, 60000) + "\n<!-- ... truncated -->" : musicXml;

  return `당신은 **세계적인 피아노 교수법 전문가**이자 **음악학자(Musicologist)**입니다.

작곡가: ${composer}
곡 제목: ${title}

아래는 이 곡의 **MusicXML 데이터**입니다.

\`\`\`xml
${truncated}
\`\`\`

[MusicXML 분석 지침]
- <measure> 태그에서 정확한 마디 번호 사용
- <note>, <pitch>에서 실제 음형과 리듬 패턴 파악
- <dynamics>, <direction>에서 다이내믹과 연주 지시 확인
- <key>, <time>에서 조성, 박자 확인

${KOREAN_OUTPUT_RULE}

${SELF_VERIFICATION_PROTOCOL}

JSON 출력:
{
  "meta": {
    "composer": "작곡가",
    "title": "곡 제목 (원어)",
    "opus": "작품번호",
    "key": "조성",
    "difficulty_level": "Beginner/Intermediate/Advanced/Virtuoso"
  },
  "content": {
    "composer_background": "한국어 8-10문장",
    "historical_context": "한국어 8-10문장",
    "work_background": "한국어 8-10문장",
    "structure_analysis": [
      {
        "section": "섹션명",
        "measures": "마디 범위 (MusicXML 기반)",
        "key_tempo": "조성/박자/템포",
        "character": "한국어 성격 묘사",
        "description": "한국어 상세 설명"
      }
    ],
    "technique_tips": [
      {
        "section": "섹션명 (mm. 마디, 화성 정보)",
        "problem": "한국어 기술적 난관",
        "category": "Physiological/Interpretative/Structural",
        "solution": "한국어 구체적 해결책",
        "practice": "한국어 변형 연습법"
      }
    ],
    "musical_interpretation": "한국어 8-10문장",
    "recommended_performances": [
      { "artist": "연주자 이름", "year": "연도", "comment": "한국어 특징 설명" }
    ]
  },
  "verification_status": "Verified"
}

JSON만 출력하십시오.`;
}
