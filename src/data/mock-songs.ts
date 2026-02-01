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
};

/** 작곡가 자동완성 목록 (key → 표시 이름) */
export const composerList: { key: string; label: string }[] = Object.entries(composerDatabase).map(
  ([key, data]) => ({
    key,
    label: data.composerFull.split(" (")[0],
  })
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

/** 동적으로 AI 정보 생성 (등록되지 않은 곡용) */
export function generateSongAIInfo(id: string, title: string, composerName?: string): SongAIInfo {
  const parsed = parseSongTitle(title);
  const composer = composerName || parsed.composer;
  const songName = composerName ? title : parsed.songName;
  const composerData = findComposerData(composer);

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
    workBackground: `"${songName}"은(는) ${composerData?.composerFull || composer}의 작품입니다. 이 곡에 대한 상세 배경 정보는 현재 준비 중입니다.`,
    structure: [
      { section: "전체", measures: "-", description: "곡의 상세 구조 분석은 현재 준비 중입니다." },
    ],
    technicalTips: [
      "곡의 기교적 특징과 연습 방법은 현재 준비 중입니다.",
    ],
    musicalTips: [
      "곡의 음악적 해석 가이드는 현재 준비 중입니다.",
    ],
    famousPerformers: [],
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
