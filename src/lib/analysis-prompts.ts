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

const KOREAN_OUTPUT_RULE = `🚨 모든 출력은 반드시 한국어로 작성하십시오. (고유명사, 음악 용어만 원어 병기 가능)
🚨 절대 마크다운 서식을 사용하지 마십시오. **bold**, *italic*, ##heading, - list 등 마크다운 문법 금지. 순수 텍스트만 출력할 것.
🚨 일본어(カタカナ, ひらがな, 漢字 음독) 절대 금지. "カデンツ" 같은 일본어 표기 대신 반드시 한국어("카덴차") 또는 원어("Kadenz", "cadenza")를 사용할 것.
🚨 손가락 번호(1-2-3-4-5 운지법) 절대 금지. 오류가 많으므로 운지 지시를 포함하지 말 것. 대신 손목/팔 동작, 터치 방법, 연습 아이디어 등 신체 감각 기반 조언을 할 것.`;

// ── Phase 0: 레퍼런스 데이터 검색 (Perplexity용) ──

export function createReferenceSearchPrompt(composer: string, title: string): string {
  return `I need accurate, verified musical reference data for this classical piano piece:

Composer: ${composer}
Title: ${title}

Search IMSLP, Wikipedia, Henle Verlag, and music theory databases for the following FACTUAL information.

**CRITICAL: If the title contains "No.X" (e.g., "Op.40 No.6"), search for information about THAT SPECIFIC piece only, NOT the entire collection.**

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

**곡의 개요 작성 기준 (아래 예시 수준으로 상세히 작성):**

[예시 1 - 베토벤 소나타 2번 (다악장 소나타)]
- composition_period: "1795년경 빈에서 작곡, 1796년 출판, 스승 요제프 하이든에게 헌정된 세 개의 소나타(Op.2)의 하나."
- tempo_marking: "1악장 Allegro vivace – A장조, 2/4, 소나타 형식. / 2악장 Largo appassionato – D장조, 3/4, 3부/론도적 구조의 느린 악장. / 3악장 Scherzo. Allegretto – A장조, 3/4, 스케르초 + 트리오의 3부분 형식. / 4악장 Rondo. Grazioso – A장조, 4/4, 소나타-론도 형식."

[예시 2 - 슈만 어린이의 정경 Op.15 (소품 모음집 — 소품마다 고유 제목이 있는 경우)]
- composition_period: "1838년 작곡, 클라라에게 보낸 편지에서 영감받은 13개의 성격소품집."
- tempo_marking: "No.1 Von fremden Ländern und Menschen (낯선 나라와 사람들) – G장조, 2/4 / No.2 Curiose Geschichte (신기한 이야기) – D장조, 3/4 / No.3 Hasche-Mann (술래잡기) – B단조, 2/4 / ... / No.7 Träumerei (꿈) – F장조, 4/4 / ... / No.13 Der Dichter spricht (시인이 말하다) – G장조, 4/4"

[예시 3 - 슈만 나비 Op.2 (소품 모음집 — 고유 제목 없이 번호만 있는 경우)]
- composition_period: "1831년경 작곡, 1832년 출판. 장 폴의 소설 '말년의 광란'에서 영감받은 12개의 짧은 성격소품집."
- tempo_marking: "Introduzione: Moderato – D장조, 3/4 / No.1: Waltz – D장조, 3/4 / No.2: Prestissimo – Eb장조, 2/4 / ... / No.12 (Finale): Allegro – D장조, 2/4"

- genre: 장르적 성격을 문장으로 서술 (예: "전형적 고전 소나타지만..." 또는 "12개의 짧은 성격소품으로 이루어진 피아노 모음곡...")
- musical_features: 곡 전체를 관통하는 한 문장 요약

**핵심 규칙:**
- 🚨🚨 **최우선 규칙**: 곡 제목에 "No.X" 등 개별 번호가 명시되어 있으면, 그 **해당 곡 하나만** 분석하십시오. 모음집 전체를 분석하지 마십시오! 예: "Eight Concert Etudes Op.40 No.6" → No.6만 분석. "Kinderszenen Op.15 No.7 Träumerei" → No.7만 분석. tempo_marking에도 해당 곡의 빠르기만 기재하십시오.
- 모음집 전체를 분석하는 경우(제목에 개별 번호가 없는 경우)에만 아래 규칙을 적용:
  - tempo_marking 필드에는 반드시 모든 악장/섹션/소품을 나열할 것
  - 🚨 다악장 소나타/협주곡 → "1악장", "2악장" 표기
  - 🚨 소품 모음집 → 각 소품의 **고유 제목이 있으면 반드시 원어 제목 + 한국어 번역을 함께** 표기 (예: "Träumerei (꿈)", "Pierrot (피에로)"). 고유 제목이 없으면 "No.1", "No.2" 사용. 절대 "악장"이라 부르지 말 것!
  - 🚨 변주곡 → "Theme", "Var.1", "Var.2" 표기
- 단악장 곡이면 전체 구조를 서술
- genre 필드는 장르 한 단어가 아니라, 이 곡의 장르적 성격을 문장으로 서술
- musical_features는 곡 전체를 한두 문장으로 압축한 "핵심 요약"

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
    "composition_period": "작곡·초연 시기 상세 (작곡 연도, 출판 연도, 헌정 정보 등을 포함한 문장)",
    "tempo_marking": "악장 구성 및 빠르기 (모든 악장을 나열: 1악장 Allegro – A장조, 2/4, 소나타 형식. / 2악장 ...)",
    "genre": "장르적 성격 (문장으로 서술)",
    "form": "전체 형식 개요",
    "musical_features": ["이 곡 전체를 관통하는 음악적 특징 한두 문장 요약"]
  }
}

JSON만 출력하십시오.`;
}

