import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { SongAIInfo } from "@/data/mock-songs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/** JSON 블록 추출 헬퍼 */
function extractJSON(text: string): string {
  // ```json ... ``` 블록에서 추출
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlockMatch) return jsonBlockMatch[1].trim();

  // { ... } 블록 직접 추출
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0].trim();

  return text.trim();
}

/** SongAIInfo 구조 검증 및 기본값 보완 */
function validateSongAIInfo(
  data: Record<string, unknown>,
  id: string,
  composer: string,
  title: string
): SongAIInfo {
  return {
    id,
    composer: (data.composer as string) || composer,
    composerFull: (data.composerFull as string) || composer,
    composerImage: data.composerImage as string | undefined,
    title: (data.title as string) || title,
    opus: (data.opus as string) || "",
    year: (data.year as string) || "",
    period: (data.period as string) || "클래식",
    difficulty: (["초급", "중급", "고급", "전문가"].includes(
      data.difficulty as string
    )
      ? data.difficulty
      : "중급") as SongAIInfo["difficulty"],
    keySignature: (data.keySignature as string) || "",
    tempo: (data.tempo as string) || "",
    duration: (data.duration as string) || "",
    composerBackground:
      (data.composerBackground as string) || `${composer}에 대한 정보입니다.`,
    historicalContext:
      (data.historicalContext as string) ||
      "이 곡의 시대적 배경 정보입니다.",
    workBackground:
      (data.workBackground as string) || "이 작품의 배경 정보입니다.",
    structure: Array.isArray(data.structure)
      ? (data.structure as SongAIInfo["structure"])
      : [
          {
            section: "전체",
            measures: "",
            description: "곡 구조 분석 정보입니다.",
          },
        ],
    technicalTips: Array.isArray(data.technicalTips)
      ? (data.technicalTips as string[])
      : ["천천히 연습하며 정확한 음을 짚어보세요."],
    musicalTips: Array.isArray(data.musicalTips)
      ? (data.musicalTips as string[])
      : ["작곡가의 의도를 생각하며 연주해보세요."],
    famousPerformers: Array.isArray(data.famousPerformers)
      ? (data.famousPerformers as string[])
      : [],
  };
}

export async function POST(request: Request) {
  try {
    const { composer, title, id } = await request.json();

    if (!composer || !title) {
      return NextResponse.json(
        { error: "composer와 title은 필수입니다." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const prompt = `당신은 클래식 피아노 음악 전문가입니다. 다음 곡에 대한 상세 분석 정보를 JSON 형태로 작성해주세요.

작곡가: ${composer}
곡 제목: ${title}

아래 JSON 형식에 맞게 한국어로 작성해주세요. 반드시 유효한 JSON만 출력하세요.

{
  "composer": "작곡가 약칭 (예: F. Chopin)",
  "composerFull": "작곡가 전체 이름과 생몰년 (예: Frédéric François Chopin (1810-1849))",
  "title": "곡 제목",
  "opus": "작품번호 (예: Op.23 또는 BWV 846)",
  "year": "작곡년도 (예: 1831-1835)",
  "period": "음악 시대 (예: 낭만주의)",
  "difficulty": "난이도 (초급/중급/고급/전문가 중 하나)",
  "keySignature": "조성 (예: G단조)",
  "tempo": "템포 지시어 (예: Allegro con brio)",
  "duration": "연주 시간 (예: 약 9-10분)",
  "composerBackground": "작곡가의 생애와 음악적 특징에 대한 상세 설명 (3-4문장)",
  "historicalContext": "이 곡이 작곡된 시대적 배경과 음악사적 의미 (3-4문장)",
  "workBackground": "이 작품의 창작 배경, 헌정, 초연 등 상세 정보 (3-4문장)",
  "structure": [
    { "section": "섹션명", "measures": "마디 범위", "description": "해당 섹션 설명" }
  ],
  "technicalTips": ["테크닉 팁 1", "테크닉 팁 2", "테크닉 팁 3", "테크닉 팁 4"],
  "musicalTips": ["음악적 해석 팁 1", "음악적 해석 팁 2", "음악적 해석 팁 3", "음악적 해석 팁 4"],
  "famousPerformers": ["연주자1 (특징)", "연주자2 (특징)", "연주자3 (특징)", "연주자4 (특징)", "연주자5 (특징)"]
}

중요 지침:
- structure는 곡의 실제 구조에 맞게 3-6개 섹션으로 나눠주세요
- technicalTips는 피아노 연습에 실질적으로 도움되는 구체적인 팁 4개
- musicalTips는 음악적 표현과 해석에 관한 팁 4개
- famousPerformers는 이 곡의 유명 연주자 5명 (괄호 안에 연주 특징)
- 모든 텍스트는 한국어로 작성
- JSON 외에 다른 텍스트는 출력하지 마세요`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content || "";

    console.log("GPT raw response:", responseText.substring(0, 500));

    const jsonStr = extractJSON(responseText);
    const parsed = JSON.parse(jsonStr);

    console.log("Parsed fields - year:", parsed.year, "duration:", parsed.duration, "opus:", parsed.opus);

    const validated = validateSongAIInfo(parsed, id || "new", composer, title);

    return NextResponse.json(validated);
  } catch (error) {
    console.error("Song analysis API error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json(
      { error: `곡 분석 중 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}
