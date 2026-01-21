"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Music, User, Clock, BookOpen, Hash, Lightbulb, FileText, ExternalLink } from "lucide-react";

// 곡별 분석 데이터베이스
const analysisDatabase: Record<string, any> = {
  "1": {
    id: "1",
    title: "Ballade No.1 in G minor",
    opus: "Op.23",
    composer: "Frédéric Chopin",
    composerLifespan: "1810-1849",
    year: 1835,
    dedication: "Baron Nathaniel von Stockhausen",
    premiere: "1836년, 라이프치히",
    duration: "약 9-10분",
    key: "G minor",
    period: "Romantic",
    composerBio: `폴란드 출신의 작곡가이자 피아니스트. 파리에서 활동하며 피아노 음악의 새로운 영역을 개척했다.
쇼팽은 피아노의 가능성을 극대화한 작곡가로, 녹턴, 마주르카, 폴로네이즈, 에튀드, 발라드 등 다양한 장르에서 독창적인 작품을 남겼다.`,
    background: `쇼팽의 4개 발라드 중 첫 번째 작품으로, 폴란드 시인 아담 미츠키에비치(Adam Mickiewicz)의 서사시 "콘라트 발렌로트"에서 영감을 받았다고 알려져 있다.
1831년 바르샤바 봉기 실패 후 파리로 망명한 쇼팽이 조국에 대한 그리움과 비극적 정서를 담아 작곡했다.
1835년 완성되어 1836년 출판되었으며, 피아노 발라드라는 새로운 장르를 확립한 작품으로 평가받는다.`,
    historicalContext: `19세기 전반 낭만주의 시대, 민족주의 음악이 부상하던 시기의 작품이다.
폴란드의 11월 봉기(1830-1831) 실패 후 많은 폴란드 예술가들이 파리로 망명했으며, 쇼팽도 이 시기 파리에 정착했다.
이 곡은 기존의 소나타 형식을 따르지 않고 자유로운 서사적 구조를 채택하여, 낭만주의 시대 형식적 혁신의 대표적 예시가 되었다.`,
    formAnalysis: {
      overview: "변형된 소나타 형식과 론도 형식의 결합",
      sections: [
        { name: "서주 (Largo)", measures: "1-7", description: "불안정한 G minor 화성, 서사의 시작을 알림" },
        { name: "제1주제 (Moderato)", measures: "8-36", description: "G minor, 서정적이고 슬픈 멜로디" },
        { name: "제2주제", measures: "68-93", description: "E♭ major, 밝고 서정적인 대조" },
        { name: "발전부", measures: "94-165", description: "두 주제의 발전과 변형" },
        { name: "코다 (Presto con fuoco)", measures: "208-264", description: "격렬한 옥타브 패시지, 비극적 종결" },
      ],
    },
    themes: [
      { name: "제1주제", description: "하행하는 6도 도약과 순차 진행이 특징. 폴란드 민요적 요소가 느껴지는 애상적 선율.", measures: "8-36" },
      { name: "제2주제", description: "E♭ major의 서정적 선율. 왈츠와 유사한 반주 패턴 위에 노래하는 듯한 멜로디.", measures: "68-93" },
    ],
    harmonyAnalysis: {
      overview: "G minor를 중심으로 3도 관계 조성(E♭ major)으로의 이동이 특징적",
      keyProgressions: [
        { section: "서주", keys: "G minor", roman: "i" },
        { section: "제1주제", keys: "G minor → B♭ major", roman: "i → III" },
        { section: "제2주제", keys: "E♭ major", roman: "VI" },
        { section: "코다", keys: "G minor", roman: "i" },
      ],
      notableProgressions: [
        { name: "서주의 나폴리 화음", progression: "i - ♭II6 - V7 - i", description: "긴장감 조성" },
        { name: "제1주제 종지", progression: "i - iv - V7 - i", description: "전통적 단조 종지" },
      ],
    },
    practicePoints: [
      { category: "템포", points: ["서주 Largo: ♩= 약 40-50", "Moderato 제1주제: ♩= 약 66-72", "Presto con fuoco 코다: ♩= 약 176-184"] },
      { category: "페달", points: ["서주: 화성 변화에 따른 신중한 페달 교체", "제1주제: 멜로디 프레이징에 맞춘 부분 페달"] },
      { category: "기술적 난점", points: ["mm. 8-36: 왼손 아르페지오의 균등한 터치", "mm. 208-264: 옥타브 지구력과 정확성"] },
    ],
    references: [
      { type: "도서", title: "Chopin: The Four Ballades", author: "Jim Samson", source: "Cambridge University Press, 1992", isbn: "ISBN 978-0521386159" },
    ],
    imslp: {
      title: "Ballade No.1, Op.23",
      composer: "Frédéric Chopin",
      url: "https://imslp.org/wiki/Ballade_No.1,_Op.23_(Chopin,_Fr%C3%A9d%C3%A9ric)",
      editions: [
        { name: "Breitkopf & Härtel (1878)", editor: "Carl Mikuli" },
        { name: "Peters (1879)", editor: "Herrmann Scholtz" },
      ],
    },
  },

  "2": {
    id: "2",
    title: "Piano Sonata No.8 in C minor",
    opus: "Op.13 'Pathétique'",
    composer: "Ludwig van Beethoven",
    composerLifespan: "1770-1827",
    year: 1798,
    dedication: "Prince Karl von Lichnowsky",
    premiere: "1799년, 빈",
    duration: "약 18-20분",
    key: "C minor",
    period: "Classical/Early Romantic",
    composerBio: `독일 본 출신의 작곡가이자 피아니스트. 고전주의와 낭만주의의 가교 역할을 한 서양 음악사의 거장이다.
교향곡, 협주곡, 소나타, 현악 4중주 등 모든 장르에서 걸작을 남겼으며, 청력을 잃은 후에도 작곡 활동을 계속했다.`,
    background: `베토벤 초기 피아노 소나타의 대표작으로, '비창(Pathétique)'이라는 부제는 베토벤 자신이 붙인 것이다.
1798년 작곡되어 1799년 출판되었으며, 당시 베토벤의 후원자였던 리히노프스키 공작에게 헌정되었다.
베토벤이 청력 상실의 조짐을 느끼기 시작한 시기의 작품으로, 내면의 고뇌가 반영되어 있다.`,
    historicalContext: `18세기 말 고전주의에서 낭만주의로의 전환기 작품이다.
프랑스 혁명(1789) 이후 격변하는 유럽 사회에서, 개인의 감정 표현이 중시되기 시작했다.
이 소나타는 고전적 형식 안에서 강렬한 감정 표현을 담아, 낭만주의 피아노 음악의 선구적 작품으로 평가받는다.`,
    formAnalysis: {
      overview: "3악장 구성의 소나타 형식",
      sections: [
        { name: "1악장 Grave - Allegro", measures: "1-310", description: "C minor, 소나타 형식. 느린 서주와 격정적인 주부" },
        { name: "2악장 Adagio cantabile", measures: "1-73", description: "A♭ major, 론도 형식. 서정적이고 노래하는 선율" },
        { name: "3악장 Rondo: Allegro", measures: "1-210", description: "C minor, 론도 형식. 1악장 제2주제를 연상시키는 주제" },
      ],
    },
    themes: [
      { name: "1악장 서주 주제", description: "Grave의 장중하고 비극적인 점음표 리듬. 전 악장에 걸쳐 회귀함.", measures: "1-10" },
      { name: "1악장 제1주제", description: "C minor의 급박한 상행 아르페지오와 트레몰로.", measures: "11-27" },
      { name: "2악장 주제", description: "A♭ major의 서정적 선율. 피아노 문헌 중 가장 아름다운 멜로디 중 하나.", measures: "1-8" },
    ],
    harmonyAnalysis: {
      overview: "C minor를 중심으로, 관계조와의 대비가 뚜렷함",
      keyProgressions: [
        { section: "1악장 서주", keys: "C minor", roman: "i" },
        { section: "1악장 제1주제", keys: "C minor", roman: "i" },
        { section: "1악장 제2주제", keys: "E♭ minor → E♭ major", roman: "iii → III" },
        { section: "2악장", keys: "A♭ major", roman: "VI" },
        { section: "3악장", keys: "C minor", roman: "i" },
      ],
      notableProgressions: [
        { name: "서주의 감7화음", progression: "i - vii°7 - i", description: "극적 긴장감" },
        { name: "2악장 주제 화성", progression: "I - V7 - I", description: "안정적이고 서정적" },
      ],
    },
    practicePoints: [
      { category: "템포", points: ["Grave 서주: ♩= 약 40-50, 위엄있게", "Allegro molto: ♩= 약 138-152", "Adagio cantabile: ♩= 약 56-63"] },
      { category: "페달", points: ["1악장 서주: 화성마다 깨끗한 페달 교체", "2악장: 레가토를 위한 섬세한 페달링, 베이스 지속"] },
      { category: "기술적 난점", points: ["1악장: 빠른 옥타브 트레몰로", "2악장: 왼손 반주 위 오른손 선율의 균형", "3악장: 빠른 스케일 패시지"] },
    ],
    references: [
      { type: "도서", title: "Beethoven: The Music and the Life", author: "Lewis Lockwood", source: "W. W. Norton, 2003", isbn: "ISBN 978-0393050813" },
    ],
    imslp: {
      title: "Piano Sonata No.8, Op.13",
      composer: "Ludwig van Beethoven",
      url: "https://imslp.org/wiki/Piano_Sonata_No.8,_Op.13_(Beethoven,_Ludwig_van)",
      editions: [
        { name: "Breitkopf & Härtel (1862)", editor: "Carl Reinecke" },
        { name: "Peters", editor: "Louis Köhler" },
      ],
    },
  },

  "3": {
    id: "3",
    title: "Clair de Lune",
    opus: "Suite bergamasque, L.75 No.3",
    composer: "Claude Debussy",
    composerLifespan: "1862-1918",
    year: 1905,
    dedication: "없음 (원곡 1890년 작곡, 1905년 개정 출판)",
    premiere: "1905년 출판 후 초연",
    duration: "약 5분",
    key: "D♭ major",
    period: "Impressionist",
    composerBio: `프랑스 생제르맹앙레 출신의 작곡가. 인상주의 음악의 창시자로 불린다.
전통적인 화성 체계를 벗어나 온음음계, 교회선법, 병행화음 등을 활용하여 새로운 음향 세계를 개척했다.
오페라 "펠레아스와 멜리장드", 관현악곡 "바다", "목신의 오후 전주곡" 등이 대표작이다.`,
    background: `'베르가마스크 모음곡'의 세 번째 곡으로, 폴 베를렌(Paul Verlaine)의 시 "달빛(Clair de lune)"에서 영감을 받았다.
1890년경 초고가 작성되었으나, 1905년 대폭 개정되어 출판되었다.
제목은 "달빛"을 의미하며, 인상주의 음악의 대표작으로 널리 사랑받는 작품이다.`,
    historicalContext: `19세기 말-20세기 초 프랑스 인상주의 시대의 작품이다.
인상파 화가들(모네, 르누아르 등)과 상징주의 시인들(말라르메, 베를렌 등)의 예술 운동과 맥을 같이한다.
독일 낭만주의의 강렬한 감정 표현에서 벗어나, 섬세한 색채와 분위기를 중시하는 새로운 미학을 제시했다.`,
    formAnalysis: {
      overview: "자유로운 3부 형식 (A-B-A')",
      sections: [
        { name: "A 섹션", measures: "1-26", description: "D♭ major, 몽환적인 주제 제시" },
        { name: "B 섹션", measures: "27-42", description: "약간의 조성 변화, 더 유동적인 움직임" },
        { name: "A' 섹션 + 코다", measures: "43-72", description: "주제 재현 및 조용한 종결" },
      ],
    },
    themes: [
      { name: "주요 주제", description: "D♭ major의 평온하고 몽환적인 선율. 아르페지오 반주 위에 떠다니는 듯한 멜로디.", measures: "1-8" },
      { name: "B섹션 주제", description: "더 유동적인 리듬, 왼손의 넓은 아르페지오가 특징.", measures: "27-34" },
    ],
    harmonyAnalysis: {
      overview: "D♭ major를 중심으로, 비기능적 화성 진행과 병행화음 사용",
      keyProgressions: [
        { section: "A 섹션", keys: "D♭ major", roman: "I" },
        { section: "B 섹션", keys: "C♯ minor 영역 → E major", roman: "i(enharmonic) → II" },
        { section: "A' 섹션", keys: "D♭ major", roman: "I" },
      ],
      notableProgressions: [
        { name: "병행 3화음", progression: "I - ♭VII - ♭VI - ♭VII - I", description: "인상주의적 색채" },
        { name: "9화음 사용", progression: "I9 - IV9", description: "몽환적 분위기 조성" },
      ],
    },
    practicePoints: [
      { category: "템포", points: ["Andante très expressif: ♩= 약 66-72", "Tempo rubato: 자연스러운 흐름, 기계적 박자 지양", "종결부: 점점 느려지며 사라지듯이"] },
      { category: "페달", points: ["화성 변화에 따른 부분 페달 필수", "베이스 음을 울리면서 상성부 명확하게", "잔향을 살리되 혼탁함 방지"] },
      { category: "기술적 난점", points: ["양손 간 선율과 반주의 명확한 분리", "왼손 넓은 아르페지오의 레가토", "pp~p 다이나믹 내에서의 미세한 표현"] },
    ],
    references: [
      { type: "도서", title: "Debussy: His Life and Mind", author: "Edward Lockspeiser", source: "Cambridge University Press, 1978", isbn: "" },
    ],
    imslp: {
      title: "Suite bergamasque, L.75",
      composer: "Claude Debussy",
      url: "https://imslp.org/wiki/Suite_bergamasque_(Debussy,_Claude)",
      editions: [
        { name: "Durand (1905)", editor: "Original edition" },
        { name: "Dover Publications", editor: "Reprint" },
      ],
    },
  },
};

