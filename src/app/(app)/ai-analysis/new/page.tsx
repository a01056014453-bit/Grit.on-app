"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Brain, Loader2, Music, User } from "lucide-react";

// 클래식 작곡가와 대표 작품 데이터베이스
const composerDatabase = [
  {
    composer: "F. Chopin",
    fullName: "Frédéric Chopin",
    works: [
      "Ballade No.1 Op.23",
      "Ballade No.2 Op.38",
      "Ballade No.3 Op.47",
      "Ballade No.4 Op.52",
      "Nocturne Op.9 No.2",
      "Nocturne Op.27 No.2",
      "Polonaise Op.53 'Heroic'",
      "Scherzo No.2 Op.31",
      "Etude Op.10 No.3 'Tristesse'",
      "Etude Op.10 No.12 'Revolutionary'",
      "Etude Op.25 No.11 'Winter Wind'",
      "Waltz Op.64 No.2",
      "Piano Sonata No.2 Op.35",
      "Piano Sonata No.3 Op.58",
      "Fantaisie-Impromptu Op.66",
      "Piano Concerto No.1 Op.11",
      "Piano Concerto No.2 Op.21",
    ],
  },
  {
    composer: "L. v. Beethoven",
    fullName: "Ludwig van Beethoven",
    works: [
      "Piano Sonata No.8 Op.13 'Pathétique'",
      "Piano Sonata No.14 Op.27/2 'Moonlight'",
      "Piano Sonata No.21 Op.53 'Waldstein'",
      "Piano Sonata No.23 Op.57 'Appassionata'",
      "Piano Sonata No.26 Op.81a 'Les Adieux'",
      "Piano Sonata No.29 Op.106 'Hammerklavier'",
      "Piano Sonata No.32 Op.111",
      "Bagatelle WoO 59 'Für Elise'",
      "Piano Concerto No.5 Op.73 'Emperor'",
      "32 Variations in C minor WoO 80",
    ],
  },
  {
    composer: "C. Debussy",
    fullName: "Claude Debussy",
    works: [
      "Suite Bergamasque No.3 'Clair de Lune'",
      "Arabesque No.1",
      "Arabesque No.2",
      "Rêverie",
      "La fille aux cheveux de lin",
      "Deux Arabesques",
      "Children's Corner",
      "Estampes",
      "Images Book 1",
      "Images Book 2",
      "Préludes Book 1",
      "Préludes Book 2",
    ],
  },
  {
    composer: "J.S. Bach",
    fullName: "Johann Sebastian Bach",
    works: [
      "Well-Tempered Clavier Book 1",
      "Well-Tempered Clavier Book 2",
      "Goldberg Variations BWV 988",
      "French Suite No.5 BWV 816",
      "English Suite No.2 BWV 807",
      "Partita No.2 BWV 826",
      "Italian Concerto BWV 971",
      "Toccata and Fugue in D minor BWV 565",
      "Prelude in C major BWV 846",
    ],
  },
  {
    composer: "W.A. Mozart",
    fullName: "Wolfgang Amadeus Mozart",
    works: [
      "Piano Sonata No.11 K.331 'Alla Turca'",
      "Piano Sonata No.16 K.545",
      "Piano Sonata No.8 K.310",
      "Piano Concerto No.21 K.467",
      "Piano Concerto No.23 K.488",
      "Fantasia in D minor K.397",
      "Rondo in D major K.485",
      "12 Variations K.265 'Ah vous dirai-je, Maman'",
    ],
  },
  {
    composer: "F. Liszt",
    fullName: "Franz Liszt",
    works: [
      "Liebestraum No.3",
      "La Campanella",
      "Hungarian Rhapsody No.2",
      "Hungarian Rhapsody No.6",
      "Consolation No.3",
      "Un Sospiro",
      "Mephisto Waltz No.1",
      "Transcendental Etude No.4 'Mazeppa'",
      "Piano Sonata in B minor",
    ],
  },
  {
    composer: "S. Rachmaninoff",
    fullName: "Sergei Rachmaninoff",
    works: [
      "Piano Concerto No.2 Op.18",
      "Piano Concerto No.3 Op.30",
      "Prelude in C# minor Op.3 No.2",
      "Prelude in G minor Op.23 No.5",
      "Etude-Tableau Op.39 No.6",
      "Rhapsody on a Theme of Paganini",
      "Moment Musical Op.16 No.4",
      "Vocalise Op.34 No.14",
    ],
  },
  {
    composer: "R. Schumann",
    fullName: "Robert Schumann",
    works: [
      "Kinderszenen Op.15",
      "Träumerei Op.15 No.7",
      "Arabeske Op.18",
      "Carnaval Op.9",
      "Kreisleriana Op.16",
      "Piano Concerto in A minor Op.54",
      "Papillons Op.2",
      "Fantasiestücke Op.12",
    ],
  },
  {
    composer: "J. Brahms",
    fullName: "Johannes Brahms",
    works: [
      "Piano Concerto No.1 Op.15",
      "Piano Concerto No.2 Op.83",
      "Intermezzo Op.117 No.1",
      "Intermezzo Op.118 No.2",
      "Rhapsody Op.79 No.2",
      "6 Piano Pieces Op.118",
      "Ballade Op.10 No.1",
      "Variations on a Theme by Paganini Op.35",
    ],
  },
  {
    composer: "P.I. Tchaikovsky",
    fullName: "Pyotr Ilyich Tchaikovsky",
    works: [
      "Piano Concerto No.1 Op.23",
      "The Seasons Op.37a",
      "Album for the Young Op.39",
      "Dumka Op.59",
      "Nocturne Op.19 No.4",
    ],
  },
  {
    composer: "M. Ravel",
    fullName: "Maurice Ravel",
    works: [
      "Jeux d'eau",
      "Pavane pour une infante défunte",
      "Miroirs",
      "Gaspard de la nuit",
      "Piano Concerto in G major",
      "Sonatine",
      "Le Tombeau de Couperin",
    ],
  },
  {
    composer: "F. Schubert",
    fullName: "Franz Schubert",
    works: [
      "Piano Sonata No.21 D.960",
      "Impromptu Op.90 No.2",
      "Impromptu Op.90 No.3",
      "Impromptu Op.90 No.4",
      "Moment Musical No.3 D.780",
      "Wanderer Fantasy D.760",
    ],
  },
  {
    composer: "E. Grieg",
    fullName: "Edvard Grieg",
    works: [
      "Piano Concerto in A minor Op.16",
      "Lyric Pieces Op.43",
      "Wedding Day at Troldhaugen Op.65 No.6",
      "Notturno Op.54 No.4",
      "March of the Dwarfs Op.54 No.3",
    ],
  },
  {
    composer: "A. Scriabin",
    fullName: "Alexander Scriabin",
    works: [
      "Piano Sonata No.2 Op.19 'Sonata-Fantasy'",
      "Piano Sonata No.3 Op.23",
      "Piano Sonata No.4 Op.30",
      "Piano Sonata No.5 Op.53",
      "Piano Sonata No.9 Op.68 'Black Mass'",
      "Piano Sonata No.10 Op.70",
      "Etude Op.8 No.12 in D# minor",
      "Etude Op.42 No.5",
      "12 Etudes Op.8",
      "24 Preludes Op.11",
      "Prelude Op.11 No.2",
      "Vers la flamme Op.72",
      "Fantaisie Op.28",
    ],
  },
  {
    composer: "S. Prokofiev",
    fullName: "Sergei Prokofiev",
    works: [
      "Piano Sonata No.2 Op.14",
      "Piano Sonata No.3 Op.28",
      "Piano Sonata No.6 Op.82",
      "Piano Sonata No.7 Op.83 'Stalingrad'",
      "Piano Sonata No.8 Op.84",
      "Piano Concerto No.2 Op.16",
      "Piano Concerto No.3 Op.26",
      "Toccata Op.11",
      "Suggestion Diabolique Op.4 No.4",
      "Visions Fugitives Op.22",
      "Romeo and Juliet (10 Pieces) Op.75",
      "Sarcasms Op.17",
    ],
  },
  {
    composer: "D. Shostakovich",
    fullName: "Dmitri Shostakovich",
    works: [
      "24 Preludes and Fugues Op.87",
      "24 Preludes Op.34",
      "Piano Concerto No.1 Op.35",
      "Piano Concerto No.2 Op.102",
      "Piano Sonata No.2 Op.61",
      "3 Fantastic Dances Op.5",
      "Prelude and Fugue No.1 in C major Op.87",
      "Prelude and Fugue No.24 in D minor Op.87",
    ],
  },
  {
    composer: "F. Mendelssohn",
    fullName: "Felix Mendelssohn",
    works: [
      "Songs Without Words Op.19",
      "Songs Without Words Op.30",
      "Songs Without Words Op.38",
      "Songs Without Words Op.53",
      "Songs Without Words Op.62",
      "Songs Without Words Op.67",
      "Songs Without Words Op.85",
      "Rondo Capriccioso Op.14",
      "Variations Sérieuses Op.54",
      "Piano Concerto No.1 Op.25",
      "Piano Concerto No.2 Op.40",
      "Scherzo in E minor Op.16 No.2",
    ],
  },
  {
    composer: "J. Haydn",
    fullName: "Joseph Haydn",
    works: [
      "Piano Sonata No.50 Hob.XVI:37 in D major",
      "Piano Sonata No.52 Hob.XVI:39 in G major",
      "Piano Sonata No.58 Hob.XVI:48 in C major",
      "Piano Sonata No.59 Hob.XVI:49 in E-flat major",
      "Piano Sonata No.60 Hob.XVI:50 in C major",
      "Piano Sonata No.62 Hob.XVI:52 in E-flat major",
      "Andante con Variazioni Hob.XVII:6",
      "Piano Concerto in D major Hob.XVIII:11",
    ],
  },
  {
    composer: "D. Scarlatti",
    fullName: "Domenico Scarlatti",
    works: [
      "Sonata in D minor K.141",
      "Sonata in D minor K.9 'Pastorale'",
      "Sonata in E major K.380",
      "Sonata in G major K.14",
      "Sonata in B minor K.27",
      "Sonata in D major K.96",
      "Sonata in F minor K.466",
      "Sonata in A major K.208",
      "Sonata in C major K.159",
    ],
  },
  {
    composer: "B. Bartók",
    fullName: "Béla Bartók",
    works: [
      "Mikrokosmos (6 volumes)",
      "Piano Sonata Sz.80",
      "Allegro Barbaro Sz.49",
      "Romanian Folk Dances Sz.56",
      "Piano Concerto No.1 Sz.83",
      "Piano Concerto No.2 Sz.95",
      "Piano Concerto No.3 Sz.119",
      "Suite Op.14 Sz.62",
      "Out of Doors Sz.81",
    ],
  },
  {
    composer: "E. Satie",
    fullName: "Erik Satie",
    works: [
      "Gymnopédie No.1",
      "Gymnopédie No.2",
      "Gymnopédie No.3",
      "Gnossienne No.1",
      "Gnossienne No.2",
      "Gnossienne No.3",
      "Je te veux",
      "Ogives",
      "Sarabandes",
    ],
  },
  {
    composer: "M. Mussorgsky",
    fullName: "Modest Mussorgsky",
    works: [
      "Pictures at an Exhibition",
      "Night on Bald Mountain (piano transcription)",
      "Gopak",
    ],
  },
  {
    composer: "G. Gershwin",
    fullName: "George Gershwin",
    works: [
      "Rhapsody in Blue",
      "Piano Concerto in F",
      "3 Preludes",
      "I Got Rhythm (Variations)",
      "An American in Paris (piano transcription)",
      "Songbook (18 songs)",
    ],
  },
  {
    composer: "C. Saint-Saëns",
    fullName: "Camille Saint-Saëns",
    works: [
      "Piano Concerto No.2 Op.22",
      "Piano Concerto No.5 Op.103 'Egyptian'",
      "Allegro Appassionato Op.70",
      "6 Etudes Op.111",
      "The Carnival of the Animals (2 pianos)",
    ],
  },
  {
    composer: "C. Czerny",
    fullName: "Carl Czerny",
    works: [
      "The School of Velocity Op.299",
      "The Art of Finger Dexterity Op.740",
      "100 Progressive Studies Op.139",
      "Practical Exercises Op.849",
      "160 Eight-Measure Exercises Op.821",
      "The School of Legato and Staccato Op.335",
    ],
  },
  {
    composer: "F. Burgmüller",
    fullName: "Friedrich Burgmüller",
    works: [
      "25 Progressive Pieces Op.100",
      "18 Characteristic Studies Op.109",
      "12 Brilliant and Melodious Studies Op.105",
    ],
  },
  {
    composer: "N. Kapustin",
    fullName: "Nikolai Kapustin",
    works: [
      "8 Concert Etudes Op.40",
      "Concert Etude Op.40 No.1 'Prelude'",
      "Concert Etude Op.40 No.2 'Dream'",
      "Concert Etude Op.40 No.3 'Toccatina'",
      "Concert Etude Op.40 No.4 'Reminiscence'",
      "Concert Etude Op.40 No.6 'Pastoral'",
      "Concert Etude Op.40 No.7 'Intermezzo'",
      "Concert Etude Op.40 No.8 'Finale'",
      "Piano Sonata No.1 Op.39 'Sonata-Fantasy'",
      "Piano Sonata No.2 Op.54",
      "Piano Sonata No.3 Op.55",
      "Variations Op.41",
      "Toccatina Op.36",
      "Sonatina Op.100",
      "24 Preludes in Jazz Style Op.53",
      "Piano Concerto No.2 Op.14",
      "Piano Concerto No.4 Op.56",
    ],
  },
];

