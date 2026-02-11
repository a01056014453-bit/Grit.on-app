import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getCachedAnalysis, saveCachedAnalysis } from "@/lib/song-analysis-db";
import type {
  SongAnalysis,
  AnalyzeSongRequest,
  AnalyzeSongResponse,
  DifficultyLevel,
  VerificationStatus,
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

/** JSON 블록 추출 */
function extractJSON(text: string): string {
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlockMatch) return jsonBlockMatch[1].trim();
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0].trim();
  return text.trim();
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

/** 음악학자 프롬프트 생성 - Professional Piano Pedagogy Mode */
function createMusicologistPrompt(composer: string, title: string): string {
  return `당신은 **세계적인 피아노 교수법 전문가**이자 **음악학자(Musicologist)**입니다. 다음 클래식 피아노 작품에 대해 **학술적 근거와 실용적 연주 솔루션**을 제공하십시오.

작곡가: ${composer}
곡 제목: ${title}

[🚨 핵심 원칙 - Professional Piano Pedagogy Mode]

**Step 1. 문헌 데이터 우선 참조 (Grounding)**
- Urtext(원전판: Henle, Bärenreiter, Wiener 등)를 최우선 참조
- 저명한 음악학자/피아니스트의 분석 참조 (Ronald Smith, Alfred Cortot, Heinrich Schenker 등)
- Grove Dictionary, RILM 등 학술 자료 기반

**Step 2. 마디 번호 검증 (Verification)**
- 마디 번호 언급 시 반드시 해당 마디의 **주요 음표/화성을 병기**
- 예: "mm. 1-4 (Bb Major 분산화음 구간)" / "mm. 45-48 (dim7 화성 연속)"
- 불확실하면 마디 번호 생략하고 섹션 특징만 기술

**Step 3. 일반론 배제 (No Generic Advice)**
- ❌ 금지: "느리게 연습하세요", "열심히 연습하세요", "많이 들어보세요"
- ✅ 필수: 즉각 적용 가능한 물리적 솔루션
- 예: "4번 손가락 독립을 위해 5번을 건반 위에 고정하고 타건하는 분리 연습"

**Step 4. 전문 용어의 엄격성**
- Voicing, Agogic, Rubato, Legato, Portato 등 전문 용어 사용
- 각 용어를 악보상의 근거(다이내믹, 아티큘레이션)와 연결하여 설명

**Step 5. 제목으로 성격 추측 금지**
- ❌ "Humoreske"라서 유머러스하다고 추측 금지
- ❌ "Scherzo"라서 무조건 빠르고 경쾌하다고 추측 금지
- ✅ 실제 악보의 템포/악상 기호(Einfach, Innig, Hastig 등)를 기반으로 분석
- ✅ Schumann Humoreske Op.20은 "Einfach"(단순하게)로 시작하며 서정적이고 내면적인 성격

**Step 5. 테크닉 솔루션 3가지 카테고리**
- **Physiological (신체적)**: 근육 이완, 손가락 독립, 팔 무게 사용법, 손목 회전
- **Interpretative (해석적)**: 페달링, 음색 층위(Voicing), 아고직 표현, 루바토
- **Structural (구조적)**: 형식에 따른 호흡법, 섹션별 연습 전략, 템포 설계

**Korean Output**: 최종 출력은 한국어. 고유명사/전문용어는 원어 병기.

[JSON 출력 형식]

{
  "meta": {
    "composer": "작곡가 이름",
    "title": "곡 제목 (원어)",
    "opus": "작품번호",
    "key": "조성",
    "difficulty_level": "Beginner/Intermediate/Advanced/Virtuoso"
  },
  "content": {
    "composer_background": "작곡가 배경 (8-10문장)",
    "historical_context": "시대적 상황 (8-10문장)",
    "work_background": "작품 배경 (8-10문장)",
    "structure_analysis": [
      {
        "section": "섹션명/변주번호",
        "measures": "마디 범위",
        "key_tempo": "조성 및 박자/템포",
        "character": "음악적 성격 (한 문장)",
        "description": "리듬적/화성적 특징 상세 설명"
      }
    ],
    "technique_tips": [
      {
        "section": "섹션명 (mm. 마디범위, 화성 정보)",
        "problem": "구체적 기술적 난관과 물리적 원인",
        "category": "Physiological 또는 Interpretative 또는 Structural",
        "solution": "카테고리에 맞는 구체적 해결책",
        "practice": "즉각 적용 가능한 변형 연습법"
      }
    ],
    "musical_interpretation": "음악적 해석 가이드 (8-10문장)",
    "recommended_performances": [
      {
        "artist": "연주자 이름",
        "year": "녹음 연도",
        "comment": "이 녹음의 특징과 추천 이유"
      }
    ]
  },
  "verification_status": "Verified 또는 Needs Review"
}

[📋 상세 지침]

### 1-3. 배경 정보 (composer_background, historical_context, work_background)
- 기존과 동일하게 8-10문장으로 상세 기술

### 4. structure_analysis (곡 구조 - 🔥 형식 맞춤 분석)
**⚠️ 핵심: 곡의 실제 형식(Form)에 맞는 용어와 구조로 분석할 것!**

**형식별 분석 방법 (해당 형식의 용어만 사용):**

**[소나타 형식]** Sonata, Sonatina
→ Exposition(제1주제, 경과구, 제2주제, 코데타), Development, Recapitulation, Coda
→ 다악장이면 각 악장별로 (1악장, 2악장, 3악장...)

**[변주곡]** Theme and Variations
→ Theme, Variation 1, Variation 2, ... (변주곡에만 Variation 사용!)

**[론도]** Rondo
→ A(주제), B(제1에피소드), A', C(제2에피소드), A'', Coda

**[3부 형식 ABA]** Nocturne, Impromptu, Intermezzo, Moment Musical
→ A섹션, B섹션, A'섹션(재현), Coda

**[스케르초/미뉴에트]** Scherzo, Minuet
→ Scherzo(또는 Minuet), Trio, Scherzo da Capo, Coda

**[에튀드]** Etude, Study
→ 도입, 주요 기술 패턴 제시, 발전, 클라이맥스, 종결

**[프렐류드]** Prelude
→ 자유로운 구성 - 도입부, 중심부, 종결부 또는 악상 기호 기반

**[발라드]** Ballade
→ 서사적 구조 - Introduzione, 제1주제군, 제2주제군, 발전부, 재현/변형, Coda

**[폴로네이즈]** Polonaise
→ Introduction, A(주요 주제), B(대조 섹션), A', Trio, A'', Coda

**[마주르카]** Mazurka
→ A, B, A' (또는 A, B, C, A' 등 실제 구조에 따라)

**[왈츠]** Waltz, Valse
→ Introduction, 주요 왈츠 주제들 (Waltz I, II, III...), Coda

**[푸가/인벤션]** Fugue, Invention, Sinfonia
→ Exposition(주제 제시), Episode 1, Middle Entry, Episode 2, Stretto, Coda

**[토카타]** Toccata
→ 화려한 도입, 푸가적 섹션, 자유로운 패시지, 종결

**[환상곡/랩소디]** Fantasie, Fantasy, Rhapsody
→ 자유 구성 - 각 성격별 섹션 (Grave, Allegro, Cantabile 등 템포/악상 기반)

**[성격 소품]** Humoreske, Arabesque, Bagatelle, Capriccio, Romance
→ 악보의 실제 악상 기호/지시어 기반 (예: Einfach, Innig, Lebhaft)

**[바르카롤/자장가]** Barcarolle, Berceuse
→ Introduction, 주요 선율, 중간부, 재현, Coda

**[협주곡]** Concerto (솔로 파트 기준)
→ Orchestral Intro, Solo Exposition, Development, Recapitulation, Cadenza, Coda

**[샤콘느/파사칼리아]** Chaconne, Passacaglia
→ Theme(바소 오스티나토), 각 변주를 그룹화하여 분석

**[모음곡]** Suite
→ 각 춤곡별 (Allemande, Courante, Sarabande, Gigue 등)

- 각 항목 필수 포함:
  * section: **해당 형식에 맞는 용어만** 사용
  * character: 한 문장 성격 묘사
  * description: 2-3문장 상세 설명 (조성, 리듬, 텍스처)

### 5. technique_tips (테크닉 팁 - 🔥 3가지 카테고리 전문 솔루션)
**⚠️ 핵심: 일반론 금지, 즉각 적용 가능한 구체적 솔루션만!**

**❌ 금지 표현:**
- "느리게 연습하세요" / "반복 연습하세요" / "손가락 힘을 길러야 합니다"

**✅ 필수 포함:**
각 항목은 다음 구조로 작성:
- section: 해당 섹션명 + (가능하면) 마디와 화성 정보 병기
- problem: 구체적 기술적 난관 (물리적 원인 명시)
- solution: 3가지 카테고리 중 해당하는 솔루션
  * **[Physiological]**: 손목 회전 각도, 팔 무게 분배, 손가락 독립 연습법, 근육 이완점
  * **[Interpretative]**: 페달 타이밍, Voicing 비율, Agogic 처리, 루바토 설계
  * **[Structural]**: 섹션별 템포 관계, 호흡 지점, 연습 분할 전략
- practice: 구체적 변형 연습법 (리듬 변형, 스타카토 변형, 블라인드 연습 등)

**예시:**
- Exposition 제1주제 (mm. 1-8, d단조 주요 동기):
  problem: 왼손 옥타브와 오른손 멜로디의 균형 문제
  solution: [Interpretative] 왼손 5번 손가락을 기준으로 Voicing하여 베이스 라인 부각, 오른손은 팔 무게 최소화
  practice: 왼손만 따로 연주하며 5번 손가락에 무게 집중 연습

- Development (mm. 58-62, 감7화음 연속):
  problem: 빠른 화성 변화에서 손의 포지션 이동
  solution: [Physiological] 각 화음의 공통음(common tone)을 피벗으로 사용, 손목의 수평 이동 최소화
  practice: 화음을 아르페지오로 분해하여 손가락 배치 암기 후 블록 화음으로 복귀

### 6. musical_interpretation (음악적 해석)
- 전체적인 프레이징, 다이내믹 설계
- 루바토/템포 처리
- 캐릭터 설정 가이드

### 7. recommended_performances (추천 연주)
- 3개의 명연주
- 각 연주의 구체적 특징

[희귀곡 처리]
알캉(Alkan), 고도프스키(Godowsky), 소라브지(Sorabji) 등:
- verification_status = "Needs Review"
- 마디 번호 불확실시 "문헌 확인 필요"로 표기하되, **섹션 자체는 반드시 모두 나열**

JSON만 출력하십시오.`;
}

