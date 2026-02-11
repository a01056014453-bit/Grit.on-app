import type { Song, RecentRecording } from "@/types";

/** 연습곡 목록 */
export const mockSongs: Song[] = [
  {
    id: "1",
    title: "F. Chopin Ballade Op.23 No.1",
    duration: "9 min",
    lastPracticed: "Today",
  },
  {
    id: "2",
    title: "L. v. Beethoven Sonata Op.13 No.8",
    duration: "18 min",
    lastPracticed: "Yesterday",
  },
  {
    id: "3",
    title: "C. Debussy Suite Bergamasque No.3",
    duration: "5 min",
    lastPracticed: "3 days ago",
  },
  {
    id: "4",
    title: "F. Liszt Etude S.141 No.3",
    duration: "5 min",
    lastPracticed: "1 week ago",
  },
  {
    id: "5",
    title: "F. Chopin Fantaisie-Impromptu Op.66",
    duration: "5 min",
    lastPracticed: "2 weeks ago",
  },
];

/** 연습 팁 목록 */
export const PRACTICE_TIPS = [
  "천천히 연습하는 것이 가장 빠른 길입니다.",
  "어려운 부분은 리듬을 바꿔서 연습해보세요.",
  "한 손씩 따로 연습하면 더 명확해집니다.",
  "녹음해서 자신의 연주를 객관적으로 들어보세요.",
  "긴장을 풀고 호흡에 집중하세요.",
  "메트로놈을 활용하여 정확한 템포를 유지하세요.",
  "같은 구간을 5번 연속 완벽하게 치면 다음으로 넘어가세요.",
  "손목과 팔의 힘을 빼고 자연스럽게 연주하세요.",
  "어려운 패시지는 점점 빠르게 연습해보세요.",
  "눈을 감고 연주해보면 청각에 더 집중할 수 있어요.",
  "프레이징을 노래하듯이 연주해보세요.",
  "페달 없이 먼저 완벽하게 연습하세요.",
];

/** 최근 녹음 (연습 페이지용) */
export const recentRecordings: RecentRecording[] = [
  { id: "1", title: "F. Chopin Ballade Op.23 No.1", duration: "30:45", score: 84, date: "오늘", focusAreas: 2 },
  { id: "2", title: "F. Chopin Ballade Op.23 No.1", duration: "25:20", score: 81, date: "어제", focusAreas: 3 },
  { id: "3", title: "L. v. Beethoven Sonata Op.13 No.8", duration: "39:00", score: 86, date: "2일 전", focusAreas: 1 },
];

/** 랜덤 팁 가져오기 */
export function getRandomTip(): string {
  return PRACTICE_TIPS[Math.floor(Math.random() * PRACTICE_TIPS.length)];
}

/** 곡 AI 분석 정보 */
export interface SongAIInfo {
  id: string;
  composer: string;
  composerFull: string;
  composerImage?: string;
  title: string;
  opus: string;
  year: string;
  period: string;
  difficulty: "초급" | "중급" | "고급" | "전문가";
  keySignature: string;
  tempo: string;
  duration: string;
  composerBackground: string;
  historicalContext: string;
  workBackground: string;
  structure: { section: string; measures: string; description: string }[];
  technicalTips: string[];
  musicalTips: string[];
  famousPerformers: string[];
}

export const mockSongAIInfo: Record<string, SongAIInfo> = {
  "1": {
    id: "1",
    composer: "F. Chopin",
    composerFull: "Frédéric François Chopin (1810-1849)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Frederic_Chopin_photo.jpeg/250px-Frederic_Chopin_photo.jpeg",
    title: "Ballade No.1",
    opus: "Op.23",
    year: "1831-1835",
    period: "낭만주의",
    difficulty: "전문가",
    keySignature: "G단조",
    tempo: "Largo - Moderato - Presto con fuoco",
    duration: "약 9-10분",
    composerBackground: "프레데리크 쇼팽은 1810년 폴란드 바르샤바 근교 젤라조바 볼라에서 프랑스인 아버지와 폴란드인 어머니 사이에서 태어났습니다. 7세에 첫 작품을 출판하고 8세에 공개 연주회를 가진 신동이었습니다. 1830년 11월 봉기 직전 폴란드를 떠나 빈을 거쳐 1831년 파리에 정착했으며, 이후 고국으로 돌아가지 못했습니다. 파리에서 귀족 사회의 총애를 받으며 피아노 교사이자 살롱 연주자로 활동했고, 작가 조르주 상드와의 관계(1838-1847)가 유명합니다. 결핵으로 평생 건강이 좋지 않았으며, 39세의 나이로 파리에서 사망했습니다.",
    historicalContext: "이 작품이 작곡된 1830년대 초는 유럽 전역에 민족주의 운동이 확산되던 시기입니다. 1830년 11월, 폴란드에서 러시아 제국의 지배에 항거하는 '11월 봉기'가 일어났으나 1831년 진압되었습니다. 쇼팽은 이 소식을 빈에서 들었고, 조국의 비극에 깊은 충격을 받았습니다. 이 시기 그의 작품들, 특히 발라드와 스케르초에는 폴란드의 비극과 망명자로서의 고통이 반영되어 있습니다. 낭만주의 음악이 절정에 달하던 시기로, 음악에서 문학적 서사와 개인적 감정 표현이 중시되었습니다.",
    workBackground: "발라드 1번은 쇼팽이 창시한 피아노 발라드 장르의 첫 작품입니다. '발라드'라는 명칭은 원래 중세 서사시를 노래한 성악곡을 지칭했으나, 쇼팽은 이를 기악곡으로 발전시켰습니다. 이 곡은 폴란드 낭만주의 시인 아담 미츠키에비치(1798-1855)의 서사시에서 영감을 받았다고 알려져 있으며, 특히 '콘라드 발렌로드'와 연관짓는 해석이 있습니다. 이 시는 조국을 위해 자신을 희생하는 영웅의 이야기를 담고 있습니다. 1835년 라이프치히에서 출판되었으며, 바이에른의 슈토켈하우젠 남작에게 헌정되었습니다. 로베르트 슈만은 이 곡을 듣고 '쇼팽의 가장 거칠고 독창적인 작품'이라고 평했습니다.",
    structure: [
      { section: "서주 (Largo)", measures: "1-8", description: "나폴리 6화음으로 시작하는 신비로운 도입부. 마치 이야기꾼이 청중의 주의를 끄는 듯한 효과를 냅니다." },
      { section: "제1주제 (Moderato)", measures: "8-67", description: "G단조의 서정적인 주선율. 왈츠 리듬 위에 노래하는 듯한 선율이 펼쳐지며, 점차 열정적으로 고조됩니다." },
      { section: "제2주제", measures: "68-93", description: "E♭장조로 전조되어 밝고 희망적인 분위기를 제시합니다. 제1주제와 대조적인 성격을 가집니다." },
      { section: "발전부", measures: "94-193", description: "두 주제가 변형되고 발전하며 긴장감이 고조됩니다. 기교적으로 가장 어려운 부분이 포함되어 있습니다." },
      { section: "재현부", measures: "194-207", description: "제1주제가 A장조로 변형되어 재현됩니다." },
      { section: "코다 (Presto con fuoco)", measures: "208-264", description: "격렬한 옥타브 패시지와 함께 비극적인 결말로 치닫습니다. 기교적 난이도가 극에 달하며 G단조로 끝맺습니다." },
    ],
    technicalTips: [
      "mm.8-36: 왼손 아르페지오 반주는 손목 회전(rotation)을 활용하여 부드럽게 연결하고, 오른손 선율이 노래하듯 들리도록 밸런스를 조절하세요.",
      "mm.68-93: 제2주제의 양손 교차 패시지에서는 손의 위치 이동을 최소화하고 손가락 번호를 미리 계획하세요.",
      "mm.208 이후: 코다의 옥타브 패시지는 손목과 팔 전체의 무게를 활용하여 연주하고, 긴장으로 인한 경직을 피하세요. 느린 템포부터 연습하여 점차 속도를 올리세요.",
      "페달: 화성 변화에 맞춰 깔끔하게 교체하되, 특히 왼손 베이스 음이 바뀔 때 정확히 교체해야 선명한 화성이 유지됩니다.",
    ],
    musicalTips: [
      "전체 구조를 하나의 서사시로 이해하세요. 서주는 '옛날 옛적에...'로 시작하는 이야기꾼의 도입, 두 주제는 대립하는 두 세계, 코다는 비극적 결말입니다.",
      "제1주제에서 루바토를 적절히 활용하되, 왼손 반주의 맥박은 일정하게 유지하면서 오른손 선율만 자유롭게 움직이는 '쇼팽식 루바토'를 구현하세요.",
      "제2주제로의 전조(G단조→E♭장조)에서 음색의 변화를 명확히 표현하세요. 마치 어두운 방에서 밝은 곳으로 나가는 듯한 효과를 주어야 합니다.",
      "코다의 비극적 결말을 향해 긴장감을 점진적으로 쌓아가되, 처음부터 너무 강하게 시작하면 클라이맥스의 효과가 감소합니다.",
    ],
    famousPerformers: ["Krystian Zimerman (1987, DG)", "Maurizio Pollini (1999, DG)", "Arthur Rubinstein (1959, RCA)", "Evgeny Kissin (1999, RCA)", "Rafał Blechacz (2007, DG)"],
  },
  "2": {
    id: "2",
    composer: "L. v. Beethoven",
    composerFull: "Ludwig van Beethoven (1770-1827)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Joseph_Karl_Stieler%27s_Beethoven_mit_dem_Manuskript_der_Missa_solemnis.jpg/250px-Joseph_Karl_Stieler%27s_Beethoven_mit_dem_Manuskript_der_Missa_solemnis.jpg",
    title: "Piano Sonata No.8 'Pathétique'",
    opus: "Op.13",
    year: "1798-1799",
    period: "고전주의 후기 / 초기 낭만주의",
    difficulty: "고급",
    keySignature: "C단조",
    tempo: "Grave - Allegro di molto e con brio / Adagio cantabile / Rondo: Allegro",
    duration: "약 17-20분",
    composerBackground: "루트비히 판 베토벤은 1770년 독일 본에서 궁정 음악가 집안에 태어났습니다. 아버지는 아들을 '제2의 모차르트'로 만들려 했고, 베토벤은 어린 시절부터 혹독한 음악 교육을 받았습니다. 1792년 빈으로 이주하여 하이든에게 사사했으며, 피아니스트이자 작곡가로 명성을 쌓았습니다. 1796년경부터 청력 감퇴가 시작되었고, 1802년 '하일리겐슈타트 유서'를 쓸 만큼 절망에 빠졌으나 이를 극복하고 창작 활동을 이어갔습니다. 고전주의와 낭만주의를 잇는 가장 중요한 작곡가로, 음악사에서 독보적인 위치를 차지합니다.",
    historicalContext: "이 소나타가 작곡된 1798-99년은 프랑스 혁명(1789) 이후 유럽 전역에 자유와 평등의 이념이 확산되던 시기입니다. 베토벤은 계몽주의와 혁명 정신에 깊이 공감했으며, 이는 그의 음악에서 개인적 감정 표현의 강조와 기존 형식의 확장으로 나타났습니다. 비창 소나타는 베토벤이 28세 무렵, 빈에서 피아니스트이자 작곡가로 명성을 확립해가던 시기에 작곡되었습니다. 그러나 동시에 청력 감퇴의 첫 증상이 나타나기 시작한 때이기도 하여, 작품에 담긴 비극적 정서는 개인적 고뇌와도 연결됩니다.",
    workBackground: "'비창(Grande Sonate Pathétique)'이라는 부제는 베토벤 자신이 붙인 것으로, 당시로서는 매우 이례적인 일이었습니다. '파테티크(Pathétique)'는 그리스어 'pathos(고통, 열정)'에서 유래한 말로, 비극적이고 열정적인 감정을 의미합니다. 이 곡은 리히노프스키 공작에게 헌정되었으며, 출판 직후 큰 성공을 거두어 베토벤의 명성을 확고히 했습니다. 1악장의 느린 서주가 빠른 부분 사이에 여러 번 재등장하는 것, 2악장의 선율이 3악장에서 변형되어 나타나는 것 등 악장 간의 유기적 연결은 당시로서는 혁신적인 시도였습니다.",
    structure: [
      { section: "1악장 서주 (Grave)", measures: "1-10", description: "C단조의 무겁고 장엄한 도입. 점음표(부점) 리듬이 프랑스 서곡 양식을 연상시키며, 이 주제는 악장 전체에 걸쳐 세 번 재등장합니다." },
      { section: "1악장 제시부 (Allegro)", measures: "11-132", description: "격정적인 제1주제와 서정적인 제2주제가 대비됩니다. 소나타 형식을 따르되 극적인 긴장감이 강조됩니다." },
      { section: "1악장 발전부", measures: "133-194", description: "제1주제를 중심으로 전개되며, 서주(Grave)가 E단조로 재등장합니다." },
      { section: "1악장 재현부 및 코다", measures: "195-310", description: "제1, 2주제가 C단조/C장조로 재현되고, 서주가 마지막으로 등장한 뒤 격렬한 코다로 끝납니다." },
      { section: "2악장 (Adagio cantabile)", measures: "전체 73마디", description: "A♭장조의 론도 형식(ABACA). 피아노 문학에서 가장 유명한 선율 중 하나로, 고귀하고 서정적인 노래가 펼쳐집니다." },
      { section: "3악장 (Rondo: Allegro)", measures: "전체 210마디", description: "C단조의 론도 형식. 주제가 2악장 선율과 유사하여 악장 간 통일성을 부여합니다. 비극과 희망이 교차하며 C단조로 끝맺습니다." },
    ],
    technicalTips: [
      "1악장 Grave: 점음표(부점) 리듬을 정확하게 연주하세요. 짧은 음(16분음표)이 너무 빨리 나오지 않도록 주의하고, 장엄한 무게감을 유지하세요.",
      "1악장 Allegro: 왼손 트레몰로(떨림 음형)는 손목의 유연한 회전을 이용하되 팔 전체가 긴장하지 않도록 하세요. 오른손 선율이 묻히지 않게 밸런스를 조절하세요.",
      "2악장: 레가토 선율에서 손가락 연결이 핵심입니다. 한 손가락이 떼지기 전에 다음 손가락이 건반에 닿아야 끊김 없는 선율이 됩니다. 페달에 과도하게 의존하지 마세요.",
      "3악장: 왼손 반주는 가볍게 처리하여 오른손 선율을 방해하지 않도록 하세요. 빠른 스케일 패시지는 손가락 균일성 훈련이 필요합니다.",
    ],
    musicalTips: [
      "1악장에서 Grave와 Allegro의 극적인 대비를 최대한 살리세요. Grave는 운명의 무게를, Allegro는 그에 맞서는 투쟁을 표현합니다.",
      "2악장은 '노래하듯이(cantabile)' 연주하세요. 이탈리아 오페라의 벨칸토 창법처럼, 선율선을 부드럽게 이어가며 자연스러운 호흡을 표현하세요.",
      "전체 3악장의 유기적 연결을 이해하세요. 특히 2악장과 3악장의 주제적 연관성을 인식하고, 하나의 이야기로 연결되는 느낌을 주세요.",
      "C단조는 베토벤에게 특별한 조성입니다(5번 교향곡, 32개 피아노 변주곡 등). 비극적이면서도 영웅적인 투쟁의 성격을 일관되게 유지하세요.",
    ],
    famousPerformers: ["Wilhelm Kempff (1965, DG)", "Daniel Barenboim (1984, DG)", "Vladimir Ashkenazy (1980, Decca)", "Alfred Brendel (1994, Philips)", "Emil Gilels (1980, DG)"],
  },
  "3": {
    id: "3",
    composer: "C. Debussy",
    composerFull: "Claude Achille Debussy (1862-1918)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Claude_Debussy_by_Atelier_Nadar.jpg/250px-Claude_Debussy_by_Atelier_Nadar.jpg",
    title: "Suite Bergamasque - III. Clair de lune",
    opus: "L.75",
    year: "1890 (개정 1905)",
    period: "인상주의",
    difficulty: "중급",
    keySignature: "D♭장조",
    tempo: "Andante très expressif",
    duration: "약 5분",
    composerBackground: "클로드 드뷔시는 1862년 파리 근교 생제르맹앙레에서 태어났습니다. 파리 음악원에서 수학했으며, 1884년 로마 대상을 수상했습니다. 바그너의 영향에서 벗어나 독자적인 음악 언어를 개발했으며, '인상주의 음악의 창시자'로 불립니다. 전통적인 화성 진행과 형식에서 벗어나 색채감 있는 화성, 온음계, 5음 음계 등을 활용했습니다. 주요 작품으로 오페라 '펠레아스와 멜리장드', 관현악곡 '바다', '목신의 오후에의 전주곡' 등이 있습니다.",
    historicalContext: "이 곡이 작곡된 1890년대는 프랑스에서 상징주의 문학과 인상주의 회화가 전성기를 맞던 시기입니다. 말라르메, 베를렌 등의 시인들과 모네, 르누아르 등의 화가들이 활동했습니다. 드뷔시는 이들과 교류하며 음악에서도 인상주의적 표현을 추구했습니다. '베르가마스크 모음곡'이라는 제목은 베를렌의 시 '달빛(Clair de lune)'이 수록된 시집 '우아한 연회(Fêtes galantes)'에서 영감을 받았습니다.",
    workBackground: "'베르가마스크 모음곡'은 전주곡, 미뉴에트, 달빛, 파스피에 4곡으로 구성된 피아노 모음곡입니다. 1890년경 초고가 완성되었으나, 드뷔시는 15년 후인 1905년에야 대폭 개정하여 출판을 허락했습니다. '달빛'은 폴 베를렌의 동명의 시에서 영감을 받았으며, 달빛 아래 정원의 몽환적인 분위기를 음악으로 표현합니다. 드뷔시의 가장 유명한 피아노 작품 중 하나로, 그의 인상주의적 스타일을 잘 보여줍니다.",
    structure: [
      { section: "A 섹션", measures: "1-14", description: "D♭장조의 주제 제시. 왼손의 아르페지오 반주 위에 오른손의 서정적인 선율이 흐릅니다." },
      { section: "B 섹션", measures: "15-26", description: "새로운 선율이 등장하며 음악이 조금 더 움직입니다." },
      { section: "A' 섹션", measures: "27-42", description: "주제가 변형되어 재현되며, 더욱 풍부한 화성으로 발전합니다." },
      { section: "C 섹션 (클라이맥스)", measures: "43-50", description: "곡의 절정으로, 더 강한 다이내믹과 풍성한 화음이 특징입니다." },
      { section: "코다", measures: "51-72", description: "점차 사라지듯 조용해지며, ppp로 끝맺습니다." },
    ],
    technicalTips: [
      "왼손 아르페지오는 손목을 부드럽게 회전시키며 연주하세요. 각 음이 균일한 음량으로 흐르듯 연결되어야 합니다.",
      "오른손 선율은 4, 5번 손가락의 독립성이 중요합니다. 선율음을 충분히 노래하게 하면서 나머지 음은 가볍게 처리하세요.",
      "페달은 화성 변화에 따라 섬세하게 교체하되, 음들이 서로 섞여 몽환적인 분위기를 만들 수 있도록 하세요. 하프 페달 기법도 활용해보세요.",
      "템포 루바토를 적절히 사용하되, 전체적인 흐름이 자연스럽게 유지되도록 하세요.",
    ],
    musicalTips: [
      "달빛이 물 위에 비치는 듯한 이미지를 떠올리며 연주하세요. 모든 음이 빛의 반짝임처럼 섬세해야 합니다.",
      "멜로디 라인을 '노래'로 생각하세요. 프레이즈의 시작과 끝, 호흡점을 명확히 인식하세요.",
      "클라이맥스(mm.43-50)에서도 소리가 거칠어지지 않도록 주의하세요. 풍성하지만 여전히 부드러운 톤을 유지하세요.",
      "곡 전체를 통해 '신비로움'과 '고요함'의 분위기를 일관되게 유지하세요.",
    ],
    famousPerformers: ["Arturo Benedetti Michelangeli (1971, DG)", "Claudio Arrau (1979, Philips)", "Samson François (1961, EMI)", "Alexis Weissenberg (1985, DG)"],
  },
  "4": {
    id: "4",
    composer: "F. Liszt",
    composerFull: "Franz Liszt (1811-1886)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Franz_Liszt_by_Herman_Biow-_1843.png/250px-Franz_Liszt_by_Herman_Biow-_1843.png",
    title: "Grandes études de Paganini - No.3 'La Campanella'",
    opus: "S.141",
    year: "1851 (원곡 1838)",
    period: "낭만주의",
    difficulty: "전문가",
    keySignature: "G#단조",
    tempo: "Allegretto",
    duration: "약 5분",
    composerBackground: "프란츠 리스트는 1811년 헝가리(당시 오스트리아 제국) 라이딩에서 태어났습니다. 아버지의 지원으로 어린 시절부터 피아노 신동으로 주목받았으며, 체르니에게 사사했습니다. 19세기 최고의 피아노 비르투오소로서 유럽 전역을 순회 연주했고, '피아노의 파가니니'라 불렸습니다. 작곡가로서도 교향시라는 장르를 개척했으며, 바그너의 장인이기도 합니다. 만년에는 신부 서품을 받고 종교 음악에 헌신했습니다.",
    historicalContext: "이 연습곡이 처음 작곡된 1838년은 낭만주의 음악이 절정에 달하던 시기입니다. 1832년 리스트는 파리에서 바이올린 거장 니콜로 파가니니의 연주를 듣고 깊은 감명을 받았습니다. 파가니니가 바이올린에서 보여준 초절기교를 피아노에서 구현하겠다는 목표로 이 연습곡집을 작곡했습니다. 1851년 개정판에서는 음악성을 강화하면서도 극도의 기교적 요구는 유지했습니다.",
    workBackground: "'라 캄파넬라'는 파가니니의 바이올린 협주곡 2번 B단조 3악장 '종의 론도'를 피아노용으로 편곡한 것입니다. '캄파넬라'는 이탈리아어로 '작은 종'을 의미하며, 곡 전체에 걸쳐 종소리를 연상시키는 높은 음역의 반복음이 등장합니다. 1838년 초판은 연주가 거의 불가능할 정도로 어려웠으나, 1851년 개정판에서 다소 실용적으로 수정되었습니다. 그럼에도 피아노 레퍼토리 중 가장 어려운 곡 중 하나로 꼽힙니다.",
    structure: [
      { section: "도입부", measures: "1-6", description: "G#단조 주제의 첫 제시. 높은 음역의 종소리 모티프가 등장합니다." },
      { section: "주제 변주 1", measures: "7-38", description: "주제가 다양한 방식으로 변형되며, 넓은 도약과 빠른 음형이 특징입니다." },
      { section: "중간부", measures: "39-62", description: "D#단조로 전조되며 서정적인 선율이 등장합니다." },
      { section: "주제 변주 2", measures: "63-98", description: "더욱 화려한 기교로 주제가 재현됩니다. 양손 교차, 큰 도약 등이 포함됩니다." },
      { section: "코다", measures: "99-끝", description: "빠른 패시지와 트릴로 화려하게 마무리됩니다." },
    ],
    technicalTips: [
      "높은 음역의 반복음(종소리 모티프)은 손가락을 바꿔가며 연주하세요(4-3-2-1 또는 5-4-3-2 등). 손목의 탄력을 활용하세요.",
      "넓은 도약에서는 눈으로 도착 지점을 미리 확인하고, 팔 전체를 이용한 부드러운 이동을 연습하세요. 도약 전 준비 시간을 확보하세요.",
      "양손 교차 패시지는 팔이 서로 부딪히지 않도록 동선을 미리 계획하세요. 느린 템포에서 정확한 위치를 익힌 후 속도를 올리세요.",
      "곡 전체의 체력 안배가 중요합니다. 어려운 패시지 전에 불필요한 긴장을 줄이세요.",
    ],
    musicalTips: [
      "종소리 모티프가 곡 전체를 통해 어떻게 변형되는지 추적하세요. 이것이 곡의 통일성을 제공합니다.",
      "기교적으로 어려운 부분에서도 음악적 표현을 잃지 마세요. 각 프레이즈의 방향성과 정점을 명확히 하세요.",
      "중간부의 서정적 선율에서 진정한 음악성을 보여주세요. 기교 과시만이 아닌, 노래하는 듯한 표현이 필요합니다.",
      "마지막 코다는 화려하지만 통제된 에너지로 마무리하세요. 서두르지 말고 각 음을 명확하게 연주하세요.",
    ],
    famousPerformers: ["Jorge Bolet (1985, Decca)", "Claudio Arrau (1977, Philips)", "Evgeny Kissin (1986, Melodiya)", "Yuja Wang (2016, DG)"],
  },
  "5": {
    id: "5",
    composer: "F. Chopin",
    composerFull: "Frédéric François Chopin (1810-1849)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Frederic_Chopin_photo.jpeg/250px-Frederic_Chopin_photo.jpeg",
    title: "Fantaisie-Impromptu",
    opus: "Op.66 (유작)",
    year: "1834",
    period: "낭만주의",
    difficulty: "고급",
    keySignature: "C#단조",
    tempo: "Allegro agitato - Moderato cantabile",
    duration: "약 5분",
    composerBackground: "프레데리크 쇼팽은 1810년 폴란드 바르샤바 근교에서 태어났습니다. 신동으로 일찍이 재능을 인정받았으며, 1830년 폴란드를 떠나 파리에 정착했습니다. 피아노만을 위한 작품에 집중했으며, 녹턴, 발라드, 스케르초, 폴로네즈, 마주르카 등의 장르에서 걸작을 남겼습니다. 섬세한 감수성과 시적인 표현으로 '피아노의 시인'이라 불립니다. 조르주 상드와의 관계, 결핵으로 인한 건강 악화 등 파란만장한 삶을 살다 39세에 세상을 떠났습니다.",
    historicalContext: "이 곡이 작곡된 1834년은 쇼팽이 파리에서 피아니스트이자 작곡가로서 명성을 확립해가던 시기입니다. 당시 파리는 유럽 문화의 중심지로, 리스트, 베를리오즈, 멘델스존 등 당대 최고의 음악가들이 활동하고 있었습니다. 살롱 문화가 번성했고, 쇼팽은 귀족들의 살롱에서 연주하며 생계를 유지했습니다. 이 곡의 서정적 중간부는 당시 유행하던 감상적인 살롱 음악의 영향을 보여줍니다.",
    workBackground: "환상즉흥곡은 쇼팽이 생전에 출판하지 않았으며, 사후 유작으로 발표되었습니다. 쇼팽은 이 곡의 출판을 원하지 않았는데, 그 이유는 명확하지 않습니다. 일부 학자들은 중간부의 선율이 모셸레스의 '즉흥곡 Op.89'와 유사하다는 점 때문이라고 추정합니다. 그러나 역설적으로 이 곡은 쇼팽의 작품 중 가장 대중적으로 사랑받는 곡이 되었습니다. '환상'이라는 제목은 형식의 자유로움을, '즉흥곡'은 즉흥 연주의 느낌을 나타냅니다.",
    structure: [
      { section: "A 섹션 (Allegro agitato)", measures: "1-40", description: "C#단조의 격정적인 부분. 오른손은 16분음표 4개씩, 왼손은 16분음표 6개씩(4:6 폴리리듬)으로 진행됩니다." },
      { section: "B 섹션 (Moderato cantabile)", measures: "41-82", description: "D♭장조의 서정적인 중간부. 'I'm Always Chasing Rainbows'의 원곡으로 유명한 아름다운 선율입니다." },
      { section: "A' 섹션", measures: "83-118", description: "A 섹션이 재현되며 더욱 격렬해집니다." },
      { section: "코다", measures: "119-끝", description: "B 섹션의 선율이 왼손에서 회상되며 조용히 사라집니다." },
    ],
    technicalTips: [
      "A 섹션의 4:6 폴리리듬은 처음에 각 손을 따로 연습하고, 천천히 합치세요. 왼손 6개 음 중 1, 3, 5번째 음과 오른손 1, 2, 3, 4번째 음이 맞물리는 지점을 인식하세요.",
      "오른손의 빠른 16분음표 패시지는 손목의 자연스러운 회전과 손가락의 가벼운 터치로 연주하세요. 힘을 주면 오히려 속도가 느려집니다.",
      "B 섹션에서는 선율음(주로 5번 손가락)을 강조하고 나머지 화음은 가볍게 처리하세요. 손가락 독립성 훈련이 필요합니다.",
      "코다에서 왼손에 나오는 B 선율은 충분히 노래하게 연주하세요. 오른손 아르페지오에 묻히지 않도록 주의하세요.",
    ],
    musicalTips: [
      "A 섹션과 B 섹션의 극적인 대비를 살리세요. A는 '불안과 격정', B는 '꿈결 같은 평화'를 표현합니다.",
      "B 섹션의 선율은 진정으로 '노래하듯이' 연주하세요. 각 프레이즈의 시작과 끝, 호흡을 명확히 하세요.",
      "A 섹션에서도 선율선을 인식하세요. 빠른 음형 속에서도 음악적 방향성을 잃지 마세요.",
      "코다는 꿈에서 깨어나는 듯한 느낌으로, B 선율의 아름다운 회상과 함께 여운을 남기며 끝내세요.",
    ],
    famousPerformers: ["Arthur Rubinstein (1962, RCA)", "Maurizio Pollini (1991, DG)", "Krystian Zimerman (1987, DG)", "Yundi Li (2002, DG)"],
  },
};

