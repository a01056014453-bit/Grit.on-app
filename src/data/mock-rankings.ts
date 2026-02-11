import type { RankingUser, InstrumentType } from "@/types";

// 현재 시간 기준으로 연습 시작 시간 생성
function getRandomPracticeStart(minutesAgo: number): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutesAgo);
  return date.toISOString();
}

// Mock 랭킹 데이터
export const mockRankingUsers: RankingUser[] = [
  {
    id: "u1",
    nickname: "피아노마스터",
    instrument: "piano",
    netPracticeTime: 7 * 3600 + 42 * 60 + 15, // 7:42:15
    isPracticing: true,
    practiceStartedAt: getRandomPracticeStart(127),
    currentSong: "F. Chopin Ballade Op.23 No.1",
    gritScore: 92,
    rank: 1,
  },
  {
    id: "u2",
    nickname: "쇼팽러버",
    instrument: "piano",
    netPracticeTime: 6 * 3600 + 58 * 60 + 32, // 6:58:32
    isPracticing: true,
    practiceStartedAt: getRandomPracticeStart(45),
    currentSong: "F. Chopin Nocturne Op.9 No.2",
    gritScore: 85,
    rank: 2,
  },
  {
    id: "u3",
    nickname: "바이올리니스트",
    instrument: "violin",
    netPracticeTime: 5 * 3600 + 23 * 60 + 48, // 5:23:48
    isPracticing: false,
    gritScore: 78,
    rank: 3,
  },
  {
    id: "u4",
    nickname: "첼로연습생",
    instrument: "cello",
    netPracticeTime: 4 * 3600 + 45 * 60 + 12, // 4:45:12
    isPracticing: true,
    practiceStartedAt: getRandomPracticeStart(88),
    currentSong: "J.S. Bach Cello Suite No.1",
    gritScore: 72,
    rank: 4,
  },
  {
    id: "u5",
    nickname: "플루티스트",
    instrument: "flute",
    netPracticeTime: 4 * 3600 + 12 * 60 + 33, // 4:12:33
    isPracticing: false,
    gritScore: 65,
    rank: 5,
  },
  {
    id: "u6",
    nickname: "클래식기타맨",
    instrument: "guitar",
    netPracticeTime: 3 * 3600 + 56 * 60 + 21, // 3:56:21
    isPracticing: true,
    practiceStartedAt: getRandomPracticeStart(32),
    currentSong: "F. Tárrega Recuerdos de la Alhambra",
    gritScore: 58,
    rank: 6,
  },
  {
    id: "u7",
    nickname: "성악가지망",
    instrument: "vocal",
    netPracticeTime: 3 * 3600 + 28 * 60 + 45, // 3:28:45
    isPracticing: false,
    gritScore: 52,
    rank: 7,
  },
  {
    id: "u8",
    nickname: "리스트덕후",
    instrument: "piano",
    netPracticeTime: 3 * 3600 + 15 * 60 + 8, // 3:15:08
    isPracticing: true,
    practiceStartedAt: getRandomPracticeStart(67),
    currentSong: "F. Liszt La Campanella",
    gritScore: 48,
    rank: 8,
  },
  {
    id: "u9",
    nickname: "클라리넷초보",
    instrument: "clarinet",
    netPracticeTime: 2 * 3600 + 45 * 60 + 22, // 2:45:22
    isPracticing: false,
    gritScore: 42,
    rank: 9,
  },
  {
    id: "u10",
    nickname: "드뷔시팬",
    instrument: "piano",
    netPracticeTime: 2 * 3600 + 18 * 60 + 55, // 2:18:55
    isPracticing: true,
    practiceStartedAt: getRandomPracticeStart(15),
    currentSong: "C. Debussy Clair de Lune",
    gritScore: 35,
    rank: 10,
  },
];

// 상위 N명 가져오기
export function getTopRankers(count: number = 5): RankingUser[] {
  return mockRankingUsers.slice(0, count);
}

// 현재 연습 중인 유저들 가져오기
export function getPracticingUsers(): RankingUser[] {
  return mockRankingUsers.filter((u) => u.isPracticing);
}

// 특정 유저의 랭킹 가져오기
export function getUserRank(userId: string): RankingUser | undefined {
  return mockRankingUsers.find((u) => u.id === userId);
}

// 현재 유저의 오늘 랭킹 (mock)
export const currentUserRanking: RankingUser = {
  id: "current-user",
  nickname: "나",
  instrument: "piano",
  netPracticeTime: 1 * 3600 + 35 * 60 + 42, // 1:35:42
  isPracticing: false,
  gritScore: 28,
  rank: 15,
};
