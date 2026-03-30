/**
 * analysis-prompts.ts — 전면 개편
 *
 * 변경사항:
 *   - 악기 에이전트 7종 → 20종 (오케스트라 전 악기)
 *   - Phase 2: 단일 → 2-A(사고) + 2-B(생성) 분리
 *   - Phase 3: description 4문장 의무 규칙, harmony_table 조건 강화
 *   - Phase 4b: 섹션 데이터 객체 주입 방식
 *   - MusicXML 관련 코드 전부 제거
 */

import { PIANO_AGENT } from "./analysis-agents/agent-piano";
import {
  VIOLIN_AGENT,
  VIOLA_AGENT,
  CELLO_AGENT,
  DOUBLE_BASS_AGENT,
} from "./analysis-agents/agent-strings";
import {
  FLUTE_AGENT,
  OBOE_AGENT,
  CLARINET_AGENT,
  BASSOON_AGENT,
  SAXOPHONE_AGENT,
} from "./analysis-agents/agent-woodwinds";
import {
  TRUMPET_AGENT,
  HORN_AGENT,
  TROMBONE_AGENT,
  TUBA_AGENT,
  EUPHONIUM_AGENT,
} from "./analysis-agents/agent-brass";
import {
  TIMPANI_AGENT,
  MARIMBA_AGENT,
  SNARE_DRUM_AGENT,
  HARP_AGENT,
} from "./analysis-agents/agent-percussion-harp";

// ════════════════════════════════════════════════════════
// 타입 export
// ════════════════════════════════════════════════════════

export type AnalysisInstrument = string;

export interface SectionForRoutine {
  name: string;
  key: string;
  time_signature: string;
  tempo: string;
  core_motif: string;
  technique_challenge: string;
  common_mistake: string;
}

// ════════════════════════════════════════════════════════
// 악기 에이전트 라우터 (20종)
// ════════════════════════════════════════════════════════

export function getInstrumentAgent(instrument: string): string {
  const key = instrument.toLowerCase().trim();

  if (key.includes("piano") || key.includes("피아노")) return PIANO_AGENT;
  if (key.includes("violin") || key.includes("바이올린")) return VIOLIN_AGENT;
  if (key.includes("viola") || key.includes("비올라")) return VIOLA_AGENT;
  if (key.includes("cello") || key.includes("첼로")) return CELLO_AGENT;
  if (key.includes("double bass") || key.includes("contrabass") || key.includes("콘트라베이스") || key.includes("더블베이스"))
    return DOUBLE_BASS_AGENT;
  if (key.includes("flute") || key.includes("플루트")) return FLUTE_AGENT;
  if (key.includes("oboe") || key.includes("오보에")) return OBOE_AGENT;
  if (key.includes("clarinet") || key.includes("클라리넷")) return CLARINET_AGENT;
  if (key.includes("bassoon") || key.includes("바순") || key.includes("파곳")) return BASSOON_AGENT;
  if (key.includes("saxophone") || key.includes("색소폰") || key.includes("색소")) return SAXOPHONE_AGENT;
  if (key.includes("trumpet") || key.includes("트럼펫")) return TRUMPET_AGENT;
  if (key.includes("horn") || key.includes("호른") || key.includes("프렌치 호른")) return HORN_AGENT;
  if (key.includes("trombone") || key.includes("트롬본")) return TROMBONE_AGENT;
  if (key.includes("tuba") || key.includes("튜바")) return TUBA_AGENT;
  if (key.includes("euphonium") || key.includes("유포니엄")) return EUPHONIUM_AGENT;
  if (key.includes("timpani") || key.includes("팀파니")) return TIMPANI_AGENT;
  if (key.includes("marimba") || key.includes("마림바") || key.includes("xylophone") || key.includes("실로폰") || key.includes("vibraphone") || key.includes("비브라폰"))
    return MARIMBA_AGENT;
  if (key.includes("snare") || key.includes("스네어") || key.includes("percussion") || key.includes("타악"))
    return SNARE_DRUM_AGENT;
  if (key.includes("harp") || key.includes("하프")) return HARP_AGENT;
  if (key.includes("guitar") || key.includes("기타")) return VIOLIN_AGENT;
  if (key.includes("vocal") || key.includes("voice") || key.includes("성악") || key.includes("노래"))
    return FLUTE_AGENT;

  console.warn(`[InstrumentAgent] 악기 인식 불가: "${instrument}" → 피아노 에이전트로 폴백`);
  return PIANO_AGENT;
}

