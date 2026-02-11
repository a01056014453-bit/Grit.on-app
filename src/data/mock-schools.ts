import type { School, Room, RoomVideo, RoomMembership, FreePiece } from "@/types";

export const mockSchools: School[] = [
  {
    id: "snu",
    name: "서울대학교",
    shortName: "서울대",
    type: "designated",
    year: 2026,
    deadline: "2026-02-15",
    designatedPieces: [
      {
        id: "snu-1",
        composer: "F. Chopin",
        title: "Ballade No.1 Op.23",
        fullName: "F. Chopin - Ballade No.1 Op.23",
        category: "낭만",
      },
      {
        id: "snu-2",
        composer: "F. Chopin",
        title: "Ballade No.2 Op.38",
        fullName: "F. Chopin - Ballade No.2 Op.38",
        category: "낭만",
      },
      {
        id: "snu-3",
        composer: "L. v. Beethoven",
        title: "Sonata Op.57 'Appassionata'",
        fullName: "L. v. Beethoven - Sonata Op.57",
        category: "고전",
      },
      {
        id: "snu-4",
        composer: "F. Liszt",
        title: "La Campanella",
        fullName: "F. Liszt - La Campanella",
        category: "낭만",
      },
      {
        id: "snu-5",
        composer: "S. Rachmaninoff",
        title: "Etude-Tableau Op.39 No.5",
        fullName: "S. Rachmaninoff - Etude-Tableau Op.39 No.5",
        category: "낭만",
      },
      {
        id: "snu-6",
        composer: "J.S. Bach",
        title: "Prelude and Fugue in C major, BWV 846",
        fullName: "J.S. Bach - Prelude and Fugue BWV 846",
        category: "바로크",
      },
    ],
  },
  {
    id: "knua",
    name: "한국예술종합학교",
    shortName: "한예종",
    type: "designated",
    year: 2026,
    deadline: "2026-01-20",
    designatedPieces: [
      {
        id: "knua-1",
        composer: "L. v. Beethoven",
        title: "Sonata Op.57 'Appassionata'",
        fullName: "L. v. Beethoven - Sonata Op.57",
        category: "고전",
      },
      {
        id: "knua-2",
        composer: "S. Rachmaninoff",
        title: "Prelude Op.23 No.5",
        fullName: "S. Rachmaninoff - Prelude Op.23 No.5",
        category: "낭만",
      },
      {
        id: "knua-3",
        composer: "F. Chopin",
        title: "Etude Op.10 No.4",
        fullName: "F. Chopin - Etude Op.10 No.4",
        category: "낭만",
      },
      {
        id: "knua-4",
        composer: "C. Debussy",
        title: "L'isle joyeuse",
        fullName: "C. Debussy - L'isle joyeuse",
        category: "근현대",
      },
    ],
  },
  {
    id: "yonsei",
    name: "연세대학교",
    shortName: "연세대",
    type: "free",
    year: 2026,
    deadline: "2026-02-10",
  },
  {
    id: "ewha",
    name: "이화여자대학교",
    shortName: "이화여대",
    type: "free",
    year: 2026,
    deadline: "2026-02-20",
  },
];

// 입시룸 목록
export const mockRooms: Room[] = mockSchools.map((school) => ({
  id: `room-${school.id}`,
  schoolId: school.id,
  school,
  memberCount:
    school.id === "snu"
      ? 156
      : school.id === "knua"
        ? 89
        : school.id === "yonsei"
          ? 72
          : 45,
  videoCount:
    school.id === "snu"
      ? 324
      : school.id === "knua"
        ? 178
        : school.id === "yonsei"
          ? 134
          : 67,
  createdAt: "2025-09-01",
}));

// 영상 Mock 데이터
const createMockDate = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

