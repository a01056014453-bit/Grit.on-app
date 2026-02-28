/**
 * lib/analysis-prompts.ts
 * Phase 0~4 프롬프트 모듈
 *
 * 핵심 원칙:
 * - Perplexity: 팩트 수집 전용
 * - GPT-4o: Perplexity 수집 팩트를 기반으로 글 작성
 * - 하드코딩된 예시 없음 — GPT가 곡별로 스스로 파악하도록 chain-of-thought
 */

const KOREAN_OUTPUT_RULE = `🚨 모든 출력은 반드시 한국어로 작성하십시오. (고유명사, 음악 용어만 원어 병기 가능)
🚨 마크다운 서식 절대 금지. **bold**, *italic*, ##heading, - list 등 금지. 순수 텍스트만 출력.
🚨 일본어 절대 금지. 한국어 또는 원어로 대체.
🚨 손가락 번호(운지법) 절대 금지. 손목/팔 동작, 터치, 신체 감각 기반 조언만.`;

const HALLUCINATION_GUARD = `🚨 핵심 규칙 — 거짓말 금지:
- 제공된 레퍼런스 데이터에 없는 구체적 수치(마디 번호, 연도, BPM)를 생성하지 마십시오.
- 확인되지 않은 사실을 단정적으로 서술하지 마십시오.
- 모르는 것은 해당 필드를 빈 문자열("")로 두십시오. "문헌 확인 필요" 같은 표기 금지.
- 레퍼런스에 있는 내용만 활용하고, 없는 내용은 생략하십시오.`;

// ── Phase 0: Perplexity 레퍼런스 검색 ──────────────────────────

export function createReferenceSearchPrompt(composer: string, title: string): string {
  return `I need accurate, verified musical reference data for this classical piano piece:

Composer: ${composer}
Title: ${title}

Search IMSLP, Wikipedia, Henle Verlag, Grove Music Online, and music theory databases.

CRITICAL: If the title contains "No.X", search for THAT SPECIFIC piece only.

Required output — fill every field for every movement:

PIECE INFO:
- Full title: [original language]
- Opus/Catalogue: [e.g., Op.10 No.3]
- Overall key: [e.g., D major]
- Year composed: [verified only]
- Number of movements:
- Henle difficulty: [if available]

Per movement:
- Tempo marking:
- Key:
- Time signature:
- Form:
- Number of measures: [approximate if exact unknown]
- Notable modulations:

CRITICAL RULES:
- Provide key, time signature, tempo for EVERY movement.
- For time signatures of well-known repertoire: give the value directly (e.g., 2/2, 3/4). Do NOT write "not specified".
- For measure counts: write "approx. 350" rather than "not found".
- Do NOT hedge with "verify via IMSLP". Give the best available answer.`;
}

// ── Phase 1: 데이터 검증 + 곡 개요 ────────────────────────────