// 하위 호환성
export const getInstrumentContext = getInstrumentAgent;

// ════════════════════════════════════════════════════════
// 헬퍼 함수
// ════════════════════════════════════════════════════════

export function getExpertRole(instrument: string): string {
  const key = instrument.toLowerCase();
  if (key.includes("piano") || key.includes("피아노")) return "피아노 교수법 전문가이자 연주 코치. 레슨 경력 30년.";
  if (key.includes("violin") || key.includes("바이올린")) return "바이올린 교수법 전문가이자 연주 코치. 레슨 경력 30년.";
  if (key.includes("viola") || key.includes("비올라")) return "비올라 교수법 전문가이자 연주 코치. 레슨 경력 30년.";
  if (key.includes("cello") || key.includes("첼로")) return "첼로 교수법 전문가이자 연주 코치. 레슨 경력 30년.";
  if (key.includes("flute") || key.includes("플루트")) return "플루트 교수법 전문가이자 연주 코치. 레슨 경력 30년.";
  if (key.includes("clarinet") || key.includes("클라리넷")) return "클라리넷 교수법 전문가이자 연주 코치. 레슨 경력 30년.";
  if (key.includes("trumpet") || key.includes("트럼펫")) return "트럼펫 교수법 전문가이자 연주 코치. 레슨 경력 30년.";
  return `${instrument} 교수법 전문가이자 연주 코치. 레슨 경력 30년.`;
}

export function getFingeringRule(instrument: string): string {
  const key = instrument.toLowerCase();
  if (key.includes("piano") || key.includes("피아노"))
    return "손가락 번호(운지법) 절대 금지. 손목/팔 동작, 터치 깊이, 팔 무게 이동, 신체 감각 기반 조언만.";
  if (key.includes("violin") || key.includes("viola") || key.includes("cello") || key.includes("bass") || key.includes("현악"))
    return "손가락 번호 금지. 활 압력·속도·접촉점, 비브라토 신체 동작, 포지션 이동 방식으로 서술.";
  if (key.includes("flute") || key.includes("oboe") || key.includes("clarinet") || key.includes("bassoon") || key.includes("saxophone") || key.includes("관악"))
    return "운지 번호 금지. 호흡 지지, 앙부쉬르 변화, 텅잉 방식, 신체 감각 기반으로 서술.";
  return "운지법/손가락 번호 금지. 신체 역학과 음향 생산 기반 언어로 서술.";
}

// 기존 코드 호환용
export function getPracticeKeywords(instrument: string): string {
  return "악기 에이전트 컨텍스트 참조";
}

export function getTechniqueCategories(instrument: string): string[] {
  return ["음정/음형", "기본기", "기교 테크닉", "감정 표현", "리듬 감각", "형식 인식"];
}

// ════════════════════════════════════════════════════════
// 공통 규칙
// ════════════════════════════════════════════════════════

export const KOREAN_OUTPUT_RULE = `
🚨 모든 출력은 반드시 한국어로 작성하십시오. (음악 용어·고유명사만 원어 병기 가능)
🚨 마크다운 서식 절대 금지.
🚨 확인되지 않은 수치를 만들어내지 마십시오.
`.trim();

export const HALLUCINATION_GUARD = `
🚨 출처 우선순위: 학술자료 > 악보(Vision) > Perplexity 팩트 > 모델 지식
🚨 LOCKED FACTS의 조성·박자·작품번호와 상충하는 내용 생성 금지.
🚨 마디 번호, 코드명, 연주자 이름·연도: 확인된 것만. 생성 금지.
`.trim();

// ════════════════════════════════════════════════════════
// LOCKED FACTS 블록 빌더
// ════════════════════════════════════════════════════════

