import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getCachedAnalysis, saveCachedAnalysis, deleteCachedAnalysis } from "@/lib/song-analysis-db";
import { supabaseServer } from "@/lib/supabase-server";
import type {
  SongAnalysis,
  AnalyzeSongRequest,
  AnalyzeSongResponse,
  DifficultyLevel,
  VerificationStatus,
} from "@/types/song-analysis";

/** OpenAI 클라이언트 생성 */
function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/** JSON 블록 추출 */
function extractJSON(text: string): string {
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlockMatch) return jsonBlockMatch[1].trim();
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0].trim();
  return text.trim();
}

/** 고유 ID 생성 */
function generateId(): string {
  return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/** "확인 필요" 문구 필터링 */
function filterNeedsReview(text: string | undefined): string | undefined {
  if (!text) return undefined;
  if (text.includes("확인 필요") || text.includes("문헌 확인") || text === "확인 필요") {
    return undefined;
  }
  return text;
}

/** 대형 작품 감지 (10개 이상 섹션이 예상되는 작품) */
function isLargeWork(title: string): boolean {
  const lower = title.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents for matching
  // Variations
  if (lower.includes("variation") || lower.includes("변주")) return true;
  // Known large multi-section works
  const largeKeywords = [
    "kreisleriana", "kinderszenen", "carnaval", "papillons", "waldszenen",
    "novelletten", "études-tableaux", "etudes-tableaux", "etudes d'execution",
    "transcendental", "paganini etude", "preludes op.28", "preludes, op.28",
    "well-tempered", "평균율", "wohltemperierte", "scenes from childhood",
    "pictures at an exhibition", "전람회의 그림", "goyescas", "iberia",
    "annees de pelerinage", "순례의 해", "goldberg", "diabelli",
    "enigma", "symphonic etudes", "교향적 연습곡",
    // Known variation works without "variation" in the title
    "festin d'esope", "festin d esope", "le festin",
    "rhapsody on a theme", "rapsodie sur un theme",
    "enigma", "chaconne", "passacaglia",
  ];
  return largeKeywords.some((k) => lower.includes(k));
}

/** 구조 분석 전용 프롬프트 (대형 작품용 Call 1) */
function createStructureOnlyPrompt(composer: string, title: string): string {
  return `당신은 세계적인 음악학자(Musicologist)입니다.

작곡가: ${composer}
곡 제목: ${title}

🚨 **모든 출력은 반드시 한국어로 작성하십시오.** (고유명사, 음악 용어 원어 병기 가능)

이 곡의 **모든 섹션/악장/변주/소품**을 빠짐없이 분석하십시오.

🚨 **절대 규칙**: 하나라도 누락하면 분석 실패로 간주합니다.
- 변주곡 → Theme + 모든 Variation (예: 25개 변주면 반드시 Theme + Variation 1~25 = 26개 항목)
- 모음곡/다곡 구성 → 모든 곡을 개별 항목으로
- 소나타 다악장 → 각 악장 내부 구조까지

**형식별 용어:**
- [변주곡]: Theme, Variation 1, Variation 2, ... Variation N
- [소나타]: Exposition, Development, Recapitulation, Coda (다악장이면 각 악장별)
- [론도]: A, B, A', C, A'', Coda
- [3부 형식]: A, B, A', Coda
- [모음곡]: 각 춤곡/소품명

각 항목에 포함할 내용:
- section: 형식에 맞는 섹션명
- measures: 마디 범위 (주요 음표/화성 병기)
- key_tempo: 조성, 박자, 템포 지시
- character: 한 문장 성격 묘사
- description: 1-2문장 핵심 특징 (조성, 리듬, 텍스처)

JSON만 출력:
{
  "structure_analysis": [
    {
      "section": "섹션명",
      "measures": "마디 범위 (화성 정보)",
      "key_tempo": "조성/박자/템포",
      "character": "한 문장 성격",
      "description": "1-2문장 설명"
    }
  ]
}`;
}

/** 추가 technique_tips 프롬프트 (대형 작품용 Call 3+ - 나머지 섹션) */
function createExtraTechniquePrompt(
  composer: string,
  title: string,
  sectionNames: string[],
  batchIndex: number,
  totalBatches: number
): string {
  return `당신은 **세계적인 피아노 교수법 전문가**입니다.

작곡가: ${composer}
곡 제목: ${title}

🚨 **모든 출력은 반드시 한국어로 작성** (고유명사, 음악 용어만 원어 병기 가능)

아래 섹션들에 대한 technique_tips를 작성하십시오 (${batchIndex + 1}/${totalBatches} 배치):

${sectionNames.map((s, i) => `${i + 1}. ${s}`).join("\n")}

**각 섹션마다 반드시 1개의 technique_tip을 작성하십시오. 누락 금지.**

JSON만 출력:
{
  "technique_tips": [
    {
      "section": "섹션명 (mm. 마디범위, 화성 정보)",
      "problem": "한국어로 — 기술적 난관과 물리적 원인을 구체적으로",
      "category": "Physiological/Interpretative/Structural",
      "solution": "한국어로 — 구체적 해결책 (손가락 번호, 동작 등 포함)",
      "practice": "한국어로 — 변형 연습법 (리듬변형, 분리연습 등 구체적으로)"
    }
  ]
}

**카테고리별 솔루션:**
- [Physiological]: 근육 이완, 손가락 독립, 팔 무게, 손목 회전
- [Interpretative]: 페달링, Voicing, Agogic, 루바토
- [Structural]: 형식 호흡법, 섹션별 연습 전략, 템포 설계

**금지:** "느리게 연습하세요", "반복 연습하세요" 등 일반론. 중복 금지.

JSON만 출력하십시오.`;
}

/** 상세 분석 프롬프트 (대형 작품용 Call 2 - 구조는 이미 확보) */
function createDetailAnalysisPrompt(
  composer: string,
  title: string,
  sectionNames: string[]
): string {
  return `당신은 **세계적인 피아노 교수법 전문가**이자 **음악학자**입니다.

작곡가: ${composer}
곡 제목: ${title}

이 곡의 구조는 이미 분석되었습니다 (총 ${sectionNames.length}개 섹션):
${sectionNames.map((s, i) => `${i + 1}. ${s}`).join("\n")}

위 구조를 참고하여 나머지 분석을 수행하십시오.

[🚨 핵심 원칙]
- 🚨 **모든 출력은 반드시 한국어로 작성** (고유명사, 음악 용어만 원어 병기 가능)
- Urtext 원전판 기반 분석
- 일반론 금지, 구체적 솔루션만
- 전문 용어 사용 (원어 병기)
- **각 필드의 내용을 충실하게 작성** — 빈 값이나 생략 금지

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
    "composer_background": "작곡가 배경 — 한국어 5-8문장, 생애/음악적 특징/시대적 위치를 구체적으로",
    "historical_context": "시대적 상황 — 한국어 5-8문장, 당시 음악계 흐름/동시대 작곡가와의 관계",
    "work_background": "작품 배경 — 한국어 5-8문장, 작곡 동기/헌정/초연/출판 정보/음악사적 의의",
    "technique_tips": [
      {
        "section": "섹션명 (mm. 마디, 화성 정보)",
        "problem": "한국어로 — 기술적 난관과 물리적 원인을 구체적으로",
        "category": "Physiological/Interpretative/Structural",
        "solution": "한국어로 — 구체적 해결책 (손가락 번호, 동작 등 포함)",
        "practice": "한국어로 — 변형 연습법 (리듬변형, 분리연습 등 구체적으로)"
      }
    ],
    "musical_interpretation": "음악적 해석 가이드 — 한국어 5-8문장, 곡 전체의 음악적 서사/감정 흐름/표현 방법",
    "recommended_performances": [
      { "artist": "연주자 이름", "year": "연도", "comment": "한국어로 특징 설명" }
    ]
  },
  "verification_status": "Verified/Needs Review"
}

### technique_tips 지침
- 총 ${sectionNames.length}개 섹션 중 **가장 중요한 기술적 난점을 가진 섹션**을 선별
- **최소 ${Math.min(sectionNames.length, 15)}개** technique_tip 작성
- 유사한 성격의 연속 변주는 그룹화 가능 (예: "Variation 3-5 (빠른 패시지 군)")
- 각 tip은 해당 섹션의 **고유한** 음악적 특징에 맞는 솔루션
- **중복 금지**: 동일한 solution/practice를 여러 섹션에 반복 사용 금지

**카테고리별 솔루션:**
- [Physiological]: 근육 이완, 손가락 독립, 팔 무게, 손목 회전
- [Interpretative]: 페달링, Voicing, Agogic, 루바토
- [Structural]: 형식 호흡법, 섹션별 연습 전략, 템포 설계

**금지:** "느리게 연습하세요", "반복 연습하세요" 등 일반론

JSON만 출력하십시오.`;
}

/** MusicXML 기반 분석 프롬프트 (OMR 변환 결과 사용) */
function createMusicXmlPrompt(composer: string, title: string, musicXml: string): string {
  // MusicXML이 너무 길면 핵심 부분만 추출
  const truncated = musicXml.length > 60000 ? musicXml.substring(0, 60000) + "\n<!-- ... truncated -->" : musicXml;

  return `당신은 **세계적인 피아노 교수법 전문가**이자 **음악학자(Musicologist)**입니다.

작곡가: ${composer}
곡 제목: ${title}

아래는 이 곡의 **MusicXML 데이터**입니다. 이것은 악보를 구조화된 텍스트로 변환한 것으로, 모든 음표, 마디, 다이내믹, 아티큘레이션 정보가 포함되어 있습니다.

\`\`\`xml
${truncated}
\`\`\`

[🚨 MusicXML 분석 지침]
- MusicXML의 <measure> 태그에서 **정확한 마디 번호**를 읽어 사용하십시오
- <note>, <pitch>, <duration> 태그에서 **실제 음형과 리듬 패턴**을 파악하십시오
- <dynamics>, <direction> 태그에서 **다이내믹과 연주 지시**를 확인하십시오
- <key>, <time>, <clef> 태그에서 **조성, 박자, 음자리표**를 확인하십시오
- <fingering> 태그가 있으면 **운지법** 정보를 활용하십시오
- 추측이 아닌 **MusicXML 데이터에 기반한 분석**만 하십시오

[🚨 핵심 원칙]
- 🚨 **모든 출력은 반드시 한국어로 작성** (고유명사, 음악 용어만 원어 병기 가능)
- Urtext 원전판 기반 분석 (MusicXML 데이터로 검증)
- 일반론 금지, 구체적 솔루션만
- 전문 용어 사용 (원어 병기)
- **각 필드의 내용을 충실하게 작성** — 빈 값이나 생략 금지

[🚨 절대 규칙: 모든 섹션/악장/변주를 빠짐없이 분석할 것]

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
    "composer_background": "한국어 8-10문장 — 작곡가 생애/음악적 특징/시대적 위치를 구체적으로",
    "historical_context": "한국어 8-10문장 — 당시 음악계 흐름/동시대 작곡가와의 관계",
    "work_background": "한국어 8-10문장 — 작곡 동기/헌정/초연/출판 정보/음악사적 의의",
    "structure_analysis": [
      {
        "section": "섹션명",
        "measures": "마디 범위 (MusicXML에서 확인한 정확한 마디)",
        "key_tempo": "조성/박자/템포",
        "character": "한국어로 한 문장 성격 묘사",
        "description": "한국어로 2-3문장 상세 설명"
      }
    ],
    "technique_tips": [
      {
        "section": "섹션명 (mm. 마디, 화성 정보)",
        "problem": "한국어로 — 기술적 난관과 물리적 원인을 구체적으로",
        "category": "Physiological/Interpretative/Structural",
        "solution": "한국어로 — 구체적 해결책 (손가락 번호, 동작 등 포함)",
        "practice": "한국어로 — 변형 연습법 (리듬변형, 분리연습 등 구체적으로)"
      }
    ],
    "musical_interpretation": "한국어 8-10문장 — 곡 전체의 음악적 서사/감정 흐름/표현 방법",
    "recommended_performances": [
      { "artist": "연주자 이름", "year": "연도", "comment": "한국어로 특징 설명" }
    ]
  },
  "verification_status": "Verified"
}

JSON만 출력하십시오.`;
}

/** 음악학자 프롬프트 생성 - Professional Piano Pedagogy Mode */
function createMusicologistPrompt(composer: string, title: string): string {
  return `당신은 **세계적인 피아노 교수법 전문가**이자 **음악학자(Musicologist)**입니다. 다음 클래식 피아노 작품에 대해 **학술적 근거와 실용적 연주 솔루션**을 제공하십시오.

작곡가: ${composer}
곡 제목: ${title}

[🚨 핵심 원칙 - Professional Piano Pedagogy Mode]

**Step 1. 문헌 데이터 우선 참조 (Grounding)**
- Urtext(원전판: Henle, Bärenreiter, Wiener 등)를 최우선 참조
- 저명한 음악학자/피아니스트의 분석 참조 (Ronald Smith, Alfred Cortot, Heinrich Schenker 등)
- Grove Dictionary, RILM 등 학술 자료 기반

**Step 2. 마디 번호 검증 (Verification)**
- 마디 번호 언급 시 반드시 해당 마디의 **주요 음표/화성을 병기**
- 예: "mm. 1-4 (Bb Major 분산화음 구간)" / "mm. 45-48 (dim7 화성 연속)"
- 불확실하면 마디 번호 생략하고 섹션 특징만 기술

**Step 3. 일반론 배제 (No Generic Advice)**
- ❌ 금지: "느리게 연습하세요", "열심히 연습하세요", "많이 들어보세요"
- ✅ 필수: 즉각 적용 가능한 물리적 솔루션
- 예: "4번 손가락 독립을 위해 5번을 건반 위에 고정하고 타건하는 분리 연습"

**Step 4. 전문 용어의 엄격성**
- Voicing, Agogic, Rubato, Legato, Portato 등 전문 용어 사용
- 각 용어를 악보상의 근거(다이내믹, 아티큘레이션)와 연결하여 설명

**Step 5. 제목으로 성격 추측 금지**
- ❌ "Humoreske"라서 유머러스하다고 추측 금지
- ❌ "Scherzo"라서 무조건 빠르고 경쾌하다고 추측 금지
- ✅ 실제 악보의 템포/악상 기호(Einfach, Innig, Hastig 등)를 기반으로 분석
- ✅ Schumann Humoreske Op.20은 "Einfach"(단순하게)로 시작하며 서정적이고 내면적인 성격

**Step 5. 테크닉 솔루션 3가지 카테고리**
- **Physiological (신체적)**: 근육 이완, 손가락 독립, 팔 무게 사용법, 손목 회전
- **Interpretative (해석적)**: 페달링, 음색 층위(Voicing), 아고직 표현, 루바토
- **Structural (구조적)**: 형식에 따른 호흡법, 섹션별 연습 전략, 템포 설계

🚨 **Korean Output**: 모든 내용을 반드시 한국어로 작성하십시오. 고유명사/전문용어만 원어 병기. 영어로 작성하면 무효 처리됩니다.

[JSON 출력 형식]

{
  "meta": {
    "composer": "작곡가 이름",
    "title": "곡 제목 (원어)",
    "opus": "작품번호",
    "key": "조성",
    "difficulty_level": "Beginner/Intermediate/Advanced/Virtuoso"
  },
  "content": {
    "composer_background": "한국어 8-10문장 — 작곡가 생애/음악적 특징/시대적 위치를 구체적으로",
    "historical_context": "한국어 8-10문장 — 당시 음악계 흐름/동시대 작곡가와의 관계",
    "work_background": "한국어 8-10문장 — 작곡 동기/헌정/초연/출판 정보/음악사적 의의",
    "structure_analysis": [
      {
        "section": "섹션명/변주번호",
        "measures": "마디 범위",
        "key_tempo": "조성 및 박자/템포",
        "character": "한국어로 음악적 성격 (한 문장)",
        "description": "한국어로 리듬적/화성적 특징 상세 설명"
      }
    ],
    "technique_tips": [
      {
        "section": "섹션명 (mm. 마디범위, 화성 정보)",
        "problem": "한국어로 — 기술적 난관과 물리적 원인을 구체적으로",
        "category": "Physiological 또는 Interpretative 또는 Structural",
        "solution": "한국어로 — 구체적 해결책 (손가락 번호, 동작 등 포함)",
        "practice": "한국어로 — 변형 연습법 (리듬변형, 분리연습 등 구체적으로)"
      }
    ],
    "musical_interpretation": "한국어 8-10문장 — 곡 전체의 음악적 서사/감정 흐름/표현 방법",
    "recommended_performances": [
      {
        "artist": "연주자 이름",
        "year": "녹음 연도",
        "comment": "한국어로 이 녹음의 특징과 추천 이유"
      }
    ]
  },
  "verification_status": "Verified 또는 Needs Review"
}

[📋 상세 지침]

### 1-3. 배경 정보 (composer_background, historical_context, work_background)
- 기존과 동일하게 8-10문장으로 상세 기술

### 4. structure_analysis (곡 구조 - 🔥 형식 맞춤 분석)
**⚠️ 핵심: 곡의 실제 형식(Form)에 맞는 용어와 구조로 분석할 것!**

**🚨 절대 규칙: 다악장/다곡 구성의 작품은 반드시 모든 악장/곡을 빠짐없이 분석할 것!**
- 소나타 3악장 → 3악장 모두 분석
- 모음곡 8곡 → 8곡 모두 분석 (예: Kreisleriana 8곡, Kinderszenen 13곡, Carnaval 전곡)
- 변주곡 → Theme + 모든 Variation 개별 분석
- **절대 앞의 일부만 분석하고 생략하지 말 것. 하나라도 누락하면 분석 실패로 간주.**

**형식별 분석 방법 (해당 형식의 용어만 사용):**

**[소나타 형식]** Sonata, Sonatina
→ Exposition(제1주제, 경과구, 제2주제, 코데타), Development, Recapitulation, Coda
→ 다악장이면 각 악장별로 (1악장, 2악장, 3악장...)

**[변주곡]** Theme and Variations
→ Theme, Variation 1, Variation 2, ... (변주곡에만 Variation 사용!)

**[론도]** Rondo
→ A(주제), B(제1에피소드), A', C(제2에피소드), A'', Coda

**[3부 형식 ABA]** Nocturne, Impromptu, Intermezzo, Moment Musical
→ A섹션, B섹션, A'섹션(재현), Coda

**[스케르초/미뉴에트]** Scherzo, Minuet
→ Scherzo(또는 Minuet), Trio, Scherzo da Capo, Coda

**[에튀드]** Etude, Study
→ 도입, 주요 기술 패턴 제시, 발전, 클라이맥스, 종결

**[프렐류드]** Prelude
→ 자유로운 구성 - 도입부, 중심부, 종결부 또는 악상 기호 기반

**[발라드]** Ballade
→ 서사적 구조 - Introduzione, 제1주제군, 제2주제군, 발전부, 재현/변형, Coda

**[폴로네이즈]** Polonaise
→ Introduction, A(주요 주제), B(대조 섹션), A', Trio, A'', Coda

**[마주르카]** Mazurka
→ A, B, A' (또는 A, B, C, A' 등 실제 구조에 따라)

**[왈츠]** Waltz, Valse
→ Introduction, 주요 왈츠 주제들 (Waltz I, II, III...), Coda

**[푸가/인벤션]** Fugue, Invention, Sinfonia
→ Exposition(주제 제시), Episode 1, Middle Entry, Episode 2, Stretto, Coda

**[토카타]** Toccata
→ 화려한 도입, 푸가적 섹션, 자유로운 패시지, 종결

**[환상곡/랩소디]** Fantasie, Fantasy, Rhapsody
→ 자유 구성 - 각 성격별 섹션 (Grave, Allegro, Cantabile 등 템포/악상 기반)

**[성격 소품]** Humoreske, Arabesque, Bagatelle, Capriccio, Romance
→ 악보의 실제 악상 기호/지시어 기반 (예: Einfach, Innig, Lebhaft)

**[바르카롤/자장가]** Barcarolle, Berceuse
→ Introduction, 주요 선율, 중간부, 재현, Coda

**[협주곡]** Concerto (솔로 파트 기준)
→ Orchestral Intro, Solo Exposition, Development, Recapitulation, Cadenza, Coda

**[샤콘느/파사칼리아]** Chaconne, Passacaglia
→ Theme(바소 오스티나토), 각 변주를 그룹화하여 분석

**[모음곡]** Suite
→ 각 춤곡별 (Allemande, Courante, Sarabande, Gigue 등)

- 각 항목 필수 포함:
  * section: **해당 형식에 맞는 용어만** 사용
  * character: 한 문장 성격 묘사
  * description: 2-3문장 상세 설명 (조성, 리듬, 텍스처)
- **🚨 다악장/다곡 작품은 모든 악장/곡을 반드시 개별 항목으로 나열할 것! 절대 생략 금지!**

### 5. technique_tips (테크닉 팁 - 🔥 3가지 카테고리 전문 솔루션)
**⚠️ 핵심: 일반론 금지, 즉각 적용 가능한 구체적 솔루션만!**

**🚨 절대 규칙: structure_analysis의 모든 섹션/악장/곡에 대해 각각 최소 1개의 technique_tip을 반드시 작성할 것!**
- 8곡 구성 → technique_tips도 최소 8개 (각 곡당 1개 이상)
- 3악장 소나타 → 최소 3개 (각 악장당 1개 이상)
- **structure_analysis에 있는 섹션 중 technique_tip이 없는 섹션이 하나라도 있으면 안 됨**

**🚨 중복 금지 - 이것을 반드시 지켜야 합니다:**
- **각 곡/악장의 technique_tip은 반드시 해당 곡의 고유한 음악적 특징에 맞는 솔루션이어야 함**
- **다른 곡과 동일하거나 유사한 problem/solution/practice를 절대 반복 사용 금지**
- 각 곡은 조성, 템포, 텍스처, 기술적 요구가 모두 다르므로 솔루션도 반드시 달라야 함
- 예를 들어 Kreisleriana에서:
  * 1번(d단조, Äußerst bewegt): 빠른 아르페지오와 도약 → 팔 전체의 회전 운동
  * 2번(B♭장조, Sehr innig): 내성부 voicing과 폴리포니 → 각 성부 독립 연습
  * 3번(g단조, Sehr aufgeregt): 격렬한 화음 연타 → 손목 탄력과 팔 무게 낙하
  * ... 이처럼 각 곡의 실제 악보 내용에 기반한 고유한 솔루션 제시
- "손가락 독립성", "손목 유연성" 같은 일반적 표현을 여러 곡에 반복 사용하면 분석 실패

**🔬 각 technique_tip에 반드시 포함할 구체적 요소:**
- 해당 곡/악장에 실제로 등장하는 **구체적 음형** (예: 3도 병행, 옥타브 트레몰로, 반음계 하행 등)
- **구체적 운지법/손 배치** (예: 1-2-4 운지, 엄지 넘기기, 손 교차 등)
- **구체적 음악 기호/지시어** (예: sf에서의 팔 낙하, pp leggiero에서의 손끝 터치 등)
- 해당 곡만의 **고유한 기술적 난점** (예: 2번 Intermezzo의 내성부 선율 vs 7번의 푸가적 성부 처리)

**❌ 금지 표현:**
- "느리게 연습하세요" / "반복 연습하세요" / "손가락 힘을 길러야 합니다"
- "손가락 독립성 강화", "손목 유연성 유지" 등 구체성 없는 일반론
- 동일한 solution/practice 문장을 2개 이상의 곡에 사용하는 것

**✅ 필수 포함:**
각 항목은 다음 구조로 작성:
- section: 해당 섹션명 + (가능하면) 마디와 화성 정보 병기
- problem: 구체적 기술적 난관 (물리적 원인 명시)
- solution: 3가지 카테고리 중 해당하는 솔루션
  * **[Physiological]**: 손목 회전 각도, 팔 무게 분배, 손가락 독립 연습법, 근육 이완점
  * **[Interpretative]**: 페달 타이밍, Voicing 비율, Agogic 처리, 루바토 설계
  * **[Structural]**: 섹션별 템포 관계, 호흡 지점, 연습 분할 전략
- practice: 구체적 변형 연습법 (리듬 변형, 스타카토 변형, 블라인드 연습 등)

**예시:**
- Exposition 제1주제 (mm. 1-8, d단조 주요 동기):
  problem: 왼손 옥타브와 오른손 멜로디의 균형 문제
  solution: [Interpretative] 왼손 5번 손가락을 기준으로 Voicing하여 베이스 라인 부각, 오른손은 팔 무게 최소화
  practice: 왼손만 따로 연주하며 5번 손가락에 무게 집중 연습

- Development (mm. 58-62, 감7화음 연속):
  problem: 빠른 화성 변화에서 손의 포지션 이동
  solution: [Physiological] 각 화음의 공통음(common tone)을 피벗으로 사용, 손목의 수평 이동 최소화
  practice: 화음을 아르페지오로 분해하여 손가락 배치 암기 후 블록 화음으로 복귀

### 6. musical_interpretation (음악적 해석)
- 전체적인 프레이징, 다이내믹 설계
- 루바토/템포 처리
- 캐릭터 설정 가이드

### 7. recommended_performances (추천 연주)
- 3개의 명연주
- 각 연주의 구체적 특징

[희귀곡 처리]
알캉(Alkan), 고도프스키(Godowsky), 소라브지(Sorabji) 등:
- verification_status = "Needs Review"
- 마디 번호 불확실시 "문헌 확인 필요"로 표기하되, **섹션 자체는 반드시 모두 나열**

JSON만 출력하십시오.`;
}

/** AI 응답 파싱 및 검증 */
function parseAndValidateResponse(
  responseText: string,
  composer: string,
  title: string
): SongAnalysis {
  const jsonStr = extractJSON(responseText);
  const parsed = JSON.parse(jsonStr);

  // 희귀 작곡가 체크
  const rareComposers = [
    "alkan", "godowsky", "sorabji", "busoni", "thalberg",
    "medtner", "lyapunov", "moszkowski", "scharwenka"
  ];
  const isRareComposer = rareComposers.some(
    (rc) => composer.toLowerCase().includes(rc)
  );

  const analysis: SongAnalysis = {
    id: generateId(),
    meta: {
      composer: parsed.meta?.composer || composer,
      title: parsed.meta?.title || title,
      opus: filterNeedsReview(parsed.meta?.opus) || "",
      key: filterNeedsReview(parsed.meta?.key) || "",
      difficulty_level: (
        ["Beginner", "Intermediate", "Advanced", "Virtuoso"].includes(
          parsed.meta?.difficulty_level
        )
          ? parsed.meta.difficulty_level
          : "Intermediate"
      ) as DifficultyLevel,
    },
    content: {
      composer_background:
        parsed.content?.composer_background || "작곡가 정보를 확인할 수 없습니다.",
      historical_context:
        parsed.content?.historical_context || "시대적 배경 정보를 확인할 수 없습니다.",
      work_background:
        parsed.content?.work_background || "작품 배경 정보를 확인할 수 없습니다.",
      structure_analysis: Array.isArray(parsed.content?.structure_analysis)
        ? parsed.content.structure_analysis.map((s: Record<string, string>) => ({
            section: s.section || "섹션",
            measures: filterNeedsReview(s.measures),
            key_tempo: filterNeedsReview(s.key_tempo),
            character: filterNeedsReview(s.character),
            description: filterNeedsReview(s.description) || "",
          }))
        : [{ section: "전체", description: "" }],
      technique_tips: Array.isArray(parsed.content?.technique_tips)
        ? parsed.content.technique_tips.map((t: Record<string, string> | string) =>
            typeof t === "string"
              ? { section: "전체", problem: t, category: undefined, solution: "", practice: "" }
              : {
                  section: t.section || "전체",
                  problem: t.problem || "",
                  category: ["Physiological", "Interpretative", "Structural"].includes(t.category)
                    ? t.category as "Physiological" | "Interpretative" | "Structural"
                    : undefined,
                  solution: t.solution || "",
                  practice: t.practice || "",
                }
          )
        : [{ section: "전체", problem: "", category: undefined, solution: "", practice: "" }],
      musical_interpretation:
        parsed.content?.musical_interpretation || "해석 가이드 정보 확인 필요",
      recommended_performances: Array.isArray(
        parsed.content?.recommended_performances
      )
        ? parsed.content.recommended_performances
        : [],
    },
    verification_status: (
      isRareComposer ? "Needs Review" : (parsed.verification_status || "Needs Review")
    ) as VerificationStatus,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return analysis;
}

export async function POST(request: Request) {
  try {
    const body: AnalyzeSongRequest = await request.json();
    let { composer, title, forceRefresh = false, sheetMusicImages, musicXml } = body;
    const { pdfStoragePath, musicxmlStoragePath, useStoredSource } = body;

    if (!composer || !title) {
      const response: AnalyzeSongResponse = {
        success: false,
        error: "composer와 title은 필수입니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // ── 관리자: 저장된 악보로 재분석 ──
    let storedPdfPath: string | undefined = pdfStoragePath;
    let storedMusicxmlPath: string | undefined = musicxmlStoragePath;

    if (useStoredSource) {
      forceRefresh = true;
      const existing = await getCachedAnalysis(composer, title);

      if (existing?.musicxml_storage_path) {
        // MusicXML 소스 다운로드
        console.log(`[Stored Source] Downloading MusicXML: ${existing.musicxml_storage_path}`);
        try {
          const { data } = await supabaseServer.storage
            .from("sheet-music")
            .download(existing.musicxml_storage_path);
          if (data) {
            musicXml = await data.text();
            console.log(`[Stored Source] MusicXML loaded: ${musicXml.length} chars`);
          }
        } catch (e) {
          console.error("[Stored Source] MusicXML download failed:", e);
        }
        storedPdfPath = existing.pdf_storage_path;
        storedMusicxmlPath = existing.musicxml_storage_path;
      } else if (existing?.pdf_storage_path) {
        // PDF 다운로드 → OMR 변환
        console.log(`[Stored Source] Downloading PDF: ${existing.pdf_storage_path}`);
        try {
          const { data } = await supabaseServer.storage
            .from("sheet-music")
            .download(existing.pdf_storage_path);
          if (data) {
            const pdfBuffer = await data.arrayBuffer();
            const pdfBlob = new Blob([pdfBuffer], { type: "application/pdf" });

            const OMR_URL = process.env.OMR_SERVER_URL;
            if (OMR_URL) {
              // MusicXML 변환 시도
              const formData = new FormData();
              formData.append("file", pdfBlob, "input.pdf");
              try {
                const omrRes = await fetch(`${OMR_URL}/convert-to-musicxml`, {
                  method: "POST",
                  body: formData,
                  signal: AbortSignal.timeout(630000),
                });
                if (omrRes.ok) {
                  const omrResult = await omrRes.json();
                  if (omrResult.musicxml) {
                    musicXml = omrResult.musicxml;
                    console.log(`[Stored Source] OMR MusicXML: ${musicXml!.length} chars`);
                  }
                }
              } catch {
                console.log("[Stored Source] OMR MusicXML failed, trying images");
              }

              // Fallback: 이미지 변환
              if (!musicXml) {
                const imgForm = new FormData();
                imgForm.append("file", pdfBlob, "input.pdf");
                try {
                  const imgRes = await fetch(`${OMR_URL}/convert-to-images`, {
                    method: "POST",
                    body: imgForm,
                  });
                  if (imgRes.ok) {
                    const imgResult = await imgRes.json();
                    sheetMusicImages = imgResult.images;
                    console.log(`[Stored Source] Images: ${sheetMusicImages?.length} pages`);
                  }
                } catch {
                  console.error("[Stored Source] Image conversion also failed");
                }
              }
            }
          }
        } catch (e) {
          console.error("[Stored Source] PDF download failed:", e);
        }
        storedPdfPath = existing.pdf_storage_path;
        storedMusicxmlPath = existing.musicxml_storage_path;
      } else {
        console.log("[Stored Source] No stored source found, using text-only analysis");
      }
    }

    const hasImages = sheetMusicImages && sheetMusicImages.length > 0;
    const hasMusicXml = musicXml && musicXml.length > 0;

    // 1. 캐시 확인 (forceRefresh가 false이고 악보 데이터가 없을 때만)
    if (!forceRefresh && !hasImages && !hasMusicXml) {
      const cachedAnalysis = await getCachedAnalysis(composer, title);
      if (cachedAnalysis) {
        console.log(`[Cache HIT] ${composer} - ${title}`);
        const response: AnalyzeSongResponse = {
          success: true,
          data: cachedAnalysis,
          cached: true,
        };
        return NextResponse.json(response);
      }
    }

    console.log(`[Cache MISS] ${composer} - ${title} - Calling AI...`);

    // 2. OpenAI API 호출
    const openai = getOpenAIClient();
    if (!openai) {
      const response: AnalyzeSongResponse = {
        success: false,
        error: "OPENAI_API_KEY가 설정되지 않았습니다.",
      };
      return NextResponse.json(response, { status: 500 });
    }

    let analysis: SongAnalysis;

    if (hasMusicXml) {
      // ── MusicXML 기반 분석 (가장 정확, Vision 불필요) ──
      console.log(`[MusicXML] ${title} - MusicXML 텍스트 기반 분석 (${musicXml!.length} chars)`);

      const xmlPrompt = createMusicXmlPrompt(composer, title, musicXml!);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: xmlPrompt }],
        max_tokens: 16384,
        temperature: 0.3,
      });

      const responseText = completion.choices[0]?.message?.content || "";
      console.log(`[MusicXML] Response length: ${responseText.length}`);

      analysis = parseAndValidateResponse(responseText, composer, title);
    } else if (isLargeWork(title) && !hasImages) {
      // ── 대형 작품: 2회 분할 호출 ──
      console.log(`[Large Work] ${title} - Using two-pass analysis`);

      // Call 1: 구조 분석만 (모든 섹션 확보)
      const structurePrompt = createStructureOnlyPrompt(composer, title);
      const structureCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: structurePrompt }],
        max_tokens: 16384,
        temperature: 0.3,
      });

      const structureText = structureCompletion.choices[0]?.message?.content || "";
      console.log(`[Call 1] Structure response length: ${structureText.length}`);

      const structureJson = JSON.parse(extractJSON(structureText));
      const structureAnalysis: Array<{ section: string; measures?: string; key_tempo?: string; character?: string; description: string }> =
        Array.isArray(structureJson.structure_analysis) ? structureJson.structure_analysis : [];

      console.log(`[Call 1] Got ${structureAnalysis.length} sections`);

      const sectionNames = structureAnalysis.map((s) => s.section);

      // Call 2: 배경, 해석, 추천 연주 (technique_tips는 분할 호출)
      const detailPrompt = createDetailAnalysisPrompt(composer, title, sectionNames);
      const detailCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: detailPrompt }],
        max_tokens: 16384,
        temperature: 0.3,
      });

      const detailText = detailCompletion.choices[0]?.message?.content || "";
      console.log(`[Call 2] Detail response length: ${detailText.length}`);

      const detailJson = JSON.parse(extractJSON(detailText));
      let allTechniqueTips = detailJson.content?.technique_tips || [];

      // Call 3+: 섹션이 많으면 technique_tips 분할 호출로 누락 보완
      const coveredSections = new Set(
        allTechniqueTips.map((t: { section: string }) =>
          t.section.replace(/\s*\(.*\)/, "").trim()
        )
      );
      const missingSections = sectionNames.filter(
        (s) => !coveredSections.has(s)
      );

      if (missingSections.length > 0) {
        console.log(`[Call 2] ${allTechniqueTips.length} tips, missing ${missingSections.length} sections → extra calls`);

        const BATCH_SIZE = 12;
        for (let i = 0; i < missingSections.length; i += BATCH_SIZE) {
          const batch = missingSections.slice(i, i + BATCH_SIZE);
          const batchIdx = Math.floor(i / BATCH_SIZE);
          const totalBatches = Math.ceil(missingSections.length / BATCH_SIZE);

          const extraPrompt = createExtraTechniquePrompt(
            composer, title, batch, batchIdx, totalBatches
          );
          const extraCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: extraPrompt }],
            max_tokens: 16384,
            temperature: 0.3,
          });

          const extraText = extraCompletion.choices[0]?.message?.content || "";
          console.log(`[Call 3-${batchIdx + 1}] Extra tips response length: ${extraText.length}`);

          try {
            const extraJson = JSON.parse(extractJSON(extraText));
            if (Array.isArray(extraJson.technique_tips)) {
              allTechniqueTips = [...allTechniqueTips, ...extraJson.technique_tips];
            }
          } catch {
            console.error(`[Call 3-${batchIdx + 1}] Failed to parse extra tips`);
          }
        }

        console.log(`[Total] ${allTechniqueTips.length} technique_tips for ${sectionNames.length} sections`);
      }

      // 병합된 전체 JSON 구성
      const mergedResponse = JSON.stringify({
        meta: detailJson.meta || { composer, title },
        content: {
          composer_background: detailJson.content?.composer_background || "",
          historical_context: detailJson.content?.historical_context || "",
          work_background: detailJson.content?.work_background || "",
          structure_analysis: structureAnalysis, // Call 1에서 확보한 전체 구조
          technique_tips: allTechniqueTips,
          musical_interpretation: detailJson.content?.musical_interpretation || "",
          recommended_performances: detailJson.content?.recommended_performances || [],
        },
        verification_status: detailJson.verification_status || "Needs Review",
      });

      analysis = parseAndValidateResponse(mergedResponse, composer, title);
    } else {
      // ── 일반 작품: 기존 단일 호출 ──
      const prompt = createMusicologistPrompt(composer, title);

      let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];

      if (hasImages) {
        console.log(`[Vision] ${sheetMusicImages!.length}장의 악보 이미지 포함`);
        const imagePromptPrefix = `\n\n[🎼 첨부된 악보 이미지 분석 지침]\n첨부된 악보 이미지를 반드시 참조하여 분석하십시오.\n- 실제 악보에 표기된 정확한 마디 번호를 사용할 것\n- 실제 음형, 음정, 리듬 패턴을 악보에서 직접 읽어서 기술할 것\n- 아티큘레이션, 다이내믹, 페달 기호 등 악보에 표기된 모든 연주 지시를 반영할 것\n- 운지법이 표기되어 있다면 이를 참조하여 테크닉 솔루션을 제시할 것\n- 악보에서 확인할 수 없는 정보는 추측하지 말 것`;

        const contentParts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
          { type: "text", text: prompt + imagePromptPrefix },
          ...sheetMusicImages!.map((img): OpenAI.Chat.Completions.ChatCompletionContentPart => ({
            type: "image_url",
            image_url: { url: img, detail: "high" },
          })),
        ];

        messages = [{ role: "user", content: contentParts }];
      } else {
        messages = [{ role: "user", content: prompt }];
      }

      let completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 16384,
        temperature: 0.3,
      });

      let responseText = completion.choices[0]?.message?.content || "";
      console.log("AI Response (first 500 chars):", responseText.substring(0, 500));

      // Vision 거절 시 텍스트 전용 분석으로 fallback
      if (hasImages && (responseText.startsWith("I'm sorry") || responseText.startsWith("I can't") || responseText.startsWith("Sorry"))) {
        console.log("[Vision Fallback] GPT refused image analysis, retrying text-only...");

        // 대형 작품이면 two-pass 분석으로 fallback (섹션 누락 방지)
        if (isLargeWork(title)) {
          console.log(`[Vision Fallback → Large Work] ${title} - Using two-pass analysis`);

          const structurePrompt = createStructureOnlyPrompt(composer, title);
          const structureCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: structurePrompt }],
            max_tokens: 16384,
            temperature: 0.3,
          });
          const structureText = structureCompletion.choices[0]?.message?.content || "";
          const structureJson = JSON.parse(extractJSON(structureText));
          const sectionNames: string[] = structureJson.structure_analysis.map(
            (s: { section: string }) => s.section
          );
          console.log(`[Vision Fallback Call 1] Got ${sectionNames.length} sections`);

          const detailPrompt = createDetailAnalysisPrompt(composer, title, sectionNames);
          const detailCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: detailPrompt }],
            max_tokens: 16384,
            temperature: 0.3,
          });
          const detailText = detailCompletion.choices[0]?.message?.content || "";
          console.log(`[Vision Fallback Call 2] Detail response length: ${detailText.length}`);

          const fbDetailJson = JSON.parse(extractJSON(detailText));
          let fbAllTips = fbDetailJson.content?.technique_tips || [];

          // 누락 섹션 보완 호출
          const fbCovered = new Set(
            fbAllTips.map((t: { section: string }) => t.section.replace(/\s*\(.*\)/, "").trim())
          );
          const fbMissing = sectionNames.filter((s) => !fbCovered.has(s));
          if (fbMissing.length > 0) {
            console.log(`[Vision Fallback] ${fbAllTips.length} tips, missing ${fbMissing.length} → extra calls`);
            const BATCH = 12;
            for (let i = 0; i < fbMissing.length; i += BATCH) {
              const batch = fbMissing.slice(i, i + BATCH);
              const ep = createExtraTechniquePrompt(composer, title, batch, Math.floor(i / BATCH), Math.ceil(fbMissing.length / BATCH));
              const ec = await openai.chat.completions.create({ model: "gpt-4o", messages: [{ role: "user", content: ep }], max_tokens: 16384, temperature: 0.3 });
              try {
                const ej = JSON.parse(extractJSON(ec.choices[0]?.message?.content || ""));
                if (Array.isArray(ej.technique_tips)) fbAllTips = [...fbAllTips, ...ej.technique_tips];
              } catch { /* skip */ }
            }
            console.log(`[Vision Fallback Total] ${fbAllTips.length} technique_tips`);
          }

          const fbMerged = JSON.stringify({
            meta: fbDetailJson.meta || { composer, title },
            content: {
              ...fbDetailJson.content,
              structure_analysis: structureJson.structure_analysis,
              technique_tips: fbAllTips,
            },
            verification_status: fbDetailJson.verification_status || "Needs Review",
          });
          analysis = parseAndValidateResponse(fbMerged, composer, title);
        } else {
          const fallbackCompletion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 16384,
            temperature: 0.3,
          });
          responseText = fallbackCompletion.choices[0]?.message?.content || "";
          console.log("[Vision Fallback] Text response (first 500 chars):", responseText.substring(0, 500));
          analysis = parseAndValidateResponse(responseText, composer, title);
        }
      } else {
        analysis = parseAndValidateResponse(responseText, composer, title);
      }
    }

    // 4. 저장 경로 보존 (새 분석 시 기존 경로 유지)
    if (storedPdfPath) {
      analysis.pdf_storage_path = storedPdfPath;
    }
    if (storedMusicxmlPath) {
      analysis.musicxml_storage_path = storedMusicxmlPath;
    }
    if (!analysis.pdf_storage_path || !analysis.musicxml_storage_path) {
      const existingForPaths = await getCachedAnalysis(composer, title);
      if (!analysis.pdf_storage_path && existingForPaths?.pdf_storage_path) {
        analysis.pdf_storage_path = existingForPaths.pdf_storage_path;
      }
      if (!analysis.musicxml_storage_path && existingForPaths?.musicxml_storage_path) {
        analysis.musicxml_storage_path = existingForPaths.musicxml_storage_path;
      }
    }

    // 5. 캐시에 저장 (원본 키와 메타 키 모두 저장)
    await saveCachedAnalysis(analysis, composer, title);
    console.log(`[Cache SAVED] ${composer} - ${title} (${analysis.content.structure_analysis.length} sections)`);

    const response: AnalyzeSongResponse = {
      success: true,
      data: analysis,
      cached: false,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Song analysis API v2 error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    const response: AnalyzeSongResponse = {
      success: false,
      error: `곡 분석 중 오류가 발생했습니다: ${errorMessage}`,
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/** 분석 삭제 */
export async function DELETE(request: Request) {
  try {
    const { composer, title } = await request.json();
    if (!composer || !title) {
      return NextResponse.json(
        { success: false, error: "composer와 title이 필요합니다" },
        { status: 400 }
      );
    }
    const result = await deleteCachedAnalysis(composer, title);
    if (result) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json(
      { success: false, error: "삭제 실패" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Delete analysis error:", error);
    return NextResponse.json(
      { success: false, error: "삭제 실패" },
      { status: 500 }
    );
  }
}

/** 캐시된 분석 목록 조회 */
export async function GET() {
  try {
    const { getAllCachedAnalyses } = await import("@/lib/song-analysis-db");
    const analyses = await getAllCachedAnalyses();
    return NextResponse.json({
      success: true,
      data: analyses,
      count: analyses.length,
    });
  } catch (error) {
    console.error("Get cached analyses error:", error);
    return NextResponse.json(
      { success: false, error: "캐시 조회 실패" },
      { status: 500 }
    );
  }
}
