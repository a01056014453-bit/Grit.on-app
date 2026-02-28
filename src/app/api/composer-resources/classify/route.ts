import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * PDF 텍스트를 받아서 GPT로 메타데이터를 자동 추출
 */
export async function POST(request: NextRequest) {
  try {
    const { extracted_text } = await request.json();

    if (!extracted_text?.trim()) {
      return NextResponse.json(
        { error: "텍스트가 필요합니다." },
        { status: 400 },
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY 미설정" },
        { status: 500 },
      );
    }

    const openai = new OpenAI({ apiKey: openaiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `당신은 음악학 논문 메타데이터 추출 전문가입니다.
주어진 텍스트에서 정보를 정확히 추출하세요. 추측하지 마세요.
반드시 JSON만 출력하세요.`,
        },
        {
          role: "user",
          content: `다음 학술자료 텍스트에서 메타데이터를 추출해주세요.

텍스트 (앞부분):
${extracted_text.substring(0, 8000)}

---

아래 JSON 형식으로만 응답:
{
  "composer": "논문이 다루는 주요 작곡가 이름 (원어, 예: N. Kapustin)",
  "title": "논문/자료의 제목",
  "resource_type": "paper | thesis | dissertation | article 중 하나",
  "author": "논문 저자 이름",
  "year": "출판/제출 연도 (4자리)",
  "source": "출판 기관/학교/학술지명",
  "language": "ko | en | de | fr | ja 중 하나",
  "piece_title": "논문이 분석하는 특정 곡명 (없으면 빈 문자열)",
  "tags": ["관련 키워드 태그 3-5개"]
}`,
        },
      ],
      max_tokens: 1024,
      temperature: 0.1,
    });

    const text = completion.choices[0]?.message?.content || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json(
        { error: "메타데이터 추출 실패" },
        { status: 500 },
      );
    }

    const metadata = JSON.parse(match[0]);
    return NextResponse.json({ success: true, metadata });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Classify] 오류:", msg, error);
    return NextResponse.json(
      { error: `분류 중 오류: ${msg}` },
      { status: 500 },
    );
  }
}