export function buildLockedFactsBlock(
  composer: string,
  title: string,
  opus: string,
  key: string,
  visionFacts?: {
    overall_key: string | null;
    movements: Array<{
      number: number;
      tempo_marking: string | null;
      key: string | null;
      time_signature: string | null;
    }>;
    confidence: string;
  } | null
): string {
  const visionBlock = visionFacts
    ? `
[🎼 악보에서 직접 읽은 값 (Vision) — 최우선]
전체 조성: ${visionFacts.overall_key ?? "확인불가"}
${visionFacts.movements
  .map(
    (m) =>
      `  ${m.number}악장: 템포=${m.tempo_marking ?? "확인불가"} | 조성=${m.key ?? "확인불가"} | 박자=${m.time_signature ?? "확인불가"}`
  )
  .join("\n")}
Vision 신뢰도: ${visionFacts.confidence}`
    : "";

  return `
[🔒 LOCKED FACTS — 절대 변경 불가]
작곡가: ${composer}
제목: ${title}
작품번호: ${opus}
조성: ${key}
${visionBlock}

[✅ ALLOWED INFERENCE — LOCKED FACTS와 모순 없는 범위에서만 추론 허용]
장르, 형식 설명, mood, character, description 등 서술형 필드

[❌ 절대 생성 금지]
마디 번호 (악보 확인 없이), 코드명 (악보 확인 없이), 연주자 이름·연도 (검증 없이)
  `.trim();
}

// ════════════════════════════════════════════════════════
// Phase 0: Perplexity 팩트 검색
// ════════════════════════════════════════════════════════

export function createReferenceSearchPrompt(
  composer: string,
  title: string,
  instrument?: string
): string {
  const inst = instrument ?? "piano";
  return `
I need accurate musical reference data for this ${inst} piece:

Composer: ${composer}
Title: ${title}

CRITICAL: Search IMSLP (imslp.org) FIRST.
- Go to the IMSLP page for this piece and extract: Key, Movements, Year, Dedication
- For each movement: tempo marking, key, time signature
- Mark each fact as [IMSLP-confirmed] or [other-source]
- If IMSLP and other sources conflict, IMSLP wins

Also search: Wikipedia, Henle Verlag, Grove Music Online,
AllMusic, MusicBrainz, sheet music databases, academic papers.

CRITICAL: If the title contains "No.X", search for THAT SPECIFIC piece only.

Required output:
PIECE INFO:
- Full title: [original language]
- Opus/Catalogue: [e.g., Op.10 No.3]
- Overall key: [e.g., F minor] ← CRITICAL
- Year composed: [verified only]
- Number of movements:

Per movement:
- Tempo marking / Key / Time signature / Form / Measures (approximate OK)

VERIFIED RECORDINGS:
Search: "${composer} ${title} recording discography" on AllMusic, Discogs
Output JSON: "verified_recordings": [{ "artist": "Name", "year": YYYY, "label": "Label" }]
Maximum 6. Only confirmed. Never invent.

RULES:
- KEY is the most important field.
- Do NOT write "not specified". Give best available answer.
  `.trim();
}

// ════════════════════════════════════════════════════════
// Phase 1: 곡 개요
// ════════════════════════════════════════════════════════

export function createPhase1Prompt(
  composer: string,
  title: string,
  lockedFactsOrMusicXml: string,
  referenceData?: string,
  instrument?: string
): string {
  const ref = referenceData ?? "";
  return `
당신은 세계적인 음악학자입니다.

작곡가: ${composer}
곡 제목: ${title}

${lockedFactsOrMusicXml}

${ref ? `[🔍 검증된 레퍼런스]\n${ref}` : ""}

${KOREAN_OUTPUT_RULE}
${HALLUCINATION_GUARD}

[Phase 1: 곡 개요]

🚨 최우선 규칙: 제목에 "No.X"가 있으면 해당 곡 하나만 분석.

사고 순서:
1. 단악장/다악장/소품 모음집/변주곡?
2. 각 악장의 박자·조성·형식을 LOCKED FACTS와 레퍼런스에서 확인.
3. 확인된 것만 tempo_marking에 기재.

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
    "composition_period": "작곡·출판 시기 (확인된 것만)",
    "tempo_marking": "모든 악장/소품 나열 (확인된 것만)",
    "genre": "장르적 성격 서술",
    "form": "전체 형식 개요",
    "musical_features": ["핵심 특징 1-2문장"]
  }
}
  `.trim();
}

