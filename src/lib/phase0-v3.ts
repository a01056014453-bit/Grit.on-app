/**
 * lib/phase0-v3.ts
 *
 * V3 전용 Phase 0 — 3개 소스를 병렬 수집 후 구조화된 번들로 반환
 *
 * 소스 레이어:
 *   1. Perplexity sonar-pro — 목적별 쿼리 3개 (technical / historical / interpretation)
 *   2. Semantic Scholar / CORE — 기존 academicInjection 재사용
 *   3. composer_resources DB — findComposerResources()
 *
 * Fallback 체인:
 *   Perplexity 실패 → gpt-4o-search-preview (실시간 웹검색) → gpt-4o (학습 데이터)
 */

import { findComposerResources } from "@/lib/composer-resources";
import { createContextSearchPrompt } from "@/lib/analysis-prompts-v3";
import OpenAI from "openai";

// ════════════════════════════════════════════════════════
// 타입
// ════════════════════════════════════════════════════════

export interface V3SourceBundle {
  perplexity: {
    technical: string;
    historical: string;
    interpretation: string;
    context: string;
    raw: string;
  };
  academic: {
    injection: string;
    hasPapers: boolean;
  };
  curated: {
    injection: string;
    hasCuratedData: boolean;
    resourceCount: number;
  };
}

// ════════════════════════════════════════════════════════
// Perplexity 호출 헬퍼
// ════════════════════════════════════════════════════════

async function queryPerplexity(
  prompt: string,
  apiKey: string,
  maxTokens = 2000,
): Promise<string> {
  if (!apiKey) return "";
  try {
    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.perplexity.ai",
    });
    const res = await client.chat.completions.create({
      model: "sonar-pro",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    });
    return res.choices[0]?.message?.content ?? "";
  } catch (e) {
    console.error("[phase0-v3] Perplexity 호출 실패:", e instanceof Error ? e.message : e);
    return "";
  }
}

// ════════════════════════════════════════════════════════
// 웹검색 fallback — gpt-4o-search-preview → gpt-4o
// ════════════════════════════════════════════════════════

async function queryWithWebSearch(
  prompt: string,
  apiKey: string,
  maxTokens = 2000,
): Promise<string> {
  if (!apiKey) return "";
  const client = new OpenAI({ apiKey });

  // 1차: gpt-4o-search-preview (실시간 웹검색)
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-search-preview",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
    });
    const content = res.choices[0]?.message?.content ?? "";
    if (content) {
      console.log("[phase0-v3] gpt-4o-search-preview 성공");
      return content;
    }
  } catch (e) {
    console.warn("[phase0-v3] gpt-4o-search-preview 실패, gpt-4o fallback:", e instanceof Error ? e.message : e);
  }

  // 2차: gpt-4o fallback (학습 데이터 기반)
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.3,
    });
    return res.choices[0]?.message?.content ?? "";
  } catch (e) {
    console.error("[phase0-v3] gpt-4o fallback도 실패:", e instanceof Error ? e.message : e);
    return "";
  }
}

// ════════════════════════════════════════════════════════
// Perplexity 쿼리 3개
// ════════════════════════════════════════════════════════

function buildTechnicalQuery(composer: string, title: string, instrument: string): string {
  return `What are the specific technical and performance challenges of ${composer}'s "${title}" for ${instrument}?

Please cover:
- Which specific passages or sections are technically most difficult and exactly why
- Common technical problems performers encounter (fingering, hand position, coordination)
- Specific practice strategies recommended by master teachers or in published masterclass notes
- What makes this piece uniquely difficult compared to other works by the same composer

Focus on SPECIFIC and PRACTICAL information. Avoid general statements like "requires good technique".
Name specific measures or sections if possible.`;
}

function buildHistoricalQuery(composer: string, title: string): string {
  return `What is the compositional background and historical context of ${composer}'s "${title}" that a performer should know?

Please cover:
- When and why was this piece composed (specific circumstances, not just the year)
- What was the composer's personal or emotional state during composition
- Any important dedications, revisions, or special circumstances
- What the composer said about this piece (if documented)
- What makes this piece distinctive or unprecedented in the composer's output

Focus on details that would help a performer understand the composer's intentions and make interpretive decisions.`;
}

