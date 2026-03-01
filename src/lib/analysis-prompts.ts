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
- 레퍼런스에 있는 내용만 활용하고, 없는 내용은 생략하십시오.

🚨 출처 우선순위:
1순위: [학술 자료 DB] 태그 하의 논문/학위논문 데이터 — 가장 신뢰도 높음. 이 데이터의 내용을 최우선으로 반영.
2순위: [웹 검색 요약] 태그 하의 Perplexity 검색 결과 — 학술 자료 보충용.
3순위: 모델 자체 지식 — 위 두 출처에서 다루지 않은 일반 음악사·음악이론 지식만 사용.
- 학술 자료에 구체적 분석(화성 진행, 마디 번호, 형식 구조, 연주법)이 있으면 반드시 인용하십시오.
- 학술 자료의 내용과 모델 지식이 상충하면 학술 자료를 따르십시오.`;

// ── Phase 0: Perplexity 레퍼런스 검색 ──────────────────────────

export function createReferenceSearchPrompt(composer: string, title: string): string {
  return `I need accurate musical reference data for this piano piece:

Composer: ${composer}
Title: ${title}

Search broadly across the web: IMSLP, Wikipedia, Henle Verlag, Grove Music Online, AllMusic, MusicBrainz, piano forums, sheet music databases, YouTube descriptions, academic papers, composer society websites, and any other relevant source.

For less mainstream composers (e.g., Kapustin, Medtner, Godowsky), also search:
- "${composer} ${title} key" directly
- Score preview sites (Scribd, IMSLP, Sheet Music Plus)
- Piano competition repertoire lists
- Recording liner notes and album descriptions

CRITICAL: If the title contains "No.X", search for THAT SPECIFIC piece only.

Required output — fill every field for every movement:

PIECE INFO:
- Full title: [original language]
- Opus/Catalogue: [e.g., Op.10 No.3]
- Overall key: [e.g., F minor] ← THIS IS CRITICAL. Search specifically for the key.
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
- The KEY of the piece is the most important field. Search "${composer} ${title} key" if not immediately found.
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
  verifiedMeta?: { composer: string; title: string; opus: string; key: string },
  referenceData?: string,
): string {
  const metaLock = verifiedMeta
    ? `\n[🔒 Phase 1 확정값 — 이 정보를 기준으로, 상충하는 내용 생성 금지]
작곡가: ${verifiedMeta.composer} / 제목: ${verifiedMeta.title} / 작품번호: ${verifiedMeta.opus} / 조성: ${verifiedMeta.key}`
    : "";

  const refSection = referenceData
    ? `\n\n[🔍 레퍼런스 데이터 — 이 데이터를 1차 출처로 사용하십시오]\n${referenceData}\n\n🚨 위 학술자료에 작곡 배경, 시대적 맥락, 형식·구조, 기법 분석이 포함되어 있다면 반드시 해당 내용을 인용·반영하십시오.`
    : "";

  return `당신은 세계적인 음악학자이자 피아노 교수법 전문가입니다.

작곡가: ${composer}
곡 제목: ${title}
작품번호: ${opus}
${metaLock}
${refSection}

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
- 마디 번호는 최대한 구체적으로 제시. 레퍼런스·MusicXML·일반 음악 지식을 종합하여 추정 가능하면 반드시 기재.
- 마디 번호 확인된 경우: "mm.1-32" (숫자만 명확하게)
- 마디 번호 추정 가능한 경우: "약 mm.1-30" (약 접두어 + 숫자)
- 마디 번호 전혀 불가능한 경우: 해당 구간의 구체적 음악 내용을 서술 (예: "E장조 주제 제시, 우아한 선율선이 상성부에서 전개")
- 절대 금지: "문헌 확인 필요", "확인 필요", "주제 제시, 성격 규정" 같은 추상적 반복 문구, 빈 문자열
- 모든 섹션의 measures가 동일한 문구이면 분석 실패 — 각 섹션마다 고유한 내용이어야 함

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
        "measures": "마디 번호 (mm.1-32) 또는 추정 (약 mm.1-30) 또는 구체적 음악 내용 서술",
        "key_signature": "조성 + 핵심 화성 진행 (예: E장조, I-vi-IV-V 진행 기반, ii-V-I 카덴스로 종결)",
        "time_signature": "박자",
        "tempo": "템포 지시어",
        "mood": "분위기·표현 한국어 요약",
        "description": "3-5문장 — 이 구간의 주요 동기·음형, 텍스처(호모포닉/폴리포닉/대위법적), 성부 배치, 다이내믹 흐름, 이전 구간과의 차이점"
      }
    ],
    "harmony_table": [
      {
        "measure": "구간명 + 마디 번호 (예: 제1주제 mm.1-4)",
        "beat": "위치 (예: 1-2박)",
        "chord": "코드명 (예: E, C#m, F#7/A#)",
        "roman_numeral": "로마숫자 (예: I, vi, V7/V)",
        "function": "기능 (Tonic/Dominant/Subdominant/Neapolitan/Aug6th/Secondary Dominant 등)",
        "voice_leading": "성부진행 특이사항 (예: 바스 반음계 하행, 소프라노 순차 상행)",
        "pedal": "페달 포인트 여부 (예: 토닉 페달 E, 없음)",
        "note": "비고 (예: 피카르디 3도, 반종지)"
      }
    ]
  }
}

🚨 화성 테이블 필수 규칙:
- 전체 곡을 커버하되 화성적으로 중요한 지점 20-40행 이상
- 단순한 I-IV-V-I 나열 절대 금지 — 이 곡 고유의 화성 어법을 구체적으로 보여줘야 함
- 반드시 포함할 것: 조바꿈 지점, 감7화음, 증6화음, 나폴리탄, 페달 포인트, 2차 도미넌트, 차용화음(modal mixture)
- roman_numeral은 전위형까지 표기 (예: V6/5, viio7/V)
- 바로크 곡은 순환5도 진행, 대위법적 종지 패턴을 상세히
- 고전파 곡은 기능 화성의 구체적 진행을 상세히
- 낭만파 이후는 반음계 화성, 감화음 연쇄, 3도 관계 조바꿈 등을 상세히`;
}