export function createPhase1Prompt(
  composer: string,
  title: string,
  musicXml?: string,
  referenceData?: string
): string {
  const xmlSection = musicXml
    ? `\n\n[MusicXML 데이터 — 조성·박자·마디를 여기서 직접 읽으십시오]\n\`\`\`xml\n${musicXml.substring(0, 30000)}\n\`\`\``
    : "";

  const refSection = referenceData
    ? `\n\n[🔍 검증된 레퍼런스 — 이 데이터를 1차 출처로 사용하십시오]\n${referenceData}\n\n🚨 위 레퍼런스의 팩트(조성, 작품번호, 작곡시기, 마디 수)를 반드시 따르십시오.`
    : "";

  return `당신은 세계적인 음악학자입니다.

작곡가: ${composer}
곡 제목: ${title}
${xmlSection}
${refSection}

${KOREAN_OUTPUT_RULE}
${HALLUCINATION_GUARD}

[Phase 1: 데이터 검증 + 곡 개요]

🚨 최우선 규칙: 제목에 "No.X"가 있으면 해당 곡 하나만 분석. 모음집 전체 분석 금지.

아래 순서로 사고하십시오:
1. 이 곡이 단악장인가, 다악장인가, 소품 모음집인가, 변주곡인가?
2. 각 악장/소품의 박자·조성·형식을 레퍼런스에서 확인하라.
3. 확인된 것만 tempo_marking에 기재. 없으면 빈 문자열.

tempo_marking 형식 규칙 (확인된 것만):
- 다악장 소나타/협주곡: "1악장 [빠르기] – [조성], [박자], [형식]. / 2악장 ..."
- 소품 모음집 (고유 제목 있음): "No.1 [원어제목] ([한국어]) – [조성], [박자] / ..."
- 소품 모음집 (고유 제목 없음): "No.1 – [조성], [박자] / No.2 – ..."
- 변주곡: "Theme – [조성], [박자] / Var.1 – ... / Var.2 – ..."
- 단악장: 해당 곡의 빠르기만

JSON만 출력:
{
  "meta": {
    "composer": "작곡가 이름 (원어)",
    "title": "곡 제목 (원어)",
    "opus": "작품번호",
    "key": "조성",
    "difficulty_level": "Beginner/Intermediate/Advanced/Virtuoso"
  },
  "song_overview": {
    "title_original": "원어 정식 제목",
    "title_korean": "한국어 제목 (없으면 빈 문자열)",
    "composition_period": "작곡·출판 시기 + 헌정 정보 (확인된 것만)",
    "tempo_marking": "위 규칙에 따라 모든 악장/소품 나열 (확인된 것만)",
    "genre": "장르적 성격을 문장으로 서술",
    "form": "전체 형식 개요",
    "musical_features": ["이 곡 전체를 관통하는 핵심 특징 1-2문장"]
  }
}`;
}

// ── Phase 2: 인문학적 배경 ─────────────────────────────────────

