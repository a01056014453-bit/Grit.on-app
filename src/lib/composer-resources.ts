/**
 * lib/composer-resources.ts
 *
 * 작곡가별 학술자료 DB — CRUD + 분석 파이프라인 연동
 */

import { supabaseServer } from "@/lib/supabase-server";
import type {
  ComposerResource,
  ComposerResourceInsert,
  ResourceSearchResult,
} from "@/types/composer-resource";

// composer_resources 테이블은 Supabase 타입에 아직 없으므로 any 캐스팅
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const table = () => (supabaseServer as any).from("composer_resources");

// ── 정규화 ──────────────────────────────────────────────────

function normalizeComposerKey(composer: string): string {
  return composer
    .split(" ")
    .pop()!
    .replace(/[^a-zA-Z가-힣]/g, "")
    .toLowerCase();
}

function normalizeOpusPattern(title: string): string | null {
  const match = title.match(
    /(?:op\.?\s*\d+(?:\s*no\.?\s*\d+)?|bwv\s*\d+|s\.?\s*\d+|k\.?\s*\d+|hob\.?\s*[\w:]+)/i,
  );
  return match ? match[0].replace(/\s/g, "").toLowerCase() : null;
}

// ── 검색 (분석 파이프라인용) ─────────────────────────────────

/**
 * Phase 0에서 호출 — 작곡가 + 곡 제목으로 관련 학술자료 검색
 *
 * 1순위: opus 패턴 정확 매칭 (곡별 자료)
 * 2순위: extracted_text에 곡명/opus 포함 (텍스트 검색)
 * 3순위: 같은 작곡가의 모든 자료 (배경 지식)
 */
export async function findComposerResources(
  composer: string,
  title: string,
): Promise<ResourceSearchResult> {
  const composerKey = normalizeComposerKey(composer);
  const opusPattern = normalizeOpusPattern(title);

  try {
    // 같은 작곡가의 활성 자료 전체 조회
    const { data, error } = await table()
      .select("*")
      .eq("composer_normalized", composerKey)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return { resources: [], totalRelevantText: "" };
    }

    const resources = data as ComposerResource[];

    // 관련도 점수 매기기
    const scored = resources.map((r) => {
      let score = 1; // 기본: 같은 작곡가

      // opus 패턴 매칭
      if (opusPattern && r.opus_pattern === opusPattern) {
        score = 10; // 최고 우선순위
      }

      // 텍스트에서 곡명/opus 언급 확인
      const text = (r.extracted_text + " " + (r.piece_title || "")).toLowerCase();
      if (opusPattern && text.includes(opusPattern)) {
        score = Math.max(score, 7);
      }
      const titleWords = title.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      const titleHits = titleWords.filter((w) => text.includes(w)).length;
      if (titleHits >= 2) {
        score = Math.max(score, 5);
      }

      return { resource: r, score };
    });

    // 점수순 정렬
    scored.sort((a, b) => b.score - a.score);

    // 상위 자료 선택 (총 30,000자 이내)
    const selected: ComposerResource[] = [];
    let totalLength = 0;
    const MAX_TEXT_LENGTH = 30000;

    for (const { resource } of scored) {
      const textToAdd = resource.summary_korean || resource.extracted_text;
      if (totalLength + textToAdd.length > MAX_TEXT_LENGTH && selected.length > 0) break;
      selected.push(resource);
      totalLength += textToAdd.length;
    }

    // 프롬프트용 텍스트 포맷
    const formattedText = selected
      .map((r, i) => {
        const label = r.resource_type === "thesis" ? "석사논문" :
          r.resource_type === "dissertation" ? "박사논문" :
          r.resource_type === "article" ? "학술기사" : "논문";
        const meta = [
          r.author && `저자: ${r.author}`,
          r.year && `(${r.year})`,
          r.source && `출처: ${r.source}`,
          r.piece_title && `대상곡: ${r.piece_title}`,
        ].filter(Boolean).join(", ");

        const content = r.summary_korean || r.extracted_text;
        return `[학술자료 ${i + 1}] ${label} — ${r.title}\n${meta}\n\n${content.substring(0, 15000)}`;
      })
      .join("\n\n" + "─".repeat(60) + "\n\n");

    return { resources: selected, totalRelevantText: formattedText };
  } catch (e) {
    console.error("[ComposerResources] 검색 실패:", e instanceof Error ? e.message : e);
    return { resources: [], totalRelevantText: "" };
  }
}

// ── CRUD ────────────────────────────────────────────────────

export async function saveComposerResource(
  input: ComposerResourceInsert,
): Promise<{ id: string } | null> {
  const composerNormalized = normalizeComposerKey(input.composer);
  const opusPattern = normalizeOpusPattern(input.piece_title || "");

  const row = {
    ...input,
    composer_normalized: composerNormalized,
    opus_pattern: opusPattern,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await table().insert(row).select("id").single();
  if (error) {
    console.error("[ComposerResources] 저장 실패:", error.message);
    return null;
  }
  return data as { id: string };
}

export async function getAllComposerResources(): Promise<ComposerResource[]> {
  const { data, error } = await table()
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[ComposerResources] 전체 조회 실패:", error.message);
    return [];
  }
  return (data as ComposerResource[]) || [];
}

export async function getResourcesByComposer(composer: string): Promise<ComposerResource[]> {
  const composerKey = normalizeComposerKey(composer);
  const { data, error } = await table()
    .select("*")
    .eq("composer_normalized", composerKey)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[ComposerResources] 작곡가별 조회 실패:", error.message);
    return [];
  }
  return (data as ComposerResource[]) || [];
}

export async function deleteComposerResource(id: string): Promise<boolean> {
  const { error } = await table()
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[ComposerResources] 삭제 실패:", error.message);
    return false;
  }
  return true;
}

export async function updateComposerResource(
  id: string,
  updates: Partial<ComposerResourceInsert & { summary_korean: string }>,
): Promise<boolean> {
  const { error } = await table()
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[ComposerResources] 수정 실패:", error.message);
    return false;
  }
  return true;
}