// ── Phase 4a: 연습법 + 추천 연주 ─────────────────────────────

export function createPhase4aPrompt(
  composer: string,
  title: string,
  opus: string,
  sectionNames: string[],
  referenceData?: string,
): string {
  const refSection = referenceData
    ? `\n\n[🔍 레퍼런스 데이터 — 연습법·연주 해석의 1차 출처]\n${referenceData}\n\n🚨 위 학술자료에 연주법, 테크닉, 페달링, 터치, 연습 방법, 해석 가이드, 추천 연주자 정보가 있으면 반드시 반영하십시오.`
    : "";

  return `당신은 세계적인 피아노 교수법 전문가이자 연주 코치입니다.

작곡가: ${composer}
곡 제목: ${title}
작품번호: ${opus}

이 곡의 구조 (${sectionNames.length}개 섹션):
${sectionNames.map((s, i) => `${i + 1}. ${s}`).join("\n")}
${refSection}

${KOREAN_OUTPUT_RULE}
${HALLUCINATION_GUARD}

[Phase 4a: 연습법 + 추천 연주]

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
- "느리게 연습하세요", "반복 연습하세요", "천천히 시작하세요" 등 일반론
- 손가락 번호 (운지법)
- 동일한 솔루션을 여러 섹션에 반복 — 각 section_guide의 guide 텍스트가 80% 이상 유사하면 실패
- YouTube URL 추측 생성
- "프레이즈를 잘 살려서 연주하세요", "균일한 터치로 연습하세요" 같은 어디에나 적용되는 일반 조언

[연습법 표현 원칙]
- 손가락 번호 대신: 손목·팔 동작, 터치 방식, 신체 감각, 비유
- 이 곡에만 해당하는 구체적 연습 아이디어
- 각 섹션의 guide는 해당 섹션의 고유한 기술적 도전을 다뤄야 함
  예: "Allemande의 16분음표 연속 패시지에서 손목 회전을 이용한 무게 이동",
      "Sarabande의 장식음 처리 시 팔 전체의 유연한 낙하 활용"
- 같은 곡의 다른 섹션과 동일한 연습법 지시 금지

JSON만 출력:
{
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
      "section": "섹션명 (각 섹션별 1개씩)",
      "guide": "8-15문장. 🚨필수: (1) 이 섹션의 고유한 음형·리듬·텍스처 설명, (2) 이 섹션에서만 나타나는 기술적 난점과 그 해결을 위한 구체적 연습 방법, (3) 이 섹션의 표현·감정 목표와 구현 방법. 다른 섹션의 guide와 문장이 겹치면 실패. 손가락 번호 금지."
    }
  ],
  "recommended_performances_v2": [
    {
      "artist": "연주자 이름 (한국인은 한글, 외국인은 영어)",
      "year": "녹음 연도 (예: 1965, 2018). 정확히 모르면 대략적 시기 (예: 1970년대). 빈 문자열 금지.",
      "comment": "이 연주자의 해석 특징 + 이 곡에서 특별한 이유 2-3문장. 구체적으로.",
      "youtube_url": "확실한 URL만, 불확실하면 빈 문자열"
    }
  ]
}

추천 연주 (5-7명, 다양성 필수):
- 반드시 아래 카테고리에서 골고루 선정:
  1) 한국 거장/신예 (백건우, 조성진, 임윤찬, 손열음, 김선욱, 선우예권, 김다솔 등 해당 곡과 관련 있는 한국 피아니스트 1-2명)
  2) 20세기 레전드 (Horowitz, Richter, Arrau, Rubinstein, Brendel, Gilels, Michelangeli, Cortot, Gould 등)
  3) 현대 세계적 거장 (Argerich, Pollini, Zimerman, Perahia, Lupu, Uchida, Sokolov, Schiff 등)
  4) 차세대 스타 (Trifonov, Yuja Wang, Hamelin, Kissin, Lang Lang, Buniatishvili, Levit 등)
- 해당 작곡가·곡을 특별히 잘 표현하는 것으로 정평 있는 연주자를 우선 선정
- 같은 시대·스타일의 연주자만 나열하지 말고, 해석 스타일이 대비되는 연주자를 포함
- 튜토리얼/레슨/아마추어 절대 금지
- comment에 "이 연주자가 이 곡을 어떻게 해석하는지" 구체적으로 서술
- 🚨 year 필드: 반드시 녹음 연도 기재. 정확한 연도 모르면 "1970년대", "2010년대 초" 등 대략적 시기라도 기재. 빈 문자열("") 금지.`;
}

