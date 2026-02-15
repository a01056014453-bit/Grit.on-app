import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getCachedAnalysis, saveCachedAnalysis, deleteCachedAnalysis } from "@/lib/song-analysis-db";
import { supabaseServer } from "@/lib/supabase-server";
import {
  createReferenceSearchPrompt,
  createPhase1Prompt,
  createPhase2Prompt,
  createPhase3Prompt,
  createPhase4Prompt,
  createMusicologistPrompt,
  createMusicXmlPrompt,
  createStructureOnlyPrompt,
  createDetailAnalysisPrompt,
  createExtraTechniquePrompt,
  isLargeWork,
} from "@/lib/analysis-prompts";
import type {
  SongAnalysis,
  SongAnalysisContentV2,
  AnalyzeSongRequest,
  AnalyzeSongResponse,
  DifficultyLevel,
  VerificationStatus,
  StructureAnalysisV2,
  PracticeMethod,
  RecommendedPerformanceV2,
  SongOverview,
  ComposerLife,
  HistoricalBackground,
  SongCharacteristics,
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

/** JSON 블록 추출 (Perplexity citations [1][2] 등 제거) */
function extractJSON(text: string): string {
  // Perplexity citation 제거: [1], [2][3], [1][2][3] 등
  let cleaned = text.replace(/\[(\d+)\]/g, "");

  const jsonBlockMatch = cleaned.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlockMatch) return jsonBlockMatch[1].trim();
  const braceMatch = cleaned.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0].trim();
  return cleaned.trim();
}

/** 안전한 JSON 파싱: 실패 시 GPT로 재포맷 */
async function safeParseJSON(
  text: string,
  openai: OpenAI,
  label: string,
): Promise<Record<string, unknown>> {
  const jsonStr = extractJSON(text);
  try {
    return JSON.parse(jsonStr);
  } catch {
    console.log(`[${label}] JSON 파싱 실패 → GPT로 재포맷`);
    const reformatted = await callGPT(
      openai,
      `다음 텍스트에서 JSON 객체만 추출하여 유효한 JSON으로 변환하십시오. 텍스트 설명이나 마크다운은 제거하고 순수 JSON만 출력하십시오.\n\n${text}`,
      8192,
      0.1,
    );
    return JSON.parse(extractJSON(reformatted));
  }
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

/** Perplexity 클라이언트 (메인 분석 엔진) */
function getPerplexityClient(): OpenAI | null {
  if (!process.env.PERPLEXITY_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.PERPLEXITY_API_KEY,
    baseURL: "https://api.perplexity.ai",
  });
}

/** GPT 호출 (보조/폴백용) */
async function callGPT(
  openai: OpenAI,
  prompt: string,
  maxTokens: number = 8192,
  temperature: number = 0.3,
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: maxTokens,
    temperature,
    top_p: 0.2,
  });
  return completion.choices[0]?.message?.content || "";
}

