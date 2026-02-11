// 학교 유형
export type SchoolType = "designated" | "free";

// 학교 정보
export interface School {
  id: string;
  name: string; // "서울대학교"
  shortName: string; // "서울대"
  type: SchoolType;
  year: number; // 2026
  deadline: string; // "2026-02-15"
  designatedPieces?: DesignatedPiece[]; // 지정곡 학교만
}

// 지정곡
export interface DesignatedPiece {
  id: string;
  composer: string; // "F. Chopin"
  title: string; // "Ballade No.1 Op.23"
  fullName: string; // "F. Chopin - Ballade No.1 Op.23"
  category?: string; // "낭만", "바로크" 등
  difficulty?: "상" | "중" | "하";
}

// 자유곡 입력 (유저가 직접 입력)
export interface FreePiece {
  composer: string;
  title: string;
}

// 입시룸
export interface Room {
  id: string;
  schoolId: string;
  school: School;
  memberCount: number;
  videoCount: number;
  createdAt: string;
}

// 업로드된 영상
export interface RoomVideo {
  id: string;
  roomId: string;
  userId: string;
  userName: string; // "익명 #127"
  pieceId?: string; // 지정곡인 경우
  piece: {
    // 곡 정보 (지정/자유 모두)
    composer: string;
    title: string;
  };
  section: string; // "1-36 마디" 또는 "전곡"
  duration: number;
  uploadedAt: string;
  helpfulCount: number;
  tags: string[];
  faceBlurred: boolean;
}

// 유저의 룸 참여 정보
export interface RoomMembership {
  roomId: string;
  userId: string;
  uploadedPieceIds: string[]; // 업로드한 곡 ID (지정곡)
  uploadedPieces: FreePiece[]; // 업로드한 곡 (자유곡)
  joinedAt: string;
}

// 학교 유형 라벨
export const SCHOOL_TYPE_LABELS: Record<SchoolType, string> = {
  designated: "지정곡",
  free: "자유곡",
};

// 학교 유형 색상
export const SCHOOL_TYPE_COLORS: Record<SchoolType, string> = {
  designated: "bg-violet-100 text-violet-700",
  free: "bg-blue-100 text-blue-700",
};