// ── Phase 2: 인문학적 배경 (생애, 시대, 곡 특징) ──

export function createPhase2Prompt(
  composer: string,
  title: string,
  opus: string,
  verifiedMeta?: { composer: string; title: string; opus: string; key: string },
): string {
  const metaVerification = verifiedMeta
    ? `\n\n[🔒 Phase 1 검증 기준값 — 아래 정보를 정답으로 간주하고, 이와 다른 정보를 생성하지 마십시오]
- 작곡가: ${verifiedMeta.composer}
- 곡 제목: ${verifiedMeta.title}
- 작품번호: ${verifiedMeta.opus}
- 조성: ${verifiedMeta.key}`
    : '';

  return `당신은 세계적인 음악학자(Musicologist)이자 음악사 전문가입니다.

작곡가: ${composer}
곡 제목: ${title}
작품번호: ${opus}
${metaVerification}

${KOREAN_OUTPUT_RULE}

**[Phase 2 임무: 인문학적 배경 — 작곡가 생애, 시대적 배경, 곡의 특징]**

🚨🚨 **최우선 규칙**: 곡 제목에 "No.X" 등 개별 번호가 명시되어 있으면, 그 **해당 곡 하나만** 분석하십시오. 모음집 전체를 분석하지 마십시오! 예: "Eight Concert Etudes Op.40 No.6" → No.6 Pastorale만 분석.

**참조 문헌:**
- Grove Dictionary of Music and Musicians
- New Grove Online, RILM
- 각 작곡가별 전문 연구서 (예: Chopin → Jim Samson, Eigeldinger / Schumann → John Daverio)
- Urtext 원전판 서문 (Henle, Bärenreiter, Wiener)

**2. 작곡가 생애 작성 기준:**
- summary: 작곡가 생애 전체 요약
- timeline: 3-5개 시기로 나누되, 반드시 "이 곡이 작곡된 시기"를 별도 항목으로 포함
  - 예: "Op.2 시기 (1795-1796) – 이 소나타의 정확한 위치" 같은 식으로, 곡과 직접 연관된 시기를 명시
  - 각 시기 설명에서 해당 시기의 주요 사건, 작품, 예술적 발전 방향을 구체적으로 서술
- at_composition: 이 곡 작곡 당시의 구체적 상황

**3. 시대적 배경 작성 기준:**
- era_characteristics: 음악사적 위치 + 이 곡의 역할 (예: "빈 고전주의가 절정에 이르던 시기...")
- contemporary_composers: 동시대 작곡가와의 관계
- musical_movement: 형식적 실험, 이 곡이 음악사에서 보여주는 혁신/실험적 요소

**4. 곡의 특징 작성 기준 (가장 중요 — 각 구성 단위별 상세 서술):**

🚨 **구성 단위 구분 규칙:**
- 다악장 소나타/협주곡 → "1악장", "2악장" 단위로 서술
- 소품 모음집(Papillons, Kinderszenen, Carnaval 등) → 각 소품의 **고유 제목이 있으면 원어 제목(한국어 번역)** 단위로 서술 (예: "Träumerei (꿈)", "Pierrot (피에로)"). 고유 제목이 없으면 "No.1", "No.2" 사용. 각 소품의 고유한 성격·분위기를 개별적으로 다룰 것. 절대 "악장"이라 부르지 말 것!
- 변주곡 → "주제(Theme)", "변주 1", "변주 2" 단위로 서술

- composition_background (4-1. 작곡 배경 및 예술적 맥락): 작곡 동기, 헌정, 출판 경위, 예술적 위치
- form_and_structure (4-2. 음악 형식·구조적 특징): 반드시 각 구성 단위별로 서술할 것!
  다악장 예: "1악장 Allegro vivace – 소나타 형식. 경쾌한 동기... / 2악장 Largo appassionato..."
  소품집 예: "No.1 Moderato – D장조, 왈츠 형식. 가면무도회 개시를 암시... / No.2 Prestissimo – Eb장조, 격렬한 아르페지오..."
  각 단위의 주제 성격, 전개 방식, 구조적 특징을 개별 서술
- technique (4-3. 기교적 특징): 각 구성 단위별 핵심 기교를 서술. 절대 손가락 번호 금지!
- literary_dramatic (4-4. 문학적·극적 특징): 각 구성 단위별 문학적/극적 성격을 서술
- conclusion: 이 곡의 음악사적 의의

${SELF_VERIFICATION_PROTOCOL}

JSON만 출력:
{
  "composer_life": {
    "summary": "한국어 8-10문장 — 작곡가 생애 전체 요약",
    "timeline": [
      { "period": "시기명 + 연도 (예: 본 시절·유년기 (1770-1792))", "description": "한국어 5-7문장 — 해당 시기 상세 설명" },
      { "period": "이 곡의 시기 + 연도 (예: Op.2 시기 (1795-1796) – 이 소나타의 정확한 위치)", "description": "한국어 5-7문장 — 이 곡이 작곡된 맥락" },
      { "period": "이후 시기 + 연도", "description": "한국어 5-7문장" }
    ],
    "at_composition": "한국어 5-8문장 — 작곡 당시 구체적 상황"
  },
  "historical_background": {
    "era_characteristics": "한국어 5-8문장 — 음악사적 위치 + 이 작곡가의 역할",
    "contemporary_composers": "한국어 5-7문장 — 동시대 작곡가와의 관계/영향",
    "musical_movement": "한국어 5-7문장 — 이 곡이 보여주는 형식적 실험/혁신"
  },
  "song_characteristics": {
    "composition_background": "한국어 5-8문장 — 4-1. 작곡 배경 및 예술적 맥락",
    "form_and_structure": "한국어 15-25문장 — 4-2. 각 구성 단위별 음악 형식·구조 상세 서술 (소나타→악장별, 소품집→각 소품별, 변주곡→각 변주별)",
    "technique": "한국어 10-15문장 — 4-3. 각 구성 단위별 기교적 특징 (손가락 번호 절대 금지! 터치/동작/호흡 중심)",
    "literary_dramatic": "한국어 10-15문장 — 4-4. 각 구성 단위별 문학적·극적 특징",
    "conclusion": "한국어 5-7문장 — 이 곡의 음악사적 의의와 현대적 가치"
  }
}

JSON만 출력하십시오.`;
}

