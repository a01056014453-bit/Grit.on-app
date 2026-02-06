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

    const prompt = `당신은 클래식 피아노 음악 전문가이자 음악학 박사입니다. 다음 곡에 대한 상세하고 정확한 분석 정보를 JSON 형태로 작성해주세요.

작곡가: ${composer}
곡 제목: ${title}

## 핵심 원칙
1. **정확성 최우선**: 확실하지 않은 정보는 절대 포함하지 마세요. 추측이나 불확실한 내용은 제외하세요.
2. **풍부한 내용**: 각 항목을 상세하고 깊이 있게 작성하세요.
3. **실용적 가치**: 피아노 학습자에게 실제로 도움이 되는 정보를 제공하세요.

아래 JSON 형식에 맞게 한국어로 작성하세요. 반드시 유효한 JSON만 출력하세요.

{
  "composer": "작곡가 약칭",
  "composerFull": "작곡가 전체 이름과 생몰년",
  "title": "곡 제목",
  "opus": "작품번호",
  "year": "작곡년도",
  "period": "음악 시대",
  "difficulty": "난이도 (초급/중급/고급/전문가 중 하나)",
  "keySignature": "조성",
  "tempo": "템포 지시어",
  "duration": "연주 시간",
  "composerBackground": "작곡가 배경 (6-8문장으로 상세히)",
  "historicalContext": "시대적 상황 (6-8문장으로 상세히)",
  "workBackground": "작품 배경 (6-8문장으로 상세히)",
  "structure": [
    { "section": "섹션명", "measures": "마디 범위", "description": "상세 설명 (2-3문장)" }
  ],
  "technicalTips": ["구체적인 테크닉 팁"],
  "musicalTips": ["구체적인 음악적 해석 팁"],
  "famousPerformers": ["연주자명 (연주 특징)"]
}

## 상세 작성 지침

### composerBackground (작곡가 배경) - 6-8문장
- 작곡가의 출생지, 가정환경, 음악 교육 배경
- 주요 활동 시기와 장소
- 음악적 스타일의 특징과 발전 과정
- 피아노 음악사에서의 위치와 기여
- 다른 작곡가들과의 관계나 영향

### historicalContext (시대적 상황) - 6-8문장
- 이 곡이 작곡된 시기의 유럽 역사적 상황
- 당시 음악계의 흐름과 트렌드
- 작곡가가 처한 개인적 상황 (건강, 재정, 인간관계 등)
- 이 곡이 탄생하게 된 구체적 배경
- 음악사적 의미와 후대에 미친 영향

### workBackground (작품 배경) - 6-8문장
- 작곡 동기와 영감의 원천
- 헌정 대상과 그 관계 (있는 경우)
- 초연 정보 (날짜, 장소, 연주자 - 알려진 경우만)
- 출판 정보와 초기 반응
- 작곡가의 다른 작품들과의 연관성
- 이 곡만의 특별한 일화나 배경 이야기

### structure (곡 구조) - 4-6개 섹션
- 각 섹션의 정확한 마디 범위
- 조성 변화, 주제 발전, 음악적 특징
- 연주 시 주의할 점

### technicalTips (테크닉 팁) - 5-6개
- 구체적인 마디 번호나 구간 언급
- 손가락 번호, 손 위치, 페달링 등 구체적 조언
- 어려운 패시지 연습 방법
- 템포 설정과 연습 순서

### musicalTips (음악적 해석 팁) - 5-6개
- 프레이징과 호흡
- 다이나믹 변화와 음색
- 감정 표현과 캐릭터
- 루바토와 템포 조절
- 시대 양식에 맞는 연주법

### famousPerformers (유명 연주자) - 5명
- 실제로 이 곡의 명연으로 인정받는 연주자만 포함
- 각 연주자의 해석 특징을 구체적으로 설명

## 주의사항
- 확실히 알려진 사실만 작성하세요
- 추측이나 불확실한 정보는 포함하지 마세요
- 모든 텍스트는 한국어로 작성하세요
- JSON 외에 다른 텍스트는 출력하지 마세요`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 4096,
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