export default function AnalysisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const analysis = analysisDatabase[id];

  if (!analysis) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span>뒤로</span>
        </button>
        <div className="text-center py-12">
          <p className="text-muted-foreground">분석 데이터를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">곡 분석</h1>
          <p className="text-xs text-muted-foreground">AI 음악학 분석</p>
        </div>
      </div>

      {/* Song Header */}
      <div className="bg-card rounded-xl p-4 border border-border shadow-sm mb-4">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <Music className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-foreground">{analysis.composer}</h2>
            <p className="text-sm text-muted-foreground">{analysis.title} {analysis.opus}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">{analysis.key}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">{analysis.period}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">{analysis.year}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary">{analysis.duration}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-card rounded-xl p-3 border border-border">
          <p className="text-xs text-muted-foreground mb-1">헌정</p>
          <p className="text-sm font-medium text-foreground">{analysis.dedication}</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border">
          <p className="text-xs text-muted-foreground mb-1">초연</p>
          <p className="text-sm font-medium text-foreground">{analysis.premiere}</p>
        </div>
      </div>

      {/* Composer Bio */}
      <Section title="작곡가" icon={User}>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">{analysis.composer}</strong> ({analysis.composerLifespan})
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2 whitespace-pre-line">
          {analysis.composerBio}
        </p>
      </Section>

      {/* Background */}
      <Section title="곡 배경" icon={BookOpen}>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {analysis.background}
        </p>
      </Section>

      {/* Historical Context */}
      <Section title="시대적 맥락" icon={Clock}>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {analysis.historicalContext}
        </p>
      </Section>

      {/* Form Analysis */}
      <Section title="형식 분석" icon={Hash}>
        <p className="text-sm text-muted-foreground mb-3">{analysis.formAnalysis.overview}</p>
        <div className="space-y-2">
          {analysis.formAnalysis.sections.map((section: any, idx: number) => (
            <div key={idx} className="bg-secondary/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground text-sm">{section.name}</span>
                <span className="text-xs text-primary font-mono">mm. {section.measures}</span>
              </div>
              <p className="text-xs text-muted-foreground">{section.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Themes */}
      <Section title="주제·동기" icon={Music}>
        <div className="space-y-3">
          {analysis.themes.map((theme: any, idx: number) => (
            <div key={idx} className="border-l-2 border-primary pl-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground text-sm">{theme.name}</span>
                <span className="text-xs text-primary font-mono">mm. {theme.measures}</span>
              </div>
              <p className="text-xs text-muted-foreground">{theme.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Harmony Analysis */}
      <Section title="화성 분석" icon={Hash}>
        <p className="text-sm text-muted-foreground mb-3">{analysis.harmonyAnalysis.overview}</p>

        <h4 className="text-xs font-semibold text-foreground mb-2">조성 진행</h4>
        <div className="overflow-x-auto mb-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 text-muted-foreground font-medium">구간</th>
                <th className="text-left py-2 text-muted-foreground font-medium">조성</th>
                <th className="text-left py-2 text-muted-foreground font-medium">Roman</th>
              </tr>
            </thead>
            <tbody>
              {analysis.harmonyAnalysis.keyProgressions.map((prog: any, idx: number) => (
                <tr key={idx} className="border-b border-border/50">
                  <td className="py-2 text-foreground">{prog.section}</td>
                  <td className="py-2 text-muted-foreground">{prog.keys}</td>
                  <td className="py-2 font-mono text-primary">{prog.roman}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h4 className="text-xs font-semibold text-foreground mb-2">주요 화성 진행</h4>
        <div className="space-y-2">
          {analysis.harmonyAnalysis.notableProgressions.map((prog: any, idx: number) => (
            <div key={idx} className="bg-secondary/50 rounded-lg p-3">
              <span className="text-sm font-medium text-foreground">{prog.name}</span>
              <p className="text-xs font-mono text-primary mb-1">{prog.progression}</p>
              <p className="text-xs text-muted-foreground">{prog.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Practice Points */}
      <Section title="연습 포인트" icon={Lightbulb}>
        <div className="space-y-4">
          {analysis.practicePoints.map((category: any, idx: number) => (
            <div key={idx}>
              <h4 className="text-sm font-semibold text-foreground mb-2">{category.category}</h4>
              <ul className="space-y-1.5">
                {category.points.map((point: string, pidx: number) => (
                  <li key={pidx} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* IMSLP Sheet Music */}
      <Section title="무료 악보 (IMSLP)" icon={Music}>
        <div className="bg-gradient-to-br from-primary/5 to-violet-500/5 rounded-xl border border-primary/20 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{analysis.imslp.title}</p>
              <p className="text-xs text-muted-foreground mb-2">{analysis.imslp.composer}</p>
              <p className="text-xs text-muted-foreground mb-2">
                IMSLP에서 퍼블릭 도메인 악보를 무료로 다운로드할 수 있습니다.
              </p>
              <div className="flex flex-wrap gap-1">
                {analysis.imslp.editions.map((ed: any, idx: number) => (
                  <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                    {ed.name}
                  </span>
                ))}
              </div>
            </div>
            <a
              href={analysis.imslp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium flex items-center gap-1.5 hover:bg-primary/90 transition-colors shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
              IMSLP
            </a>
          </div>
        </div>
      </Section>

      {/* References */}
      <Section title="참고 문헌" icon={FileText}>
        <p className="text-xs text-muted-foreground mb-3">
          아래 자료는 검증된 음악학 문헌입니다. 도서관이나 서점에서 확인하세요.
        </p>
        <div className="space-y-3">
          {analysis.references.map((ref: any, idx: number) => (
            <div key={idx} className="bg-secondary/50 rounded-lg p-3">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                {ref.type}
              </span>
              <p className="text-sm font-medium text-foreground mt-1">{ref.title}</p>
              <p className="text-xs text-muted-foreground">{ref.author}</p>
              <p className="text-xs text-muted-foreground">{ref.source}</p>
              {ref.isbn && <p className="text-xs text-muted-foreground font-mono">{ref.isbn}</p>}
            </div>
          ))}
        </div>
      </Section>

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-xs text-amber-800 text-center">
          <strong>주의:</strong> 본 분석은 참고용이며, 정확한 학습을 위해
          <br />
          위 참고 자료의 원문을 직접 확인하시기 바랍니다.
        </p>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm mb-4 overflow-hidden">
      <div className="px-4 py-3 bg-muted/50 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