// 검색을 위한 통합 리스트 생성
interface SearchItem {
  composer: string;
  fullName: string;
  work: string;
}

const searchableItems: SearchItem[] = composerDatabase.flatMap((c) =>
  c.works.map((work) => ({
    composer: c.composer,
    fullName: c.fullName,
    work,
  }))
);

// 작곡가 목록 (중복 제거)
const composerList = composerDatabase.map((c) => ({
  composer: c.composer,
  fullName: c.fullName,
}));

// 분석 가능한 곡 데이터
const availableAnalysis = [
  {
    id: "1",
    composer: "F. Chopin",
    keywords: ["ballade", "op.23", "op 23", "no.1", "no 1", "발라드"],
  },
  {
    id: "2",
    composer: "L. v. Beethoven",
    keywords: ["sonata no.8", "sonata no 8", "op.13", "op 13", "pathétique", "pathetique", "비창"],
  },
  {
    id: "3",
    composer: "C. Debussy",
    keywords: ["clair de lune", "bergamasque", "달빛", "클레르 드 륀"],
  },
  {
    id: "4",
    composer: "F. Liszt",
    keywords: ["campanella", "la campanella", "s.141", "etude", "종"],
  },
];

// 분석 ID 찾기
const findAnalysisId = (composer: string, title: string): string | null => {
  const lowerComposer = composer.toLowerCase();
  const lowerTitle = title.toLowerCase();

  for (const analysis of availableAnalysis) {
    // 작곡가 매칭 확인
    const composerMatch =
      lowerComposer.includes(analysis.composer.toLowerCase()) ||
      analysis.composer.toLowerCase().includes(lowerComposer) ||
      (lowerComposer.includes("chopin") && analysis.composer.includes("Chopin")) ||
      (lowerComposer.includes("beethoven") && analysis.composer.includes("Beethoven")) ||
      (lowerComposer.includes("debussy") && analysis.composer.includes("Debussy"));

    if (composerMatch) {
      // 키워드 매칭 확인
      for (const keyword of analysis.keywords) {
        if (lowerTitle.includes(keyword)) {
          return analysis.id;
        }
      }
    }
  }

  return null;
};