function buildInterpretationQuery(composer: string, title: string, instrument: string): string {
  return `How do famous performers interpret ${composer}'s "${title}" differently, and what are the key interpretive decisions?

Please cover:
- Notable recordings and what makes each distinctive (specific tempo choices, phrasing, character)
- Key interpretive decisions performers must make (tempo, dynamics, ornamentation, pedaling)
- Different schools of interpretation (e.g., historical performance practice vs modern approach)
- Any documented performance advice from the composer or contemporaries
- What separates great performances from merely correct ones

Include specific performer names, recording years, and concrete musical details where possible.`;
}

// ════════════════════════════════════════════════════════
// 메인 번들 생성
// ════════════════════════════════════════════════════════

export async function buildV3SourceBundle(params: {
  composer: string;
  title: string;
  instrument: string;
  perplexityApiKey: string;
  openaiApiKey: string;
  academicInjection: string;
  hasPapers: boolean;
}): Promise<V3SourceBundle> {
  const { composer, title, instrument, perplexityApiKey, openaiApiKey, academicInjection, hasPapers } = params;

  console.log("[phase0-v3] 3개 소스 병렬 수집 시작");

  const [perplexityResults, curatedResult] = await Promise.allSettled([
    Promise.allSettled([
      queryPerplexity(buildTechnicalQuery(composer, title, instrument), perplexityApiKey, 2000),
      queryPerplexity(buildHistoricalQuery(composer, title), perplexityApiKey, 1500),
      queryPerplexity(buildInterpretationQuery(composer, title, instrument), perplexityApiKey, 1500),
      queryPerplexity(createContextSearchPrompt(composer, title), perplexityApiKey, 2000),
    ]),
    findComposerResources(composer, title),
  ]);

  const pValues = perplexityResults.status === "fulfilled"
    ? perplexityResults.value
    : ([] as PromiseSettledResult<string>[]);

  let technical = pValues[0]?.status === "fulfilled" ? pValues[0].value : "";
  let historical = pValues[1]?.status === "fulfilled" ? pValues[1].value : "";
  let interpretation = pValues[2]?.status === "fulfilled" ? pValues[2].value : "";
  let context = pValues[3]?.status === "fulfilled" ? pValues[3].value : "";

  // Perplexity 전체 실패 시 웹검색(gpt-4o-search-preview) fallback
  if (!technical && !historical && !interpretation) {
    console.warn("[phase0-v3] Perplexity 전체 실패 → gpt-4o-search-preview fallback 시작");
    const [ft, fh, fi, fc] = await Promise.allSettled([
      queryWithWebSearch(buildTechnicalQuery(composer, title, instrument), openaiApiKey, 2000),
      queryWithWebSearch(buildHistoricalQuery(composer, title), openaiApiKey, 1500),
      queryWithWebSearch(buildInterpretationQuery(composer, title, instrument), openaiApiKey, 1500),
      queryWithWebSearch(createContextSearchPrompt(composer, title), openaiApiKey, 2000),
    ]);
    technical = ft.status === "fulfilled" ? ft.value : "";
    historical = fh.status === "fulfilled" ? fh.value : "";
    interpretation = fi.status === "fulfilled" ? fi.value : "";
    context = fc.status === "fulfilled" ? fc.value : "";
    console.log(`[phase0-v3] 웹검색 fallback 완료 — technical:${technical.length}자 | historical:${historical.length}자 | context:${context.length}자`);
  }

  const curatedData = curatedResult.status === "fulfilled" ? curatedResult.value : null;
  const curatedInjection = curatedData?.totalRelevantText ?? "";
  const resourceCount = curatedData?.resources?.length ?? 0;

  console.log(
    `[phase0-v3] 완료 — technical:${technical.length}자 | historical:${historical.length}자 | interpretation:${interpretation.length}자 | context:${context.length}자 | curated:${resourceCount}건 | academic:${hasPapers ? "있음" : "없음"}`,
  );

  return {
    perplexity: {
      technical,
      historical,
      interpretation,
      context,
      raw: [technical, historical, interpretation, context].filter(Boolean).join("\n\n"),
    },
    academic: {
      injection: academicInjection,
      hasPapers,
    },
    curated: {
      injection: curatedInjection,
      hasCuratedData: resourceCount > 0,
      resourceCount,
    },
  };
}

// ════════════════════════════════════════════════════════
// Phase B용 소스 블록
// ════════════════════════════════════════════════════════