/** Perplexity 호출 (메인) */
async function callPerplexity(
  prompt: string,
  maxTokens: number = 8192,
): Promise<string | null> {
  const perplexity = getPerplexityClient();
  if (!perplexity) return null;

  try {
    const completion = await perplexity.chat.completions.create({
      model: "sonar-pro",
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.1,
    });
    return completion.choices[0]?.message?.content || null;
  } catch (error) {
    console.error("[Perplexity] 호출 실패:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** AI 호출: Perplexity 우선, 실패 시 GPT 폴백 */
async function callAI(
  openai: OpenAI,
  prompt: string,
  maxTokens: number = 8192,
  label: string = "",
): Promise<string> {
  // 1차: Perplexity (웹 검색 기반, 정확도 높음)
  const perplexityResult = await callPerplexity(prompt, maxTokens);
  if (perplexityResult) {
    console.log(`[${label}] Perplexity 응답 (${perplexityResult.length}자)`);
    return perplexityResult;
  }

  // 2차: GPT 폴백
  console.log(`[${label}] Perplexity 실패 → GPT 폴백`);
  return callGPT(openai, prompt, maxTokens, 0.2);
}

/** Phase 0: 레퍼런스 데이터 검색 (Perplexity sonar-pro) */
async function searchMusicReference(
  composer: string,
  title: string,
): Promise<string | null> {
  const perplexity = getPerplexityClient();
  if (!perplexity) {
    console.log("[Phase 0] PERPLEXITY_API_KEY 미설정 — 레퍼런스 검색 건너뜀");
    return null;
  }

  try {
    console.log("[Phase 0] Perplexity 레퍼런스 검색 중...");
    const prompt = createReferenceSearchPrompt(composer, title);
    const completion = await perplexity.chat.completions.create({
      model: "sonar-pro",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
      temperature: 0.1,
    });

    const result = completion.choices[0]?.message?.content || null;
    if (result) {
      console.log(`[Phase 0] 레퍼런스 확보: ${result.length}자`);
    }
    return result;
  } catch (error) {
    console.error("[Phase 0] Perplexity 검색 실패:", error instanceof Error ? error.message : error);
    return null;
  }
}

// ── 4-Phase 파이프라인 ──

async function runPhase1(
  openai: OpenAI,
  composer: string,
  title: string,
  musicXml?: string,
  referenceData?: string | null,
): Promise<{ meta: SongAnalysis["meta"]; song_overview: SongOverview }> {
  console.log("[Phase 1] 데이터 검증 + 곡 개요...");
  const prompt = createPhase1Prompt(composer, title, musicXml, referenceData || undefined);
  const text = await callAI(openai, prompt, 4096, "Phase 1");
  const parsed = await safeParseJSON(text, openai, "Phase 1");

  const meta: SongAnalysis["meta"] = {
    composer: parsed.meta?.composer || composer,
    title: parsed.meta?.title || title,
    opus: filterNeedsReview(parsed.meta?.opus) || "",
    key: filterNeedsReview(parsed.meta?.key) || "",
    difficulty_level: (
      ["Beginner", "Intermediate", "Advanced", "Virtuoso"].includes(parsed.meta?.difficulty_level)
        ? parsed.meta.difficulty_level
        : "Intermediate"
    ) as DifficultyLevel,
  };

  const song_overview: SongOverview = {
    title_original: parsed.song_overview?.title_original || title,
    title_korean: parsed.song_overview?.title_korean || undefined,
    composition_period: parsed.song_overview?.composition_period || "",
    tempo_marking: parsed.song_overview?.tempo_marking || "",
    genre: parsed.song_overview?.genre || "",
    form: parsed.song_overview?.form || "",
    musical_features: Array.isArray(parsed.song_overview?.musical_features)
      ? parsed.song_overview.musical_features
      : [],
  };

  console.log(`[Phase 1] Done: ${meta.composer} - ${meta.title} (${meta.opus})`);
  return { meta, song_overview };
}

async function runPhase2(
  openai: OpenAI,
  composer: string,
  title: string,
  opus: string,
): Promise<{
  composer_life: ComposerLife;
  historical_background: HistoricalBackground;
  song_characteristics: SongCharacteristics;
}> {
  console.log("[Phase 2] 인문학적 배경...");
  const prompt = createPhase2Prompt(composer, title, opus);
  const text = await callAI(openai, prompt, 8192, "Phase 2");
  const parsed = await safeParseJSON(text, openai, "Phase 2");

  const composer_life: ComposerLife = {
    summary: parsed.composer_life?.summary || "",
    timeline: Array.isArray(parsed.composer_life?.timeline) ? parsed.composer_life.timeline : [],
    at_composition: parsed.composer_life?.at_composition || "",
  };

  const historical_background: HistoricalBackground = {
    era_characteristics: parsed.historical_background?.era_characteristics || "",
    contemporary_composers: parsed.historical_background?.contemporary_composers || "",
    musical_movement: parsed.historical_background?.musical_movement || "",
  };

  const song_characteristics: SongCharacteristics = {
    composition_background: parsed.song_characteristics?.composition_background || "",
    form_and_structure: parsed.song_characteristics?.form_and_structure || "",
    technique: parsed.song_characteristics?.technique || "",
    literary_dramatic: parsed.song_characteristics?.literary_dramatic || "",
    conclusion: parsed.song_characteristics?.conclusion || "",
  };

  console.log(`[Phase 2] Done`);
  return { composer_life, historical_background, song_characteristics };
}

async function runPhase3(
  openai: OpenAI,
  composer: string,
  title: string,
  opus: string,
  musicXml?: string,
  referenceData?: string | null,
): Promise<{ structure_analysis_v2: StructureAnalysisV2 }> {
  console.log("[Phase 3] 구조/화성 분석...");
  const prompt = createPhase3Prompt(composer, title, opus, musicXml, referenceData || undefined);
  const text = await callAI(openai, prompt, 16384, "Phase 3");
  const parsed = await safeParseJSON(text, openai, "Phase 3");

  const structure_analysis_v2: StructureAnalysisV2 = {
    sections: Array.isArray(parsed.structure_analysis_v2?.sections)
      ? parsed.structure_analysis_v2.sections
      : [],
    harmony_table: Array.isArray(parsed.structure_analysis_v2?.harmony_table)
      ? parsed.structure_analysis_v2.harmony_table
      : [],
  };

  console.log(`[Phase 3] Done: ${structure_analysis_v2.sections.length} sections, ${structure_analysis_v2.harmony_table.length} harmony rows`);
  return { structure_analysis_v2 };
}

async function runPhase4(
  openai: OpenAI,
  composer: string,
  title: string,
  opus: string,
  sectionNames: string[],
): Promise<{
  practice_method: PracticeMethod;
  recommended_performances_v2: RecommendedPerformanceV2[];
}> {
  console.log("[Phase 4] 연습법 + 4주 루틴 + 추천 연주...");
  const prompt = createPhase4Prompt(composer, title, opus, sectionNames);
  const text = await callAI(openai, prompt, 16384, "Phase 4");
  const parsed = await safeParseJSON(text, openai, "Phase 4");

  const practice_method: PracticeMethod = {
    technique_summary: Array.isArray(parsed.practice_method?.technique_summary)
      ? parsed.practice_method.technique_summary
      : [],
    section_guides: Array.isArray(parsed.practice_method?.section_guides)
      ? parsed.practice_method.section_guides
      : [],
    weekly_routine: Array.isArray(parsed.practice_method?.weekly_routine)
      ? parsed.practice_method.weekly_routine
      : [],
  };

  const recommended_performances_v2: RecommendedPerformanceV2[] = Array.isArray(
    parsed.recommended_performances_v2
  )
    ? parsed.recommended_performances_v2
    : [];

  console.log(`[Phase 4] Done: ${practice_method.section_guides.length} guides, ${practice_method.weekly_routine.length} weeks, ${recommended_performances_v2.length} performances`);
  return { practice_method, recommended_performances_v2 };
}

/** 4-Phase 파이프라인 실행 (V2) */
async function runV2Pipeline(
  openai: OpenAI,
  composer: string,
  title: string,
  musicXml?: string,
): Promise<SongAnalysis> {
  // Phase 0: 레퍼런스 데이터 검색 (Perplexity)
  const referenceData = await searchMusicReference(composer, title);

  // Phase 1: 데이터 검증 + 곡 개요 (레퍼런스 데이터 주입)
  const { meta, song_overview } = await runPhase1(openai, composer, title, musicXml, referenceData);

  // Phase 2 & 3: 병렬 실행 (Phase 3에 레퍼런스 데이터 주입)
  const [phase2Result, phase3Result] = await Promise.all([
    runPhase2(openai, meta.composer, meta.title, meta.opus),
    runPhase3(openai, meta.composer, meta.title, meta.opus, musicXml, referenceData),
  ]);

  // Phase 4: Phase 3 결과 기반
  const sectionNames = phase3Result.structure_analysis_v2.sections.map((s) => s.section);
  const phase4Result = await runPhase4(
    openai,
    meta.composer,
    meta.title,
    meta.opus,
    sectionNames.length > 0 ? sectionNames : ["전체"],
  );

  // 하위 호환 필드 자동 생성
  const composer_background = phase2Result.composer_life.summary;
  const historical_context = phase2Result.historical_background.era_characteristics;
  const work_background = phase2Result.song_characteristics.composition_background;

  const structure_analysis = phase3Result.structure_analysis_v2.sections.map((s) => ({
    section: s.section,
    measures: s.measures,
    key_tempo: `${s.key_signature} / ${s.time_signature} / ${s.tempo}`,
    character: s.mood,
    description: s.description,
  }));

  const technique_tips = phase4Result.practice_method.section_guides.map((g) => ({
    section: g.section,
    problem: "",
    category: undefined as undefined,
    solution: g.guide,
    practice: "",
  }));

  const musical_interpretation = phase2Result.song_characteristics.conclusion;

  const recommended_performances = phase4Result.recommended_performances_v2.map((p) => ({
    artist: p.artist,
    year: p.year,
    comment: p.comment,
  }));

  // 희귀 작곡가 체크
  const rareComposers = [
    "alkan", "godowsky", "sorabji", "busoni", "thalberg",
    "medtner", "lyapunov", "moszkowski", "scharwenka"
  ];
  const isRareComposer = rareComposers.some(
    (rc) => composer.toLowerCase().includes(rc)
  );

  const content: SongAnalysisContentV2 = {
    // 하위 호환 V1 필드
    composer_background,
    historical_context,
    work_background,
    structure_analysis,
    technique_tips,
    musical_interpretation,
    recommended_performances,
    // V2 신규 필드
    song_overview,
    composer_life: phase2Result.composer_life,
    historical_background: phase2Result.historical_background,
    song_characteristics: phase2Result.song_characteristics,
    structure_analysis_v2: phase3Result.structure_analysis_v2,
    practice_method: phase4Result.practice_method,
    recommended_performances_v2: phase4Result.recommended_performances_v2,
  };

  return {
    id: generateId(),
    meta,
    content,
    verification_status: isRareComposer ? "Needs Review" : "Verified",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    schema_version: 2,
  };
}

// ── 기존 V1 파이프라인 (하위 호환) ──

function parseAndValidateResponse(
  responseText: string,
  composer: string,
  title: string
): SongAnalysis {
  const jsonStr = extractJSON(responseText);
  const parsed = JSON.parse(jsonStr);

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
    schema_version: 1,
  };

  return analysis;
}

async function runV1Pipeline(
  openai: OpenAI,
  composer: string,
  title: string,
  sheetMusicImages?: string[],
  musicXml?: string,
): Promise<SongAnalysis> {
  const hasImages = sheetMusicImages && sheetMusicImages.length > 0;
  const hasMusicXml = musicXml && musicXml.length > 0;

  if (hasMusicXml) {
    console.log(`[V1 MusicXML] ${title} - ${musicXml!.length} chars`);
    const xmlPrompt = createMusicXmlPrompt(composer, title, musicXml!);
    const responseText = await callGPT(openai, xmlPrompt, 16384);
    return parseAndValidateResponse(responseText, composer, title);
  }

  if (isLargeWork(title) && !hasImages) {
    console.log(`[V1 Large Work] ${title} - two-pass analysis`);
    return runV1LargeWorkPipeline(openai, composer, title);
  }

  // 일반 작품
  const prompt = createMusicologistPrompt(composer, title);

  let messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  if (hasImages) {
    const imagePromptPrefix = `\n\n[악보 이미지 분석 지침]\n첨부된 악보 이미지를 반드시 참조하여 분석하십시오.`;
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

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    max_tokens: 16384,
    temperature: 0.2,
    top_p: 0.2,
  });

  let responseText = completion.choices[0]?.message?.content || "";

  // Vision 거절 시 텍스트 전용으로 fallback
  if (hasImages && (responseText.startsWith("I'm sorry") || responseText.startsWith("I can't") || responseText.startsWith("Sorry"))) {
    console.log("[V1 Vision Fallback] Retrying text-only...");
    if (isLargeWork(title)) {
      return runV1LargeWorkPipeline(openai, composer, title);
    }
    const fallbackCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 16384,
      temperature: 0.5,
      top_p: 0.3,
    });
    responseText = fallbackCompletion.choices[0]?.message?.content || "";
  }

  return parseAndValidateResponse(responseText, composer, title);
}