// ── Phase 4b: 4주 루틴 (별도 호출) ─────────────────────────────

export function createPhase4bPrompt(
  composer: string,
  title: string,
  opus: string,
  sectionNames: string[],
  referenceData?: string,
): string {
  const refSection = referenceData
    ? `\n\n[🔍 레퍼런스 데이터]\n${referenceData.substring(0, 10000)}\n\n🚨 학술자료에 연습 순서, 단계별 학습 방법이 있으면 반드시 반영.`
    : "";

  return `당신은 세계적인 피아노 교수법 전문가이자 연주 코치입니다.

작곡가: ${composer}
곡 제목: ${title}
작품번호: ${opus}

이 곡의 구조 (${sectionNames.length}개 섹션):
${sectionNames.map((s, i) => `${i + 1}. ${s}`).join("\n")}
${refSection}

${KOREAN_OUTPUT_RULE}
${HALLUCINATION_GUARD}

[Phase 4b: 4주 연습 루틴]

이 곡(${composer}, ${title})을 4주 동안 체계적으로 완성하는 일일 연습 계획을 작성하십시오.

🚨🚨🚨 가장 중요한 규칙:
- 반드시 4주 × 7일 = 총 28일 모두 작성
- 각 주차의 days 배열에 정확히 7개 항목 필수
- days 배열이 7개 미만이면 절대 허용 불가
- 각 일차의 tasks는 정확히 5개

JSON만 출력:
{
  "weekly_routine": [
    {
      "week": 1,
      "theme": "1주차 테마 (예: 기본 음형 익히기와 구조 파악)",
      "days": [
        { "day": "1일차", "focus": "집중 구간 + 구체적 목표", "tasks": ["기본기: 이 곡의 조성 스케일/아르페지오 + 구체적 부가 연습", "기교: 양손 따로 연습 → 구체적 테크닉", "표현: 구체적 다이내믹/터치 실험", "리듬·형식: 구체적 박자감/구조 인식 과제", "연결 연주: 이전 구간과의 연결"] },
        { "day": "2일차", "focus": "다른 구간 + 다른 목표", "tasks": ["기본기: ...", "기교: 양손 따로 연습 → ...", "표현: ...", "리듬·형식: ...", "연결 연주: ..."] },
        { "day": "3일차", "focus": "...", "tasks": ["기본기: ...", "기교: 양손 따로 연습 → ...", "표현: ...", "리듬·형식: ...", "연결 연주: ..."] },
        { "day": "4일차", "focus": "...", "tasks": ["기본기: ...", "기교: 양손 따로 연습 → ...", "표현: ...", "리듬·형식: ...", "연결 연주: ..."] },
        { "day": "5일차", "focus": "...", "tasks": ["기본기: ...", "기교: 양손 따로 연습 → ...", "표현: ...", "리듬·형식: ...", "연결 연주: ..."] },
        { "day": "6일차", "focus": "...", "tasks": ["기본기: ...", "기교: 양손 따로 연습 → ...", "표현: ...", "리듬·형식: ...", "연결 연주: ..."] },
        { "day": "7일차", "focus": "1주차 복습 + 점검", "tasks": ["기본기: ...", "기교: 양손 따로 연습 → ...", "표현: ...", "리듬·형식: ...", "연결 연주: ..."] }
      ]
    },
    {
      "week": 2,
      "theme": "2주차 테마 (예: 테크닉 심화와 양손 합치기)",
      "days": [
        { "day": "1일차", "focus": "...", "tasks": ["...", "...", "...", "...", "..."] },
        { "day": "2일차", "focus": "...", "tasks": ["...", "...", "...", "...", "..."] },
        { "day": "3일차", "focus": "...", "tasks": ["...", "...", "...", "...", "..."] },
        { "day": "4일차", "focus": "...", "tasks": ["...", "...", "...", "...", "..."] },
        { "day": "5일차", "focus": "...", "tasks": ["...", "...", "...", "...", "..."] },
        { "day": "6일차", "focus": "...", "tasks": ["...", "...", "...", "...", "..."] },
        { "day": "7일차", "focus": "...", "tasks": ["...", "...", "...", "...", "..."] }
      ]
    },
    {
      "week": 3,
      "theme": "3주차 테마 (예: 표현·해석 다듬기)",
      "days": [
        { "day": "1일차", "focus": "...", "tasks": ["...", "...", "...", "...", "..."] },
        { "day": "2일차", "focus": "...", "tasks": ["...", "...", "...", "...", "..."] },
        { "day": "3일차", "focus": "...", "tasks": ["...", "...", "...", "...", "..."] },
        { "day": "4일차", "focus": "...", "tasks": ["...", "...", "...", "...", "..."] },
        { "day": "5일차", "focus": "...", "tasks": ["...", "...", "...", "...", "..."] },
        { "day": "6일차", "focus": "...", "tasks": ["...", "...", "...", "...", "..."] },
        { "day": "7일차", "focus": "...", "tasks": ["...", "...", "...", "...", "..."] }
      ]
    },
    {
      "week": 4,
      "theme": "4주차 테마 (예: 통합 연주와 완성)",
      "days": [
        { "day": "1일차", "focus": "...", "tasks": ["...", "...", "...", "...", "..."] },
        { "day": "2일차", "focus": "...", "tasks": ["...", "...", "...", "...", "..."] },
        { "day": "3일차", "focus": "...", "tasks": ["...", "...", "...", "...", "..."] },
        { "day": "4일차", "focus": "...", "tasks": ["...", "...", "...", "...", "..."] },
        { "day": "5일차", "focus": "...", "tasks": ["...", "...", "...", "...", "..."] },
        { "day": "6일차", "focus": "...", "tasks": ["...", "...", "...", "...", "..."] },
        { "day": "7일차", "focus": "최종 통합 연주 + 자기 평가", "tasks": ["...", "...", "...", "...", "..."] }
      ]
    }
  ]
}

필수 규칙:
- tasks는 정확히 5개: 기본기 / 기교 / 표현 / 리듬·형식 / 연결 연주
- 기교: 반드시 "양손 따로 연습 →"으로 시작
- 시간(분) 표기 금지
- 각 일차별 focus와 tasks는 서로 다른 구간/목표를 다뤄야 함 (7일이 모두 동일하면 실패)
- 주차별 난이도 진행: 1주차(기초 익히기) → 2주차(테크닉 심화) → 3주차(표현·해석) → 4주차(통합·완성)
- 이 곡의 각 섹션(${sectionNames.join(", ")})을 4주에 걸쳐 고르게 다뤄야 함`;
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
    "recommended_performances": [{ "artist": "", "year": "", "comment": "" }]  // 5-7명: 한국(백건우/조성진/임윤찬/손열음 등) 1-2 + 레전드(Horowitz/Richter/Arrau 등) 1-2 + 현대거장(Argerich/Zimerman 등) 1-2 + 차세대(Trifonov/Yuja Wang 등) 1
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
    "recommended_performances": [{ "artist": "", "year": "", "comment": "" }]  // 5-7명: 한국(백건우/조성진/임윤찬/손열음 등) 1-2 + 레전드(Horowitz/Richter/Arrau 등) 1-2 + 현대거장(Argerich/Zimerman 등) 1-2 + 차세대(Trifonov/Yuja Wang 등) 1
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
    "recommended_performances": [{ "artist": "", "year": "", "comment": "" }]  // 5-7명: 한국(백건우/조성진/임윤찬/손열음 등) 1-2 + 레전드(Horowitz/Richter/Arrau 등) 1-2 + 현대거장(Argerich/Zimerman 등) 1-2 + 차세대(Trifonov/Yuja Wang 등) 1
  },
  "verification_status": "Verified"
}`;
}