// ════════════════════════════════════════════════════════
// Phase 2-A: 사고 단계 (자유 텍스트, temp 0.7)
// ════════════════════════════════════════════════════════

export function createPhase2APrompt(
  composer: string,
  title: string,
  opus: string,
  instrument: string,
  lockedFactsBlock: string,
  referenceData: string,
  academicInjection: string = ""
): string {
  return `
당신은 음악학 박사이자 ${instrument} 전공 연주자입니다.

작곡가: ${composer}
곡 제목: ${title}
작품번호: ${opus}

${lockedFactsBlock}

${academicInjection ? `[📚 학술 자료]\n${academicInjection}` : ""}

[🔍 레퍼런스 데이터]
${referenceData.slice(0, 15000)}

아래 10개 질문에 답하십시오. 확인된 사실만. 각 3-6문장.
추상적 표현 금지. 구체적 음악 언어: 음정, 리듬 패턴, 화성 진행, 형식 구조.

Q1. ${composer}의 화성 언어를 다른 작곡가와 구별하는 구체적 요소?
Q2. ${composer}의 리듬 어법 특징?
Q3. 형식 면에서 선배들과 어떻게 달랐는가?
Q4. 동시대 작곡가들과의 실질적 관계? (확인된 사례만)
Q5. ${title} 작곡 당시 직면한 구체적 상황? (확인된 것만)
Q6. 이 곡이 탄생한 구체적 동기?
Q7. 이 시기 ${instrument} 음악계에서 무슨 일이 있었는가?
Q8. 당시 청중·비평가 반응? (확인된 것만)
Q9. 각 악장/섹션의 고유한 음형과 음악적 아이디어?
Q10. ${instrument} 연주자 관점 이 곡 고유의 기교적 도전?

자유 텍스트 출력. JSON 금지. Q1:, Q2:, ... 형식. 한국어.
  `.trim();
}

// ════════════════════════════════════════════════════════
// Phase 2-B: 콘텐츠 생성 (JSON, temp 0.3)
// ════════════════════════════════════════════════════════

export function createPhase2BPrompt(
  composer: string,
  title: string,
  opus: string,
  instrument: string,
  lockedFactsBlock: string,
  phase2AThinking: string,
  instrumentAgent: string
): string {
  return `
당신은 세계적인 음악학자이자 ${instrument} 연주 코치입니다.

작곡가: ${composer}
곡 제목: ${title}
작품번호: ${opus}

${lockedFactsBlock}

[📝 사고 결과]
${phase2AThinking}

[🎹 악기 에이전트: ${instrument}]
${instrumentAgent}

${KOREAN_OUTPUT_RULE}
${HALLUCINATION_GUARD}
🚨 ${getFingeringRule(instrument)}

[구성 단위 표기]
- 다악장: "1악장", "2악장" / 소품: "No.1" / 변주곡: "주제", "변주 1"

JSON만 출력:
{
  "composer_life": {
    "summary": "8-10문장",
    "timeline": [{ "period": "시기명 + 연도", "description": "5-7문장" }],
    "at_composition": {
      "age_and_location": "",
      "crisis_or_motivation": "",
      "concurrent_works": "",
      "premiere_reception": ""
    }
  },
  "historical_background": {
    "era_characteristics": "5-8문장",
    "contemporary_composers": "5-7문장",
    "musical_movement": "5-7문장"
  },
  "song_characteristics": {
    "composition_background": "5-8문장",
    "form_and_structure": "15-25문장 — [단위명] 구분",
    "technique": "10-15문장 — [단위명] 구분, 악기 에이전트 신체 역학 언어",
    "literary_dramatic": "10-15문장 — [단위명] 구분",
    "conclusion": "5-7문장"
  }
}
  `.trim();
}

// 하위 호환 래퍼
export function createPhase2Prompt(
  composer: string,
  title: string,
  opus: string,
  verifiedMeta?: { composer: string; title: string; opus: string; key: string },
  referenceData?: string,
  instrument?: string
): string {
  // 기존 호출부 호환 — Phase 2-A 프롬프트만 반환
  const inst = instrument ?? "piano";
  const lockedBlock = buildLockedFactsBlock(
    verifiedMeta?.composer ?? composer,
    verifiedMeta?.title ?? title,
    verifiedMeta?.opus ?? opus,
    verifiedMeta?.key ?? ""
  );
  return createPhase2APrompt(composer, title, opus, inst, lockedBlock, referenceData ?? "");
}