export function createPhase2Prompt(
  composer: string,
  title: string,
  opus: string,
  verifiedMeta?: { composer: string; title: string; opus: string; key: string }
): string {
  const metaLock = verifiedMeta
    ? `\n[🔒 Phase 1 확정값 — 이 정보를 기준으로, 상충하는 내용 생성 금지]
작곡가: ${verifiedMeta.composer} / 제목: ${verifiedMeta.title} / 작품번호: ${verifiedMeta.opus} / 조성: ${verifiedMeta.key}`
    : "";

  return `당신은 세계적인 음악학자이자 피아노 교수법 전문가입니다.

작곡가: ${composer}
곡 제목: ${title}
작품번호: ${opus}
${metaLock}

${KOREAN_OUTPUT_RULE}
${HALLUCINATION_GUARD}

[Phase 2: 인문학적 배경]

🚨 최우선 규칙: 제목에 "No.X"가 있으면 해당 곡 하나만 분석.

─────────────────────────────────────────
[작성 전 필수 사고 단계 — 이 질문들에 먼저 답하고 글을 쓰십시오]
─────────────────────────────────────────

[작곡가 생애 사고]
Q1. 이 작곡가의 화성 언어는 무엇인가?
    (다른 작곡가와 구별되는 구체적 화성 진행, 음정 사용 방식, 성부 배치 습관)
Q2. 이 작곡가의 리듬 어법은 무엇인가?
    (특유의 리듬 패턴, 폴리리듬 사용, 민속 리듬 차용 등)
Q3. 이 작곡가가 형식 면에서 이전 시대와 어떻게 달랐는가?
Q4. 이 작곡가가 같은 시대 작곡가들과 어떤 구체적 관계였는가?
    (단순 나열 금지 — 실제 편지, 만남, 영향 관계, 대립 관계)

[시대적 배경 사고]
Q5. 이 곡이 작곡된 시기, 피아노 음악계에서 구체적으로 무슨 일이 있었는가?
    (유행한 장르, 기술 혁신, 청중의 취향 변화 등)
Q6. 이 작곡가는 그 흐름에서 어떤 독자적 위치를 차지했는가?
Q7. 이 곡이 당시 청중과 비평가에게 어떻게 받아들여졌는가? (기록이 있는 경우만)

[곡 특징 사고]
Q8. 이 곡의 각 구성 단위(악장/소품/변주)가 갖는 고유한 음형(figuration)은 무엇인가?
Q9. 이 곡에서만 만나는 기교적 도전은 무엇인가?
    (다른 레퍼토리에서 흔히 나오지 않는 특수한 요구)
Q10. 이 곡의 각 구성 단위가 표현하는 감정·이미지·극적 흐름은 무엇인가?

─────────────────────────────────────────
[구성 단위 표기 규칙]
─────────────────────────────────────────
- 다악장 소나타/협주곡 → "1악장", "2악장" 단위로 각각 서술
- 소품 모음집 (고유 제목 있음) → 원어 제목(한국어 번역) 단위로 서술. 절대 "악장" 금지
- 소품 모음집 (고유 제목 없음) → "No.1", "No.2" 단위로 서술. 절대 "악장" 금지
- 변주곡 → "주제(Theme)", "변주 1", "변주 2" 단위로 서술

─────────────────────────────────────────
[각 필드 작성 기준]
─────────────────────────────────────────

summary (작곡가 생애):
Q1~Q4 사고 결과를 바탕으로 8-10문장. 추상적 표현("독창적이다", "혁신적이다") 금지.
구체적 음악 언어로 서술. 예: "~단3도 도약과 반음계 꾸밈음", "~ii-V-I 진행을 ~방식으로 처리"

timeline:
3-5개 시기. 반드시 "이 곡이 작곡된 시기"를 별도 항목으로 포함.
각 5-7문장.

at_composition:
이 곡 작곡 당시 작곡가의 나이, 거주지, 진행 중이던 다른 작품들, 작곡 동기.
확인된 것만. 5-8문장.

era_characteristics:
Q5~Q6 사고 결과. "낭만주의 시대" 같은 단순 시대 분류 금지.
구체적 사건·유행·기술 변화로 서술. 5-8문장.

contemporary_composers:
Q7 사고 결과. 단순 나열("X, Y, Z가 있다") 절대 금지.
실질적 영향 관계, 구체적 사례, 대립 또는 협력 관계. 5-7문장.

musical_movement:
이 곡이 음악사에서 보여주는 구체적 혁신.
"새로운 가능성을 탐구했다" 수준의 표현 금지.
실제 화성 진행, 형식 구조, 음색 실험, 리듬 어법에서 이전과 무엇이 달랐는지. 5-7문장.

form_and_structure:
Q8 사고 결과. 각 구성 단위별로 반드시 개별 서술.
주제 음형, 화성 특징, 발전 방식, 종결 방식. 15-25문장.

technique:
Q9 사고 결과. 각 구성 단위별로 이 곡 고유의 기교.
"일반적인 피아노 기교"가 아닌 이 곡에서만 만나는 특수한 도전.
손목/팔/어깨 사용 방식, 터치 종류, 리듬의 신체적 해결 방법.
손가락 번호 절대 금지. 10-15문장.

literary_dramatic:
Q10 사고 결과. 각 구성 단위별 감정·이미지·극적 흐름. 10-15문장.

JSON만 출력:
{
  "composer_life": {
    "summary": "8-10문장",
    "timeline": [
      { "period": "시기명 + 연도", "description": "5-7문장" }
    ],
    "at_composition": "5-8문장"
  },
  "historical_background": {
    "era_characteristics": "5-8문장",
    "contemporary_composers": "5-7문장",
    "musical_movement": "5-7문장"
  },
  "song_characteristics": {
    "composition_background": "5-8문장",
    "form_and_structure": "15-25문장 — 각 구성 단위별 개별 서술",
    "technique": "10-15문장 — 이 곡 고유의 기교, 손가락 번호 금지",
    "literary_dramatic": "10-15문장 — 각 구성 단위별 감정·극적 흐름",
    "conclusion": "5-7문장 — 음악사적 의의"
  }
}`;
}

// ── Phase 3: 구조/화성 분석 ────────────────────────────────────