export function getSongAIInfo(id: string): SongAIInfo | null {
  return mockSongAIInfo[id] || null;
}

/** 곡 제목에서 작곡가와 곡명 파싱 */
function parseSongTitle(title: string): { composer: string; songName: string } {
  // 일반적인 패턴: "작곡가 곡명" (예: "F. Chopin Ballade Op.23 No.1")
  const patterns = [
    /^(F\. Chopin|L\. v\. Beethoven|C\. Debussy|F\. Liszt|J\. S\. Bach|W\. A\. Mozart|R\. Schumann|J\. Brahms|S\. Rachmaninoff|P\. I\. Tchaikovsky)\s+(.+)$/i,
    /^([A-Z]\.\s*[A-Z]?\.\s*[A-Za-z]+)\s+(.+)$/i,
    /^([A-Za-z]+)\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      return { composer: match[1], songName: match[2] };
    }
  }

  return { composer: "알 수 없음", songName: title };
}

/** 주요 작곡가 데이터베이스 */
interface ComposerData {
  composerFull: string;
  composerImage?: string;
  period: string;
  background: string;
  historicalContext: string;
}

const composerDatabase: Record<string, ComposerData> = {
  chopin: {
    composerFull: "Frédéric François Chopin (1810-1849)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Frederic_Chopin_photo.jpeg/250px-Frederic_Chopin_photo.jpeg",
    period: "낭만주의",
    background: "프레데리크 쇼팽은 1810년 폴란드 바르샤바 근교 젤라조바 볼라에서 태어났습니다. 7세에 첫 작품을 출판하고 8세에 공개 연주회를 가진 신동이었습니다. 1830년 폴란드를 떠나 파리에 정착했으며, 피아노만을 위한 작품에 집중하여 녹턴, 발라드, 스케르초, 폴로네즈, 마주르카 등에서 걸작을 남겼습니다. '피아노의 시인'이라 불리며, 섬세한 감수성과 시적 표현이 특징입니다. 39세의 나이로 파리에서 사망했습니다.",
    historicalContext: "19세기 전반 유럽은 낭만주의 운동이 절정에 달하던 시기로, 음악에서 개인적 감정 표현과 민족주의가 중시되었습니다. 쇼팽은 폴란드 망명자로서 조국의 비극을 음악에 담았으며, 파리 살롱 문화의 중심에서 활동했습니다.",
  },
  beethoven: {
    composerFull: "Ludwig van Beethoven (1770-1827)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Joseph_Karl_Stieler%27s_Beethoven_mit_dem_Manuskript_der_Missa_solemnis.jpg/250px-Joseph_Karl_Stieler%27s_Beethoven_mit_dem_Manuskript_der_Missa_solemnis.jpg",
    period: "고전주의 / 초기 낭만주의",
    background: "루트비히 판 베토벤은 1770년 독일 본에서 궁정 음악가 집안에 태어났습니다. 1792년 빈으로 이주하여 하이든에게 사사했으며, 피아니스트이자 작곡가로 명성을 쌓았습니다. 1796년경부터 청력 감퇴가 시작되었으나 이를 극복하고 위대한 작품들을 남겼습니다. 고전주의와 낭만주의를 잇는 가장 중요한 작곡가로, 교향곡, 소나타, 협주곡, 현악 사중주 등 모든 장르에서 음악사에 혁명을 일으켰습니다.",
    historicalContext: "프랑스 혁명(1789) 이후 유럽 전역에 자유와 평등의 이념이 확산되던 시기입니다. 베토벤은 계몽주의와 혁명 정신에 공감했으며, 이는 그의 음악에서 개인적 감정 표현의 강조와 기존 형식의 확장으로 나타났습니다.",
  },
  debussy: {
    composerFull: "Claude Achille Debussy (1862-1918)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Claude_Debussy_by_Atelier_Nadar.jpg/250px-Claude_Debussy_by_Atelier_Nadar.jpg",
    period: "인상주의",
    background: "클로드 드뷔시는 1862년 파리 근교 생제르맹앙레에서 태어났습니다. 파리 음악원에서 수학했으며, 1884년 로마 대상을 수상했습니다. 바그너의 영향에서 벗어나 독자적인 음악 언어를 개발했으며, '인상주의 음악의 창시자'로 불립니다. 색채감 있는 화성, 온음계, 5음 음계 등을 활용하여 전통적 화성 체계를 확장했습니다.",
    historicalContext: "19세기 말~20세기 초 프랑스에서 상징주의 문학과 인상주의 회화가 전성기를 맞던 시기입니다. 드뷔시는 말라르메, 모네 등 당대 예술가들과 교류하며 음악에서도 인상주의적 표현을 추구했습니다.",
  },
  liszt: {
    composerFull: "Franz Liszt (1811-1886)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Franz_Liszt_by_Herman_Biow-_1843.png/250px-Franz_Liszt_by_Herman_Biow-_1843.png",
    period: "낭만주의",
    background: "프란츠 리스트는 1811년 헝가리에서 태어났습니다. 19세기 최고의 피아노 비르투오소로서 유럽 전역을 순회 연주했고, '피아노의 파가니니'라 불렸습니다. 작곡가로서도 교향시라는 장르를 개척했으며, 피아노 기법을 혁명적으로 확장했습니다. 만년에는 신부 서품을 받고 종교 음악에 헌신했습니다.",
    historicalContext: "낭만주의 음악이 절정에 달하던 19세기 중반, 비르투오소 연주자에 대한 대중적 열광이 최고조에 달했습니다. 리스트는 현대적 의미의 독주 리사이틀을 처음 만든 인물이기도 합니다.",
  },
  schumann: {
    composerFull: "Robert Schumann (1810-1856)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Robert_Schumann_1839.jpg/250px-Robert_Schumann_1839.jpg",
    period: "낭만주의",
    background: "로베르트 슈만은 1810년 독일 츠비카우에서 태어났습니다. 원래 피아니스트를 꿈꿨으나 손가락 부상으로 연주 활동을 포기하고 작곡과 음악 평론에 전념했습니다. 음악 잡지 '새 음악 시보(Neue Zeitschrift für Musik)'를 창간하여 쇼팽, 브람스 등 젊은 작곡가들을 소개했습니다. 피아니스트 클라라 비크와의 결혼(1840)은 음악사에서 가장 유명한 러브스토리 중 하나입니다. 말년에 정신 질환으로 고통받다 1856년 사망했습니다.",
    historicalContext: "1830-40년대 독일 낭만주의 운동의 중심에서 문학과 음악의 결합을 추구했습니다. 슈만은 문학적 교양이 깊었으며, 장 파울, E.T.A. 호프만 등 낭만주의 작가들의 영향을 받아 음악에 문학적 프로그램을 적극적으로 도입했습니다.",
  },
  bach: {
    composerFull: "Johann Sebastian Bach (1685-1750)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Johann_Sebastian_Bach.jpg/250px-Johann_Sebastian_Bach.jpg",
    period: "바로크",
    background: "요한 제바스티안 바흐는 1685년 독일 아이제나흐에서 음악가 집안에 태어났습니다. 교회 오르가니스트, 궁정 악장, 토마스 교회 칸토르 등을 역임하며 평생 방대한 양의 작품을 남겼습니다. 대위법의 최고 대가로, 바로크 음악을 집대성한 '음악의 아버지'로 불립니다. 평균율 클라비어곡집, 골드베르크 변주곡, 푸가의 기법 등은 서양 음악의 근간을 이루는 작품입니다.",
    historicalContext: "바로크 시대 후기(1700-1750)는 대위법 음악이 최고의 복잡성과 완성도에 도달한 시기입니다. 바흐는 독일 프로테스탄트 교회 음악의 전통 위에서 이탈리아와 프랑스 양식을 종합하여 독자적인 음악 세계를 구축했습니다.",
  },
  mozart: {
    composerFull: "Wolfgang Amadeus Mozart (1756-1791)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Croce-Mozart-Detail.jpg/250px-Croce-Mozart-Detail.jpg",
    period: "고전주의",
    background: "볼프강 아마데우스 모차르트는 1756년 오스트리아 잘츠부르크에서 태어났습니다. 음악사상 가장 위대한 신동으로, 5세에 작곡을 시작하고 6세에 유럽 궁정 순회 연주를 시작했습니다. 오페라, 교향곡, 협주곡, 실내악, 종교 음악 등 모든 장르에서 600곡 이상의 작품을 남겼습니다. 35세의 젊은 나이에 빈에서 사망했습니다.",
    historicalContext: "18세기 후반 빈 고전주의 음악의 황금기입니다. 계몽주의 사상이 확산되고 시민 사회가 성장하면서 음악의 대중화가 진행되었습니다. 모차르트는 하이든, 베토벤과 함께 빈 고전파 3대 거장으로 불립니다.",
  },
  brahms: {
    composerFull: "Johannes Brahms (1833-1897)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/JohannesBrahms.jpg/250px-JohannesBrahms.jpg",
    period: "낭만주의",
    background: "요하네스 브람스는 1833년 독일 함부르크에서 태어났습니다. 슈만에 의해 '음악의 미래를 이끌 젊은이'로 소개되어 일약 유명해졌습니다. 베토벤의 전통을 계승하면서도 낭만주의적 서정성을 결합한 독자적 양식을 구축했습니다. 교향곡, 협주곡, 실내악, 가곡 등에서 걸작을 남겼으며, 특히 4곡의 교향곡은 베토벤 이후 가장 중요한 교향곡으로 평가됩니다.",
    historicalContext: "19세기 후반 독일 음악계는 브람스를 중심으로 한 절대음악파와 바그너-리스트를 중심으로 한 신독일악파로 나뉘어 있었습니다. 브람스는 형식미와 고전적 전통을 중시하면서도 깊은 감정적 내용을 담아냈습니다.",
  },
  rachmaninoff: {
    composerFull: "Sergei Vasilievich Rachmaninoff (1873-1943)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Sergei_Rachmaninoff_cph.3a40575.jpg/250px-Sergei_Rachmaninoff_cph.3a40575.jpg",
    period: "후기 낭만주의",
    background: "세르게이 라흐마니노프는 1873년 러시아에서 태어났습니다. 피아니스트, 작곡가, 지휘자로 활동했으며, 20세기 최고의 피아니스트 중 한 명으로 꼽힙니다. 피아노 협주곡 2번과 3번은 피아노 협주곡 레퍼토리에서 가장 사랑받는 작품입니다. 1917년 러시아 혁명 이후 미국으로 망명하여 연주 활동에 전념했습니다.",
    historicalContext: "19세기 말~20세기 초 러시아 낭만주의 전통의 마지막 세대입니다. 차이코프스키의 영향을 받았으며, 현대 음악의 흐름과는 거리를 두고 후기 낭만주의 어법을 고수했습니다.",
  },
  tchaikovsky: {
    composerFull: "Pyotr Ilyich Tchaikovsky (1840-1893)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Portr%C3%A4t_des_Komponisten_Pjotr_I._Tschaikowski_%281840-1893%29.jpg/250px-Portr%C3%A4t_des_Komponisten_Pjotr_I._Tschaikowski_%281840-1893%29.jpg",
    period: "낭만주의",
    background: "표트르 일리치 차이코프스키는 1840년 러시아에서 태어났습니다. 러시아 음악을 세계적 수준으로 끌어올린 작곡가로, 교향곡, 협주곡, 오페라, 발레 음악 등에서 걸작을 남겼습니다. 특히 발레 음악 '백조의 호수', '잠자는 숲속의 미녀', '호두까기 인형'은 발레 역사상 가장 중요한 작품입니다. 피아노 협주곡 1번, 바이올린 협주곡도 널리 사랑받습니다.",
    historicalContext: "19세기 후반 러시아 음악의 황금기로, 러시아 5인조와 차이코프스키가 각각 민족주의적, 국제주의적 노선에서 러시아 음악의 정체성을 확립했습니다.",
  },
  ravel: {
    composerFull: "Maurice Ravel (1875-1937)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Maurice_Ravel_1925.jpg/250px-Maurice_Ravel_1925.jpg",
    period: "인상주의 / 신고전주의",
    background: "모리스 라벨은 1875년 프랑스 바스크 지방에서 태어났습니다. 파리 음악원에서 포레에게 사사했으며, 드뷔시와 함께 프랑스 인상주의 음악을 대표합니다. 정교한 관현악법과 완벽주의적 작곡 기법으로 유명하며, '오케스트라의 마법사'라 불립니다. 볼레로, 피아노 협주곡, 다프니스와 클로에 등이 대표작입니다.",
    historicalContext: "20세기 초 프랑스 음악은 인상주의에서 신고전주의로 전환되던 시기입니다. 라벨은 인상주의적 색채감과 고전적 형식미를 결합한 독자적 양식을 구축했습니다.",
  },
  schubert: {
    composerFull: "Franz Peter Schubert (1797-1828)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Franz_Schubert_by_Wilhelm_August_Rieder_1875.jpg/250px-Franz_Schubert_by_Wilhelm_August_Rieder_1875.jpg",
    period: "초기 낭만주의",
    background: "프란츠 슈베르트는 1797년 빈에서 태어났습니다. 31세의 짧은 생애 동안 600곡 이상의 가곡, 9곡의 교향곡, 다수의 피아노 소나타와 실내악을 남겼습니다. '가곡의 왕'으로 불리며, 독일 리트(Lied)를 예술 장르로 격상시켰습니다. 생전에는 크게 인정받지 못했으나 사후 높이 평가받았습니다.",
    historicalContext: "베토벤과 동시대를 살았던 슈베르트는 고전주의에서 낭만주의로의 전환기를 대표합니다. 비더마이어 시대 빈의 시민 문화 속에서 친밀한 살롱 음악의 전통을 발전시켰습니다.",
  },
  alkan: {
    composerFull: "Charles-Valentin Alkan (1813-1888)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Charles-Valentin_Alkan.jpg/250px-Charles-Valentin_Alkan.jpg",
    period: "낭만주의",
    background: "샤를 발랑탱 알캉은 1813년 파리에서 태어났습니다. 뛰어난 피아니스트이자 작곡가로, 쇼팽, 리스트와 동시대에 활동했습니다. 극도로 어렵고 독창적인 피아노 작품들로 유명하며, '피아노 문헌의 숨겨진 보물'로 불립니다. 은둔적 성격으로 생전에는 잘 알려지지 않았으나, 20세기 후반부터 재평가되고 있습니다.",
    historicalContext: "19세기 파리는 피아노 비르투오소의 황금시대였습니다. 알캉은 쇼팽, 리스트와 함께 최고의 피아니스트로 인정받았으나, 점차 공개 연주를 피하고 은둔 생활을 했습니다.",
  },
  scriabin: {
    composerFull: "Alexander Nikolayevich Scriabin (1872-1915)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Alexander_Scriabin.jpg/250px-Alexander_Scriabin.jpg",
    period: "후기 낭만주의 / 신비주의",
    background: "알렉산더 스크랴빈은 1872년 모스크바에서 태어났습니다. 초기에는 쇼팽의 영향을 받았으나, 점차 독자적인 화성 체계를 발전시켜 '신비 화음'을 개발했습니다. 철학과 신비주의에 깊이 심취했으며, 음악을 통한 정신적 변용을 추구했습니다.",
    historicalContext: "19세기 말~20세기 초 러시아 음악계에서 스크랴빈은 라흐마니노프와 함께 중요한 위치를 차지했습니다. 신지학 등 당대의 신비주의 사상에 영향받았습니다.",
  },
  prokofiev: {
    composerFull: "Sergei Sergeyevich Prokofiev (1891-1953)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Sergei_Prokofiev_circa_1918_over_Chair_Bain.jpg/250px-Sergei_Prokofiev_circa_1918_over_Chair_Bain.jpg",
    period: "20세기 / 신고전주의",
    background: "세르게이 프로코피예프는 1891년 우크라이나에서 태어났습니다. 현대 음악사에서 가장 중요한 작곡가 중 한 명으로, 피아노 협주곡, 교향곡, 오페라, 발레 음악 등 다양한 장르에서 걸작을 남겼습니다. 독특한 화성과 리듬, 그리고 날카롭고 기계적인 음색이 특징입니다.",
    historicalContext: "러시아 혁명 이후 해외에서 활동하다 1936년 소련으로 귀국했습니다. 사회주의 리얼리즘의 압박 속에서도 독자적 양식을 유지하려 노력했습니다.",
  },
  mendelssohn: {
    composerFull: "Felix Mendelssohn Bartholdy (1809-1847)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Felix_Mendelssohn_Bartholdy.jpg/250px-Felix_Mendelssohn_Bartholdy.jpg",
    period: "낭만주의",
    background: "펠릭스 멘델스존은 1809년 함부르크에서 태어났습니다. 유복한 은행가 집안에서 최고의 교육을 받았으며, 어린 시절부터 천재적 재능을 보였습니다. 17세에 작곡한 '한여름 밤의 꿈' 서곡은 낭만주의 관현악의 걸작입니다. 바흐 음악의 부흥에도 크게 기여했습니다.",
    historicalContext: "19세기 전반 독일 낭만주의 음악의 황금기에 활동했습니다. 라이프치히 게반트하우스 오케스트라를 지휘하며 독일 음악 생활의 중심 인물로 활동했습니다.",
  },
  haydn: {
    composerFull: "Franz Joseph Haydn (1732-1809)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Joseph_Haydn.jpg/250px-Joseph_Haydn.jpg",
    period: "고전주의",
    background: "요제프 하이든은 1732년 오스트리아에서 태어났습니다. '교향곡의 아버지', '현악 4중주의 아버지'로 불리며, 고전주의 형식을 확립한 작곡가입니다. 에스테르하지 가문에서 30년간 악장으로 봉직하며 104곡의 교향곡을 비롯한 방대한 작품을 남겼습니다.",
    historicalContext: "18세기 후반 빈 고전주의 양식의 확립기입니다. 하이든은 소나타 형식, 교향곡, 현악 4중주의 형식적 틀을 만들어 모차르트와 베토벤에게 영향을 주었습니다.",
  },
  grieg: {
    composerFull: "Edvard Hagerup Grieg (1843-1907)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Edvard_Grieg_%281888%29_by_Elliot_and_Fry_-_02.jpg/250px-Edvard_Grieg_%281888%29_by_Elliot_and_Fry_-_02.jpg",
    period: "낭만주의 / 민족주의",
    background: "에드바르 그리그는 1843년 노르웨이 베르겐에서 태어났습니다. 노르웨이 민족 음악의 대표적 작곡가로, 피아노 협주곡 a단조와 '페르 귄트' 모음곡으로 세계적 명성을 얻었습니다. 노르웨이 민요와 춤곡의 요소를 서양 클래식 음악과 결합했습니다.",
    historicalContext: "19세기 후반 유럽 각지에서 민족주의 음악 운동이 일어났습니다. 그리그는 노르웨이 음악의 정체성을 확립한 가장 중요한 작곡가입니다.",
  },
  satie: {
    composerFull: "Erik Alfred Leslie Satie (1866-1925)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Erik_Satie_en_1909.jpg/250px-Erik_Satie_en_1909.jpg",
    period: "근대",
    background: "에릭 사티는 1866년 프랑스에서 태어났습니다. 독창적이고 실험적인 작곡가로, 미니멀리즘과 앰비언트 음악의 선구자로 평가됩니다. '짐노페디', '그노시엔느' 등 명상적이고 단순한 피아노 작품으로 유명합니다. 드뷔시와 라벨에게 영향을 주었습니다.",
    historicalContext: "19세기 말~20세기 초 파리의 아방가르드 예술계에서 활동했습니다. 기존 음악계의 관습을 거부하고 '가구 음악' 같은 혁신적 개념을 제시했습니다.",
  },
  czerny: {
    composerFull: "Carl Czerny (1791-1857)",
    composerImage: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Carl_Czerny.jpg/250px-Carl_Czerny.jpg",
    period: "고전주의 / 초기 낭만주의",
    background: "카를 체르니는 1791년 빈에서 태어났습니다. 베토벤의 제자이자 리스트의 스승으로, 피아노 교육학의 아버지로 불립니다. 1,000곡 이상의 작품을 남겼으며, 특히 피아노 연습곡집은 전 세계 피아노 학습자들에게 필수적인 교재로 사용되고 있습니다.",
    historicalContext: "베토벤 시대의 빈에서 최고의 피아노 교육자로 활동했습니다. 그의 연습곡은 피아노 테크닉 발전의 체계적 방법론을 제시했습니다.",
  },
  burgmuller: {
    composerFull: "Johann Friedrich Franz Burgmüller (1806-1874)",
    composerImage: "",
    period: "낭만주의",
    background: "요한 프리드리히 프란츠 부르크뮐러는 1806년 독일 레겐스부르크에서 태어났습니다. 피아노 교육용 작품으로 유명하며, 특히 '25개의 쉬운 연습곡 Op.100'은 전 세계 피아노 입문자들에게 사랑받는 교재입니다.",
    historicalContext: "19세기 중반 파리의 살롱 문화와 시민 음악 교육의 확대 시기에 활동했습니다.",
  },
  // Baroque Era (1600-1750)
  handel: {
    composerFull: "George Frideric Handel (1685-1759)",
    period: "바로크",
    background: "게오르크 프리드리히 헨델은 독일 태생의 영국 작곡가로, 오페라와 오라토리오의 대가입니다. '메시아'는 가장 유명한 오라토리오 중 하나입니다.",
    historicalContext: "바로크 시대 후기 영국에서 활동하며 영국 음악 발전에 크게 기여했습니다.",
  },
  vivaldi: {
    composerFull: "Antonio Lucio Vivaldi (1678-1741)",
    period: "바로크",
    background: "안토니오 비발디는 이탈리아의 작곡가이자 바이올리니스트로, '사계'로 가장 잘 알려져 있습니다. 500곡 이상의 협주곡을 작곡했습니다.",
    historicalContext: "바로크 시대 베네치아에서 활동하며 협주곡 형식의 발전에 크게 기여했습니다.",
  },
  dscarlatti: {
    composerFull: "Domenico Scarlatti (1685-1757)",
    period: "바로크",
    background: "도메니코 스카를라티는 이탈리아 작곡가로, 555곡의 건반 소나타로 유명합니다. 혁신적인 건반 기법을 개발했습니다.",
    historicalContext: "바로크 후기 이탈리아와 스페인, 포르투갈 궁정에서 활동했습니다.",
  },
  monteverdi: {
    composerFull: "Claudio Giovanni Antonio Monteverdi (1567-1643)",
    period: "초기 바로크",
    background: "클라우디오 몬테베르디는 르네상스에서 바로크로의 전환기를 대표하는 이탈리아 작곡가입니다. 오페라의 아버지로 불립니다.",
    historicalContext: "르네상스에서 바로크로 전환되는 음악사의 중요한 시기에 활동했습니다.",
  },
  corelli: {
    composerFull: "Arcangelo Corelli (1653-1713)",
    period: "바로크",
    background: "아르칸젤로 코렐리는 이탈리아의 바이올리니스트이자 작곡가로, 바로크 바이올린 음악의 기초를 확립했습니다.",
    historicalContext: "바로크 시대 로마에서 활동하며 합주 협주곡 형식을 발전시켰습니다.",
  },
  purcell: {
    composerFull: "Henry Purcell (1659-1695)",
    period: "바로크",
    background: "헨리 퍼셀은 영국 바로크 시대의 가장 위대한 작곡가로, 오페라 '디도와 에네아스'가 대표작입니다.",
    historicalContext: "영국 왕정복고 시대에 활동하며 영국 음악의 정체성을 확립했습니다.",
  },
  rameau: {
    composerFull: "Jean-Philippe Rameau (1683-1764)",
    period: "바로크",
    background: "장필리프 라모는 프랑스 바로크 음악의 거장으로, 음악 이론가이자 오페라 작곡가입니다.",
    historicalContext: "프랑스 바로크 시대 파리에서 활동하며 화성학 이론을 체계화했습니다.",
  },
  couperin: {
    composerFull: "François Couperin (1668-1733)",
    period: "바로크",
    background: "프랑수아 쿠프랭은 프랑스 건반 음악의 대가로, '클라브생 연주법'을 저술했습니다.",
    historicalContext: "프랑스 바로크 시대 베르사유 궁정에서 활동했습니다.",
  },
  telemann: {
    composerFull: "Georg Philipp Telemann (1681-1767)",
    period: "바로크",
    background: "게오르크 필리프 텔레만은 바로크 시대 가장 다작한 작곡가 중 한 명으로, 3,000곡 이상을 작곡했습니다.",
    historicalContext: "바로크 후기 독일에서 가장 유명한 작곡가로 바흐보다 더 인정받았습니다.",
  },
  marais: {
    composerFull: "Marin Marais (1656-1728)",
    period: "바로크",
    background: "마랭 마레는 프랑스의 비올라 다 감바 연주자이자 작곡가로, 비올 음악의 대가입니다.",
    historicalContext: "루이 14세 시대 프랑스 궁정에서 활동했습니다.",
  },
  ascarlatti: {
    composerFull: "Alessandro Scarlatti (1660-1725)",
    period: "바로크",
    background: "알레산드로 스카를라티는 이탈리아 오페라의 아버지로 불리며, 도메니코 스카를라티의 아버지입니다.",
    historicalContext: "바로크 시대 나폴리 오페라 학파의 창시자입니다.",
  },
  lully: {
    composerFull: "Jean-Baptiste Lully (1632-1687)",
    period: "바로크",
    background: "장바티스트 륄리는 이탈리아 태생의 프랑스 작곡가로, 프랑스 오페라를 확립했습니다.",
    historicalContext: "루이 14세 시대 프랑스 궁정 음악을 지배했습니다.",
  },
  buxtehude: {
    composerFull: "Dietrich Buxtehude (1637-1707)",
    period: "바로크",
    background: "디트리히 북스테후데는 독일-덴마크 오르간 작곡가로, 바흐에게 큰 영향을 주었습니다.",
    historicalContext: "북독일 바로크 오르간 음악의 대표적 작곡가입니다.",
  },
  zelenka: {
    composerFull: "Jan Dismas Zelenka (1679-1745)",
    period: "바로크",
    background: "얀 디스마스 젤렌카는 보헤미아 출신 작곡가로, 독창적인 종교 음악으로 유명합니다.",
    historicalContext: "드레스덴 궁정에서 활동한 후기 바로크 작곡가입니다.",
  },
  pergolesi: {
    composerFull: "Giovanni Battista Pergolesi (1710-1736)",
    period: "바로크",
    background: "조반니 바티스타 페르골레시는 26세에 요절한 이탈리아 작곡가로, '스타바트 마테르'가 유명합니다.",
    historicalContext: "바로크 후기 나폴리에서 활동했습니다.",
  },
  strozzi: {
    composerFull: "Barbara Strozzi (1619-1677)",
    period: "바로크",
    background: "바르바라 스트로치는 바로크 시대의 이탈리아 여성 작곡가로, 세속 성악곡을 많이 작곡했습니다.",
    historicalContext: "17세기 베네치아에서 활동한 뛰어난 여성 작곡가입니다.",
  },
  jacquet: {
    composerFull: "Elisabeth Jacquet de La Guerre (1665-1729)",
    period: "바로크",
    background: "엘리자베트 자케 드 라 게르는 프랑스 바로크 시대의 여성 작곡가이자 하프시코드 연주자입니다.",
    historicalContext: "루이 14세 궁정에서 활동한 여성 음악가입니다.",
  },
  tartini: {
    composerFull: "Giuseppe Tartini (1692-1770)",
    period: "바로크",
    background: "주세페 타르티니는 이탈리아 바이올리니스트이자 작곡가로, '악마의 트릴'로 유명합니다.",
    historicalContext: "바로크 후기 이탈리아 바이올린 학파의 중요한 인물입니다.",
  },
  geminiani: {
    composerFull: "Francesco Geminiani (1687-1762)",
    period: "바로크",
    background: "프란체스코 제미니아니는 이탈리아 바이올리니스트이자 작곡가로, 코렐리의 제자입니다.",
    historicalContext: "바로크 시대 런던에서 활동한 이탈리아 작곡가입니다.",
  },
  locatelli: {
    composerFull: "Pietro Antonio Locatelli (1695-1764)",
    period: "바로크",
    background: "피에트로 로카텔리는 이탈리아 바이올린 비르투오소로, 기교적인 바이올린 작품으로 유명합니다.",
    historicalContext: "바로크 시대 암스테르담에서 활동했습니다.",
  },
  pachelbel: {
    composerFull: "Johann Pachelbel (1653-1706)",
    period: "바로크",
    background: "요한 파헬벨은 독일 작곡가로, '캐논 D장조'로 가장 잘 알려져 있습니다.",
    historicalContext: "바로크 시대 독일 오르간 음악의 중요한 작곡가입니다.",
  },
  frescobaldi: {
    composerFull: "Girolamo Frescobaldi (1583-1643)",
    period: "초기 바로크",
    background: "지롤라모 프레스코발디는 이탈리아 건반 음악의 선구자로, 바로크 건반 양식을 확립했습니다.",
    historicalContext: "로마 성 베드로 대성당의 오르간 연주자로 활동했습니다.",
  },
  charpentier: {
    composerFull: "Marc-Antoine Charpentier (1643-1704)",
    period: "바로크",
    background: "마르크앙투안 샤르팡티에는 프랑스 바로크 작곡가로, 종교 음악과 오페라로 유명합니다.",
    historicalContext: "륄리와 동시대에 프랑스에서 활동했습니다.",
  },
  albinoni: {
    composerFull: "Tomaso Giovanni Albinoni (1671-1751)",
    period: "바로크",
    background: "토마소 알비노니는 이탈리아 바로크 작곡가로, 협주곡과 오페라를 작곡했습니다.",
    historicalContext: "바로크 시대 베네치아에서 활동했습니다.",
  },
  // Classical Era (1750-1820)
  gluck: {
    composerFull: "Christoph Willibald Gluck (1714-1787)",
    period: "고전주의",
    background: "크리스토프 빌리발트 글루크는 오페라 개혁을 이끈 독일 작곡가입니다.",
    historicalContext: "고전주의 시대 오페라의 형식을 혁신했습니다.",
  },
  clementi: {
    composerFull: "Muzio Clementi (1752-1832)",
    period: "고전주의",
    background: "무치오 클레멘티는 이탈리아 피아니스트이자 작곡가로, '피아노의 아버지'로 불립니다.",
    historicalContext: "피아노 교육학과 피아노 제작에 큰 기여를 했습니다.",
  },
  hummel: {
    composerFull: "Johann Nepomuk Hummel (1778-1837)",
    period: "고전주의",
    background: "요한 네포무크 훔멜은 모차르트의 제자로, 고전주의와 낭만주의를 잇는 작곡가입니다.",
    historicalContext: "베토벤과 동시대에 활동한 중요한 피아니스트 겸 작곡가입니다.",
  },
  cpebach: {
    composerFull: "Carl Philipp Emanuel Bach (1714-1788)",
    period: "고전주의",
    background: "칼 필리프 에마누엘 바흐는 J.S. 바흐의 아들로, 감정 과다 양식의 대표 작곡가입니다.",
    historicalContext: "바로크에서 고전주의로의 전환기를 대표합니다.",
  },
  jcbach: {
    composerFull: "Johann Christian Bach (1735-1782)",
    period: "고전주의",
    background: "요한 크리스티안 바흐는 J.S. 바흐의 막내아들로, '런던의 바흐'로 불립니다. 모차르트에게 큰 영향을 주었습니다.",
    historicalContext: "런던에서 활동하며 고전주의 양식 발전에 기여했습니다.",
  },
  boccherini: {
    composerFull: "Luigi Boccherini (1743-1805)",
    period: "고전주의",
    background: "루이지 보케리니는 이탈리아 첼리스트이자 작곡가로, 실내악 작품으로 유명합니다.",
    historicalContext: "고전주의 시대 스페인 궁정에서 활동했습니다.",
  },
  weber: {
    composerFull: "Carl Maria von Weber (1786-1826)",
    period: "초기 낭만주의",
    background: "카를 마리아 폰 베버는 독일 낭만주의 오페라의 선구자로, '마탄의 사수'가 대표작입니다.",
    historicalContext: "독일 민족주의 오페라의 기초를 확립했습니다.",
  },
  cimarosa: {
    composerFull: "Domenico Cimarosa (1749-1801)",
    period: "고전주의",
    background: "도메니코 치마로사는 이탈리아 오페라 작곡가로, '비밀 결혼'이 대표작입니다.",
    historicalContext: "고전주의 시대 이탈리아 오페라 부파의 대가입니다.",
  },
  salieri: {
    composerFull: "Antonio Salieri (1750-1825)",
    period: "고전주의",
    background: "안토니오 살리에리는 이탈리아 작곡가로, 빈 궁정악장을 역임했습니다. 베토벤, 슈베르트의 스승입니다.",
    historicalContext: "빈 고전주의 시대의 중요한 작곡가이자 교육자입니다.",
  },
  paradis: {
    composerFull: "Maria Theresia von Paradis (1759-1824)",
    period: "고전주의",
    background: "마리아 테레지아 폰 파라디스는 오스트리아의 시각장애인 작곡가이자 피아니스트입니다.",
    historicalContext: "고전주의 시대 빈에서 활동한 여성 음악가입니다.",
  },
  saintgeorges: {
    composerFull: "Joseph Bologne, Chevalier de Saint-Georges (1745-1799)",
    period: "고전주의",
    background: "조제프 볼로뉴는 프랑스의 작곡가, 바이올리니스트, 검객으로, '흑인 모차르트'로 불렸습니다.",
    historicalContext: "프랑스 혁명기에 활동한 다재다능한 음악가입니다.",
  },
  dussek: {
    composerFull: "Jan Ladislav Dussek (1760-1812)",
    period: "고전주의",
    background: "얀 라디슬라프 두셰크는 보헤미아 출신 피아니스트이자 작곡가로, 낭만적 피아노 양식을 선도했습니다.",
    historicalContext: "고전주의에서 낭만주의로의 전환기를 대표합니다.",
  },
  ries: {
    composerFull: "Ferdinand Ries (1784-1838)",
    period: "고전주의",
    background: "페르디난트 리스는 베토벤의 제자이자 비서로, 피아노 협주곡으로 유명합니다.",
    historicalContext: "베토벤의 가장 가까운 제자 중 한 명입니다.",
  },
  stamitz: {
    composerFull: "Johann Stamitz (1717-1757)",
    period: "고전주의",
    background: "요한 슈타미츠는 만하임 악파의 창시자로, 교향곡 발전에 크게 기여했습니다.",
    historicalContext: "만하임 궁정에서 오케스트라의 혁신을 이끌었습니다.",
  },
  lmozart: {
    composerFull: "Leopold Mozart (1719-1787)",
    period: "고전주의",
    background: "레오폴트 모차르트는 볼프강 모차르트의 아버지이자 바이올린 교육서를 저술한 작곡가입니다.",
    historicalContext: "잘츠부르크 궁정에서 활동했습니다.",
  },
  paisiello: {
    composerFull: "Giovanni Paisiello (1740-1816)",
    period: "고전주의",
    background: "조반니 파이지엘로는 이탈리아 오페라 작곡가로, 100편 이상의 오페라를 작곡했습니다.",
    historicalContext: "나폴리 오페라 학파의 중요한 작곡가입니다.",
  },
  mhaydn: {
    composerFull: "Michael Haydn (1737-1806)",
    period: "고전주의",
    background: "미하엘 하이든은 요제프 하이든의 동생으로, 종교 음악으로 유명합니다.",
    historicalContext: "잘츠부르크에서 활동한 작곡가입니다.",
  },
  mehul: {
    composerFull: "Étienne Méhul (1763-1817)",
    period: "고전주의",
    background: "에티엔 메율은 프랑스 작곡가로, 프랑스 오페라의 발전에 기여했습니다.",
    historicalContext: "프랑스 혁명기와 나폴레옹 시대에 활동했습니다.",
  },
  pleyel: {
    composerFull: "Ignaz Pleyel (1757-1831)",
    period: "고전주의",
    background: "이냐츠 플레이엘은 오스트리아 작곡가이자 피아노 제작자로, 플레이엘 피아노를 창립했습니다.",
    historicalContext: "하이든의 제자로 파리에서 활동했습니다.",
  },
  gretry: {
    composerFull: "André Grétry (1741-1813)",
    period: "고전주의",
    background: "앙드레 그레트리는 벨기에 태생의 프랑스 오페라 작곡가입니다.",
    historicalContext: "프랑스 오페라 코미크의 대표적 작곡가입니다.",
  },
  boyce: {
    composerFull: "William Boyce (1711-1779)",
    period: "바로크/고전주의",
    background: "윌리엄 보이스는 영국 작곡가로, 교향곡과 교회 음악으로 유명합니다.",
    historicalContext: "영국 바로크에서 고전주의로의 전환기를 대표합니다.",
  },
  giuliani: {
    composerFull: "Mauro Giuliani (1781-1829)",
    period: "고전주의",
    background: "마우로 줄리아니는 이탈리아 기타 비르투오소이자 작곡가로, 클래식 기타 레퍼토리를 확립했습니다.",
    historicalContext: "빈에서 활동한 기타의 거장입니다.",
  },
  // Romantic Era (1820-1900)
  wagner: {
    composerFull: "Richard Wagner (1813-1883)",
    period: "낭만주의",
    background: "리하르트 바그너는 독일 오페라 작곡가로, '총체 예술' 개념과 무한 선율을 발전시켰습니다.",
    historicalContext: "19세기 후반 독일 음악계에 지대한 영향을 미쳤습니다.",
  },
  verdi: {
    composerFull: "Giuseppe Fortunino Francesco Verdi (1813-1901)",
    period: "낭만주의",
    background: "주세페 베르디는 이탈리아 오페라의 거장으로, '라 트라비아타', '아이다' 등이 대표작입니다.",
    historicalContext: "이탈리아 통일 운동의 상징적 인물이었습니다.",
  },
  puccini: {
    composerFull: "Giacomo Antonio Domenico Michele Secondo Maria Puccini (1858-1924)",
    period: "낭만주의/베리스모",
    background: "자코모 푸치니는 이탈리아 오페라 작곡가로, '라 보엠', '토스카', '나비 부인' 등이 대표작입니다.",
    historicalContext: "베리스모 오페라의 대표적 작곡가입니다.",
  },
  dvorak: {
    composerFull: "Antonín Leopold Dvořák (1841-1904)",
    period: "낭만주의",
    background: "안토닌 드보르작은 체코 작곡가로, '신세계 교향곡'과 첼로 협주곡으로 유명합니다.",
    historicalContext: "체코 민족주의 음악의 대표적 작곡가입니다.",
  },
  saintsaens: {
    composerFull: "Charles-Camille Saint-Saëns (1835-1921)",
    period: "낭만주의",
    background: "카미유 생상스는 프랑스 작곡가로, '동물의 사육제', 오르간 교향곡 등이 대표작입니다.",
    historicalContext: "19세기 후반 프랑스 음악계의 중심 인물입니다.",
  },
  berlioz: {
    composerFull: "Louis-Hector Berlioz (1803-1869)",
    period: "낭만주의",
    background: "엑토르 베를리오즈는 프랑스 낭만주의 작곡가로, '환상 교향곡'이 대표작입니다.",
    historicalContext: "관현악법의 혁신가로 불립니다.",
  },
  mussorgsky: {
    composerFull: "Modest Petrovich Mussorgsky (1839-1881)",
    period: "낭만주의",
    background: "모데스트 무소륵스키는 러시아 5인조의 일원으로, '전람회의 그림'이 대표작입니다.",
    historicalContext: "러시아 민족주의 음악의 대표적 작곡가입니다.",
  },
  rimskykorsakov: {
    composerFull: "Nikolai Andreyevich Rimsky-Korsakov (1844-1908)",
    period: "낭만주의",
    background: "니콜라이 림스키코르사코프는 러시아 작곡가로, 화려한 관현악법으로 유명합니다.",
    historicalContext: "러시아 5인조의 일원으로 러시아 음악 발전에 기여했습니다.",
  },
  faure: {
    composerFull: "Gabriel Urbain Fauré (1845-1924)",
    period: "낭만주의/인상주의",
    background: "가브리엘 포레는 프랑스 작곡가로, 레퀴엠과 가곡으로 유명합니다.",
    historicalContext: "프랑스 낭만주의에서 인상주의로의 전환기를 대표합니다.",
  },
  mahler: {
    composerFull: "Gustav Mahler (1860-1911)",
    period: "후기 낭만주의",
    background: "구스타프 말러는 오스트리아 작곡가이자 지휘자로, 10곡의 교향곡이 대표작입니다.",
    historicalContext: "후기 낭만주의 교향곡의 정점을 이루었습니다.",
  },
  rstrauss: {
    composerFull: "Richard Georg Strauss (1864-1949)",
    period: "후기 낭만주의",
    background: "리하르트 슈트라우스는 독일 작곡가로, 교향시와 오페라로 유명합니다.",
    historicalContext: "후기 낭만주의의 마지막 대가 중 한 명입니다.",
  },
  claraschumann: {
    composerFull: "Clara Josephine Schumann (1819-1896)",
    period: "낭만주의",
    background: "클라라 슈만은 독일의 피아니스트이자 작곡가로, 로베르트 슈만의 아내입니다.",
    historicalContext: "19세기 가장 뛰어난 여성 피아니스트 중 한 명입니다.",
  },
  fannymendelssohn: {
    composerFull: "Fanny Mendelssohn Hensel (1805-1847)",
    period: "낭만주의",
    background: "파니 멘델스존은 독일의 피아니스트이자 작곡가로, 펠릭스 멘델스존의 누나입니다.",
    historicalContext: "당시 여성으로서 작곡 활동에 제약을 받았으나 뛰어난 작품을 남겼습니다.",
  },
  thalberg: {
    composerFull: "Sigismond Thalberg (1812-1871)",
    period: "낭만주의",
    background: "지기스몬트 탈베르크는 스위스 피아니스트이자 작곡가로, 리스트의 라이벌이었습니다.",
    historicalContext: "19세기 가장 뛰어난 피아노 비르투오소 중 한 명입니다.",
  },
  moszkowski: {
    composerFull: "Moritz Moszkowski (1854-1925)",
    period: "낭만주의",
    background: "모리츠 모슈코프스키는 폴란드-독일 작곡가로, 피아노 작품과 연습곡으로 유명합니다.",
    historicalContext: "19세기 후반 파리에서 활동한 피아니스트입니다.",
  },
  gottschalk: {
    composerFull: "Louis Moreau Gottschalk (1829-1869)",
    period: "낭만주의",
    background: "루이 모로 고트샬크는 미국 최초의 국제적 피아니스트이자 작곡가입니다.",
    historicalContext: "미국 음악과 크리올 음악을 클래식에 도입했습니다.",
  },
  arubinstein: {
    composerFull: "Anton Grigoryevich Rubinstein (1829-1894)",
    period: "낭만주의",
    background: "안톤 루빈스타인은 러시아 피아니스트이자 작곡가로, 상트페테르부르크 음악원을 설립했습니다.",
    historicalContext: "러시아 클래식 음악 교육의 기초를 닦았습니다.",
  },
  bulow: {
    composerFull: "Hans Guido von Bülow (1830-1894)",
    period: "낭만주의",
    background: "한스 폰 뷜로는 독일 지휘자이자 피아니스트로, 바그너와 브람스를 옹호했습니다.",
    historicalContext: "현대적 지휘법의 선구자입니다.",
  },
  smetana: {
    composerFull: "Bedřich Smetana (1824-1884)",
    period: "낭만주의",
    background: "베드르지흐 스메타나는 체코 음악의 아버지로, '나의 조국'이 대표작입니다.",
    historicalContext: "체코 민족주의 음악을 확립했습니다.",
  },
  albeniz: {
    composerFull: "Isaac Manuel Francisco Albéniz (1860-1909)",
    period: "낭만주의",
    background: "이삭 알베니스는 스페인 작곡가로, 피아노 모음곡 '이베리아'가 대표작입니다.",
    historicalContext: "스페인 민족주의 음악의 대표적 작곡가입니다.",
  },
  granados: {
    composerFull: "Enrique Granados y Campiña (1867-1916)",
    period: "낭만주의",
    background: "엔리케 그라나도스는 스페인 작곡가로, '고예스카스'가 대표작입니다.",
    historicalContext: "알베니스와 함께 스페인 민족주의 음악을 이끌었습니다.",
  },
  wolf: {
    composerFull: "Hugo Philipp Jakob Wolf (1860-1903)",
    period: "낭만주의",
    background: "후고 볼프는 오스트리아 작곡가로, 독일 리트의 대가입니다.",
    historicalContext: "슈베르트 이후 가장 중요한 가곡 작곡가로 평가됩니다.",
  },
  bruch: {
    composerFull: "Max Christian Friedrich Bruch (1838-1920)",
    period: "낭만주의",
    background: "막스 브루흐는 독일 작곡가로, 바이올린 협주곡 1번으로 유명합니다.",
    historicalContext: "19세기 후반 독일에서 활동한 작곡가입니다.",
  },
  franck: {
    composerFull: "César-Auguste-Jean-Guillaume-Hubert Franck (1822-1890)",
    period: "낭만주의",
    background: "세자르 프랑크는 벨기에 태생의 프랑스 작곡가로, 오르간 음악과 교향곡으로 유명합니다.",
    historicalContext: "프랑스 기악 음악 부흥의 중심 인물입니다.",
  },
  bizet: {
    composerFull: "Georges Alexandre César Léopold Bizet (1838-1875)",
    period: "낭만주의",
    background: "조르주 비제는 프랑스 작곡가로, 오페라 '카르멘'이 대표작입니다.",
    historicalContext: "프랑스 오페라의 걸작을 남겼습니다.",
  },
  // Modern & Contemporary Era (1900-Present)
  stravinsky: {
    composerFull: "Igor Fyodorovich Stravinsky (1882-1971)",
    period: "20세기",
    background: "이고르 스트라빈스키는 러시아 태생 작곡가로, '봄의 제전'이 대표작입니다.",
    historicalContext: "20세기 음악의 혁명을 이끈 작곡가입니다.",
  },
  schoenberg: {
    composerFull: "Arnold Franz Walter Schönberg (1874-1951)",
    period: "20세기",
    background: "아르놀트 쇤베르크는 오스트리아 작곡가로, 12음 기법을 창시했습니다.",
    historicalContext: "제2 빈 악파의 창시자입니다.",
  },
  bartok: {
    composerFull: "Béla Viktor János Bartók (1881-1945)",
    period: "20세기",
    background: "벨러 버르토크는 헝가리 작곡가로, 민족 음악학과 현대 음악을 결합했습니다.",
    historicalContext: "동유럽 민속 음악 연구의 선구자입니다.",
  },
  shostakovich: {
    composerFull: "Dmitri Dmitriyevich Shostakovich (1906-1975)",
    period: "20세기",
    background: "드미트리 쇼스타코비치는 소련 작곡가로, 15곡의 교향곡과 현악 4중주로 유명합니다.",
    historicalContext: "소련 체제 하에서 예술적 자유와 갈등하며 작품 활동을 했습니다.",
  },
  berg: {
    composerFull: "Alban Maria Johannes Berg (1885-1935)",
    period: "20세기",
    background: "알반 베르크는 오스트리아 작곡가로, 쇤베르크의 제자입니다. 오페라 '보체크'가 대표작입니다.",
    historicalContext: "제2 빈 악파의 일원입니다.",
  },
  webern: {
    composerFull: "Anton Friedrich Wilhelm von Webern (1883-1945)",
    period: "20세기",
    background: "안톤 베베른은 오스트리아 작곡가로, 극도로 응축된 작품으로 유명합니다.",
    historicalContext: "제2 빈 악파의 일원으로 점묘주의 양식을 발전시켰습니다.",
  },
  messiaen: {
    composerFull: "Olivier Eugène Prosper Charles Messiaen (1908-1992)",
    period: "20세기",
    background: "올리비에 메시앙은 프랑스 작곡가로, 새소리와 종교적 신비주의를 음악에 도입했습니다.",
    historicalContext: "20세기 후반 프랑스 음악의 거장입니다.",
  },
  britten: {
    composerFull: "Edward Benjamin Britten (1913-1976)",
    period: "20세기",
    background: "벤저민 브리튼은 영국 작곡가로, '피터 그라임스' 등 오페라로 유명합니다.",
    historicalContext: "20세기 영국 음악의 대표적 작곡가입니다.",
  },
  copland: {
    composerFull: "Aaron Copland (1900-1990)",
    period: "20세기",
    background: "애런 코플랜드는 미국 작곡가로, '애팔래치아의 봄' 등으로 미국적 클래식을 확립했습니다.",
    historicalContext: "미국 클래식 음악의 정체성을 확립한 작곡가입니다.",
  },
  gershwin: {
    composerFull: "George Gershwin (1898-1937)",
    period: "20세기",
    background: "조지 거슈윈은 미국 작곡가로, '랩소디 인 블루'로 재즈와 클래식을 결합했습니다.",
    historicalContext: "미국 음악의 상징적 작곡가입니다.",
  },
  ives: {
    composerFull: "Charles Edward Ives (1874-1954)",
    period: "20세기",
    background: "찰스 아이브스는 미국 모더니즘의 선구자로, 실험적 기법을 개척했습니다.",
    historicalContext: "미국 아방가르드 음악의 아버지로 불립니다.",
  },
  szymanowski: {
    composerFull: "Karol Maciej Szymanowski (1882-1937)",
    period: "20세기",
    background: "카롤 시마노프스키는 폴란드 작곡가로, 인상주의와 민족주의를 결합했습니다.",
    historicalContext: "20세기 폴란드 음악의 가장 중요한 작곡가입니다.",
  },
  defalla: {
    composerFull: "Manuel de Falla y Matheu (1876-1946)",
    period: "20세기",
    background: "마누엘 데 파야는 스페인 작곡가로, 스페인 민속 음악을 현대 음악에 도입했습니다.",
    historicalContext: "스페인 민족주의 음악의 완성자입니다.",
  },
  lboulanger: {
    composerFull: "Lili Boulanger (1893-1918)",
    period: "20세기",
    background: "릴리 불랑제는 프랑스 작곡가로, 로마 대상을 수상한 최초의 여성입니다.",
    historicalContext: "24세에 요절했으나 뛰어난 작품을 남겼습니다.",
  },
  nboulanger: {
    composerFull: "Nadia Juliette Boulanger (1887-1979)",
    period: "20세기",
    background: "나디아 불랑제는 프랑스의 작곡가이자 음악 교육자로, 20세기 가장 영향력 있는 음악 교육자입니다.",
    historicalContext: "코플랜드, 피아졸라 등 수많은 작곡가를 가르쳤습니다.",
  },
  poulenc: {
    composerFull: "Francis Jean Marcel Poulenc (1899-1963)",
    period: "20세기",
    background: "프란시스 풀랑크는 프랑스 작곡가로, 프랑스 6인조의 일원입니다.",
    historicalContext: "신고전주의와 프랑스 전통을 결합했습니다.",
  },
  milhaud: {
    composerFull: "Darius Milhaud (1892-1974)",
    period: "20세기",
    background: "다리우스 미요는 프랑스 작곡가로, 다조성과 재즈 요소를 활용했습니다.",
    historicalContext: "프랑스 6인조의 일원입니다.",
  },
  hindemith: {
    composerFull: "Paul Hindemith (1895-1963)",
    period: "20세기",
    background: "파울 힌데미트는 독일 작곡가로, 신고전주의의 대표적 인물입니다.",
    historicalContext: "실용 음악 이론을 발전시켰습니다.",
  },
  ligeti: {
    composerFull: "György Sándor Ligeti (1923-2006)",
    period: "현대",
    background: "죄르지 리게티는 헝가리 태생 작곡가로, 음색 음악과 미세 다성 음악으로 유명합니다.",
    historicalContext: "큐브릭의 '2001: 스페이스 오디세이'에 음악이 사용되었습니다.",
  },
  penderecki: {
    composerFull: "Krzysztof Eugeniusz Penderecki (1933-2020)",
    period: "현대",
    background: "크시슈토프 펜데레츠키는 폴란드 작곡가로, 음향 실험과 종교 음악으로 유명합니다.",
    historicalContext: "현대 폴란드 음악의 거장입니다.",
  },
  glass: {
    composerFull: "Philip Morris Glass (1937-)",
    period: "현대",
    background: "필립 글래스는 미국 작곡가로, 미니멀리즘 음악의 선구자입니다.",
    historicalContext: "반복 구조의 미니멀 음악을 확립했습니다.",
  },
  reich: {
    composerFull: "Stephen Michael Reich (1936-)",
    period: "현대",
    background: "스티브 라이히는 미국 작곡가로, 미니멀리즘과 위상 변이 기법으로 유명합니다.",
    historicalContext: "미니멀리즘 음악의 대표적 작곡가입니다.",
  },
  takemitsu: {
    composerFull: "Toru Takemitsu (1930-1996)",
    period: "현대",
    background: "타케미츠 토루는 일본 작곡가로, 동양과 서양 음악을 결합했습니다.",
    historicalContext: "20세기 일본 음악의 가장 중요한 작곡가입니다.",
  },
  part: {
    composerFull: "Arvo Pärt (1935-)",
    period: "현대",
    background: "아르보 페르트는 에스토니아 작곡가로, '틴티나불리' 양식으로 유명합니다.",
    historicalContext: "현대 종교 음악의 대표적 작곡가입니다.",
  },
  cage: {
    composerFull: "John Milton Cage Jr. (1912-1992)",
    period: "현대",
    background: "존 케이지는 미국 작곡가로, 우연성 음악과 '4분 33초'로 유명합니다.",
    historicalContext: "전위 음악의 아이콘입니다.",
  },
  barber: {
    composerFull: "Samuel Osborne Barber II (1910-1981)",
    period: "20세기",
    background: "새뮤얼 바버는 미국 작곡가로, '현을 위한 아다지오'가 대표작입니다.",
    historicalContext: "신낭만주의 양식의 미국 작곡가입니다.",
  },
  villalobos: {
    composerFull: "Heitor Villa-Lobos (1887-1959)",
    period: "20세기",
    background: "에이토르 빌라로보스는 브라질 작곡가로, 남미 클래식 음악의 거장입니다.",
    historicalContext: "브라질 민속 음악과 바흐를 결합한 '바키아나스 브라질레이라스'로 유명합니다.",
  },
  ginastera: {
    composerFull: "Alberto Evaristo Ginastera (1916-1983)",
    period: "20세기",
    background: "알베르토 히나스테라는 아르헨티나 작곡가로, 민족주의에서 실험적 양식으로 발전했습니다.",
    historicalContext: "라틴 아메리카 클래식 음악의 대표적 작곡가입니다.",
  },
  lutoslawski: {
    composerFull: "Witold Roman Lutosławski (1913-1994)",
    period: "현대",
    background: "비톨트 루토스와프스키는 폴란드 작곡가로, 통제된 우연성 기법으로 유명합니다.",
    historicalContext: "20세기 후반 가장 중요한 폴란드 작곡가입니다.",
  },
};