// ════════════════════════════════════════════════════════
// Phase 3: 구조/화성 분석
// ════════════════════════════════════════════════════════

export function createPhase3Prompt(
  composer: string,
  title: string,
  opus: string,
  confirmedKeyOrInstrument?: string,
  lockedFactsBlockOrMusicXml?: string,
  referenceData?: string,
  hasScoreOrVerifiedMeta?: boolean | { composer: string; title: string; opus: string; key: string }
): string {
  // 하위 호환: 7번째 인자가 boolean이면 새 시그니처, object면 기존 시그니처
  const hasScore = typeof hasScoreOrVerifiedMeta === "boolean" ? hasScoreOrVerifiedMeta : false;
  const lockedBlock = lockedFactsBlockOrMusicXml ?? buildLockedFactsBlock(composer, title, opus, confirmedKeyOrInstrument ?? "");
  const ref = referenceData ?? "";

  return `
당신은 세계적인 음악 이론가이자 화성학 전문가입니다.

작곡가: ${composer}
곡 제목: ${title}
작품번호: ${opus}

${lockedBlock}

${ref ? `[🔍 레퍼런스 데이터]\n${ref}` : ""}

${KOREAN_OUTPUT_RULE}
${HALLUCINATION_GUARD}

[Phase 3: 구조·화성 분석]

🚨 최우선 규칙: 제목에 "No.X"가 있으면 해당 곡 하나만 분석.

[작성 전 사고]
Q1. 전체 형식? Q2. 내부 구간? Q3. 각 구간 조성/화성? Q4. 작곡가 화성 특징? Q5. 전조 방식?

🚨 최소 섹션 수 규칙:
- 짧은 곡이라도 최소 3개 이상 섹션. 1~2개만 출력하면 분석 실패.

[🚨 형식별 구간 가이드 — 곡의 실제 형식에 맞게 나눌 것]
- 소나타 형식: 제시부(1주제·전이·2주제·종결) / 전개부 / 재현부 / 코다
- 론도: A / B / A' / C / A'' / 코다
- 3부 형식(ABA): A / B(대비) / A' (녹턴, 즉흥곡 등)
- 발라드/판타지/랩소디:
  🚨 소나타 형식(주제부/발전부/재현부)을 강제 적용 금지!
  쇼팽 발라드 = 서사적 자유 형식 (소나타-론도 혼합).
  각 주제 영역을 성격별로 독립 섹션으로 나눌 것.
  예: Largo 도입 / 1st Theme (waltz) / 2nd Theme (cantabile) /
      1st Theme 변형 / Agitato 전개 / 2nd Theme 재현 / Presto 코다
- 변주곡: 주제 + 각 변주 개별
- 모음곡: 각 춤곡 개별
- 에튀드: 기교 패턴에 따른 구간 분리
- 푸가: 제시부 / 에피소드 / 스트레토 / 종결

[measures 규칙]
- IMSLP/악보에서 확인된 마디만: "mm.1-32"
- LOCKED FACTS에 총 마디 수가 있으면 비율로 추정 가능: "약 mm.1-30"
- 확인 안 된 경우: 구간의 음악적 내용을 서술 (예: "E♭장조 주제가 오른손에서 제시되며...")
- 🚨 마디 번호를 임의로 생성하는 것은 절대 금지. 틀린 마디 번호는 분석 전체를 무효화함
- 금지: "문헌 확인 필요", 빈 문자열, 동일 문구 반복

[description 규칙 — 구체성 필수]
각 섹션의 description은 3-5문장으로, 반드시 아래를 포함:
1. 이 구간의 핵심 동기/음형을 구체적으로 서술 (예: "짧은 동기 반복, 스타카토, sforzando")
2. 직전 구간과의 대비 (텍스처·다이내믹·조성 변화)
3. 조성 중심과 주요 화성 진행 (예: "f단조(i–V7–i)")
4. 연주 시 만들어야 할 소리/분위기 (예: "비극적 긴장과 단호함")
🚨 "주제 제시, 성격 규정" 같은 추상적 서술 금지. 구체적 음악 내용만.

[다악장 곡 필수: 악장별 세부 구간 분석]
다악장 곡은 각 악장을 독립적으로 분석하되, 각 악장 내부를 최소 3개 이상 세부 구간으로 나눌 것.
예시 (소나타 1악장):
- 제시부 1–8: 제1주제 도입 | f단조(i–V7–i) | 비극적 긴장, 짧은 동기 반복
- 제시부 9–20: 연결부 | f단조→A♭장조 | 점진적 전조, 패시지+셋잇단음
- 제시부 21–41: 제2주제 | A♭장조 | 완화된 선율, 장조이지만 긴장 유지
- 발전부 51–93: 동기 발전 | d단조→g단조 | 반음계 전조, 긴박함
이 수준의 구체성을 모든 곡에 적용하십시오.

[harmony_table 조건]
${hasScore
    ? "악보 있음 → 확인된 전조점·종지·특수화음만. 확신 70% 미만 생략."
    : "악보 없음 → harmony_table = [] 빈 배열 필수."}

[다악장 규칙]
movements 배열 반드시 출력. 단악장이면 [].

[악장별 구간 깊이 기준]
- 50마디 초과 악장: 최소 3개 세부 구간 (제시부/발전부/재현부 등)
- 50마디 이하 악장: 최소 2개 세부 구간 (A/B 등)
- 전체 세부 구간 합계가 과도하게 많아지면 환각 위험 → 핵심 구간에 집중

JSON만 출력:
{
  "structure_analysis_v2": {
    "movements": [{ "number": 1, "title": "", "key": "", "tempo": "", "form": "", "duration": "", "character": "", "technique_challenges": [], "connection_to_next": "" }],
    "sections": [{ "section": "", "measures": "", "key_signature": "", "time_signature": "", "tempo": "", "mood": "", "description": "4문장 의무" }],
    "harmony_table": []
  }
}
  `.trim();
}