export function createPhase3Prompt(
  composer: string,
  title: string,
  opus: string,
  musicXml?: string,
  referenceData?: string,
  verifiedMeta?: { composer: string; title: string; opus: string; key: string }
): string {
  const xmlSection = musicXml
    ? `\n\n[MusicXML — 마디 번호·조성·박자·음형을 여기서 읽으십시오]\n\`\`\`xml\n${musicXml.substring(0, 60000)}\n\`\`\``
    : "";

  const refSection = referenceData
    ? `\n\n[🔍 레퍼런스 데이터 — 1차 출처]\n${referenceData}\n\n🚨 레퍼런스의 조성·박자·마디 수를 그대로 사용. 상충하는 정보 생성 금지.`
    : "";

  const metaLock = verifiedMeta
    ? `\n[🔒 Phase 1 확정값]\n작곡가: ${verifiedMeta.composer} / 제목: ${verifiedMeta.title} / 작품번호: ${verifiedMeta.opus} / 조성: ${verifiedMeta.key}`
    : "";

  return `당신은 세계적인 음악 이론가이자 화성학 전문가입니다.

작곡가: ${composer}
곡 제목: ${title}
작품번호: ${opus}
${metaLock}
${xmlSection}
${refSection}

${KOREAN_OUTPUT_RULE}
${HALLUCINATION_GUARD}

[Phase 3: 구조·화성 분석]

🚨 최우선 규칙: 제목에 "No.X"가 있으면 해당 곡 하나만 분석.

─────────────────────────────────────────
[작성 전 필수 사고 단계]
─────────────────────────────────────────

Q1. 이 곡의 전체 형식은 무엇인가? (소나타/론도/3부/변주/자유 형식 등)
Q2. 각 구성 단위(악장/소품/변주) 내부는 어떤 구간으로 나뉘는가?
Q3. 각 구간의 조성과 화성 진행의 핵심은 무엇인가?
Q4. 이 작곡가의 화성 언어에서 특징적인 요소가 이 곡에서 어떻게 나타나는가?
    (나폴리 6화음, 증6화음, 모달 혼용, 재즈 코드, 비기능적 화성 등)
Q5. 조성 간 전조가 어떤 방식으로 이루어지는가?

─────────────────────────────────────────
[measures 필드 작성 규칙 — 반드시 준수]
─────────────────────────────────────────
- 마디 번호가 확인된 경우: "mm.1-32, 주제 제시"
- 마디 번호가 불확실한 경우: "주제 제시, 성격 규정" (역할만 서술)
- 절대 금지: "문헌 확인 필요", "확인 필요", 빈 문자열

[구성 단위 표기 규칙]
- 다악장: section에 "1악장:", "2악장:" 접두어
- 소품 모음집 (고유 제목): "Träumerei (꿈):", "Pierrot (피에로):" 접두어
- 소품 모음집 (번호만): "No.1:", "No.2:" 접두어. 절대 "악장" 금지
- 변주곡: "주제:", "Var.1:", "Var.2:" 접두어

[구간 구성 — 형식별 필수 구간]
- 소나타 형식: 도입·제1주제 / 전이부 / 제2주제 / 종결부 / 전개부 / 재현부 / 코다
- 론도 형식: A주제 / B에피소드 / A'회귀 / C에피소드 / A''+코다
- 스케르초: 스케르초 주제 / 트리오 / 스케르초 회귀
- 변주곡: 주제 + 각 변주 개별
- 짧은 소품: A주제 / 중간부(대비) / 재현+코다 (2-4개)
- 누락 시 분석 실패

JSON만 출력:
{
  "structure_analysis_v2": {
    "sections": [
      {
        "section": "구성단위: 구간 이름",
        "measures": "마디 번호 있으면 'mm.N-N, 역할' / 없으면 '역할' (문헌 확인 필요 금지)",
        "key_signature": "조성 + 핵심 화성 진행",
        "time_signature": "박자",
        "tempo": "템포 지시어",
        "mood": "분위기·표현 한국어 요약",
        "description": "1-2문장 — 음악적 특징, 주요 동기, 텍스처"
      }
    ],
    "harmony_table": [
      {
        "measure": "구간명",
        "beat": "위치",
        "chord": "코드명",
        "roman_numeral": "로마숫자",
        "function": "기능 (Tonic/Dominant/Subdominant/Neapolitan 등)",
        "voice_leading": "성부진행 특이사항",
        "pedal": "페달 포인트 여부",
        "note": "비고"
      }
    ]
  }
}

화성 테이블: 전체 곡 커버, 화성적으로 중요한 지점 15-30행.
조바꿈, 감7화음, 증6화음, 나폴리탄, 페달 포인트 반드시 포함.`;
}