export const mockRoomVideos: RoomVideo[] = [
  // 서울대 - 쇼팽 발라드 1번 영상들
  {
    id: "v1",
    roomId: "room-snu",
    userId: "user-1",
    userName: "익명 #127",
    pieceId: "snu-1",
    piece: { composer: "F. Chopin", title: "Ballade No.1 Op.23" },
    section: "1-36 마디",
    duration: 180,
    uploadedAt: createMockDate(1),
    helpfulCount: 24,
    tags: ["도입부", "페달링"],
    faceBlurred: true,
  },
  {
    id: "v2",
    roomId: "room-snu",
    userId: "user-2",
    userName: "익명 #89",
    pieceId: "snu-1",
    piece: { composer: "F. Chopin", title: "Ballade No.1 Op.23" },
    section: "94-138 마디",
    duration: 240,
    uploadedAt: createMockDate(2),
    helpfulCount: 18,
    tags: ["코다", "옥타브"],
    faceBlurred: true,
  },
  {
    id: "v3",
    roomId: "room-snu",
    userId: "user-3",
    userName: "익명 #203",
    pieceId: "snu-1",
    piece: { composer: "F. Chopin", title: "Ballade No.1 Op.23" },
    section: "전곡",
    duration: 560,
    uploadedAt: createMockDate(3),
    helpfulCount: 42,
    tags: ["전곡연주", "템포조절"],
    faceBlurred: false,
  },
  {
    id: "v4",
    roomId: "room-snu",
    userId: "user-4",
    userName: "익명 #45",
    pieceId: "snu-1",
    piece: { composer: "F. Chopin", title: "Ballade No.1 Op.23" },
    section: "36-67 마디",
    duration: 195,
    uploadedAt: createMockDate(4),
    helpfulCount: 12,
    tags: ["중간부", "왈츠"],
    faceBlurred: true,
  },
  // 서울대 - 라 캄파넬라
  {
    id: "v5",
    roomId: "room-snu",
    userId: "user-5",
    userName: "익명 #78",
    pieceId: "snu-4",
    piece: { composer: "F. Liszt", title: "La Campanella" },
    section: "1-48 마디",
    duration: 150,
    uploadedAt: createMockDate(1),
    helpfulCount: 31,
    tags: ["도입부", "점프"],
    faceBlurred: true,
  },
  {
    id: "v6",
    roomId: "room-snu",
    userId: "user-6",
    userName: "익명 #156",
    pieceId: "snu-4",
    piece: { composer: "F. Liszt", title: "La Campanella" },
    section: "전곡",
    duration: 320,
    uploadedAt: createMockDate(2),
    helpfulCount: 28,
    tags: ["전곡연주", "테크닉"],
    faceBlurred: true,
  },
  {
    id: "v7",
    roomId: "room-snu",
    userId: "user-7",
    userName: "익명 #92",
    pieceId: "snu-4",
    piece: { composer: "F. Liszt", title: "La Campanella" },
    section: "코다",
    duration: 90,
    uploadedAt: createMockDate(5),
    helpfulCount: 15,
    tags: ["코다", "마무리"],
    faceBlurred: false,
  },
  // 서울대 - 베토벤 열정
  {
    id: "v8",
    roomId: "room-snu",
    userId: "user-8",
    userName: "익명 #234",
    pieceId: "snu-3",
    piece: {
      composer: "L. v. Beethoven",
      title: "Sonata Op.57 'Appassionata'",
    },
    section: "1악장",
    duration: 480,
    uploadedAt: createMockDate(1),
    helpfulCount: 35,
    tags: ["1악장", "강렬함"],
    faceBlurred: true,
  },
  {
    id: "v9",
    roomId: "room-snu",
    userId: "user-9",
    userName: "익명 #167",
    pieceId: "snu-3",
    piece: {
      composer: "L. v. Beethoven",
      title: "Sonata Op.57 'Appassionata'",
    },
    section: "3악장",
    duration: 420,
    uploadedAt: createMockDate(3),
    helpfulCount: 29,
    tags: ["3악장", "프레스토"],
    faceBlurred: true,
  },
  // 한예종 영상들
  {
    id: "v10",
    roomId: "room-knua",
    userId: "user-10",
    userName: "익명 #56",
    pieceId: "knua-1",
    piece: {
      composer: "L. v. Beethoven",
      title: "Sonata Op.57 'Appassionata'",
    },
    section: "전곡",
    duration: 1200,
    uploadedAt: createMockDate(2),
    helpfulCount: 45,
    tags: ["전곡연주"],
    faceBlurred: true,
  },
  {
    id: "v11",
    roomId: "room-knua",
    userId: "user-11",
    userName: "익명 #112",
    pieceId: "knua-2",
    piece: { composer: "S. Rachmaninoff", title: "Prelude Op.23 No.5" },
    section: "전곡",
    duration: 240,
    uploadedAt: createMockDate(1),
    helpfulCount: 22,
    tags: ["행진곡풍", "힘찬"],
    faceBlurred: true,
  },
  // 연세대 (자유곡) 영상들
  {
    id: "v12",
    roomId: "room-yonsei",
    userId: "user-12",
    userName: "익명 #34",
    piece: { composer: "F. Chopin", title: "Nocturne Op.9 No.2" },
    section: "전곡",
    duration: 280,
    uploadedAt: createMockDate(1),
    helpfulCount: 19,
    tags: ["녹턴", "서정적"],
    faceBlurred: true,
  },
  {
    id: "v13",
    roomId: "room-yonsei",
    userId: "user-13",
    userName: "익명 #78",
    piece: { composer: "F. Chopin", title: "Nocturne Op.9 No.2" },
    section: "전곡",
    duration: 275,
    uploadedAt: createMockDate(2),
    helpfulCount: 14,
    tags: ["녹턴"],
    faceBlurred: true,
  },
  {
    id: "v14",
    roomId: "room-yonsei",
    userId: "user-14",
    userName: "익명 #145",
    piece: { composer: "C. Debussy", title: "Clair de Lune" },
    section: "전곡",
    duration: 310,
    uploadedAt: createMockDate(3),
    helpfulCount: 26,
    tags: ["인상주의", "페달링"],
    faceBlurred: true,
  },
  {
    id: "v15",
    roomId: "room-yonsei",
    userId: "user-15",
    userName: "익명 #89",
    piece: { composer: "C. Debussy", title: "Clair de Lune" },
    section: "전곡",
    duration: 305,
    uploadedAt: createMockDate(4),
    helpfulCount: 21,
    tags: ["달빛"],
    faceBlurred: false,
  },
  // 이화여대 (자유곡) 영상들
  {
    id: "v16",
    roomId: "room-ewha",
    userId: "user-16",
    userName: "익명 #23",
    piece: { composer: "F. Schubert", title: "Impromptu Op.90 No.4" },
    section: "전곡",
    duration: 420,
    uploadedAt: createMockDate(1),
    helpfulCount: 17,
    tags: ["즉흥곡", "아르페지오"],
    faceBlurred: true,
  },
  {
    id: "v17",
    roomId: "room-ewha",
    userId: "user-17",
    userName: "익명 #67",
    piece: { composer: "F. Schubert", title: "Impromptu Op.90 No.4" },
    section: "전곡",
    duration: 415,
    uploadedAt: createMockDate(2),
    helpfulCount: 12,
    tags: ["슈베르트"],
    faceBlurred: true,
  },
];