// ════════════════════════════════════════════════════════
// Phase 4a: 연습법
// ════════════════════════════════════════════════════════

export function createPhase4aPrompt(
  composer: string,
  title: string,
  opus: string,
  sectionNames: string[],
  referenceData?: string,
  instrument?: string
): string {
  const inst = instrument ?? "piano";
  const instrumentAgent = getInstrumentAgent(inst);
  const sectionList = sectionNames.map((s, i) => `${i + 1}. ${s}`).join("\n");

  return `
당신은 세계적인 ${getExpertRole(inst)}

작곡가: ${composer}
곡 제목: ${title}
악기: ${inst}

[🎹 악기 에이전트: ${inst}]
${instrumentAgent}

${KOREAN_OUTPUT_RULE}
${HALLUCINATION_GUARD}
🚨 ${getFingeringRule(inst)}

이 곡의 섹션:
${sectionList}

[🚨 section_guides 작성 규칙 — 마디별 구체적 연습법 필수]

각 섹션의 guide는 반드시 **마디 번호를 명시**하고, 해당 구간의 구체적 연습 방법을 제시하십시오.

🚨 절대 금지:
- "팔 무게를 실어주세요", "프레이즈를 살려서" 같은 일반론
- 모든 섹션에 동일한 조언 반복
- 마디 번호 없는 추상적 조언

✅ guide는 단일 문자열로, 아래 내용을 줄바꿈(\\n)으로 구분하여 작성:
1행: 해당 구간의 마디 번호 + 기교적 도전 (예: "mm.1-8: 만하임 로켓 상행 동기")
2행: 구체적 연습 방법 ① (예: "→ 상향 패시지 손가락 분산 훈련")
3행: 구체적 연습 방법 ② (예: "→ sf 직전 소리를 줄이고 갑자기 치솟게")
4행: 흔한 실수 + 해결법 (예: "흔한 실수: 손목 경직 → 해결: 팔꿈치 유연성 훈련")

최소 3행, 최대 5행. 마디 번호 없는 행은 금지.

예시 (단일 문자열):
"mm.1-8: 만하임 로켓 상행 동기\\n→ 상향 패시지 정확한 손가락 분산 훈련\\n→ 빠른 업비트의 추진력을 위해 박–박 사이 긴장 유지\\n흔한 실수: 손목 경직 → 해결: 팔꿈치와 손목의 유연한 연결"

🚨 추천 연주: 최소 5명, 최대 7명. 1명만 출력하면 분석 실패.
   - 한국인 연주자 1명 이상 포함
   - 역사적 명연 + 현대 연주자 + 독특한 해석 다양하게

JSON만 출력:
{
  "technique_summary": [{ "category": "영역명", "items": ["구체적 내용 — 이 곡 고유의 기교"] }],
  "section_guides": [{ "section": "섹션명", "guide": "마디 번호 + 구체적 연습법 3-4개 + 흔한 실수와 해결" }],
  "recommended_performances_v2": [{ "artist": "", "year": "", "comment": "", "youtube_url": "" }]
}
  `.trim();
}