// ── Phase 4: 연습법 + 4주 루틴 + 추천 연주 ────────────────────

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

이 곡의 구조 (${sectionNames.length}개 섹션):
${sectionNames.map((s, i) => `${i + 1}. ${s}`).join("\n")}

${KOREAN_OUTPUT_RULE}
${HALLUCINATION_GUARD}

[Phase 4: 연습법 + 4주 루틴 + 추천 연주]

🚨 최우선 규칙: 제목에 "No.X"가 있으면 해당 곡 하나만 분석.

─────────────────────────────────────────
[작성 전 필수 사고 단계]
─────────────────────────────────────────

technique_summary를 작성하기 전에 먼저 아래를 스스로 파악하십시오:

Q1. 음정: 이 곡(${composer}, ${title})에서 가장 빈번하게 등장하는 음정 패턴은?
    (도약 음정, 아르페지오 형태, 화음 구성 등 이 곡 고유의 것)

Q2. 기본기: 이 곡을 연주하기 위해 특별히 발달시켜야 할 손/팔/몸의 능력은?
    (이 곡이 아닌 다른 곡에서는 덜 요구되는 것)

Q3. 기교 테크닉: 이 곡에서만 만나는 특수한 기교적 도전은?
    (일반론이 아닌 이 곡 고유의 패시지, 리듬, 텍스처)

Q4. 감정표현: 이 곡의 고유한 표현 방식은?
    (이 작곡가·이 시대·이 장르의 특수한 표현 관습)

Q5. 리듬감각: 이 곡의 리듬에서 특별히 주의해야 할 것은?
    (단순한 박자 유지가 아닌, 이 곡 특유의 리듬 복잡성)

Q6. 형식인식: 이 곡의 구조를 이해하는 것이 연습·연주에 어떻게 도움이 되는가?

→ Q1-Q6 답변을 바탕으로 technique_summary를 작성하십시오.
   각 카테고리의 items는 반드시 이 답변에서 도출된 내용이어야 합니다.
   "일반적인 피아노 연습법"이나 플레이스홀더 수준의 항목은 실패입니다.

─────────────────────────────────────────
[절대 금지]
─────────────────────────────────────────
- "느리게 연습하세요", "반복 연습하세요" 등 일반론
- 손가락 번호 (운지법)
- 동일한 솔루션을 여러 섹션에 반복
- YouTube URL 추측 생성

[연습법 표현 원칙]
- 손가락 번호 대신: 손목·팔 동작, 터치 방식, 신체 감각, 비유
- 이 곡에만 해당하는 구체적 연습 아이디어

JSON만 출력:
{
  "practice_method": {
    "technique_summary": [
      { "category": "음정", "items": ["이 곡 고유 음정 연습 항목 1", "항목 2", "항목 3"] },
      { "category": "기본기", "items": ["이 곡 고유 기본기 항목 1", "항목 2", "항목 3"] },
      { "category": "기교 테크닉", "items": ["이 곡 고유 기교 항목 1", "항목 2", "항목 3"] },
      { "category": "감정표현", "items": ["이 곡 고유 표현 항목 1", "항목 2", "항목 3"] },
      { "category": "리듬감각", "items": ["이 곡 고유 리듬 항목 1", "항목 2", "항목 3"] },
      { "category": "형식인식", "items": ["이 곡 고유 형식 항목 1", "항목 2", "항목 3"] }
    ],
    "section_guides": [
      {
        "section": "섹션명",
        "guide": "8-15문장 — 이 섹션의 핵심 기술 + 이 곡에만 해당하는 구체적 연습 아이디어. 손가락 번호 금지."
      }
    ],
    "weekly_routine": [
      {
        "week": 1,
        "theme": "1주차 테마",
        "days": [
          {
            "day": "1일차",
            "focus": "집중 구간 + 목표",
            "tasks": [
              "기본기: 조성 스케일/아르페지오 + 부가 연습",
              "기교: 양손 따로 연습 → 핵심 테크닉",
              "표현: 다이내믹/터치/프레이즈 실험",
              "리듬·형식: 박자감/구조 인식",
              "연결 연주: 이전 구간과 연결"
            ]
          }
        ]
      }
    ]
  },
  "recommended_performances_v2": [
    {
      "artist": "연주자 이름 (세계적 프로만)",
      "year": "녹음 연도",
      "comment": "해석 특징 + 추천 이유 2-3문장",
      "youtube_url": "확실한 URL만, 불확실하면 빈 문자열"
    }
  ]
}

