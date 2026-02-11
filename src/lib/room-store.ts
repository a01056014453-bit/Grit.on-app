import type {
  School,
  Room,
  RoomVideo,
  RoomMembership,
  FreePiece,
} from "@/types";
import {
  mockSchools,
  mockRooms,
  mockRoomVideos,
  mockCurrentUserMembership,
} from "@/data/mock-schools";

const STORAGE_KEYS = {
  MEMBERSHIPS: "room-memberships",
  VIDEOS: "room-videos",
} as const;

const CURRENT_USER_ID = "current-user";

// localStorage 헬퍼
function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function setToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or other error
  }
}

// 학교 관련
export function getSchools(): School[] {
  return mockSchools;
}

export function getSchoolById(id: string): School | null {
  return mockSchools.find((s) => s.id === id) ?? null;
}

// 룸 관련
export function getRooms(): Room[] {
  return mockRooms;
}

export function getRoomBySchoolId(schoolId: string): Room | null {
  return mockRooms.find((r) => r.schoolId === schoolId) ?? null;
}

export function getRoomById(roomId: string): Room | null {
  return mockRooms.find((r) => r.id === roomId) ?? null;
}

// 영상 관련
export function getRoomVideos(roomId: string): RoomVideo[] {
  // localStorage에서 추가된 영상 가져오기
  const storedVideos = getFromStorage<RoomVideo[]>(STORAGE_KEYS.VIDEOS, []);
  const additionalVideos = storedVideos.filter((v) => v.roomId === roomId);

  // Mock 데이터와 합치기
  const mockVideosForRoom = mockRoomVideos.filter((v) => v.roomId === roomId);

  return [...mockVideosForRoom, ...additionalVideos];
}

export function addRoomVideo(video: RoomVideo): void {
  const storedVideos = getFromStorage<RoomVideo[]>(STORAGE_KEYS.VIDEOS, []);
  storedVideos.push(video);
  setToStorage(STORAGE_KEYS.VIDEOS, storedVideos);
}

// 멤버십 관련
export function getUserMembership(roomId: string): RoomMembership | null {
  // localStorage에서 멤버십 가져오기
  const storedMemberships = getFromStorage<Record<string, RoomMembership>>(
    STORAGE_KEYS.MEMBERSHIPS,
    {}
  );

  if (storedMemberships[roomId]) {
    return storedMemberships[roomId];
  }

  // Mock 데이터에서 가져오기
  return mockCurrentUserMembership[roomId] ?? null;
}

export function joinRoom(roomId: string): RoomMembership {
  const storedMemberships = getFromStorage<Record<string, RoomMembership>>(
    STORAGE_KEYS.MEMBERSHIPS,
    {}
  );

  // 이미 참여 중인 경우
  if (storedMemberships[roomId]) {
    return storedMemberships[roomId];
  }

  // Mock 데이터에 있는 경우
  if (mockCurrentUserMembership[roomId]) {
    return mockCurrentUserMembership[roomId];
  }

  // 새 멤버십 생성
  const membership: RoomMembership = {
    roomId,
    userId: CURRENT_USER_ID,
    uploadedPieceIds: [],
    uploadedPieces: [],
    joinedAt: new Date().toISOString(),
  };

  storedMemberships[roomId] = membership;
  setToStorage(STORAGE_KEYS.MEMBERSHIPS, storedMemberships);

  return membership;
}

export function isRoomJoined(roomId: string): boolean {
  const membership = getUserMembership(roomId);
  return membership !== null;
}

// 업로드 처리 (멤버십 업데이트)
export function saveUserUpload(
  roomId: string,
  video: RoomVideo,
  pieceId?: string,
  freePiece?: FreePiece
): void {
  // 영상 저장
  addRoomVideo(video);

  // 멤버십 업데이트
  const storedMemberships = getFromStorage<Record<string, RoomMembership>>(
    STORAGE_KEYS.MEMBERSHIPS,
    {}
  );

  let membership = storedMemberships[roomId] ?? mockCurrentUserMembership[roomId];

  if (!membership) {
    // 참여하지 않은 룸이면 먼저 참여
    membership = joinRoom(roomId);
  }

  // 업로드한 곡 추가
  if (pieceId && !membership.uploadedPieceIds.includes(pieceId)) {
    membership.uploadedPieceIds.push(pieceId);
  }

  if (freePiece) {
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "");
    const alreadyUploaded = membership.uploadedPieces.some(
      (p) =>
        normalize(p.composer) === normalize(freePiece.composer) &&
        normalize(p.title) === normalize(freePiece.title)
    );

    if (!alreadyUploaded) {
      membership.uploadedPieces.push(freePiece);
    }
  }

  storedMemberships[roomId] = membership;
  setToStorage(STORAGE_KEYS.MEMBERSHIPS, storedMemberships);
}

// 유저가 업로드한 곡인지 확인
export function hasUploadedPiece(
  roomId: string,
  pieceId: string | null,
  freePiece: FreePiece | null
): boolean {
  const membership = getUserMembership(roomId);
  if (!membership) return false;

  if (pieceId) {
    return membership.uploadedPieceIds.includes(pieceId);
  }

  if (freePiece) {
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, "");
    return membership.uploadedPieces.some(
      (p) =>
        normalize(p.composer) === normalize(freePiece.composer) &&
        normalize(p.title) === normalize(freePiece.title)
    );
  }

  return false;
}

// 참여 중인 룸 목록
export function getJoinedRooms(): Room[] {
  return mockRooms.filter((room) => isRoomJoined(room.id));
}

// 스토리지 초기화 (테스트용)
export function resetRoomStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.MEMBERSHIPS);
  localStorage.removeItem(STORAGE_KEYS.VIDEOS);
}
