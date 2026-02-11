import type { AnalyzedPiece, PieceSearchResult } from "@/types/piece";

// AI 분석 완료된 곡 목록
export const analyzedPieces: AnalyzedPiece[] = [
  {
    id: "piece_001",
    composer: {
      fullName: "Frédéric Chopin",
      shortName: "F. Chopin",
      nationality: "Polish",
    },
    title: "Ballade No.1",
    opus: "Op.23",
    key: "G minor",
    nickname: null,
    analysisStatus: "completed",
    createdAt: "2026-02-11T00:00:00Z",
  },
  {
    id: "piece_002",
    composer: {
      fullName: "Ludwig van Beethoven",
      shortName: "L. v. Beethoven",
      nationality: "German",
    },
    title: "Piano Sonata No.8",
    opus: "Op.13",
    key: "C minor",
    nickname: "Pathétique",
    analysisStatus: "completed",
    createdAt: "2026-02-11T00:00:00Z",
  },
  {
    id: "piece_003",
    composer: {
      fullName: "Claude Debussy",
      shortName: "C. Debussy",
      nationality: "French",
    },
    title: "Suite Bergamasque",
    opus: "L.75",
    movement: 3,
    movementTitle: "Clair de Lune",
    key: "D-flat major",
    nickname: "Clair de Lune",
    analysisStatus: "completed",
    createdAt: "2026-02-11T00:00:00Z",
  },
  {
    id: "piece_004",
    composer: {
      fullName: "Franz Liszt",
      shortName: "F. Liszt",
      nationality: "Hungarian",
    },
    title: "Grandes études de Paganini",
    opus: "S.141",
    movement: 3,
    key: "G-sharp minor",
    nickname: "La Campanella",
    analysisStatus: "completed",
    createdAt: "2026-02-11T00:00:00Z",
  },
  {
    id: "piece_005",
    composer: {
      fullName: "Frédéric Chopin",
      shortName: "F. Chopin",
      nationality: "Polish",
    },
    title: "Fantaisie-Impromptu",
    opus: "Op.66",
    key: "C-sharp minor",
    nickname: null,
    analysisStatus: "completed",
    createdAt: "2026-02-11T00:00:00Z",
  },
];

// 곡 표시 이름 생성
export function getDisplayName(piece: AnalyzedPiece): string {
  const parts = [piece.composer.shortName, piece.title, piece.opus];
  if (piece.movement) {
    parts.push(`No.${piece.movement}`);
  }
  return parts.join(" ");
}

// 검색용 데이터로 변환
export function getPieceSearchResults(): PieceSearchResult[] {
  return analyzedPieces.map((piece) => ({
    id: piece.id,
    displayName: getDisplayName(piece),
    composer: piece.composer.shortName,
    hasAnalysis: piece.analysisStatus === "completed",
  }));
}

// ID로 곡 찾기
export function getPieceById(id: string): AnalyzedPiece | undefined {
  return analyzedPieces.find((p) => p.id === id);
}

// 작곡가로 곡 필터링
export function getPiecesByComposer(composerShortName: string): AnalyzedPiece[] {
  return analyzedPieces.filter(
    (p) => p.composer.shortName.toLowerCase() === composerShortName.toLowerCase()
  );
}

// 분석 완료된 곡 수
export function getAnalyzedCount(): number {
  return analyzedPieces.filter((p) => p.analysisStatus === "completed").length;
}

// 메타데이터
export const pieceMetadata = {
  totalCount: analyzedPieces.length,
  analyzedCount: getAnalyzedCount(),
  lastUpdated: "2026-02-11T14:51:50Z",
};