4주 루틴 규칙:
- 반드시 4주 × 7일 = 28일 모두 작성
- tasks 정확히 5개 (기본기/기교/표현/리듬·형식/연결 연주)
- 시간(분) 표기 금지
- 기교: 반드시 "양손 따로 연습 →"으로 시작

추천 연주:
- 세계적으로 인정받는 프로 연주자만 (Marc-André Hamelin, Daniil Trifonov, Yuja Wang 등)
- 튜토리얼/레슨/아마추어 절대 금지
- 3-5개, 다양한 해석 스타일 포함`;
}

// ── 기존 호환 함수들 ───────────────────────────────────────────

export function isCharacterPieceCollection(title: string): boolean {
  const lower = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return [
    "papillons", "kinderszenen", "scenes from childhood", "carnaval", "kreisleriana",
    "waldszenen", "novelletten", "albumblatter", "bunte blatter", "phantasiestucke",
    "fantasiestucke", "nachtstucke", "pictures at an exhibition", "전람회의 그림",
    "goyescas", "iberia", "annees de pelerinage", "순례의 해", "preludes op.28",
    "preludes, op.28", "etudes-tableaux", "études-tableaux", "well-tempered",
    "평균율", "wohltemperierte", "songs without words", "무언가", "moments musicaux",
    "impromptus", "consolations", "liebestraume",
  ].some((k) => lower.includes(k));
}

export function isLargeWork(title: string): boolean {
  const lower = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (lower.includes("variation") || lower.includes("변주")) return true;
  return [
    "kreisleriana", "kinderszenen", "carnaval", "papillons", "waldszenen",
    "novelletten", "études-tableaux", "etudes-tableaux", "etudes d'execution",
    "transcendental", "paganini etude", "preludes op.28", "preludes, op.28",
    "well-tempered", "평균율", "wohltemperierte", "scenes from childhood",
    "pictures at an exhibition", "전람회의 그림", "goyescas", "iberia",
    "annees de pelerinage", "순례의 해", "goldberg", "diabelli", "enigma",
    "symphonic etudes", "교향적 연습곡", "festin d'esope", "chaconne", "passacaglia",
  ].some((k) => lower.includes(k));
}

export function createStructureOnlyPrompt(composer: string, title: string): string {
  return `당신은 세계적인 음악학자입니다.

작곡가: ${composer}
곡 제목: ${title}

${KOREAN_OUTPUT_RULE}
${HALLUCINATION_GUARD}

이 곡의 모든 구성 단위를 빠짐없이 분석하십시오.

구성 단위 표기:
- 변주곡: Theme + 모든 Variation
- 소품 모음집 (고유 제목): 원어 제목(한국어 번역). 절대 "악장" 금지
- 소품 모음집 (번호만): No.1, No.2. 절대 "악장" 금지
- 소나타: 각 악장 내부 구조까지

JSON만 출력:
{
  "structure_analysis": [
    {
      "section": "섹션명",
      "measures": "마디 범위 또는 역할 (문헌 확인 필요 금지)",
      "key_tempo": "조성/박자/템포",
      "character": "한 문장 성격",
      "description": "1-2문장 핵심 특징"
    }
  ]
}`;
}

export function createDetailAnalysisPrompt(composer: string, title: string, sectionNames: string[]): string {
  return `당신은 세계적인 피아노 교수법 전문가이자 음악학자입니다.