export default function NewAnalysisPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [composer, setComposer] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 작곡가 자동완성
  const [composerSuggestions, setComposerSuggestions] = useState<typeof composerList>([]);
  const [showComposerSuggestions, setShowComposerSuggestions] = useState(false);
  const composerRef = useRef<HTMLDivElement>(null);

  // 곡 제목 자동완성
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const titleRef = useRef<HTMLDivElement>(null);

  // 작곡가 필터링
  const filterComposers = (query: string) => {
    if (query.length < 2) {
      setComposerSuggestions([]);
      setShowComposerSuggestions(false);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = composerList.filter(
      (c) =>
        c.composer.toLowerCase().includes(lowerQuery) ||
        c.fullName.toLowerCase().includes(lowerQuery)
    );

    setComposerSuggestions(filtered);
    setShowComposerSuggestions(filtered.length > 0);
  };

  // 선택된 작곡가의 곡 목록 필터링
  const filterTitles = (query: string) => {
    if (query.length < 2) {
      setTitleSuggestions([]);
      setShowTitleSuggestions(false);
      return;
    }

    const lowerQuery = query.toLowerCase();
    let works: string[] = [];

    // 선택된 작곡가가 있으면 그 작곡가의 곡만 필터링
    if (composer) {
      const selectedComposer = composerDatabase.find(
        (c) => c.composer === composer || c.fullName === composer
      );
      if (selectedComposer) {
        works = selectedComposer.works.filter((w) =>
          w.toLowerCase().includes(lowerQuery)
        );
      }
    } else {
      // 선택된 작곡가가 없을 때만 전체에서 검색
      works = searchableItems
        .filter((item) => item.work.toLowerCase().includes(lowerQuery))
        .map((item) => `${item.work} (${item.composer})`);
      // 중복 제거
      works = [...new Set(works)];
    }

    setTitleSuggestions(works.slice(0, 8));
    setShowTitleSuggestions(works.length > 0);
  };

  // 작곡가 선택
  const selectComposer = (item: typeof composerList[0]) => {
    setComposer(item.composer);
    setShowComposerSuggestions(false);
    setTitle(""); // 작곡가 변경 시 곡 제목 초기화
  };

  // 곡 제목 선택
  const selectTitle = (work: string) => {
    // "(작곡가)" 부분이 있으면 분리
    const match = work.match(/^(.+) \((.+)\)$/);
    if (match) {
      setTitle(match[1]);
      setComposer(match[2]);
    } else {
      setTitle(work);
    }
    setShowTitleSuggestions(false);
  };

  // 외부 클릭 시 자동완성 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (composerRef.current && !composerRef.current.contains(event.target as Node)) {
        setShowComposerSuggestions(false);
      }
      if (titleRef.current && !titleRef.current.contains(event.target as Node)) {
        setShowTitleSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleComposerChange = (value: string) => {
    setComposer(value);
    filterComposers(value);
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    filterTitles(value);
  };

  const handleAnalyze = async () => {
    if (!title || !composer) return;

    setIsAnalyzing(true);

    // 분석 ID 찾기
    const analysisId = findAnalysisId(composer, title);

    // 짧은 로딩 효과 (500ms)
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (analysisId) {
      // 분석 데이터가 있으면 해당 페이지로 이동
      router.push(`/ai-analysis/${analysisId}`);
    } else {
      // 분석 데이터가 없으면 알림
      setIsAnalyzing(false);
      alert(`"${composer} - ${title}" 곡의 분석 데이터가 아직 준비되지 않았습니다.\n\n현재 분석 가능한 곡:\n• F. Chopin - Ballade No.1 Op.23\n• L. v. Beethoven - Piano Sonata No.8 Op.13\n• C. Debussy - Clair de Lune\n• F. Liszt - Etude S.141 No.3`);
    }
  };

  const canAnalyze = title.trim() && composer.trim();

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24 min-h-screen bg-blob-violet">
      <div className="bg-blob-extra" />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-foreground">새 곡 분석</h1>
          <p className="text-xs text-muted-foreground">곡 정보를 입력하세요</p>
        </div>
      </div>

      {/* Input Form */}
      <div className="space-y-4 mb-6">
        {/* Composer */}
        <div className="relative" ref={composerRef}>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            작곡가 *
          </label>
          <input
            type="text"
            placeholder="예: Chopin, Bach, Mozart"
            value={composer}
            onChange={(e) => handleComposerChange(e.target.value)}
            onFocus={() => {
              if (composer.length >= 2) filterComposers(composer);
            }}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-xs text-muted-foreground mt-1">2글자 이상 입력하면 자동완성됩니다</p>

          {/* Composer Suggestions */}
          {showComposerSuggestions && composerSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
              {composerSuggestions.map((item, index) => (
                <button
                  key={`${item.composer}-${index}`}
                  onClick={() => selectComposer(item)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{item.composer}</p>
                    <p className="text-xs text-muted-foreground">{item.fullName}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <div className="relative" ref={titleRef}>
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            곡 제목 *
          </label>
          <input
            type="text"
            placeholder={composer ? `${composer}의 곡 검색...` : "예: Ballade, Sonata, Nocturne"}
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            onFocus={() => {
              if (title.length >= 2) filterTitles(title);
            }}
            className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          {/* Title Suggestions */}
          {showTitleSuggestions && titleSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
              {titleSuggestions.map((work, index) => (
                <button
                  key={`${work}-${index}`}
                  onClick={() => selectTitle(work)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/50 transition-colors border-b border-border last:border-b-0 text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                    <Music className="w-4 h-4 text-violet-600" />
                  </div>
                  <p className="font-medium text-foreground text-sm truncate">{work}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* What AI Analyzes */}
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          AI가 분석하는 항목
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span><strong className="text-foreground">곡 배경</strong> - 작곡 시기, 헌정, 초연 정보</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span><strong className="text-foreground">작곡가 설명</strong> - 생애, 음악적 특징</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span><strong className="text-foreground">시대적 맥락</strong> - 음악사적 위치, 영향</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span><strong className="text-foreground">형식·주제·동기</strong> - 구조 분석</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span><strong className="text-foreground">화성 진행</strong> - 로마숫자 분석 (I-IV-V-I 등)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span><strong className="text-foreground">연습 포인트</strong> - 템포, 페달, 프레이징 제안</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span><strong className="text-foreground">참고 자료</strong> - 관련 논문, 레퍼런스 링크</span>
          </li>
        </ul>
      </div>

      {/* Notice */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 mb-6">
        <p className="text-sm text-amber-800">
          <strong>정확성 안내:</strong> AI는 검증된 음악학 자료를 바탕으로 분석합니다.
          불확실한 정보는 제공하지 않으며, 출처를 명시합니다.
        </p>
      </div>

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={!canAnalyze || isAnalyzing}
        className="w-full py-4 rounded-xl bg-primary text-white font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            분석 중...
          </>
        ) : (
          <>
            <Brain className="w-5 h-5" />
            AI 분석 시작
          </>
        )}
      </button>
    </div>
  );
}
