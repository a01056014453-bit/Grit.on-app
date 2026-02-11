import type { RoomMembership, RoomVideo, School, FreePiece } from "@/types";

// 문자열 정규화 (비교용)
const normalize = (s: string): string => s.toLowerCase().replace(/\s+/g, "");

// 동일곡 상호열람 판별
export function canViewVideo(
  userMembership: RoomMembership | null,
  video: RoomVideo,
  school: School
): boolean {
  // 멤버십이 없으면 볼 수 없음
  if (!userMembership) return false;

  // 자기가 올린 영상은 항상 볼 수 있음
  if (video.userId === userMembership.userId) return true;

  // 지정곡 학교: pieceId 비교
  if (school.type === "designated" && video.pieceId) {
    return userMembership.uploadedPieceIds.includes(video.pieceId);
  }

  // 자유곡 학교: composer + title 비교 (정규화)
  return userMembership.uploadedPieces.some(
    (p) =>
      normalize(p.composer) === normalize(video.piece.composer) &&
      normalize(p.title) === normalize(video.piece.title)
  );
}

// 내가 볼 수 있는 영상 필터링
export function getViewableVideos(
  videos: RoomVideo[],
  userMembership: RoomMembership | null,
  school: School
): RoomVideo[] {
  return videos.filter((v) => canViewVideo(userMembership, v, school));
}

// 곡별 영상 그룹핑
export interface PieceGroup {
  pieceId: string | null;
  piece: {
    composer: string;
    title: string;
    fullName?: string;
    category?: string;
  };
  videos: RoomVideo[];
  uploaderCount: number;
  canView: boolean;
}

export function groupVideosByPiece(
  videos: RoomVideo[],
  userMembership: RoomMembership | null,
  school: School
): PieceGroup[] {
  const groups = new Map<string, PieceGroup>();

  for (const video of videos) {
    // 그룹 키 생성
    const key =
      school.type === "designated" && video.pieceId
        ? video.pieceId
        : `${normalize(video.piece.composer)}-${normalize(video.piece.title)}`;

    if (!groups.has(key)) {
      // 지정곡인 경우 학교 데이터에서 추가 정보 가져오기
      let fullName: string | undefined;
      let category: string | undefined;

      if (school.type === "designated" && video.pieceId) {
        const designatedPiece = school.designatedPieces?.find(
          (p) => p.id === video.pieceId
        );
        if (designatedPiece) {
          fullName = designatedPiece.fullName;
          category = designatedPiece.category;
        }
      }

      groups.set(key, {
        pieceId: video.pieceId ?? null,
        piece: {
          composer: video.piece.composer,
          title: video.piece.title,
          fullName,
          category,
        },
        videos: [],
        uploaderCount: 0,
        canView: false,
      });
    }

    groups.get(key)!.videos.push(video);
  }

  // 각 그룹에 대해 업로더 수 및 접근 권한 계산
  for (const group of groups.values()) {
    // 고유 업로더 수 계산
    const uniqueUploaders = new Set(group.videos.map((v) => v.userId));
    group.uploaderCount = uniqueUploaders.size;

    // 접근 권한 계산
    group.canView = canViewVideo(userMembership, group.videos[0], school);
  }

  // 영상 수 많은 순으로 정렬
  return Array.from(groups.values()).sort(
    (a, b) => b.videos.length - a.videos.length
  );
}

// 동일곡 업로드자 수 조회
export function getSamePieceUploaderCount(
  videos: RoomVideo[],
  pieceId: string | null,
  piece: FreePiece | null,
  school: School
): number {
  if (school.type === "designated" && pieceId) {
    const uniqueUploaders = new Set(
      videos.filter((v) => v.pieceId === pieceId).map((v) => v.userId)
    );
    return uniqueUploaders.size;
  }

  if (piece) {
    const uniqueUploaders = new Set(
      videos
        .filter(
          (v) =>
            normalize(v.piece.composer) === normalize(piece.composer) &&
            normalize(v.piece.title) === normalize(piece.title)
        )
        .map((v) => v.userId)
    );
    return uniqueUploaders.size;
  }

  return 0;
}

// 유사곡 찾기 (자유곡 학교에서 사용)
export interface SimilarPiece {
  composer: string;
  title: string;
  uploaderCount: number;
}

export function findSimilarPieces(
  videos: RoomVideo[],
  inputComposer: string,
  inputTitle: string,
  limit: number = 5
): SimilarPiece[] {
  const normalizedInput = {
    composer: normalize(inputComposer),
    title: normalize(inputTitle),
  };

  // 기존 영상들에서 곡 정보 추출
  const pieceMap = new Map<string, SimilarPiece>();

  for (const video of videos) {
    const key = `${normalize(video.piece.composer)}-${normalize(video.piece.title)}`;

    if (!pieceMap.has(key)) {
      pieceMap.set(key, {
        composer: video.piece.composer,
        title: video.piece.title,
        uploaderCount: 0,
      });
    }

    // 고유 사용자만 카운트하기 위해 Set 사용해야 하지만, 간단하게 처리
    pieceMap.get(key)!.uploaderCount++;
  }

  // 유사도 점수 계산 (간단한 부분 문자열 매칭)
  const results: Array<{ piece: SimilarPiece; score: number }> = [];

  for (const piece of pieceMap.values()) {
    const normalizedPiece = {
      composer: normalize(piece.composer),
      title: normalize(piece.title),
    };

    let score = 0;

    // 작곡가명 매칭
    if (normalizedPiece.composer.includes(normalizedInput.composer)) score += 2;
    if (normalizedInput.composer.includes(normalizedPiece.composer)) score += 1;

    // 곡명 매칭
    if (normalizedPiece.title.includes(normalizedInput.title)) score += 2;
    if (normalizedInput.title.includes(normalizedPiece.title)) score += 1;

    if (score > 0) {
      results.push({ piece, score });
    }
  }

  // 점수 높은 순으로 정렬 후 반환
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.piece);
}
