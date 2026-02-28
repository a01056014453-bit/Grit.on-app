import { NextRequest, NextResponse } from "next/server";
import {
  saveComposerResource,
  getAllComposerResources,
  deleteComposerResource,
} from "@/lib/composer-resources";
import type { ResourceType } from "@/types/composer-resource";
import OpenAI from "openai";

// ── POST: 새 학술자료 저장 (JSON — PDF는 프론트에서 직접 Storage 업로드) ──

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      composer,
      title,
      resource_type = "paper",
      author,
      year,
      source,
      language = "ko",
      piece_title,
      extracted_text,
      pdf_storage_path,
      file_size_bytes,
      page_count,
      uploaded_by,
      tags,
      auto_translate = false,
    } = body as {
      composer: string;
      title: string;
      resource_type?: ResourceType;
      author?: string;
      year?: string;
      source?: string;
      language?: string;
      piece_title?: string;
      extracted_text: string;
      pdf_storage_path?: string;
      file_size_bytes?: number;
      page_count?: number;
      uploaded_by?: string;
      tags?: string[];
      auto_translate?: boolean;
    };

    if (!composer?.trim() || !title?.trim() || !extracted_text?.trim()) {
      return NextResponse.json(
        { error: "작곡가, 제목, 추출된 텍스트는 필수입니다." },
        { status: 400 },
      );
    }

    // ── 비한국어 자료 자동 번역/요약 ──────────────────────
    let summary_korean: string | undefined;
    if (auto_translate && language !== "ko") {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (openaiKey) {
        const openai = new OpenAI({ apiKey: openaiKey });
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: "음악학 전문 번역가. 자료에 없는 내용 추가 금지. 한국어로 번역하되 음악 용어는 원어 병기.",
              },
              {
                role: "user",
                content: `"${composer}" 관련 해외 학술자료 (원문: ${language}).
핵심 내용만 추출·번역:
1. 화성 분석 (조성, 화성 진행)
2. 형식·구조 분석 (마디 번호, 섹션)
3. 작곡 기법
4. 연주 해석 (템포, 터치, 페달링)
5. 역사·맥락
6. 출처 정보
---
${extracted_text.substring(0, 20000)}
---`,
              },
            ],
            max_tokens: 4000,
            temperature: 0.1,
          });
          summary_korean = completion.choices[0]?.message?.content || undefined;
        } catch (e) {
          console.error("[ComposerResources] 번역 실패:", e instanceof Error ? e.message : e);
        }
      }
    }

    const result = await saveComposerResource({
      composer: composer.trim(),
      title: title.trim(),
      resource_type,
      author: author?.trim(),
      year: year?.trim(),
      source: source?.trim(),
      language,
      piece_title: piece_title?.trim(),
      extracted_text: extracted_text.substring(0, 100000),
      pdf_storage_path,
      file_size_bytes,
      page_count,
      uploaded_by,
      tags,
      ...(summary_korean ? { summary_korean } : {}),
    });

    if (!result) {
      return NextResponse.json(
        { error: "저장에 실패했습니다." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error("[ComposerResources API] POST 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

// ── GET: 전체 목록 조회 ─────────────────────────────────────

export async function GET() {
  try {
    const resources = await getAllComposerResources();
    return NextResponse.json({ success: true, data: resources });
  } catch (error) {
    console.error("[ComposerResources API] GET 오류:", error);
    return NextResponse.json(
      { error: "조회 실패" },
      { status: 500 },
    );
  }
}

// ── DELETE: 비활성화 ────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID 필수" }, { status: 400 });
    }

    const success = await deleteComposerResource(id);
    if (!success) {
      return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ComposerResources API] DELETE 오류:", error);
    return NextResponse.json(
      { error: "서버 오류" },
      { status: 500 },
    );
  }
}
