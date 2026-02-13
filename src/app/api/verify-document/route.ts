import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { AIDocumentReviewItem, AIReview, AIVerdict } from "@/types";

function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function extractJSON(text: string): string {
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlockMatch) return jsonBlockMatch[1].trim();

  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0].trim();

  return text.trim();
}

interface DocumentInput {
  id: string;
  type: string;
  fileName: string;
  fileData: string; // base64 data URL
}

async function analyzeDocument(
  client: OpenAI,
  doc: DocumentInput,
): Promise<AIDocumentReviewItem> {
  const isPDF = doc.fileName.toLowerCase().endsWith(".pdf");

  if (isPDF) {
    return {
      documentId: doc.id,
      isValid: false,
      confidence: 0,
      warnings: ["PDF 파일은 AI 이미지 분석이 불가합니다. 관리자가 직접 확인해 주세요."],
    };
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `당신은 음악 교육 자격 서류를 검증하는 AI 심사관입니다.
제출된 서류 이미지를 분석하여 다음 JSON 형식으로 응답하세요:
{
  "isValid": true/false,
  "institution": "기관명 (알 수 있는 경우)",
  "major": "전공/분야 (알 수 있는 경우)",
  "confidence": 0.0~1.0,
  "warnings": ["경고사항 배열"]
}

판단 기준:
- 졸업증명서, 재학증명서, 자격증 등 공식 서류인지 확인
- 음악 관련 기관/전공인지 확인
- 위조가 의심되는 경우 경고
- 이미지가 불선명하거나 읽기 어려운 경우 confidence를 낮추고 경고 추가`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `이 서류를 분석해 주세요. 서류 종류: ${doc.type}, 파일명: ${doc.fileName}`,
            },
            {
              type: "image_url",
              image_url: { url: doc.fileData, detail: "low" },
            },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content || "";
    const parsed = JSON.parse(extractJSON(raw));

    return {
      documentId: doc.id,
      isValid: Boolean(parsed.isValid),
      institution: parsed.institution || undefined,
      major: parsed.major || undefined,
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0)),
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
    };
  } catch {
    return {
      documentId: doc.id,
      isValid: false,
      confidence: 0,
      warnings: ["AI 분석 중 오류가 발생했습니다."],
    };
  }
}

function determineVerdict(items: AIDocumentReviewItem[]): AIVerdict {
  if (items.length === 0) return "needs_attention";

  const validCount = items.filter((d) => d.isValid).length;
  const avgConfidence =
    items.reduce((sum, d) => sum + d.confidence, 0) / items.length;
  const hasWarnings = items.some((d) => d.warnings.length > 0);

  if (validCount === items.length && avgConfidence >= 0.7 && !hasWarnings) {
    return "likely_valid";
  }
  if (validCount === 0 || avgConfidence < 0.3) {
    return "suspicious";
  }
  return "needs_attention";
}

function generateSummary(items: AIDocumentReviewItem[], verdict: AIVerdict): string {
  const validCount = items.filter((d) => d.isValid).length;
  const total = items.length;

  switch (verdict) {
    case "likely_valid":
      return `${total}건의 서류 중 ${validCount}건이 유효한 것으로 판단됩니다.`;
    case "needs_attention":
      return `${total}건의 서류 중 ${validCount}건이 유효하나, 일부 확인이 필요합니다.`;
    case "suspicious":
      return `${total}건의 서류에서 유효성 확인이 어렵습니다. 관리자 직접 확인이 필요합니다.`;
  }
}

export async function POST(request: Request) {
  try {
    const { documents } = (await request.json()) as {
      documents: DocumentInput[];
    };

    if (!documents || documents.length === 0) {
      return NextResponse.json(
        { error: "서류가 없습니다." },
        { status: 400 },
      );
    }

    const client = getOpenAIClient();
    if (!client) {
      // API 키 없으면 placeholder 반환
      const placeholderItems: AIDocumentReviewItem[] = documents.map((doc) => ({
        documentId: doc.id,
        isValid: false,
        confidence: 0,
        warnings: ["AI 분석을 사용할 수 없습니다 (API 키 미설정)."],
      }));

      const review: AIReview = {
        verdict: "needs_attention",
        summary: "AI 분석을 사용할 수 없어 관리자 직접 확인이 필요합니다.",
        documents: placeholderItems,
        reviewedAt: new Date().toISOString(),
      };

      return NextResponse.json({ aiReview: review });
    }

    const items = await Promise.all(
      documents.map((doc) => analyzeDocument(client, doc)),
    );

    const verdict = determineVerdict(items);
    const summary = generateSummary(items, verdict);

    const review: AIReview = {
      verdict,
      summary,
      documents: items,
      reviewedAt: new Date().toISOString(),
    };

    return NextResponse.json({ aiReview: review });
  } catch {
    // 분석 실패해도 에러 없이 placeholder 반환
    const review: AIReview = {
      verdict: "needs_attention",
      summary: "AI 분석 중 오류가 발생했습니다. 관리자 직접 확인이 필요합니다.",
      documents: [],
      reviewedAt: new Date().toISOString(),
    };

    return NextResponse.json({ aiReview: review });
  }
}