/** AI 응답 파싱 및 검증 */
function parseAndValidateResponse(
  responseText: string,
  composer: string,
  title: string
): SongAnalysis {
  const jsonStr = extractJSON(responseText);
  const parsed = JSON.parse(jsonStr);

  // 희귀 작곡가 체크
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
  };

  return analysis;
}

export async function POST(request: Request) {
  try {
    const body: AnalyzeSongRequest = await request.json();
    const { composer, title, forceRefresh = false } = body;

    if (!composer || !title) {
      const response: AnalyzeSongResponse = {
        success: false,
        error: "composer와 title은 필수입니다.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // 1. 캐시 확인 (forceRefresh가 false일 때만)
    if (!forceRefresh) {
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

    console.log(`[Cache MISS] ${composer} - ${title} - Calling AI...`);

    // 2. OpenAI API 호출
    const openai = getOpenAIClient();
    if (!openai) {
      const response: AnalyzeSongResponse = {
        success: false,
        error: "OPENAI_API_KEY가 설정되지 않았습니다.",
      };
      return NextResponse.json(response, { status: 500 });
    }

    const prompt = createMusicologistPrompt(composer, title);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 8192,
      temperature: 0.1, // 낮은 temperature로 정확성 극대화
    });

    const responseText = completion.choices[0]?.message?.content || "";
    console.log("AI Response (first 500 chars):", responseText.substring(0, 500));

    // 3. 응답 파싱 및 검증
    const analysis = parseAndValidateResponse(responseText, composer, title);

    // 4. 캐시에 저장 (원본 키와 메타 키 모두 저장)
    await saveCachedAnalysis(analysis, composer, title);
    console.log(`[Cache SAVED] ${composer} - ${title}`);

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