/** 작곡가 자동완성 목록 (key → 표시 이름) */
export const composerList: { key: string; label: string }[] = Object.entries(composerDatabase).map(
  ([key, data]) => ({
    key,
    label: data.composerFull.split(" (")[0],
  })
);

/** 곡 제목 데이터베이스 (작곡가별 대표곡) */
export const pieceDatabase: { composer: string; pieces: string[] }[] = [
  // Baroque
  {
    composer: "bach",
    pieces: [
      "Well-Tempered Clavier Book 1",
      "Well-Tempered Clavier Book 2",
      "Goldberg Variations BWV 988",
      "French Suite No.5 BWV 816",
      "English Suite No.2 BWV 807",
      "Partita No.1 BWV 825",
      "Partita No.2 BWV 826",
      "Italian Concerto BWV 971",
      "Toccata BWV 910",
      "Chromatic Fantasia and Fugue BWV 903",
      "Invention No.1 BWV 772",
      "Invention No.8 BWV 779",
      "Sinfonia No.9 BWV 795",
      "Prelude and Fugue in C major BWV 846",
      "Prelude and Fugue in C minor BWV 847",
      "Prelude and Fugue in D major BWV 850",
    ],
  },
  {
    composer: "handel",
    pieces: [
      "Suite No.5 in E major HWV 430 (Harmonious Blacksmith)",
      "Chaconne in G major HWV 435",
      "Suite No.7 in G minor HWV 432",
    ],
  },
  {
    composer: "scarlatti",
    pieces: [
      "Sonata K.141",
      "Sonata K.27",
      "Sonata K.9 (Pastorale)",
      "Sonata K.380",
      "Sonata K.466",
      "Sonata K.531",
    ],
  },
  // Classical
  {
    composer: "mozart",
    pieces: [
      "Piano Sonata No.11 K.331 (Turkish March)",
      "Piano Sonata No.16 K.545 (Facile)",
      "Piano Sonata No.8 K.310",
      "Piano Sonata No.14 K.457",
      "Fantasy in D minor K.397",
      "Rondo alla Turca K.331",
      "Piano Concerto No.20 K.466",
      "Piano Concerto No.21 K.467",
      "Piano Concerto No.23 K.488",
      "Variations on Ah vous dirai-je, Maman K.265",
    ],
  },
  {
    composer: "beethoven",
    pieces: [
      "Piano Sonata No.8 Op.13 (Pathétique)",
      "Piano Sonata No.14 Op.27 No.2 (Moonlight)",
      "Piano Sonata No.17 Op.31 No.2 (Tempest)",
      "Piano Sonata No.21 Op.53 (Waldstein)",
      "Piano Sonata No.23 Op.57 (Appassionata)",
      "Piano Sonata No.26 Op.81a (Les Adieux)",
      "Piano Sonata No.29 Op.106 (Hammerklavier)",
      "Piano Sonata No.30 Op.109",
      "Piano Sonata No.31 Op.110",
      "Piano Sonata No.32 Op.111",
      "Piano Concerto No.3 Op.37",
      "Piano Concerto No.4 Op.58",
      "Piano Concerto No.5 Op.73 (Emperor)",
      "Bagatelle Op.119 No.1",
      "Für Elise WoO 59",
      "32 Variations in C minor WoO 80",
    ],
  },
  // Romantic - Chopin
  {
    composer: "chopin",
    pieces: [
      "Ballade No.1 Op.23",
      "Ballade No.2 Op.38",
      "Ballade No.3 Op.47",
      "Ballade No.4 Op.52",
      "Scherzo No.1 Op.20",
      "Scherzo No.2 Op.31",
      "Scherzo No.3 Op.39",
      "Scherzo No.4 Op.54",
      "Polonaise Op.53 (Heroic)",
      "Polonaise-Fantaisie Op.61",
      "Andante Spianato et Grande Polonaise Brillante Op.22",
      "Fantaisie-Impromptu Op.66",
      "Nocturne Op.9 No.2",
      "Nocturne Op.27 No.2",
      "Nocturne Op.48 No.1",
      "Nocturne Op.55 No.1",
      "Etude Op.10 No.1",
      "Etude Op.10 No.3 (Tristesse)",
      "Etude Op.10 No.4",
      "Etude Op.10 No.5 (Black Keys)",
      "Etude Op.10 No.12 (Revolutionary)",
      "Etude Op.25 No.5",
      "Etude Op.25 No.11 (Winter Wind)",
      "Etude Op.25 No.12 (Ocean)",
      "Waltz Op.64 No.1 (Minute)",
      "Waltz Op.64 No.2",
      "Barcarolle Op.60",
      "Berceuse Op.57",
      "Sonata No.2 Op.35 (Funeral March)",
      "Sonata No.3 Op.58",
      "Piano Concerto No.1 Op.11",
      "Piano Concerto No.2 Op.21",
      "Prelude Op.28 No.4",
      "Prelude Op.28 No.15 (Raindrop)",
    ],
  },
  // Romantic - Liszt
  {
    composer: "liszt",
    pieces: [
      "Transcendental Etude No.4 (Mazeppa)",
      "Transcendental Etude No.5 (Feux Follets)",
      "Transcendental Etude No.10",
      "Transcendental Etude No.12 (Chasse-neige)",
      "Paganini Etude No.3 (La Campanella)",
      "Paganini Etude No.6",
      "Hungarian Rhapsody No.2",
      "Hungarian Rhapsody No.6",
      "Hungarian Rhapsody No.12",
      "Hungarian Rhapsody No.15 (Rákóczi March)",
      "Liebesträume No.3",
      "Consolation No.3",
      "Mephisto Waltz No.1",
      "Sonata in B minor S.178",
      "Années de pèlerinage - Vallée d'Obermann",
      "Années de pèlerinage - Un sospiro",
      "Années de pèlerinage - Sonetto 104 del Petrarca",
      "Ballade No.2 in B minor",
      "Funérailles",
      "Réminiscences de Don Juan",
    ],
  },
  // Romantic - Schumann
  {
    composer: "schumann",
    pieces: [
      "Carnaval Op.9",
      "Kinderszenen Op.15 (Scenes from Childhood)",
      "Träumerei Op.15 No.7",
      "Kreisleriana Op.16",
      "Fantasie in C major Op.17",
      "Symphonic Etudes Op.13",
      "Papillons Op.2",
      "Toccata Op.7",
      "Arabeske Op.18",
      "Piano Concerto Op.54",
      "Album für die Jugend Op.68",
    ],
  },
  // Romantic - Brahms
  {
    composer: "brahms",
    pieces: [
      "Piano Sonata No.3 Op.5",
      "Variations on a Theme by Paganini Op.35",
      "Variations on a Theme by Handel Op.24",
      "Rhapsody Op.79 No.1",
      "Rhapsody Op.79 No.2",
      "Intermezzo Op.117 No.1",
      "Intermezzo Op.118 No.2",
      "Ballade Op.10 No.1 (Edward)",
      "Piano Concerto No.1 Op.15",
      "Piano Concerto No.2 Op.83",
      "6 Klavierstücke Op.118",
      "4 Klavierstücke Op.119",
    ],
  },
  // Romantic - Schubert
  {
    composer: "schubert",
    pieces: [
      "Impromptu Op.90 No.2",
      "Impromptu Op.90 No.3",
      "Impromptu Op.90 No.4",
      "Impromptu Op.142 No.3",
      "Moment Musical Op.94 No.3",
      "Piano Sonata No.21 D.960",
      "Piano Sonata No.20 D.959",
      "Piano Sonata No.19 D.958",
      "Wanderer Fantasy D.760",
    ],
  },
  // Romantic - Mendelssohn
  {
    composer: "mendelssohn",
    pieces: [
      "Songs Without Words Op.19 No.1",
      "Songs Without Words Op.30 No.6 (Venetian Gondola Song)",
      "Songs Without Words Op.67 No.4 (Spinning Song)",
      "Rondo Capriccioso Op.14",
      "Variations Sérieuses Op.54",
      "Piano Concerto No.1 Op.25",
    ],
  },
  // Romantic - Rachmaninoff
  {
    composer: "rachmaninoff",
    pieces: [
      "Piano Concerto No.2 Op.18",
      "Piano Concerto No.3 Op.30",
      "Rhapsody on a Theme of Paganini Op.43",
      "Prelude Op.3 No.2 (C# minor)",
      "Prelude Op.23 No.5",
      "Prelude Op.32 No.12",
      "Etude-Tableau Op.33 No.8",
      "Etude-Tableau Op.39 No.5",
      "Moment Musical Op.16 No.4",
      "Piano Sonata No.2 Op.36",
      "Elegie Op.3 No.1",
    ],
  },
  // Romantic - Scriabin
  {
    composer: "scriabin",
    pieces: [
      "Etude Op.8 No.12",
      "Etude Op.42 No.5",
      "Piano Sonata No.2 Op.19 (Sonata-Fantasy)",
      "Piano Sonata No.4 Op.30",
      "Piano Sonata No.5 Op.53",
      "Prelude Op.11 No.9",
      "Prelude Op.11 No.14",
      "Vers la flamme Op.72",
      "Poème Op.32 No.1",
    ],
  },
  // Impressionism - Debussy
  {
    composer: "debussy",
    pieces: [
      "Clair de lune (Suite Bergamasque)",
      "Arabesque No.1",
      "Arabesque No.2",
      "Rêverie",
      "Pour le piano - Prélude",
      "Estampes - Jardins sous la pluie",
      "Images Book 1 - Reflets dans l'eau",
      "Images Book 2 - Poissons d'or",
      "Préludes Book 1 - La fille aux cheveux de lin",
      "Préludes Book 1 - La cathédrale engloutie",
      "Préludes Book 2 - Feux d'artifice",
      "L'isle joyeuse",
      "Children's Corner - Golliwog's Cakewalk",
      "Deux Arabesques",
    ],
  },
  // Impressionism - Ravel
  {
    composer: "ravel",
    pieces: [
      "Jeux d'eau",
      "Miroirs - Alborada del gracioso",
      "Miroirs - Une barque sur l'océan",
      "Gaspard de la nuit - Ondine",
      "Gaspard de la nuit - Le Gibet",
      "Gaspard de la nuit - Scarbo",
      "Sonatine",
      "Pavane pour une infante défunte",
      "Valses nobles et sentimentales",
      "Le Tombeau de Couperin",
      "Piano Concerto in G major",
      "Piano Concerto for the Left Hand",
    ],
  },
  // 20th Century
  {
    composer: "prokofiev",
    pieces: [
      "Piano Sonata No.3 Op.28",
      "Piano Sonata No.6 Op.82 (War Sonata)",
      "Piano Sonata No.7 Op.83 (War Sonata)",
      "Piano Sonata No.8 Op.84 (War Sonata)",
      "Toccata Op.11",
      "Piano Concerto No.2 Op.16",
      "Piano Concerto No.3 Op.26",
      "Romeo and Juliet - 10 Pieces Op.75",
      "Sarcasms Op.17",
      "Visions fugitives Op.22",
    ],
  },
  {
    composer: "bartok",
    pieces: [
      "Allegro barbaro",
      "Romanian Folk Dances",
      "Mikrokosmos (selection)",
      "Out of Doors",
      "Piano Sonata Sz.80",
      "Piano Concerto No.2",
      "Piano Concerto No.3",
    ],
  },
  {
    composer: "stravinsky",
    pieces: [
      "Petrushka (piano version)",
      "Piano Sonata",
      "Serenade in A",
      "Trois mouvements de Petrouchka",
    ],
  },
  {
    composer: "kapustin",
    pieces: [
      "8 Concert Etudes Op.40",
      "Variations Op.41",
      "Piano Sonata No.1 Op.39",
      "Piano Sonata No.2 Op.54",
      "Toccatina Op.36",
    ],
  },
  // Alkan
  {
    composer: "alkan",
    pieces: [
      "Grande Sonate Op.33 (Les quatre âges)",
      "Concerto for Solo Piano Op.39",
      "Symphony for Solo Piano Op.39",
      "Le festin d'Ésope Op.39 No.12",
      "Étude Op.39 No.1",
      "Barcarolle Op.65 No.6",
    ],
  },
  // Moszkowski
  {
    composer: "moszkowski",
    pieces: [
      "15 Études de Virtuosité Op.72",
      "Spanish Dances Op.12",
      "Étincelles Op.36 No.6",
    ],
  },
  // Satie
  {
    composer: "satie",
    pieces: [
      "Gymnopédie No.1",
      "Gymnopédie No.2",
      "Gymnopédie No.3",
      "Gnossienne No.1",
      "Gnossienne No.3",
      "Je te veux",
    ],
  },
  // Gershwin
  {
    composer: "gershwin",
    pieces: [
      "Rhapsody in Blue",
      "Piano Concerto in F",
      "3 Preludes",
      "An American in Paris (piano)",
    ],
  },
];