// ════════════════════════════════════════════════════════
// Phase 4b: 4주 루틴
// ════════════════════════════════════════════════════════

export function buildSectionsForRoutine(
  sections: Array<{
    section: string;
    key_signature: string;
    time_signature: string;
    tempo: string;
    description: string;
    mood: string;
  }>
): SectionForRoutine[] {
  return sections.map((s) => {
    const sentences = s.description.split(/\.\s+/);
    return {
      name: s.section,
      key: s.key_signature.split(/[,\s]/)[0] ?? s.key_signature,
      time_signature: s.time_signature,
      tempo: s.tempo,
      core_motif: (sentences[0] ?? s.mood).slice(0, 120),
      technique_challenge: (sentences[3] ?? sentences[sentences.length - 1] ?? "").slice(0, 150),
      common_mistake: "",
    };
  });
}

export function createPhase4bPrompt(
  composer: string,
  title: string,
  opus: string,
  sectionNamesOrData: string[] | SectionForRoutine[],
  referenceData?: string,
  instrument?: string
): string {
  const inst = instrument ?? "piano";
  const instrumentAgent = getInstrumentAgent(inst);

  // 하위 호환: string[] 또는 SectionForRoutine[] 모두 지원
  let sectionContext: string;
  if (sectionNamesOrData.length > 0 && typeof sectionNamesOrData[0] === "string") {
    sectionContext = (sectionNamesOrData as string[]).map((s, i) => `${i + 1}. ${s}`).join("\n");
  } else {
    const sections = sectionNamesOrData as SectionForRoutine[];
    sectionContext = sections
      .map(
        (s, i) => `
${i + 1}. ${s.name}
   조성: ${s.key} | 박자: ${s.time_signature} | 템포: ${s.tempo}
   핵심 음형: ${s.core_motif}
   기술 도전: ${s.technique_challenge}`
      )
      .join("\n");
  }

  return `
당신은 세계적인 ${getExpertRole(inst)}

작곡가: ${composer}
곡 제목: ${title}
악기: ${inst}

[🎹 악기 에이전트: ${inst}]
${instrumentAgent}

이 곡의 섹션:
${sectionContext}

${KOREAN_OUTPUT_RULE}
${HALLUCINATION_GUARD}
🚨 ${getFingeringRule(inst)}

[Phase 4b: 4주 연습 루틴]

[4주 전략 — 다악장 곡은 악장별로 배분]
1주차: 1악장(또는 전반부 섹션) 테크닉 집중 + 2악장 레가토/표현
2주차: 3악장(또는 후반부 섹션) + 4악장 기교 + 1악장 복습
3주차: 전 악장 프레이징 점검 + 암보 + 구조 해석 + 연결
4주차: 전곡 통합 + 리허설 시뮬레이션 + 최종 점검

[각 day의 tasks 규칙]
tasks는 최소 3개, 최대 5개. 각 task는 "마디 번호 + 구체적 동작" 형식.
예:
- "mm.1-8 만하임 로켓 상행 동기 반복 연습"
- "양손 따로 → mm.9-20 sf 대비 표현 반복"
- "발전부(mm.51-93) 클라리넷-플루트 상상하며 대화하듯 연주"
- "제시부→발전부 연결, 템포 일정 유지"

🚨 핵심 규칙:
- 4주 × 7일 = 28일. 반드시 28개 day 객체.
- 1일만 출력하면 분석 실패.
- "스케일 연습", "테크닉 연습" 같은 추상적 과제 금지.
- 모든 task에 이 곡의 구체적 마디·음형·조성·기법을 명시.
- 다악장 곡: 각 악장에 최소 3-4일씩 배분.

예시 (베토벤 소나타 1번):
Day 1-2: 1악장 주제 테크닉 — 만하임 로켓 반복, 업비트 정렬, 스타카토→레가토 변환
Day 3-4: 1악장 발전부 — sf/p 대비, 조성 변화 다이내믹, 두 손 관현악적 대화
Day 5-6: 2악장 레가토 — cantabile 프레이즈, 3도·32분음 연결, Two-note slur
Day 7: 2악장 리듬 — 3대4 불규칙 리듬, 페르마타 루바토

JSON만 출력:
{
  "weekly_routine": [
    {
      "week": 1,
      "theme": "1주차 테마 (구체적)",
      "days": [
        { "day": "1일차", "focus": "악장명 + 마디 구간 + 구체적 목표", "tasks": ["구체적 과제 1", "구체적 과제 2", "구체적 과제 3", "구체적 과제 4"] },
        { "day": "2일차", "focus": "...", "tasks": ["...", "...", "...", "..."] },
        { "day": "3일차", "focus": "...", "tasks": ["...", "...", "...", "..."] },
        { "day": "4일차", "focus": "...", "tasks": ["...", "...", "...", "..."] },
        { "day": "5일차", "focus": "...", "tasks": ["...", "...", "...", "..."] },
        { "day": "6일차", "focus": "...", "tasks": ["...", "...", "...", "..."] },
        { "day": "7일차", "focus": "...", "tasks": ["...", "...", "...", "..."] }
      ]
    },
    { "week": 2, "theme": "...", "days": [7개] },
    { "week": 3, "theme": "...", "days": [7개] },
    { "week": 4, "theme": "...", "days": [7개] }
  ]
}
  `.trim();
}