// ── Phase 3: 구조/화성 분석 ──

export function createPhase3Prompt(
  composer: string,
  title: string,
  opus: string,
  musicXml?: string,
  referenceData?: string,
  verifiedMeta?: { composer: string; title: string; opus: string; key: string },
): string {
  const xmlSection = musicXml
    ? `\n\n[MusicXML 데이터]\n아래 MusicXML에서 정확한 마디 번호, 조성, 박자, 음형을 직접 읽어 사용하십시오.\n\`\`\`xml\n${musicXml.substring(0, 60000)}\n\`\`\``
    : '';

  const refSection = referenceData
    ? `\n\n[🔍 웹 검색 레퍼런스 데이터 — 이 데이터가 1차 출처입니다. 반드시 사용하십시오.]\n${referenceData}\n\n🚨 절대 규칙:\n1. 레퍼런스에 명시된 조성(key), 박자(time signature), 템포(tempo marking), 마디 수를 **그대로** 사용하십시오.\n2. 레퍼런스에 "Key: D major, Time signature: 2/2"라고 되어 있으면, key_signature는 "D major", time_signature는 "2/2"여야 합니다.\n3. 레퍼런스에 "typically 6/8" 또는 "approx. 87 measures" 등이 있으면, 그 값을 그대로 사용하십시오 (6/8, mm. 1-87).\n4. "문헌 확인 필요"는 레퍼런스에 해당 정보가 전혀 없을 때만 사용하십시오.\n5. 레퍼런스와 상충하는 정보를 절대 생성하지 마십시오.`
    : '\n\n🚨 확실하지 않은 조성, 박자, 마디 번호는 추측하지 말고 "문헌 확인 필요"로 표기하십시오.';

  const metaVerification = verifiedMeta
    ? `\n\n[🔒 Phase 1 검증 기준값 — 아래 정보를 정답으로 간주하고, 이와 다른 정보를 생성하지 마십시오]
- 작곡가: ${verifiedMeta.composer}
- 곡 제목: ${verifiedMeta.title}
- 작품번호: ${verifiedMeta.opus}
- 조성: ${verifiedMeta.key}`
    : '';

  return `당신은 세계적인 음악 이론가(Music Theorist)이자 화성학 전문가입니다.

작곡가: ${composer}
곡 제목: ${title}
작품번호: ${opus}
${metaVerification}
${xmlSection}
${refSection}

${KOREAN_OUTPUT_RULE}

**[Phase 3 임무: 구조 분석 및 분위기 분석]**

🚨🚨 **최우선 규칙**: 곡 제목에 "No.X" 등 개별 번호가 명시되어 있으면, 그 **해당 곡 하나만** 분석하십시오. 모음집 전체를 분석하지 마십시오!

**🚨 핵심 원칙: 마디 번호 대신 "구간 이름 + 역할" 중심으로 분석할 것!**

각 구성 단위의 내부를 구간별로 나누어, 다음 4가지 관점을 서술하십시오:
1. 구간 이름 (section 필드): 구성 단위 + 구간명
2. 역할 (measures 필드): 이 구간의 형식적 역할을 서술 (예: "주제 제시, 성격 규정", "조성 이동, 긴장 형성", "회귀·강화")
3. 조성·화성 이미지 (key_signature 필드): 조성과 화성 진행의 핵심 (예: "A장조, 명료한 I–V 진행, 하행 삼화음·스케일")
4. 분위기·표현 (mood 필드 + description 필드)

🚨 **구성 단위 구분 — 반드시 따를 것:**
- 다악장 소나타/협주곡 → section에 "1악장:", "2악장:" 접두어 사용
  예: "1악장: 도입·제1주제 영역", "2악장: A 주제 (첫 등장)"
- 소품 모음집(Papillons, Kinderszenen, Carnaval, Waldszenen 등) → 각 소품의 **고유 제목이 있으면 원어 제목(한국어 번역)을 section 접두어로 사용**. 고유 제목이 없으면 "No.N:" 사용. 절대 "악장"이라 부르지 말 것!
  고유 제목 있는 예: "Träumerei (꿈): 주제 제시", "Pierrot (피에로): A 주제 영역"
  고유 제목 없는 예: "No.1: A 주제 영역", "No.2: 도입부"
  각 소품은 독립된 성격소품이며, 소품별 고유한 성격·조성·분위기를 개별적으로 분석할 것
- 변주곡 → "주제:", "Var.1:", "Var.2:" 접두어 사용

**예시 1 (베토벤 소나타 1악장):**
- section: "1악장: 도입·제1주제 영역"
- measures: "주제 제시, 성격 규정"
- key_signature: "A장조, 명료한 I–V 진행, 하행 삼화음·스케일"
- time_signature: "2/4"
- tempo: "Allegro vivace"
- mood: "명랑·유쾌, 구조적으로 치밀한 활력"
- description: "경쾌한 동기, 삼도·육도 도약, 스케일 진행이 결합된 활달한 제1주제."

**예시 2 (슈만 어린이의 정경 — 고유 제목이 있는 소품집):**
- section: "Träumerei (꿈): 주제 제시"
- measures: "서정적 주제 제시, 몽환적 성격 규정"
- key_signature: "F장조, 부드러운 I-IV-V 진행"
- time_signature: "4/4"
- tempo: "Langsam"
- mood: "몽환적이고 서정적인 꿈결, 순수한 동심"
- description: "넓은 아치형 선율이 부드럽게 펼쳐지며, 어린 시절의 꿈을 그리는 가장 유명한 성격소품."

**예시 3 (슈만 나비 — 고유 제목 없이 번호만 있는 소품집):**
- section: "No.1: A 주제 영역"
- measures: "왈츠 주제 제시, 무도회 성격 규정"
- key_signature: "D장조, 명료한 I-V-I 순환"
- time_signature: "3/4"
- tempo: "Waltz"
- mood: "우아하고 경쾌한 왈츠, 나비의 가벼운 날갯짓"
- description: "왈츠 리듬의 주제 동기 반복, 나비의 날갯짓 같은 가벼운 텍스처."

**🚨 절대 규칙:**
- 모든 구성 단위의 내부 구간을 빠짐없이 나열할 것 (단위당 2-8개 구간)
- 소나타 형식: 도입·제1주제, 전이부, 제2주제, 종결부, 전개부, 재현부·코다
- 론도 형식: A 주제, B 에피소드, A' 회귀, C 에피소드, A'' + 코다
- 스케르초: 스케르초 주제, 트리오, 스케르초 회귀
- 변주곡: 주제 + 각 변주
- 짧은 소품(성격소품): A 주제, 대비부/중간부, 재현/코다 (소품 길이에 맞게 2-4개 구간)
- measures 필드에는 마디 번호가 아닌 "역할/기능"을 서술할 것
- 하나라도 누락하면 분석 실패

${SELF_VERIFICATION_PROTOCOL}

JSON만 출력:
{
  "structure_analysis_v2": {
    "sections": [
      {
        "section": "구성단위: 구간 이름 (소나타 예: '1악장: 도입·제1주제', 소품집 예: 'Träumerei (꿈): 주제 제시' 또는 'No.1: A 주제 영역')",
        "measures": "이 구간의 역할 (예: 주제 제시, 성격 규정)",
        "key_signature": "조성·화성 이미지 (예: A장조, 명료한 I–V 진행)",
        "time_signature": "박자 (예: 2/4)",
        "tempo": "템포 지시어 (예: Allegro vivace)",
        "mood": "한국어 분위기·표현 요약",
        "description": "한국어 1-2문장 — 음악적 특징, 주요 동기, 텍스처 상세"
      }
    ],
    "harmony_table": [
      {
        "measure": "구간명 (소나타 예: '1악장 제시부 도입', 소품집 예: 'No.3 A 주제')",
        "beat": "위치 설명",
        "chord": "코드명 (예: Gm, D7, Eb+)",
        "roman_numeral": "로마숫자 분석 (예: i, V7, bVI)",
        "function": "기능 (예: Tonic, Dominant, Neapolitan)",
        "voice_leading": "성부진행 특이사항",
        "pedal": "페달 포인트 여부",
        "note": "한국어 비고"
      }
    ]
  }
}

**화성 분석 테이블 지침:**
- 전체 곡을 커버하되, **화성적으로 중요한 지점** 위주로 (15-30행)
- 조바꿈, 감7화음, 증6화음, 나폴리탄, 페달 포인트 등 주목할 화성 반드시 포함

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

**[Phase 4 임무: 연습법 + 4주(28일) 루틴 + 추천 연주]**

🚨🚨 **최우선 규칙**: 곡 제목에 "No.X" 등 개별 번호가 명시되어 있으면, 그 **해당 곡 하나만** 분석하십시오. 모음집 전체를 분석하지 마십시오!

**절대 금지:**
- "느리게 연습하세요", "반복 연습하세요" 등 일반론
- 손가락 번호(1-2-3-4-5 운지법) 절대 금지 — 오류가 많으므로 제외
- 동일한 솔루션을 여러 섹션에 반복 사용
- YouTube URL 추측/생성 (확실한 경우만 포함)

**연습법 작성 원칙:**
- 손가락 번호 대신: 손목/팔 동작, 터치 방법, 신체 감각, 창의적 비유를 사용
- 예: "손가락 끝은 가볍게, 손목과 팔은 더 가벼운 방향(위쪽)으로 움직여, 소리가 바닥으로 눌리지 않고 공중으로 뜨는 느낌을 추구"
- 예: "주제 동기를 떼어내어 다양한 리듬(긴–짧–짧 등)으로 연습해 손의 균형을 잡기"
- 예: "오른손 선율만 노래처럼 불러보고, 왼손·내성은 별도로 코러스처럼 연습"

${SELF_VERIFICATION_PROTOCOL}

JSON만 출력:
{
  "practice_method": {
    "technique_summary": [
      { "category": "음정", "items": ["이 곡에 필요한 음정 연습 — 스케일, 아르페지오, 도약 등 구체적 항목"] },
      { "category": "기본기", "items": ["이 곡에 필요한 기본기 — 터치, 손가락 독립, 타건 방법 등"] },
      { "category": "기교 테크닉", "items": ["이 곡의 핵심 기교 — 빠른 패시지, 옥타브, 트릴, 알베르티 베이스 등"] },
      { "category": "감정표현", "items": ["이 곡의 감정 표현 — 프레이즈, 다이내믹, 호흡, 루바토 등"] },
      { "category": "리듬감각", "items": ["이 곡의 리듬 — 박자감, 악장별 리듬 특성 등"] },
      { "category": "형식인식", "items": ["이 곡의 형식 — 구간별 구조 파악, 연습 시 형식 활용법 등"] }
    ],
    "section_guides": [
      {
        "section": "악장명 (예: 1악장 Allegro vivace)",
        "guide": "한국어 8-15문장 — 이 악장의 핵심 기술 + 구체적 연습 아이디어. 손가락 번호 금지! 대신 창의적 연습법, 신체 동작, 비유적 표현을 사용. 예: 주제 동기를 떼어내어 다양한 리듬으로 연습, 화성 진행만 잡고 음형을 얹는 순서로 연습, 손뼉·발 디딤으로 리듬만 먼저 익히기 등."
      }
    ],
    "weekly_routine": [
      {
        "week": 1,
        "theme": "1주차 테마 (예: 1악장 완성)",
        "days": [
          {
            "day": "1일차",
            "focus": "집중 영역 (예: 1악장 도입·제1주제)",
            "tasks": [
              "기본기: 조성 스케일 + 관련 기초 연습",
              "기교: 양손 따로 연습 → 해당 구간 핵심 테크닉",
              "표현: 다이내믹/터치/프레이즈 실험",
              "리듬·형식: 박자감/구조 인식 연습",
              "연결 연주: 이전 구간과 연결하여 통과"
            ]
          },
          {
            "day": "2일차",
            "focus": "집중 영역",
            "tasks": ["기본기: ...", "기교: 양손 따로 연습 → ...", "표현: ...", "리듬·형식: ...", "연결 연주: ..."]
          }
        ]
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

**4주(28일) 루틴 상세 지침:**
- 반드시 4주, 각 주 7일, 총 28일을 모두 작성할 것!
- 각 일의 tasks는 정확히 5개: "기본기:", "기교:", "표현:", "리듬·형식:", "연결 연주:"
- 시간(분) 표기 금지! 간결한 한 줄로 핵심만 서술
- day 필드: "N일차" 형식 (예: "1일차", "8일차")
- focus 필드: "해당 구간명 + 목표" (예: "1악장 도입·제1주제", "2악장 A주제 완벽화")

**각 task 작성 형식 (아래 예시를 정확히 따를 것):**
- 기본기: 해당일 구간에 맞는 조성 스케일/아르페지오 + 부가 연습 (예: "D장조 스케일(레가토, pp→ff)")
- 기교: 반드시 "양손 따로 연습 →" 으로 시작 + 해당 구간 핵심 테크닉 (예: "양손 따로 연습 → 보이싱 (상성부/중성부/베이스 구분)")
- 표현: 다이내믹/터치/프레이즈/대비 실험 (예: "A→B 전환 극적 대비 (터치·템포 변화 실험)")
- 리듬·형식: 박자감/구조 인식/메트로놈 (예: "론도적 구조(A-B-C-A) 머릿속 지도 그리기")
- 연결 연주: 이전 구간과 연결하여 흐름 연습 (예: "1악장 가볍게 + 2악장 A주제")

**실제 예시 (2주차 8-10일차):**
8일차 focus: "2악장 A주제 완벽화"
  "기본기: D장조 스케일(레가토, pp→ff)"
  "기교: 양손 따로 연습 → 보이싱 (상성부/중성부/베이스 구분)"
  "표현: A주제 노래하듯 + 크레센도 실험"
  "리듬·형식: A-B-A 구조 악보에 색연필 표시"
  "연결 연주: 1악장 가볍게 + 2악장 A주제"

9일차 focus: "2악장 B에피소드"
  "기본기: B단조 스케일 + 크로마틱"
  "기교: 양손 따로 연습 → 격정적 화음 (다이내믹 극대화)"
  "표현: A→B 전환 극적 대비 (터치·템포 변화 실험)"
  "리듬·형식: 3/4 내부 리듬(1+2+3 세분화)"
  "연결 연주: 2악장 A-B-A 전체 흐름"

10일차 focus: "2악장 C에피소드"
  "기본기: F#단조 스케일 + 아르페지오"
  "기교: 양손 따로 연습 → 대위법 성부 (각 성부 따로→합)"
  "표현: 성부별 음색 차별화 (멜로디/코러스/베이스)"
  "리듬·형식: 론도적 구조(A-B-C-A) 머릿속 지도 그리기"
  "연결 연주: 2악장 전체 앞뒤 연결"

**주차별 커리큘럼:**
- 1주차 (1-7일차): 첫 번째 악장 완성
  - 매일 새 구간을 하나씩 추가해가며 확장
- 2주차 (8-14일차): 두 번째 악장 완성 + 세 번째 악장 시작
- 3주차 (15-21일차): 나머지 악장 완성 + 암보 시작
- 4주차 (22-28일차): 전곡 통과 + 무대 완성

단악장 곡이면 1주차부터 구간별로 나누어 진행.

**추천 연주 (필수 준수):**
- 반드시 세계적으로 인정받는 프로 연주자(피아니스트)의 공연/녹음만 추천할 것
- 예시: Martha Argerich, Krystian Zimerman, Maurizio Pollini, Vladimir Horowitz, Sviatoslav Richter, Lang Lang, Yuja Wang, Daniil Trifonov, Grigory Sokolov, Claudio Arrau 등
- 절대 금지: 튜토리얼 채널, 레슨 영상, 아마추어 연주, 무명 연주자
- 3-5개의 명연주를 추천하되, 다양한 해석 스타일 포함

JSON만 출력하십시오.`;
}

