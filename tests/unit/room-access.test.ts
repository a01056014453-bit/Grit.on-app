import { describe, it, expect } from "vitest";
import {
  canViewVideo,
  getViewableVideos,
  groupVideosByPiece,
  getSamePieceUploaderCount,
  findSimilarPieces,
} from "@/lib/room-access";
import type { RoomMembership, RoomVideo, School } from "@/types";

// ─── 테스트 팩토리 ───

function makeMembership(overrides: Partial<RoomMembership> = {}): RoomMembership {
  return {
    userId: "user-1",
    roomId: "room-1",
    uploadedPieceIds: [],
    uploadedPieces: [],
    ...overrides,
  } as RoomMembership;
}

function makeVideo(overrides: Partial<RoomVideo> = {}): RoomVideo {
  return {
    id: "video-1",
    userId: "user-2",
    pieceId: null,
    piece: { composer: "Chopin", title: "Ballade No.1" },
    ...overrides,
  } as RoomVideo;
}

function makeSchool(overrides: Partial<School> = {}): School {
  return {
    id: "school-1",
    name: "Test School",
    type: "free",
    ...overrides,
  } as School;
}

describe("canViewVideo", () => {
  it("멤버십 없으면 볼 수 없음", () => {
    const video = makeVideo();
    const school = makeSchool();
    expect(canViewVideo(null, video, school)).toBe(false);
  });

  it("자기가 올린 영상은 항상 볼 수 있음", () => {
    const membership = makeMembership({ userId: "user-1" });
    const video = makeVideo({ userId: "user-1" });
    const school = makeSchool();
    expect(canViewVideo(membership, video, school)).toBe(true);
  });

  it("지정곡 학교: 같은 pieceId 업로드한 경우 볼 수 있음", () => {
    const membership = makeMembership({
      userId: "user-1",
      uploadedPieceIds: ["piece-A"],
    });
    const video = makeVideo({ userId: "user-2", pieceId: "piece-A" });
    const school = makeSchool({ type: "designated" });
    expect(canViewVideo(membership, video, school)).toBe(true);
  });

  it("지정곡 학교: 다른 pieceId는 볼 수 없음", () => {
    const membership = makeMembership({
      userId: "user-1",
      uploadedPieceIds: ["piece-B"],
    });
    const video = makeVideo({ userId: "user-2", pieceId: "piece-A" });
    const school = makeSchool({ type: "designated" });
    expect(canViewVideo(membership, video, school)).toBe(false);
  });

  it("자유곡 학교: 같은 작곡가+제목이면 볼 수 있음", () => {
    const membership = makeMembership({
      userId: "user-1",
      uploadedPieces: [{ composer: "Chopin", title: "Ballade No.1" }],
    });
    const video = makeVideo({
      userId: "user-2",
      piece: { composer: "chopin", title: "ballade no.1" },
    });
    const school = makeSchool({ type: "free" });
    expect(canViewVideo(membership, video, school)).toBe(true);
  });

  it("자유곡 학교: 대소문자/공백 무시하여 비교", () => {
    const membership = makeMembership({
      userId: "user-1",
      uploadedPieces: [{ composer: "BEETHOVEN", title: "Sonata  No. 14" }],
    });
    const video = makeVideo({
      userId: "user-2",
      piece: { composer: "beethoven", title: "sonatano.14" },
    });
    const school = makeSchool({ type: "free" });
    expect(canViewVideo(membership, video, school)).toBe(true);
  });
});

describe("getViewableVideos", () => {
  it("볼 수 있는 영상만 필터링", () => {
    const membership = makeMembership({
      userId: "user-1",
      uploadedPieces: [{ composer: "Bach", title: "Prelude" }],
    });
    const school = makeSchool({ type: "free" });

    const videos = [
      makeVideo({ id: "v1", userId: "user-1", piece: { composer: "Any", title: "Any" } }),
      makeVideo({ id: "v2", userId: "user-2", piece: { composer: "Bach", title: "Prelude" } }),
      makeVideo({ id: "v3", userId: "user-2", piece: { composer: "Mozart", title: "Sonata" } }),
    ];

    const result = getViewableVideos(videos, membership, school);
    expect(result.map((v) => v.id)).toEqual(["v1", "v2"]);
  });
});

describe("groupVideosByPiece", () => {
  it("같은 곡 영상을 그룹화", () => {
    const membership = makeMembership({
      userId: "user-1",
      uploadedPieces: [{ composer: "Chopin", title: "Etude" }],
    });
    const school = makeSchool({ type: "free" });
    const videos = [
      makeVideo({ id: "v1", userId: "user-2", piece: { composer: "Chopin", title: "Etude" } }),
      makeVideo({ id: "v2", userId: "user-3", piece: { composer: "chopin", title: "etude" } }),
      makeVideo({ id: "v3", userId: "user-4", piece: { composer: "Mozart", title: "Sonata" } }),
    ];

    const groups = groupVideosByPiece(videos, membership, school);
    expect(groups.length).toBe(2);

    // 영상 수 많은 순
    expect(groups[0].videos.length).toBe(2);
    expect(groups[0].uploaderCount).toBe(2);
    expect(groups[1].videos.length).toBe(1);
  });
});

describe("getSamePieceUploaderCount", () => {
  it("같은 곡 업로드자 수를 반환 (자유곡)", () => {
    const school = makeSchool({ type: "free" });
    const videos = [
      makeVideo({ userId: "u1", piece: { composer: "Bach", title: "Prelude" } }),
      makeVideo({ userId: "u2", piece: { composer: "bach", title: "prelude" } }),
      makeVideo({ userId: "u1", piece: { composer: "Bach", title: "Prelude" } }), // 중복 유저
      makeVideo({ userId: "u3", piece: { composer: "Mozart", title: "Other" } }),
    ];

    const count = getSamePieceUploaderCount(
      videos,
      null,
      { composer: "Bach", title: "Prelude" },
      school,
    );
    expect(count).toBe(2); // u1, u2만 (u1 중복 제외)
  });

  it("곡 정보 없으면 0 반환", () => {
    const school = makeSchool({ type: "free" });
    expect(getSamePieceUploaderCount([], null, null, school)).toBe(0);
  });
});

describe("findSimilarPieces", () => {
  it("유사한 곡을 점수순으로 반환", () => {
    const videos = [
      makeVideo({ userId: "u1", piece: { composer: "Chopin", title: "Ballade No.1" } }),
      makeVideo({ userId: "u2", piece: { composer: "Chopin", title: "Ballade No.2" } }),
      makeVideo({ userId: "u3", piece: { composer: "Mozart", title: "Sonata" } }),
    ];

    const results = findSimilarPieces(videos, "Chopin", "Ballade");
    expect(results.length).toBe(2);
    expect(results[0].composer).toBe("Chopin");
  });

  it("매칭 없으면 빈 배열", () => {
    const videos = [
      makeVideo({ userId: "u1", piece: { composer: "Bach", title: "Fugue" } }),
    ];

    const results = findSimilarPieces(videos, "Liszt", "Rhapsody");
    expect(results.length).toBe(0);
  });

  it("limit 파라미터 적용", () => {
    const videos = Array.from({ length: 10 }, (_, i) =>
      makeVideo({
        userId: `u${i}`,
        piece: { composer: "Chopin", title: `Etude No.${i + 1}` },
      }),
    );

    const results = findSimilarPieces(videos, "Chopin", "Etude", 3);
    expect(results.length).toBe(3);
  });
});