/** 곡 제목 자동완성 목록 */
export const pieceList: { composer: string; title: string; searchKey: string }[] = pieceDatabase.flatMap(
  (entry) =>
    entry.pieces.map((piece) => ({
      composer: entry.composer,
      title: piece,
      searchKey: piece.toLowerCase().replace(/[^a-z0-9가-힣]/g, ""),
    }))
);

/** 작곡가 이름으로 데이터베이스 검색 */
function findComposerData(composerName: string): ComposerData | null {
  const name = composerName.toLowerCase();
  for (const [key, data] of Object.entries(composerDatabase)) {
    if (name.includes(key)) {
      return data;
    }
  }
  return null;
}

/** 작곡가별 연주 스타일 정보 */
const composerStyleInfo: Record<string, {
  workBg: (songName: string) => string;
  structure: { section: string; measures: string; description: string }[];
  technicalTips: string[];
  musicalTips: string[];
  performers: string[];
}> = {
  chopin: {
    workBg: (s) => `"${s}"은(는) 쇼팽의 피아노 작품으로, 그의 특유의 서정적이고 시적인 선율이 돋보이는 곡입니다. 쇼팽은 피아노의 노래하는 특성을 최대한 살리면서도, 왼손의 풍부한 화성과 오른손의 장식적인 선율을 통해 피아노만의 고유한 표현 세계를 구축했습니다. 이 곡에서도 폴란드 민족 음악의 영향과 파리 살롱 문화의 우아함이 조화롭게 결합되어 있습니다.`,
    structure: [
      { section: "제시부", measures: "도입~", description: "주요 주제가 제시되며, 쇼팽 특유의 서정적 선율이 펼쳐집니다. 왼손 반주 위에 오른손이 노래하듯 진행됩니다." },
      { section: "전개부", measures: "중반", description: "주제가 발전하며 조성 변화와 함께 감정적 긴장이 고조됩니다. 기교적으로 더 복잡한 패시지가 등장합니다." },
      { section: "재현부 및 코다", measures: "후반~끝", description: "주제가 재현되고 감정적 절정을 거쳐 결말로 향합니다." },
    ],
    technicalTips: [
      "오른손 선율의 레가토 연결에 집중하세요. 손가락이 건반 위에서 부드럽게 이동하며, 한 음에서 다음 음으로 끊김 없이 연결되어야 합니다.",
      "왼손 아르페지오 반주는 손목 회전(rotation)을 활용하여 부드럽게 처리하세요. 각 음이 균일한 음량으로 흐르듯 연결되어야 합니다.",
      "루바토를 적절히 활용하되, 왼손 반주의 맥박은 비교적 일정하게 유지하면서 오른손 선율만 자유롭게 움직이는 '쇼팽식 루바토'를 연습하세요.",
      "페달링은 화성 변화에 맞춰 깔끔하게 교체하되, 베이스 음이 바뀔 때 반드시 교체하여 화성이 혼탁해지지 않도록 하세요.",
    ],
    musicalTips: [
      "선율을 '노래하듯' 연주하세요. 쇼팽은 벨칸토 오페라의 영향을 깊이 받았으며, 피아노에서도 성악적인 표현을 추구했습니다.",
      "프레이즈의 호흡을 인식하세요. 각 악구의 시작과 끝, 정점을 파악하고 자연스러운 음악적 흐름을 만드세요.",
      "다이내믹 변화를 섬세하게 조절하세요. 쇼팽 음악에서는 극단적인 포르테보다 피아노~메조포르테 범위 내에서의 미묘한 변화가 중요합니다.",
      "감정 표현이 과도해지지 않도록 균형을 유지하세요. 우아함과 절제 속에서 깊은 감정을 표현하는 것이 쇼팽 연주의 핵심입니다.",
    ],
    performers: ["Krystian Zimerman", "Maurizio Pollini", "Arthur Rubinstein", "Rafał Blechacz", "Daniil Trifonov"],
  },
  beethoven: {
    workBg: (s) => `"${s}"은(는) 베토벤의 작품으로, 고전주의의 형식적 완성도와 낭만주의적 감정 표현이 결합된 역작입니다. 베토벤은 소나타 형식을 혁신적으로 확장하며 음악에 서사적 드라마를 부여했습니다. 이 곡에서도 대비되는 주제 사이의 극적 긴장, 점진적인 발전과 폭발적인 클라이맥스 등 베토벤 특유의 음악적 논리가 관철되어 있습니다.`,
    structure: [
      { section: "제시부", measures: "도입~", description: "주요 주제가 제시됩니다. 베토벤 특유의 간결하면서도 강렬한 모티프가 등장하며, 대비되는 성격의 제2주제와 대립합니다." },
      { section: "발전부", measures: "중반", description: "주제 소재가 다양한 조성과 변형을 거치며 발전합니다. 긴장감이 점진적으로 고조되는 베토벤 특유의 구축 방식이 돋보입니다." },
      { section: "재현부 및 코다", measures: "후반~끝", description: "주제가 재현되며, 베토벤의 코다는 종종 '제2의 발전부'라 불릴 만큼 충실한 내용을 담고 있습니다." },
    ],
    technicalTips: [
      "베토벤의 악센트와 sf 표시를 정확히 지키세요. 이는 단순한 강세가 아니라 음악적 의미를 전달하는 중요한 수단입니다.",
      "스케일과 아르페지오 패시지에서 손가락 균일성을 유지하세요. 모든 음이 명확하게 들려야 하며, 특히 엄지손가락의 넘김이 매끄러워야 합니다.",
      "옥타브와 화음 패시지에서는 팔 전체의 무게를 활용하세요. 손목과 어깨의 긴장을 풀고, 자연스러운 무게 이동으로 풍부한 소리를 만드세요.",
      "느린 부분에서의 레가토 연주에 특히 신경 쓰세요. 베토벤의 서정적 선율은 깊은 터치와 손가락 연결이 요구됩니다.",
    ],
    musicalTips: [
      "베토벤 음악의 구조적 논리를 이해하세요. 각 모티프가 어떻게 발전하고 변형되는지 추적하며 연주해야 합니다.",
      "대비(contrast)를 명확히 표현하세요. 강과 약, 긴장과 이완, 비극과 희망 사이의 극적 대비가 베토벤 음악의 핵심입니다.",
      "템포는 안정적으로 유지하되, 구조적으로 중요한 지점에서의 미세한 변화로 음악적 의미를 전달하세요.",
      "베토벤의 다이내믹 표시를 충실히 따르세요. pp에서 ff까지의 폭넓은 다이내믹 범위를 활용하는 것이 중요합니다.",
    ],
    performers: ["Wilhelm Kempff", "Daniel Barenboim", "Alfred Brendel", "Maurizio Pollini", "Emil Gilels"],
  },
  debussy: {
    workBg: (s) => `"${s}"은(는) 드뷔시의 작품으로, 인상주의 음악의 특징인 색채적 화성과 몽환적 분위기가 돋보이는 곡입니다. 드뷔시는 전통적인 기능 화성에서 벗어나 음색 자체의 아름다움을 추구했으며, 온음계, 5음 음계, 병행 화음 등을 활용하여 빛과 그림자, 물과 바람 같은 자연의 인상을 음악으로 그려냈습니다.`,
    structure: [
      { section: "A 섹션", measures: "도입~", description: "주요 주제가 제시됩니다. 드뷔시 특유의 색채적 화성과 모호한 조성감이 몽환적 분위기를 만들어냅니다." },
      { section: "B 섹션", measures: "중반", description: "대조적인 소재가 등장하며 새로운 음색과 분위기를 제시합니다. 화성의 색채가 더욱 풍부해집니다." },
      { section: "A' 섹션 및 코다", measures: "후반~끝", description: "주제가 변형되어 재현되며, 점차 사라지듯 여운을 남기며 마무리됩니다." },
    ],
    technicalTips: [
      "음색(tone color)에 대한 섬세한 감각이 핵심입니다. 건반을 누르는 속도와 깊이를 미세하게 조절하여 다양한 음색을 만들어내세요.",
      "페달링이 매우 중요합니다. 하프 페달, 플러터 페달 등 다양한 기법을 활용하여 음들이 적절히 섞이면서도 혼탁해지지 않도록 하세요.",
      "양손의 독립성을 연습하세요. 한 손은 선율을, 다른 손은 배경 화성을 담당하며, 각각의 음량과 음색이 달라야 합니다.",
      "빠른 아르페지오나 장식적 패시지는 가볍고 유려하게 처리하세요. 하프를 연주하듯 손가락이 건반 위를 스치듯 지나가야 합니다.",
    ],
    musicalTips: [
      "드뷔시 음악을 '그림'으로 생각하세요. 명확한 선율선보다 전체적인 분위기와 색채감이 중요합니다.",
      "소리가 거칠어지지 않도록 항상 주의하세요. 드뷔시 음악에서는 ff에서도 풍성하지만 부드러운 톤을 유지해야 합니다.",
      "정확한 박자 위에 유연한 루바토를 적용하세요. 물 위에 떠가는 듯한 자유로움이 필요하지만, 음악의 맥박은 살아있어야 합니다.",
      "침묵도 음악의 일부입니다. 쉼표와 여백의 의미를 충분히 살려 여운 있는 연주를 하세요.",
    ],
    performers: ["Arturo Benedetti Michelangeli", "Samson François", "Claudio Arrau", "Krystian Zimerman", "Jean-Yves Thibaudet"],
  },
  liszt: {
    workBg: (s) => `"${s}"은(는) 리스트의 피아노 작품으로, 화려한 비르투오시티와 교향적 스케일이 특징입니다. 리스트는 피아노 기법을 혁명적으로 확장한 작곡가로, 옥타브 주법, 양손 교차, 넓은 도약, 트레몰로 등 오케스트라적인 효과를 피아노에서 구현했습니다. 이 곡에서도 그의 초절기교적 피아니즘과 시적 감수성이 결합되어 있습니다.`,
    structure: [
      { section: "도입부", measures: "도입~", description: "주제가 제시되며, 리스트 특유의 화려한 피아니즘이 펼쳐집니다." },
      { section: "전개부", measures: "중반", description: "주제가 다양한 방식으로 변형되며 기교적 난이도가 높아집니다. 서정적인 에피소드가 대비를 이룹니다." },
      { section: "클라이맥스 및 코다", measures: "후반~끝", description: "화려한 기교적 절정을 거쳐 장대한 결말로 마무리됩니다." },
    ],
    technicalTips: [
      "옥타브 패시지에서는 손목과 팔 전체의 탄력을 활용하세요. 경직된 상태에서는 속도도, 음악성도 확보할 수 없습니다.",
      "넓은 도약은 눈으로 도착 지점을 미리 확인하고 팔 전체의 부드러운 이동으로 처리하세요. 느린 템포에서 정확한 위치를 익힌 후 속도를 올리세요.",
      "양손 교차 패시지는 팔의 동선을 미리 계획하세요. 서로 부딪히지 않도록 위아래 공간을 확보하세요.",
      "곡 전체의 체력 안배가 중요합니다. 클라이맥스를 위해 에너지를 보존하고, 어려운 패시지 전 불필요한 긴장을 줄이세요.",
    ],
    musicalTips: [
      "기교적으로 화려한 부분에서도 음악적 표현을 잃지 마세요. 모든 패시지에는 음악적 방향성과 의미가 있어야 합니다.",
      "서정적 부분에서 진정한 음악성을 보여주세요. 리스트의 음악은 기교 과시만이 아닌 깊은 시적 감수성을 담고 있습니다.",
      "오케스트라적 사고로 연주하세요. 리스트는 종종 피아노를 오케스트라처럼 다뤘으며, 다양한 악기의 음색을 상상하며 연주하면 표현이 풍부해집니다.",
      "구조적 클라이맥스를 향한 에너지 흐름을 계획하세요. 처음부터 최대 음량으로 연주하면 정점의 효과가 감소합니다.",
    ],
    performers: ["Jorge Bolet", "Claudio Arrau", "Vladimir Horowitz", "Yuja Wang", "Daniil Trifonov"],
  },
  schumann: {
    workBg: (s) => `"${s}"은(는) 슈만의 작품으로, 문학적 상상력과 깊은 감정 표현이 결합된 낭만주의 피아노 음악의 정수입니다. 슈만은 음악과 문학의 깊은 연결을 추구했으며, 상반된 두 인격인 열정적인 '플로레스탄'과 내성적인 '오이제비우스'가 그의 작품 속에서 대화를 나눕니다. 이 곡에서도 극적인 대비와 시적인 서정성이 어우러져 있습니다.`,
    structure: [
      { section: "제1부", measures: "도입~", description: "주요 주제가 제시됩니다. 슈만 특유의 낭만적 선율과 리듬적 특징이 나타납니다." },
      { section: "중간부", measures: "중반", description: "대조적인 성격의 에피소드가 등장합니다. 내면적이고 서정적인 부분과 격정적인 부분이 교차합니다." },
      { section: "재현부 및 코다", measures: "후반~끝", description: "주제가 재현되며 감정적 결말로 향합니다." },
    ],
    technicalTips: [
      "슈만의 복잡한 내성부를 명확히 들려주세요. 여러 성부가 동시에 진행될 때 각각의 선율선이 독립적으로 들려야 합니다.",
      "싱코페이션과 리듬적 교차를 정확히 처리하세요. 슈만은 강박의 이동과 리듬적 모호성을 자주 활용합니다.",
      "양손의 균형에 주의하세요. 특히 왼손에 선율이 나올 때 충분히 노래하게 연주하고, 오른손 화성에 묻히지 않도록 하세요.",
      "점프와 넓은 음역의 패시지에서 정확성을 확보하세요. 느린 템포에서 확실히 익힌 후 속도를 올리세요.",
    ],
    musicalTips: [
      "슈만 음악의 문학적 측면을 이해하세요. 이야기를 들려주듯, 각 섹션의 '성격(character)'을 명확히 표현하세요.",
      "열정적인 부분(플로레스탄)과 내성적인 부분(오이제비우스)의 대비를 살리세요. 이 이중성이 슈만 음악의 핵심입니다.",
      "프레이즈의 호흡과 방향성에 주의하세요. 슈만의 선율은 때때로 예상치 못한 방향으로 진행하며, 이를 자연스럽게 이끌어야 합니다.",
      "페달을 신중하게 사용하세요. 화성의 변화를 깨끗하게 유지하면서도 낭만적인 울림을 만들어내야 합니다.",
    ],
    performers: ["Claudio Arrau", "Martha Argerich", "Vladimir Horowitz", "Radu Lupu", "Mitsuko Uchida"],
  },
  bach: {
    workBg: (s) => `"${s}"은(는) 바흐의 작품으로, 대위법적 완성도와 음악적 논리의 극치를 보여줍니다. 바흐는 여러 독립적인 선율선이 동시에 진행하면서도 완벽한 화성적 조화를 이루는 대위법의 최고 대가입니다. 이 곡에서도 각 성부의 독립성과 전체의 유기적 통일성이 놀라운 균형을 이루고 있으며, 치밀한 구조 속에 깊은 음악적 아름다움이 담겨 있습니다.`,
    structure: [
      { section: "주제 제시", measures: "도입~", description: "주요 주제가 제시됩니다. 바흐의 주제는 간결하면서도 발전 가능성이 풍부한 것이 특징입니다." },
      { section: "전개", measures: "중반", description: "주제가 다양한 조성과 성부에서 변형되며 발전합니다. 대위법적 기법이 집약적으로 사용됩니다." },
      { section: "결말", measures: "후반~끝", description: "모든 성부가 종합되어 통일감 있는 결말을 이룹니다." },
    ],
    technicalTips: [
      "각 성부의 독립성을 유지하세요. 손가락의 독립적인 터치와 음량 조절이 핵심입니다. 각 성부를 따로 연습한 후 합치세요.",
      "운지법(fingering)을 미리 체계적으로 계획하세요. 바흐의 대위법 작품에서는 손가락 번호가 음악적 표현에 직접 영향을 미칩니다.",
      "논레가토와 레가토를 적절히 구분하세요. 바로크 시대의 아티큘레이션은 현대 피아노에서 의식적으로 만들어내야 합니다.",
      "장식음(트릴, 모르덴트 등)은 시대적 관습을 참고하되, 음악적 맥락에 맞게 자연스럽게 처리하세요.",
    ],
    musicalTips: [
      "각 성부를 '다른 악기' 또는 '다른 가수'로 상상하세요. 합창이나 실내악처럼 여러 목소리가 대화하는 듯한 연주를 추구하세요.",
      "구조적 논리를 이해하세요. 주제가 어느 성부에서 나타나는지, 어떻게 변형되는지 추적하며 연주하세요.",
      "바로크 시대의 수사학적 표현을 참고하세요. 음형 하나하나에 감정적 의미가 담겨 있습니다.",
      "템포는 안정적으로 유지하되 기계적이지 않게 하세요. 음악적 호흡과 자연스러운 흐름이 있어야 합니다.",
    ],
    performers: ["Glenn Gould", "Andras Schiff", "Angela Hewitt", "Murray Perahia", "Rosalyn Tureck"],
  },
  mozart: {
    workBg: (s) => `"${s}"은(는) 모차르트의 작품으로, 고전주의 음악의 균형미와 우아함의 정수를 보여줍니다. 모차르트의 음악은 표면적으로 단순해 보이지만 그 안에 깊은 감정과 완벽한 형식적 논리가 담겨 있습니다. 이 곡에서도 명쾌한 구조, 투명한 텍스처, 그리고 노래하는 듯한 아름다운 선율이 특징적입니다.`,
    structure: [
      { section: "제시부", measures: "도입~", description: "우아하고 명쾌한 주제가 제시됩니다. 모차르트 특유의 노래하는 선율과 투명한 질감이 돋보입니다." },
      { section: "발전부", measures: "중반", description: "주제 소재가 발전하며 조성의 변화를 거칩니다. 모차르트의 발전부는 간결하면서도 기지에 넘칩니다." },
      { section: "재현부 및 코다", measures: "후반~끝", description: "주제가 재현되며 균형 잡힌 결말로 마무리됩니다." },
    ],
    technicalTips: [
      "투명한 터치가 핵심입니다. 각 음이 진주 알갱이처럼 명확하고 균일하게 들려야 합니다. 손가락 끝의 민감한 터치를 연습하세요.",
      "스케일과 아르페지오의 균일성을 철저히 훈련하세요. 모차르트 음악에서는 한 음이라도 불균일하면 전체가 무너져 보입니다.",
      "왼손 반주(알베르티 베이스 등)가 오른손 선율을 방해하지 않도록 가볍게 처리하세요.",
      "장식음은 우아하고 자연스럽게, 마치 즉흥적으로 떠오른 것처럼 연주하세요. 강조가 아닌 장식의 역할을 해야 합니다.",
    ],
    musicalTips: [
      "모차르트의 '단순함' 뒤에 숨은 깊이를 표현하세요. 겉보기에 쉬운 선율일수록 더 깊은 음악적 이해가 필요합니다.",
      "오페라적 상상력으로 연주하세요. 모차르트는 위대한 오페라 작곡가였으며, 그의 기악곡에서도 등장인물들의 대화가 들리듯 연주하세요.",
      "다이내믹은 섬세하게 조절하되 과장하지 마세요. 모차르트 음악에서는 우아함과 균형이 최우선입니다.",
      "프레이즈를 자연스럽게 '호흡'하세요. 문장을 읽듯이 쉼표와 마침표가 명확해야 합니다.",
    ],
    performers: ["Mitsuko Uchida", "Murray Perahia", "Alfred Brendel", "Maria João Pires", "Claudio Arrau"],
  },
  brahms: {
    workBg: (s) => `"${s}"은(는) 브람스의 작품으로, 고전적 형식의 견고함과 낭만적 서정성의 깊이가 결합된 걸작입니다. 브람스는 베토벤의 전통을 계승하면서도 풍부한 화성과 복잡한 리듬을 통해 독자적인 음악 세계를 구축했습니다. 이 곡에서도 치밀한 동기 작업, 풍부한 내성부, 그리고 가을 같은 서정성이 돋보입니다.`,
    structure: [
      { section: "제1부", measures: "도입~", description: "주요 주제가 제시됩니다. 브람스 특유의 풍부한 화성과 복잡한 리듬 구조가 나타납니다." },
      { section: "전개부", measures: "중반", description: "주제가 치밀하게 발전합니다. 동기 변형과 조성 변화를 통해 긴장이 고조됩니다." },
      { section: "결말", measures: "후반~끝", description: "주제가 재현되고 감정적으로 충실한 결말로 마무리됩니다." },
    ],
    technicalTips: [
      "브람스의 두꺼운 화성을 소화하기 위해 손의 폭을 유연하게 활용하세요. 큰 화음에서 손을 벌리는 스트레칭이 필요합니다.",
      "복잡한 리듬 패턴(3 대 2, 헤미올라 등)을 정확히 처리하세요. 각 손을 따로 연습한 후 천천히 합치세요.",
      "풍부하고 깊은 톤을 만들기 위해 팔의 무게를 건반에 전달하는 기법을 연습하세요. 표면적인 타건이 아닌 깊은 터치가 필요합니다.",
      "내성부의 선율을 명확히 들려주세요. 브람스의 텍스처는 여러 겹의 선율로 이루어져 있어 성부 간 균형이 중요합니다.",
    ],
    musicalTips: [
      "브람스 음악의 따뜻한 서정성을 표현하세요. 가을 석양처럼 풍부하고 깊은 감성이 특징입니다.",
      "구조적 통일성을 인식하세요. 브람스는 작은 동기에서 전체 작품을 구축하는 기법에 탁월했으며, 이 유기적 연결을 느끼며 연주하세요.",
      "서두르지 마세요. 브람스의 음악은 여유 있는 호흡과 깊은 사색이 필요합니다.",
      "내면적 감정의 깊이를 표현하되, 과도한 감상에 빠지지 않도록 구조적 탄탄함을 유지하세요.",
    ],
    performers: ["Julius Katchen", "Emil Gilels", "Radu Lupu", "Nelson Freire", "Krystian Zimerman"],
  },
  rachmaninoff: {
    workBg: (s) => `"${s}"은(는) 라흐마니노프의 작품으로, 후기 낭만주의의 풍부한 감정 표현과 화려한 피아니즘이 결합된 곡입니다. 라흐마니노프는 20세기 최고의 피아니스트 중 한 명이자 뛰어난 작곡가로, 그의 큰 손에서 비롯된 넓은 화음, 풍부한 화성, 그리고 러시아 낭만주의의 서정적 선율이 특징입니다. 이 곡에서도 스케일 큰 피아니즘과 깊은 서정성이 어우러져 있습니다.`,
    structure: [
      { section: "도입부", measures: "도입~", description: "주요 주제가 제시됩니다. 라흐마니노프 특유의 넓은 화성과 서정적 선율이 펼쳐집니다." },
      { section: "전개부", measures: "중반", description: "주제가 점진적으로 발전하며 스케일이 커집니다. 화려한 기교적 패시지와 감정적 고조가 특징입니다." },
      { section: "클라이맥스 및 결말", measures: "후반~끝", description: "감정적 절정을 거쳐 장대한 결말로 향합니다." },
    ],
    technicalTips: [
      "넓은 화음과 긴 아르페지오를 위해 손의 유연성과 스트레칭을 충분히 연습하세요. 도달할 수 없는 화음은 아르페지오로 처리하세요.",
      "라흐마니노프의 두꺼운 텍스처에서도 선율선을 명확히 부각시키세요. 여러 층의 음향 속에서 주선율이 항상 들려야 합니다.",
      "빠른 음형 패시지에서 균일성과 정확성을 유지하세요. 손가락 독립성 훈련과 느린 연습이 필수적입니다.",
      "풍부한 페달 사용이 필요하지만, 텍스처가 혼탁해지지 않도록 화성 변화에 맞춰 적절히 교체하세요.",
    ],
    musicalTips: [
      "러시아 낭만주의의 깊은 감정을 표현하세요. 광활한 러시아 대지를 연상시키는 스케일 큰 서정성이 필요합니다.",
      "선율을 충분히 노래하게 연주하세요. 라흐마니노프의 선율은 벨칸토 오페라처럼 숨 쉬고 노래해야 합니다.",
      "클라이맥스를 향한 점진적인 구축이 중요합니다. 너무 일찍 정점에 도달하면 전체 구조가 무너집니다.",
      "저음부의 깊은 울림을 충분히 활용하세요. 라흐마니노프 음악에서 베이스 라인은 전체의 기둥 역할을 합니다.",
    ],
    performers: ["Sergei Rachmaninoff (자작 연주)", "Vladimir Horowitz", "Sviatoslav Richter", "Van Cliburn", "Daniil Trifonov"],
  },
  tchaikovsky: {
    workBg: (s) => `"${s}"은(는) 차이코프스키의 작품으로, 러시아 낭만주의 음악의 감정적 깊이와 선율적 아름다움이 돋보이는 곡입니다. 차이코프스키는 서양 음악의 형식적 전통 위에 러시아적 감수성을 결합하여 깊은 감정적 호소력을 지닌 음악을 만들어냈습니다. 이 곡에서도 풍부한 선율, 극적인 감정 표현, 화려한 오케스트라적 사고가 반영되어 있습니다.`,
    structure: [
      { section: "도입부", measures: "도입~", description: "주제가 제시되며, 차이코프스키 특유의 서정적이면서도 극적인 성격이 드러납니다." },
      { section: "전개부", measures: "중반", description: "주제가 감정적으로 발전하며 극적 긴장이 고조됩니다." },
      { section: "결말", measures: "후반~끝", description: "감정적 클라이맥스를 거쳐 결말로 향합니다." },
    ],
    technicalTips: [
      "선율의 레가토 연결에 집중하세요. 차이코프스키의 노래하는 선율은 끊김 없는 연결이 핵심입니다.",
      "화음 패시지에서 풍부한 소리를 만들기 위해 팔의 무게를 활용하세요.",
      "빠른 패시지에서도 음악적 방향성을 잃지 마세요. 기교는 음악적 표현의 수단이어야 합니다.",
      "다이내믹의 폭을 넓게 활용하세요. pp에서 ff까지의 극적인 대비가 차이코프스키 음악의 특징입니다.",
    ],
    musicalTips: [
      "발레와 오페라의 극적 감각으로 연주하세요. 차이코프스키는 위대한 극음악 작곡가였으며, 피아노 음악에서도 그 드라마가 살아있어야 합니다.",
      "선율을 진정으로 '노래'하세요. 성악가가 되었다고 상상하며 프레이즈의 호흡과 표현을 계획하세요.",
      "러시아적 감수성을 담되 과도한 감상에 빠지지 않도록 구조적 통일성을 유지하세요.",
      "대비(contrast)를 명확히 표현하세요. 서정적 부분과 격정적 부분의 성격 차이가 뚜렷해야 합니다.",
    ],
    performers: ["Martha Argerich", "Sviatoslav Richter", "Vladimir Horowitz", "Mikhail Pletnev", "Denis Matsuev"],
  },
  ravel: {
    workBg: (s) => `"${s}"은(는) 라벨의 작품으로, 정교한 기법과 색채적 화성이 완벽하게 결합된 걸작입니다. 라벨은 '오케스트라의 마법사'로 불릴 만큼 정교한 관현악법의 대가였으며, 피아노 음악에서도 이러한 음색적 상상력이 빛을 발합니다. 인상주의적 색채감과 고전적 형식미, 그리고 기계처럼 정밀한 기교적 요구가 이 곡의 특징입니다.`,
    structure: [
      { section: "A 섹션", measures: "도입~", description: "주요 주제가 제시됩니다. 라벨 특유의 정교한 음형과 색채적 화성이 전개됩니다." },
      { section: "B 섹션", measures: "중반", description: "대조적인 소재가 등장하며 새로운 음색적 세계를 펼칩니다." },
      { section: "결말", measures: "후반~끝", description: "주제가 변형되어 재현되며 정교한 마무리로 끝맺습니다." },
    ],
    technicalTips: [
      "정확성이 핵심입니다. 라벨의 음악은 '시계 장인'의 정밀함을 요구합니다. 한 음, 한 쉼표도 허술하게 넘기지 마세요.",
      "다양한 터치로 음색의 변화를 만들어내세요. 같은 음량이라도 건반을 누르는 속도와 각도에 따라 음색이 달라집니다.",
      "복잡한 리듬 패턴을 정확히 처리하세요. 라벨은 복잡한 리듬을 자주 사용하며, 이를 자연스럽게 소화해야 합니다.",
      "페달은 절제하되 효과적으로 사용하세요. 깨끗한 텍스처를 유지하면서 필요한 곳에서만 색채적 효과를 더하세요.",
    ],
    musicalTips: [
      "라벨의 음악은 '감정의 억제' 속에서 깊이를 표현합니다. 드뷔시보다 더 구조적이고 절제된 표현을 추구하세요.",
      "각 음형의 색채적 특성을 살리세요. 라벨은 피아노에서도 다양한 악기의 음색을 상상하며 작곡했습니다.",
      "스페인, 바스크, 재즈 등 다양한 문화적 영향을 인식하세요. 라벨의 음악에는 이국적인 색채가 풍부합니다.",
      "완벽주의적 태도로 임하세요. 라벨 자신이 극도의 완벽주의자였으며, 그의 음악은 모든 세부 사항에 의미가 담겨 있습니다.",
    ],
    performers: ["Martha Argerich", "Samson François", "Krystian Zimerman", "Jean-Yves Thibaudet", "Pierre-Laurent Aimard"],
  },
  schubert: {
    workBg: (s) => `"${s}"은(는) 슈베르트의 작품으로, 가곡적 서정성과 깊은 감정의 세계가 펼쳐지는 곡입니다. 슈베르트는 '가곡의 왕'으로 불리며, 그의 피아노 음악에서도 노래하는 선율이 핵심적인 역할을 합니다. 고전주의의 형식적 틀 안에서 낭만주의적 감수성을 표현했으며, 화성의 변화를 통한 미묘한 감정 표현에 탁월했습니다.`,
    structure: [
      { section: "제시부", measures: "도입~", description: "노래하는 듯한 주제가 제시됩니다. 슈베르트 특유의 서정적 선율과 화성적 색채가 나타납니다." },
      { section: "전개부", measures: "중반", description: "주제가 발전하며 다양한 조성을 거칩니다. 슈베르트의 전개부에서는 종종 예상치 못한 화성적 전환이 일어납니다." },
      { section: "재현부 및 코다", measures: "후반~끝", description: "주제가 재현되며, 깊은 여운을 남기는 결말로 마무리됩니다." },
    ],
    technicalTips: [
      "노래하는 레가토 터치를 연습하세요. 슈베르트의 선율은 가곡처럼 자연스럽게 흘러야 합니다.",
      "왼손 반주 패턴을 가볍고 균일하게 유지하세요. 반주가 선율을 지지하되 방해하지 않아야 합니다.",
      "화성 변화에 민감하게 반응하세요. 특히 장조에서 단조로, 또는 예상치 못한 조성으로 전환되는 부분에서 음색의 변화를 표현하세요.",
      "긴 프레이즈를 끊김 없이 연결하세요. 호흡이 긴 선율을 자연스럽게 이끌어가는 것이 중요합니다.",
    ],
    musicalTips: [
      "슈베르트의 음악을 '노래'로 생각하세요. 가곡에서의 시적 표현이 기악곡에서도 살아있어야 합니다.",
      "장/단조의 교체에서 빛과 그림자의 변화를 표현하세요. 슈베르트는 이 전환을 통해 깊은 감정적 의미를 전달합니다.",
      "반복되는 구간에서도 매번 새로운 뉘앙스를 찾으세요. 슈베르트의 반복은 단순한 되풀이가 아닌 심화입니다.",
      "서두르지 마세요. 슈베르트의 '천상의 길이(himmlische Länge)'는 여유 있는 호흡 속에서 비로소 아름다움이 펼쳐집니다.",
    ],
    performers: ["Alfred Brendel", "Radu Lupu", "Mitsuko Uchida", "Wilhelm Kempff", "András Schiff"],
  },
};