작곡가: ${composer}
곡 제목: ${title}

구조 (${sectionNames.length}개 섹션):
${sectionNames.map((s, i) => `${i + 1}. ${s}`).join("\n")}

${KOREAN_OUTPUT_RULE}
${HALLUCINATION_GUARD}

JSON 출력:
{
  "meta": { "composer": "", "title": "", "opus": "", "key": "", "difficulty_level": "" },
  "content": {
    "composer_background": "5-8문장",
    "historical_context": "5-8문장",
    "work_background": "5-8문장",
    "technique_tips": [
      { "section": "", "problem": "", "category": "Physiological/Interpretative/Structural", "solution": "", "practice": "" }
    ],
    "musical_interpretation": "5-8문장",
    "recommended_performances": [{ "artist": "", "year": "", "comment": "" }]
  },
  "verification_status": "Verified/Needs Review"
}

technique_tips: 최소 ${Math.min(sectionNames.length, 15)}개, 섹션별 고유 솔루션, 중복 금지.`;
}

export function createExtraTechniquePrompt(
  composer: string, title: string, sectionNames: string[], batchIndex: number, totalBatches: number
): string {
  return `당신은 세계적인 피아노 교수법 전문가입니다.

작곡가: ${composer} / 곡 제목: ${title}
${KOREAN_OUTPUT_RULE}
${HALLUCINATION_GUARD}

아래 섹션 technique_tips 작성 (${batchIndex + 1}/${totalBatches}):
${sectionNames.map((s, i) => `${i + 1}. ${s}`).join("\n")}

JSON만 출력:
{
  "technique_tips": [
    { "section": "", "problem": "", "category": "Physiological/Interpretative/Structural", "solution": "", "practice": "" }
  ]
}`;
}

export function createMusicologistPrompt(composer: string, title: string): string {
  return `당신은 세계적인 피아노 교수법 전문가이자 음악학자입니다.

작곡가: ${composer}
곡 제목: ${title}

${KOREAN_OUTPUT_RULE}
${HALLUCINATION_GUARD}

JSON 출력:
{
  "meta": { "composer": "", "title": "", "opus": "", "key": "", "difficulty_level": "" },
  "content": {
    "composer_background": "8-10문장",
    "historical_context": "8-10문장",
    "work_background": "8-10문장",
    "structure_analysis": [{ "section": "", "measures": "", "key_tempo": "", "character": "", "description": "" }],
    "technique_tips": [{ "section": "", "problem": "", "category": "Physiological/Interpretative/Structural", "solution": "", "practice": "" }],
    "musical_interpretation": "8-10문장",
    "recommended_performances": [{ "artist": "", "year": "", "comment": "" }]
  },
  "verification_status": "Verified/Needs Review"
}`;
}

export function createMusicXmlPrompt(composer: string, title: string, musicXml: string): string {
  const truncated = musicXml.length > 60000 ? musicXml.substring(0, 60000) + "\n<!-- truncated -->" : musicXml;
  return `당신은 세계적인 피아노 교수법 전문가이자 음악학자입니다.

작곡가: ${composer} / 곡 제목: ${title}

[MusicXML]
\`\`\`xml
${truncated}
\`\`\`

${KOREAN_OUTPUT_RULE}
${HALLUCINATION_GUARD}

JSON 출력:
{
  "meta": { "composer": "", "title": "", "opus": "", "key": "", "difficulty_level": "" },
  "content": {
    "composer_background": "8-10문장",
    "historical_context": "8-10문장",
    "work_background": "8-10문장",
    "structure_analysis": [{ "section": "", "measures": "", "key_tempo": "", "character": "", "description": "" }],
    "technique_tips": [{ "section": "", "problem": "", "category": "Physiological/Interpretative/Structural", "solution": "", "practice": "" }],
    "musical_interpretation": "8-10문장",
    "recommended_performances": [{ "artist": "", "year": "", "comment": "" }]
  },
  "verification_status": "Verified"
}`;
}