async function runV1LargeWorkPipeline(
  openai: OpenAI,
  composer: string,
  title: string,
): Promise<SongAnalysis> {
  // Call 1: 구조 분석
  const structurePrompt = createStructureOnlyPrompt(composer, title);
  const structureText = await callGPT(openai, structurePrompt, 16384);
  const structureJson = JSON.parse(extractJSON(structureText));
  const structureAnalysis: Array<{ section: string; measures?: string; key_tempo?: string; character?: string; description: string }> =
    Array.isArray(structureJson.structure_analysis) ? structureJson.structure_analysis : [];

  console.log(`[V1 Large Call 1] ${structureAnalysis.length} sections`);
  const sectionNames = structureAnalysis.map((s) => s.section);

  // Call 2: 상세 분석
  const detailPrompt = createDetailAnalysisPrompt(composer, title, sectionNames);
  const detailText = await callGPT(openai, detailPrompt, 16384);
  const detailJson = JSON.parse(extractJSON(detailText));
  let allTechniqueTips = detailJson.content?.technique_tips || [];

  // 누락 섹션 보완
  const coveredSections = new Set(
    allTechniqueTips.map((t: { section: string }) =>
      t.section.replace(/\s*\(.*\)/, "").trim()
    )
  );
  const missingSections = sectionNames.filter((s) => !coveredSections.has(s));

  if (missingSections.length > 0) {
    console.log(`[V1 Large] Missing ${missingSections.length} sections → extra calls`);
    const BATCH_SIZE = 12;
    for (let i = 0; i < missingSections.length; i += BATCH_SIZE) {
      const batch = missingSections.slice(i, i + BATCH_SIZE);
      const extraPrompt = createExtraTechniquePrompt(
        composer, title, batch, Math.floor(i / BATCH_SIZE), Math.ceil(missingSections.length / BATCH_SIZE)
      );
      const extraText = await callGPT(openai, extraPrompt, 16384);
      try {
        const extraJson = JSON.parse(extractJSON(extraText));
        if (Array.isArray(extraJson.technique_tips)) {
          allTechniqueTips = [...allTechniqueTips, ...extraJson.technique_tips];
        }
      } catch { /* skip */ }
    }
  }

  const mergedResponse = JSON.stringify({
    meta: detailJson.meta || { composer, title },
    content: {
      composer_background: detailJson.content?.composer_background || "",
      historical_context: detailJson.content?.historical_context || "",
      work_background: detailJson.content?.work_background || "",
      structure_analysis: structureAnalysis,
      technique_tips: allTechniqueTips,
      musical_interpretation: detailJson.content?.musical_interpretation || "",
      recommended_performances: detailJson.content?.recommended_performances || [],
    },
    verification_status: detailJson.verification_status || "Needs Review",
  });

  return parseAndValidateResponse(mergedResponse, composer, title);
}

