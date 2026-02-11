import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { SongAIInfo } from "@/data/mock-songs";

// OpenAI 클라이언트를 런타임에 생성 (빌드 시 에러 방지)
function getOpenAIClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

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

    const openai = getOpenAIClient();
    if (!openai) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    const prompt = `당신은 클래식 피아노 음악 전문가이자 음악학 박사입니다. 다음 곡에 대한 **학술적으로 검증된** 상세 분석 정보를 JSON 형태로 작성해주세요.

작곡가: ${composer}
곡 제목: ${title}

## 분석의 전제 조건 (필수)
1. **모르면 모른다고 해**: 확실한 근거(악보, 학술 자료)가 없는 부분은 "확인된 자료 부족"으로 표기하거나 해당 필드를 비워둘 것.
2. **출처 명시**: 배경 설명이나 형식 분석 시, 참고한 에디션(Henle, Wiener Urtext, Peters 등)이나 문헌의 맥락을 언급할 것.
3. **악보 데이터 충돌 시 폐기**: 분석 내용 중 악보 데이터와 충돌하는 내용이 감지되면 해당 내용을 제외할 것.

## 정보 층위 분리 (Layered Information)

### Fact Layer (악보 기반) - 단정적 표현 사용
- 마디 수, 박자 변화, 반복 기호, 실제 적힌 템포 지시어
- "악보상 ~로 표기됨" 형식으로 기술
- 예: "악보상 Allegro con brio (♩=160)로 표기됨"

### Evidence Layer (문헌 기반) - 출처 언급 필수
- 작곡 배경, 학술적 분석, 역사적 맥락
- 출처나 각주가 가능한 정보만 기술
- 예: "New Grove Dictionary에 따르면...", "작곡가의 1830년 편지에서..."

### Opinion Layer (해석/팁) - 제안 형식 사용
- 연주자별 해석 차이, 테크닉 가이드
- "~로 해석될 여지가 있음", "~를 고려해볼 수 있음" 형식
- 특정 연주자의 해석인지, 보편적 관행인지 구분

## 정합성 자가 검증 (출력 전 확인)
1. 기술된 마디 번호가 실제 악보의 구조와 일치하는가?
2. 테크닉 팁이 악보에 표기된 도약, 화음 구조와 물리적으로 연결되는가?
3. 변주곡/소나타 등의 경우 각 섹션 특징이 실제 음형(Figuration)에 근거하는가?
4. 추상적 표현("화려하다", "아름답다")을 구체적 음악 요소로 대체했는가?

아래 JSON 형식에 맞게 한국어로 작성하세요. 반드시 유효한 JSON만 출력하세요.

{
  "composer": "작곡가 약칭 (예: F. Chopin)",
  "composerFull": "작곡가 전체 이름과 생몰년 (예: Frédéric François Chopin, 1810-1849)",
  "title": "곡 제목 (원어 표기)",
  "opus": "작품번호 (정확한 카탈로그 번호)",
  "year": "작곡년도 (확인된 경우만, 미상이면 빈 문자열)",
  "period": "음악 시대 (바로크/고전/낭만/인상주의/근현대 중 하나)",
  "difficulty": "난이도 (초급/중급/고급/전문가 중 하나)",
  "keySignature": "조성 (예: G minor, B-flat major)",
  "tempo": "악보상 템포 지시어 (예: Largo - Moderato - Presto)",
  "duration": "표준 연주 시간 (예: 약 9-10분)",
  "composerBackground": "작곡가 배경 (8-10문장, 역사적 사실 기반)",
  "historicalContext": "시대적 상황 (8-10문장, 작곡 당시 상황)",
  "workBackground": "작품 배경 (8-10문장, 검증된 정보만)",
  "structure": [
    { "section": "섹션명", "measures": "마디 범위 (예: 1-8)", "description": "해당 섹션의 음악적 특징 (3-4문장)" }
  ],
  "technicalTips": ["구체적인 테크닉 팁 (마디 번호 포함)"],
  "musicalTips": ["음악적 해석 팁"],
  "famousPerformers": ["연주자명 - 해석 특징"]
}

## 상세 작성 지침

### composerBackground (작곡가 배경) - 8-10문장 [Evidence Layer]
- 정확한 출생일, 출생지, 사망일 (검증된 정보만)
- 음악 교육 이력 (스승, 학교)
- 주요 활동 도시와 시기
- 음악 양식의 특징 (구체적 음악 요소로 설명)
- 피아노 음악사에서의 공헌
- 동시대 작곡가들과의 관계

### historicalContext (시대적 상황) - 8-10문장 [Evidence Layer]
- 작곡 당시의 역사적 사건 (연도 명시)
- 음악계의 주요 흐름
- 작곡가의 개인사 (문헌에서 확인된 경우만)
- 이 장르/형식의 발전 맥락
- 당시 청중과 비평가의 반응 (출처가 있는 경우만)

### workBackground (작품 배경) - 8-10문장 [Evidence Layer]
- 작곡 동기 (작곡가의 편지, 일기 등 1차 자료에서 확인된 경우)
- 정확한 작곡 시기 (불확실하면 "정확한 시기 미상")
- 헌정자와 그 관계 (악보 초판에 명시된 경우만)
- 초연 정보 (날짜, 장소, 연주자 - 기록이 있는 경우만)
- 출판사와 초판 연도
- 자필 악보 보관 장소 (알려진 경우)

### structure (곡 구조) - 반드시 악보 기반 [Fact Layer]
**중요**: 표준 에디션(Henle, Wiener Urtext, Peters 등)의 마디 번호를 기준으로 정확하게 작성.
- 마디 번호가 확실하지 않으면 해당 섹션을 제외하거나 "확인 필요"로 표기
- 각 섹션의 정확한 시작-끝 마디 (예: "1-32마디")
- 조성 변화 명시 (예: "g단조 → B♭장조")
- 특징적인 음형(Figuration) 근거로 설명 (예: "16분음표 아르페지오 패턴")
- 소나타/론도/변주곡 등 형식 분석
- 변주곡의 경우 각 변주의 특성을 음악적 요소로 설명

### technicalTips (테크닉 팁) - 6-8개 [Opinion Layer]
- 구체적인 마디 번호 명시 (예: "23-28마디의 옥타브 패시지")
- 실제 악보에 나타나는 도약, 연타, 복합 리듬의 구체적 위치
- 물리적으로 해결 가능한 연습법만 제안
- "~를 고려해볼 수 있음" 형식 사용
- 보편적 관행인지, 특정 교수법인지 구분

### musicalTips (음악적 해석 팁) - 6-8개 [Opinion Layer]
- 프레이징 단위와 호흡점 (악보상 슬러 기준으로)
- 악보에 표기된 다이나믹 구조 분석
- 루바토 적용 제안 (단정적 표현 금지)
- 특정 연주자의 해석인지, 보편적 관행인지 구분
- "~로 해석될 여지가 있음" 형식 사용

### famousPerformers (유명 연주자) - 5-6명
- 이 곡의 정평 있는 녹음을 남긴 연주자만 포함
- 각 연주자의 해석 특징을 구체적으로 설명 (템포, 루바토, 페달링 등)
- 녹음 연도나 음반 레이블 (알려진 경우)
- 예: "Raymond Lewenthal (1961, Columbia) - 극적인 대비와 빠른 템포"

## 절대 금지 사항
- 마디 번호를 추측하지 마세요. 확실하지 않으면 "마디 번호 확인 필요" 또는 "전반부/중반부/후반부"로 표현
- 작곡년도가 불확실하면 빈 문자열("")로 두세요
- 존재하지 않는 헌정자나 초연 정보를 만들지 마세요
- "화려하다", "아름답다" 같은 추상적 표현 대신 구체적 음악 요소로 설명
- '~이다'라는 단정적 표현 대신 사실은 "악보상 ~로 표기됨", 의견은 "~로 해석될 여지가 있음"
- JSON 외에 다른 텍스트는 출력하지 마세요`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 8192,
      temperature: 0.3,
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