// ════════════════════════════════════════════════════════
// V1 폴백 (기존 호환)
// ════════════════════════════════════════════════════════

export function createStructureOnlyPrompt(composer: string, title: string): string {
  return `당신은 ${composer}의 ${title}를 분석하는 음악학자입니다.
JSON: { "structure_analysis": [{ "section": "", "measures": "", "key_tempo": "", "character": "", "description": "" }] }`;
}

export function createDetailAnalysisPrompt(composer: string, title: string, sectionNames: string[]): string {
  return `당신은 음악학자입니다. ${composer} - ${title}. 섹션: ${sectionNames.join(", ")}.
JSON: { "meta": {}, "content": { "composer_background": "", "historical_context": "", "work_background": "", "technique_tips": [], "musical_interpretation": "", "recommended_performances": [] } }`;
}

export function createExtraTechniquePrompt(composer: string, title: string, sectionNames: string[], batchIndex: number, totalBatches: number): string {
  return `${composer} - ${title}. 배치 ${batchIndex + 1}/${totalBatches}. 섹션: ${sectionNames.join(", ")}.
JSON: { "technique_tips": [{ "section": "", "problem": "", "category": "", "solution": "", "practice": "" }] }`;
}

export function createMusicologistPrompt(composer: string, title: string): string {
  return createDetailAnalysisPrompt(composer, title, []);
}

export function createMusicXmlPrompt(composer: string, title: string, musicXml: string): string {
  return createDetailAnalysisPrompt(composer, title, []);
}

export function isCharacterPieceCollection(title: string): boolean {
  const lower = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return ["papillons", "kinderszenen", "carnaval", "kreisleriana", "waldszenen",
    "pictures at an exhibition", "annees de pelerinage", "preludes op.28",
    "well-tempered", "wohltemperierte", "songs without words", "moments musicaux",
    "impromptus", "consolations", "liebestraume"].some((k) => lower.includes(k));
}

export function isLargeWork(title: string): boolean {
  const lower = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (lower.includes("variation") || lower.includes("변주")) return true;
  return ["kreisleriana", "kinderszenen", "carnaval", "etudes-tableaux",
    "well-tempered", "pictures at an exhibition", "goldberg", "diabelli",
    "enigma", "symphonic etudes", "chaconne", "passacaglia"].some((k) => lower.includes(k));
}