// 현재 유저의 멤버십 정보 (테스트용)
export const mockCurrentUserMembership: Record<string, RoomMembership> = {
  "room-snu": {
    roomId: "room-snu",
    userId: "current-user",
    uploadedPieceIds: ["snu-1"], // 쇼팽 발라드 1번만 업로드함
    uploadedPieces: [],
    joinedAt: "2025-12-01",
  },
  "room-knua": {
    roomId: "room-knua",
    userId: "current-user",
    uploadedPieceIds: [],
    uploadedPieces: [],
    joinedAt: "2025-12-05",
  },
  "room-yonsei": {
    roomId: "room-yonsei",
    userId: "current-user",
    uploadedPieceIds: [],
    uploadedPieces: [{ composer: "F. Chopin", title: "Nocturne Op.9 No.2" }],
    joinedAt: "2025-12-10",
  },
  "room-ewha": {
    roomId: "room-ewha",
    userId: "current-user",
    uploadedPieceIds: [],
    uploadedPieces: [],
    joinedAt: "2025-12-15",
  },
};

// Helper functions
export function getSchoolById(id: string): School | undefined {
  return mockSchools.find((s) => s.id === id);
}

export function getRoomBySchoolId(schoolId: string): Room | undefined {
  return mockRooms.find((r) => r.schoolId === schoolId);
}

export function getRoomById(roomId: string): Room | undefined {
  return mockRooms.find((r) => r.id === roomId);
}

export function getVideosByRoomId(roomId: string): RoomVideo[] {
  return mockRoomVideos.filter((v) => v.roomId === roomId);
}

export function getPieceUploaderCount(
  roomId: string,
  pieceId: string | null,
  piece: FreePiece | null,
  school: School
): number {
  const videos = getVideosByRoomId(roomId);

  if (school.type === "designated" && pieceId) {
    return new Set(videos.filter((v) => v.pieceId === pieceId).map((v) => v.userId)).size;
  }

  if (piece) {
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "");
    return new Set(
      videos
        .filter(
          (v) =>
            normalize(v.piece.composer) === normalize(piece.composer) &&
            normalize(v.piece.title) === normalize(piece.title)
        )
        .map((v) => v.userId)
    ).size;
  }

  return 0;
}