/** 기본 스타일 정보 (데이터베이스에 없는 작곡가용) */
const defaultStyleInfo = {
  workBg: (composer: string, songName: string) =>
    `"${songName}"은(는) ${composer}의 작품입니다. 이 곡은 작곡가의 음악적 특성과 시대적 양식이 반영된 피아노 작품으로, 연주자에게 기교적, 음악적 도전을 제시합니다.`,
  structure: [
    { section: "제1부", measures: "도입~", description: "주요 주제가 제시되며, 곡의 성격과 분위기가 확립됩니다." },
    { section: "중간부", measures: "중반", description: "주제가 발전하며 새로운 소재가 등장합니다. 조성과 다이내믹의 변화를 통해 음악적 긴장이 만들어집니다." },
    { section: "결말부", measures: "후반~끝", description: "주제가 재현되거나 새로운 방식으로 종합되며 곡이 마무리됩니다." },
  ],
  technicalTips: [
    "곡의 주요 선율을 레가토로 노래하듯 연결하세요. 손가락의 부드러운 연결과 적절한 무게 이동이 중요합니다.",
    "어려운 패시지는 느린 템포에서 정확히 익힌 후 점진적으로 속도를 올리세요. 리듬을 변형하여 연습하는 것도 효과적입니다.",
    "양손의 밸런스에 주의하세요. 선율이 있는 손이 명확히 들리도록 하고, 반주는 가볍게 처리하세요.",
    "페달링은 화성 변화에 맞춰 깨끗하게 교체하되, 곡의 성격에 맞는 울림을 만들어내세요.",
  ],
  musicalTips: [
    "곡 전체의 구조를 파악하고, 각 부분의 역할과 성격을 이해하며 연주하세요.",
    "프레이즈의 시작과 끝, 정점을 명확히 인식하고 자연스러운 음악적 호흡을 만드세요.",
    "다이내믹 변화를 통해 감정의 흐름을 표현하세요. 점진적인 크레센도와 디미누엔도로 음악에 생명력을 불어넣으세요.",
    "작곡가의 시대적 양식을 이해하고 그에 맞는 표현 방식을 추구하세요.",
  ],
  performers: [] as string[],
};