// ── 기존 호환 프롬프트 (route.ts에서 이전) ──

/** 소품집/모음곡 형태 감지 (악장이 아닌 개별 소품으로 구성된 작품) */
export function isCharacterPieceCollection(title: string): boolean {
  const lower = title.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const collectionKeywords = [
    "papillons", "kinderszenen", "scenes from childhood",
    "carnaval", "kreisleriana", "waldszenen",
    "novelletten", "albumblatter", "bunte blatter",
    "phantasiestucke", "fantasiestucke", "nachtstucke",
    "pictures at an exhibition", "전람회의 그림",
    "goyescas", "iberia",
    "annees de pelerinage", "순례의 해",
    "preludes op.28", "preludes, op.28",
    "etudes-tableaux", "études-tableaux",
    "well-tempered", "평균율", "wohltemperierte",
    "songs without words", "무언가",
    "moments musicaux", "impromptus",
    "consolations", "liebestraume",
  ];
  return collectionKeywords.some((k) => lower.includes(k));
}

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

이 곡의 **모든 구성 단위**를 빠짐없이 분석하십시오.

🚨 **절대 규칙**: 하나라도 누락하면 분석 실패로 간주합니다.
- 변주곡 → Theme + 모든 Variation (Var.1, Var.2, ...)
- 소품 모음집(Papillons, Kinderszenen, Carnaval 등) → 각 소품의 **고유 제목이 있으면 원어 제목(한국어 번역)으로** 표기 (예: "Träumerei (꿈)", "Pierrot (피에로)"). 고유 제목이 없으면 "No.1", "No.2" 사용. 절대 "악장"이라 부르지 말 것! 각 소품의 고유한 성격을 개별 분석
- 소나타 다악장 → 각 악장 내부 구조까지 (1악장, 2악장, ...)

각 항목에 포함할 내용:
- section: 형식에 맞는 섹션명 (소나타: "1악장: ...", 소품집 고유제목: "Träumerei (꿈): ...", 소품집 번호: "No.1: ...", 변주곡: "Var.1: ...")
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