// ── API 핸들러 ──

export async function POST(request: Request) {
  try {
    const body: AnalyzeSongRequest = await request.json();
    let { composer, title, forceRefresh = false, sheetMusicImages, musicXml } = body;
    const { pdfStoragePath, musicxmlStoragePath, useStoredSource, useV2 = true } = body;

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
      }
    }

    const hasImages = sheetMusicImages && sheetMusicImages.length > 0;
    const hasMusicXml = musicXml && musicXml.length > 0;

    // 1. 캐시 확인
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

    console.log(`[Cache MISS] ${composer} - ${title} - Calling AI (V2=${useV2})...`);

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

    if (useV2) {
      // ── V2 4-Phase 파이프라인 ──
      analysis = await runV2Pipeline(openai, composer, title, hasMusicXml ? musicXml : undefined);
    } else {
      // ── V1 기존 파이프라인 ──
      analysis = await runV1Pipeline(
        openai,
        composer,
        title,
        hasImages ? sheetMusicImages : undefined,
        hasMusicXml ? musicXml : undefined,
      );
    }

    // 저장 경로 보존
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

    // 캐시 저장
    await saveCachedAnalysis(analysis, composer, title);
    console.log(`[Cache SAVED] ${composer} - ${title} (schema_version=${analysis.schema_version})`);

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
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { success: false, error: "id가 필요합니다" },
        { status: 400 }
      );
    }
    const result = await deleteCachedAnalysis(id);
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