/** 동적으로 AI 정보 생성 (등록되지 않은 곡용) */
export function generateSongAIInfo(id: string, title: string, composerName?: string): SongAIInfo {
  const parsed = parseSongTitle(title);
  const composer = composerName || parsed.composer;
  const songName = composerName ? title : parsed.songName;
  const composerData = findComposerData(composer);

  // 작곡가별 스타일 정보 찾기
  const composerKey = composerData
    ? Object.entries(composerDatabase).find(([, d]) => d === composerData)?.[0] || ""
    : "";
  const styleInfo = composerStyleInfo[composerKey];

  return {
    id,
    composer,
    composerFull: composerData?.composerFull || composer,
    composerImage: composerData?.composerImage,
    title: songName,
    opus: "",
    year: "",
    period: composerData?.period || "클래식",
    difficulty: "중급",
    keySignature: "",
    tempo: "",
    duration: "",
    composerBackground: composerData?.background || `${composer}에 대한 상세 정보는 현재 준비 중입니다.`,
    historicalContext: composerData?.historicalContext || `이 곡이 작곡된 시대적 배경 정보는 현재 준비 중입니다.`,
    workBackground: styleInfo
      ? styleInfo.workBg(songName)
      : defaultStyleInfo.workBg(composer, songName),
    structure: styleInfo?.structure || defaultStyleInfo.structure,
    technicalTips: styleInfo?.technicalTips || defaultStyleInfo.technicalTips,
    musicalTips: styleInfo?.musicalTips || defaultStyleInfo.musicalTips,
    famousPerformers: styleInfo?.performers || defaultStyleInfo.performers,
  };
}

/** ID 또는 제목으로 AI 정보 가져오기 */
export function getSongAIInfoByIdOrTitle(id: string, title: string, composerName?: string): SongAIInfo {
  const existingInfo = mockSongAIInfo[id];
  if (existingInfo) {
    return existingInfo;
  }
  return generateSongAIInfo(id, title, composerName);
}