export function buildCoachingSourceBlock(bundle: V3SourceBundle): string {
  const sections: string[] = [];

  if (bundle.curated.hasCuratedData) {
    sections.push(
      `[⭐ 큐레이션 학술자료 — 가장 신뢰도 높음, 최우선 반영]\n` +
      bundle.curated.injection.slice(0, 8000),
    );
  }

  if (bundle.academic.hasPapers) {
    sections.push(
      `[📚 학술 논문 분석]\n` + bundle.academic.injection.slice(0, 3000),
    );
  }

  if (bundle.perplexity.technical) {
    sections.push(
      `[🎯 연주 기교 레퍼런스]\n` + bundle.perplexity.technical.slice(0, 2500),
    );
  }

  if (bundle.perplexity.historical) {
    sections.push(
      `[📖 작곡 맥락]\n` + bundle.perplexity.historical.slice(0, 1500),
    );
  }

  if (bundle.perplexity.context) {
    sections.push(
      `[🏛️ 역사·인문학적 맥락]\n` + bundle.perplexity.context.slice(0, 2500),
    );
  }

  if (sections.length === 0) {
    return "(레퍼런스 데이터 없음 — 음악학적 지식에 기반하여 작성)";
  }

  const curatedDirective = bundle.curated.hasCuratedData
    ? `\n\n🚨🚨 [큐레이션 학술자료 활용 필수 지침]
위 [⭐ 큐레이션 학술자료]는 실제 석사논문과 학술자료입니다.
반드시 아래 규칙을 따르십시오:
1. composition_background, at_composition, form_and_structure 작성 시 위 자료에 언급된 구체적 사실(장소, 인물, 사건, 날짜, 학자 주장)을 직접 반영하십시오.
2. "깊은 감정", "후기 스타일", "종교적 주제" 처럼 어느 작곡가에도 쓸 수 있는 일반론 표현은 금지입니다.
3. 위 자료에 있는 내용을 먼저 쓰고, 자료에 없는 내용만 훈련 지식으로 보완하십시오.
4. 위 자료에 특정 학자 이름이나 주장이 있으면 반드시 인용하십시오.`
    : "";

  return sections.join("\n\n" + "─".repeat(60) + "\n\n") + curatedDirective;
}

// ════════════════════════════════════════════════════════
// Phase C용 소스 블록
// ════════════════════════════════════════════════════════

export function buildGuidesSourceBlock(bundle: V3SourceBundle): string {
  const sections: string[] = [];

  if (bundle.curated.hasCuratedData) {
    sections.push(`[⭐ 큐레이션 학술자료]\n` + bundle.curated.injection.slice(0, 4000));
  }

  if (bundle.perplexity.interpretation) {
    sections.push(`[🎵 해석 레퍼런스]\n` + bundle.perplexity.interpretation.slice(0, 2000));
  }

  if (bundle.perplexity.historical) {
    sections.push(`[📖 작곡 맥락]\n` + bundle.perplexity.historical.slice(0, 1000));
  }

  if (bundle.perplexity.context) {
    sections.push(`[🏛️ 역사·인문학적 맥락]\n` + bundle.perplexity.context.slice(0, 1500));
  }

  if (sections.length === 0) {
    return "(레퍼런스 데이터 없음)";
  }

  const curatedDirective = bundle.curated.hasCuratedData
    ? `\n\n🚨🚨 [큐레이션 학술자료 활용 필수 지침]
위 [⭐ 큐레이션 학술자료]는 실제 석사논문과 학술자료입니다.
반드시 아래 규칙을 따르십시오:
1. composition_background, at_composition, form_and_structure 작성 시 위 자료에 언급된 구체적 사실(장소, 인물, 사건, 날짜, 학자 주장)을 직접 반영하십시오.
2. "깊은 감정", "후기 스타일", "종교적 주제" 처럼 어느 작곡가에도 쓸 수 있는 일반론 표현은 금지입니다.
3. 위 자료에 있는 내용을 먼저 쓰고, 자료에 없는 내용만 훈련 지식으로 보완하십시오.
4. 위 자료에 특정 학자 이름이나 주장이 있으면 반드시 인용하십시오.`
    : "";

  return sections.join("\n\n" + "─".repeat(60) + "\n\n") + curatedDirective;
}
