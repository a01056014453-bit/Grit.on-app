"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Music, Sparkles, Loader2, AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { mockSongs, saveAnalyzedSong } from "@/data";
import type { SongAnalysis, AnalyzeSongResponse } from "@/types/song-analysis";
import { getDifficultyLabel, getVerificationLabel } from "@/types/song-analysis";
import { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import { AnalysisDisplay } from "@/components/analysis/analysis-display";
import { addToLibrary } from "@/lib/user-library";

/** 작곡가 초상화 (Wikimedia Commons, public domain) — Wikipedia API 기반 최신 URL */
const COMPOSER_PORTRAITS: Record<string, string> = {
  // 바로크
  bach: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Johann_Sebastian_Bach.jpg/250px-Johann_Sebastian_Bach.jpg",
  handel: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/George_Frideric_Handel_by_Balthasar_Denner.jpg/250px-George_Frideric_Handel_by_Balthasar_Denner.jpg",
  scarlatti: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Retrato_de_Domenico_Scarlatti.jpg/250px-Retrato_de_Domenico_Scarlatti.jpg",
  couperin: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Francois_Couperin_2.jpg/250px-Francois_Couperin_2.jpg",
  rameau: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Attribu%C3%A9_%C3%A0_Joseph_Aved%2C_Portrait_de_Jean-Philippe_Rameau_%28vers_1728%29_-_001.jpg/250px-Attribu%C3%A9_%C3%A0_Joseph_Aved%2C_Portrait_de_Jean-Philippe_Rameau_%28vers_1728%29_-_001.jpg",
  // 고전
  haydn: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Joseph_Haydn.jpg/250px-Joseph_Haydn.jpg",
  mozart: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/The_Mozart_Family_-_Wolfgang_Amadeus_Mozart_headshot.jpg/250px-The_Mozart_Family_-_Wolfgang_Amadeus_Mozart_headshot.jpg",
  beethoven: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Joseph_Karl_Stieler%27s_Beethoven_mit_dem_Manuskript_der_Missa_solemnis.jpg/250px-Joseph_Karl_Stieler%27s_Beethoven_mit_dem_Manuskript_der_Missa_solemnis.jpg",
  clementi: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Muzio_Clementi.jpeg/250px-Muzio_Clementi.jpeg",
  // 초기 낭만
  schubert: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Franz_Schubert_by_Wilhelm_August_Rieder_1875.jpg/250px-Franz_Schubert_by_Wilhelm_August_Rieder_1875.jpg",
  mendelssohn: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Felix_Mendelssohn_Bartholdy_by_Eduard_Magnus_%281833%29.jpg/250px-Felix_Mendelssohn_Bartholdy_by_Eduard_Magnus_%281833%29.jpg",
  schumann: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Robert_Schumann_1839.jpg/250px-Robert_Schumann_1839.jpg",
  chopin: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Frederic_Chopin_photo.jpeg/250px-Frederic_Chopin_photo.jpeg",
  liszt: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Franz_Liszt_by_Herman_Biow-_1843.png/250px-Franz_Liszt_by_Herman_Biow-_1843.png",
  alkan: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/Charles-Valentin_Alkan%2C_sitting.jpg/200px-Charles-Valentin_Alkan%2C_sitting.jpg",
  // 후기 낭만
  brahms: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/JohannesBrahms.jpg/250px-JohannesBrahms.jpg",
  tchaikovsky: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Tchaikovsky_by_Reutlinger_%28cropped%29.jpg/250px-Tchaikovsky_by_Reutlinger_%28cropped%29.jpg",
  grieg: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Edvard_Grieg_portrait_%28cropped%29.jpg/250px-Edvard_Grieg_portrait_%28cropped%29.jpg",
  dvorak: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Dvorak.jpg/250px-Dvorak.jpg",
  franck: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/C%C3%A9sar_Franck_by_Pierre_Petit.jpg/250px-C%C3%A9sar_Franck_by_Pierre_Petit.jpg",
  "saint-saens": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Saint-Sa%C3%ABns-circa-1880.jpg/250px-Saint-Sa%C3%ABns-circa-1880.jpg",
  mussorgsky: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Modest_M%C3%BAsorgski%2C_por_Ili%C3%A1_Repin.jpg/250px-Modest_M%C3%BAsorgski%2C_por_Ili%C3%A1_Repin.jpg",
  // 프랑스 인상주의 / 근대
  faure: "https://upload.wikimedia.org/wikipedia/en/thumb/1/1f/Faure1907.jpg/250px-Faure1907.jpg",
  debussy: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Claude_Debussy_by_Atelier_Nadar.jpg/250px-Claude_Debussy_by_Atelier_Nadar.jpg",
  ravel: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Maurice_Ravel_1925.jpg/250px-Maurice_Ravel_1925.jpg",
  satie: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Ericsatie.jpg/250px-Ericsatie.jpg",
  poulenc: "https://upload.wikimedia.org/wikipedia/en/thumb/b/b8/Poulenc-1922.jpg/220px-Poulenc-1922.jpg",
  // 러시아 / 동유럽
  rachmaninoff: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Sergei_Rachmaninoff_cph.3a40575.jpg/250px-Sergei_Rachmaninoff_cph.3a40575.jpg",
  rachmaninov: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Sergei_Rachmaninoff_cph.3a40575.jpg/250px-Sergei_Rachmaninoff_cph.3a40575.jpg",
  scriabin: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Scriabin_1909_Cropped.jpg/250px-Scriabin_1909_Cropped.jpg",
  prokofiev: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Sergei_Prokofiev_circa_1918_over_Chair_Bain.jpg/250px-Sergei_Prokofiev_circa_1918_over_Chair_Bain.jpg",
  shostakovich: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/%D0%9A%D0%BE%D0%BC%D0%BF%D0%BE%D0%B7%D0%B8%D1%82%D0%BE%D1%80_%D0%94%D0%BC%D0%B8%D1%82%D1%80%D0%B8%D0%B9_%D0%94%D0%BC%D0%B8%D1%82%D1%80%D0%B8%D0%B5%D0%B2%D0%B8%D1%87_%D0%A8%D0%BE%D1%81%D1%82%D0%B0%D0%BA%D0%BE%D0%B2%D0%B8%D1%87.jpg/250px-%D0%9A%D0%BE%D0%BC%D0%BF%D0%BE%D0%B7%D0%B8%D1%82%D0%BE%D1%80_%D0%94%D0%BC%D0%B8%D1%82%D1%80%D0%B8%D0%B9_%D0%94%D0%BC%D0%B8%D1%82%D1%80%D0%B8%D0%B5%D0%B2%D0%B8%D1%87_%D0%A8%D0%BE%D1%81%D1%82%D0%B0%D0%BA%D0%BE%D0%B2%D0%B8%D1%87.jpg",
  bartok: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Bart%C3%B3k_B%C3%A9la_1927.jpg/250px-Bart%C3%B3k_B%C3%A9la_1927.jpg",
  janacek: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Leo%C5%A1_Jan%C3%A1%C4%8Dek_el_1914.png/250px-Leo%C5%A1_Jan%C3%A1%C4%8Dek_el_1914.png",
  // 스페인
  albeniz: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Isaac_Alb%C3%A9niz%2C_de_Napoleon.jpg/250px-Isaac_Alb%C3%A9niz%2C_de_Napoleon.jpg",
  granados: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Granados.jpg/242px-Granados.jpg",
  // 20세기
  gershwin: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Portrait_of_George_Gershwin_LCCN2004662906.jpg/250px-Portrait_of_George_Gershwin_LCCN2004662906.jpg",
  barber: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Samuel_Barber.jpg/250px-Samuel_Barber.jpg",
  copland: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Aaron_Copland_1970.JPG/250px-Aaron_Copland_1970.JPG",
  messiaen: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Messiaen_Harcourt_1937_2.jpg/250px-Messiaen_Harcourt_1937_2.jpg",
};

function getComposerPortrait(composerName: string): string | null {
  const lower = composerName.toLowerCase();
  for (const [key, url] of Object.entries(COMPOSER_PORTRAITS)) {
    if (lower.includes(key)) return url;
  }
  return null;
}

function SongDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [analysis, setAnalysis] = useState<SongAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCached, setIsCached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  const songId = params.id as string;
  const song = mockSongs.find((s) => s.id === songId);

  const composerFromQuery = searchParams.get("composer");
  const titleFromQuery = searchParams.get("title");

  // mockSongs title에서 작곡가/곡명 자동 추출 (예: "F. Chopin Ballade Op.23 No.1")
  const extractComposerFromTitle = (fullTitle: string): { composer: string; title: string } => {
    const parts = fullTitle.split(" ");
    // 첫 2단어를 작곡가로 추출 (예: "F. Chopin", "L. v." → 3단어)
    if (parts.length >= 3 && parts[1].endsWith(".")) {
      // "L. v. Beethoven ..." 패턴
      return { composer: parts.slice(0, 3).join(" "), title: parts.slice(3).join(" ") };
    }
    if (parts.length >= 2) {
      return { composer: parts.slice(0, 2).join(" "), title: parts.slice(2).join(" ") };
    }
    return { composer: fullTitle, title: fullTitle };
  };

  const extracted = song ? extractComposerFromTitle(song.title) : null;
  const finalComposer = composerFromQuery || extracted?.composer || "";
  const finalTitle = titleFromQuery || extracted?.title || "";
  const songTitle = song?.title || (composerFromQuery && titleFromQuery
    ? `${composerFromQuery} ${titleFromQuery}`
    : titleFromQuery || "");

  const loadAIAnalysis = useCallback(async () => {
    if (!finalComposer || !finalTitle) {
      setIsLoading(false);
      setError("곡 정보가 부족합니다.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log("[AI Analysis V2] Calling API for:", finalComposer, finalTitle);

      setLoadingMessage("AI 분석 중...");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);

      const requestBody: Record<string, unknown> = { composer: finalComposer, title: finalTitle };

      const res = await fetch("/api/analyze-song-v2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data: AnalyzeSongResponse = await res.json();
        if (data.success && data.data) {
          console.log("[AI Analysis V2] Success - cached:", data.cached);
          setAnalysis(data.data);
          setIsCached(data.cached || false);
          // 사용자 보관함에 추가
          addToLibrary(data.data.meta.composer, data.data.meta.title);
        } else {
          setError(data.error || "분석에 실패했습니다.");
        }
      } else {
        setError(`서버 오류 (${res.status})`);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("분석 시간이 초과되었습니다. 다시 시도해주세요.");
      } else {
        setError("네트워크 오류가 발생했습니다.");
      }
      console.error("[AI Analysis V2] API call failed:", err);
    } finally {
      setIsLoading(false);
      setLoadingMessage(null);
    }
  }, [finalComposer, finalTitle]);

  useEffect(() => {
    loadAIAnalysis();
  }, [loadAIAnalysis]);

  useEffect(() => {
    if (analysis) {
      saveAnalyzedSong(analysis.meta.composer, analysis.meta.title, songId);
    }
  }, [songId, analysis]);

  if (!song && !titleFromQuery) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <p className="text-muted-foreground">곡을 찾을 수 없습니다.</p>
      </div>
    );
  }

  // 검증 상태 배지 컬러
  const getVerificationColor = (status: SongAnalysis["verification_status"]) => {
    switch (status) {
      case "Verified":
        return "bg-violet-100/60 text-violet-700";
      case "Needs Review":
        return "bg-violet-100/40 text-violet-500";
      default:
        return "bg-white/30 text-gray-600";
    }
  };

  const getVerificationIcon = (status: SongAnalysis["verification_status"]) => {
    switch (status) {
      case "Verified":
        return <CheckCircle className="w-3 h-3" />;
      case "Needs Review":
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return <Shield className="w-3 h-3" />;
    }
  };

  // 난이도 배지 컬러
  const getDifficultyColor = (level: SongAnalysis["meta"]["difficulty_level"]) => {
    switch (level) {
      case "Beginner":
        return "bg-violet-100/40 text-violet-500";
      case "Intermediate":
        return "bg-violet-100/50 text-violet-600";
      case "Advanced":
        return "bg-violet-100/60 text-violet-700";
      case "Virtuoso":
        return "bg-violet-200/60 text-violet-800";
      default:
        return "bg-white/30 text-gray-600";
    }
  };

  // 로딩 또는 에러 UI
  if (isLoading || (!analysis && !error)) {
    return (
      <div className="min-h-screen bg-blob-violet">
        <div className="px-4 py-6 max-w-lg mx-auto pb-24">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">AI 곡 분석</h1>
              <p className="text-xs text-gray-500">작품 정보와 연주 가이드</p>
            </div>
          </div>
          <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-sm mb-6">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white/60 backdrop-blur-sm flex items-center justify-center shadow-md">
                  <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
                </div>
              </div>
              <div className="text-center mt-2">
                <p className="font-semibold text-gray-900">AI가 곡을 분석하고 있습니다</p>
                <p className="text-sm text-gray-500 mt-1">{songTitle}</p>
                {loadingMessage && (
                  <p className="text-xs text-violet-500 mt-2 animate-pulse">{loadingMessage}</p>
                )}
              </div>
            </div>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/30 backdrop-blur-sm rounded-2xl border border-white/30 mb-4 p-5">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-full bg-white/40 animate-pulse" />
                <div className="w-28 h-5 bg-white/40 rounded-lg animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="w-full h-4 bg-white/30 rounded animate-pulse" />
                <div className="w-5/6 h-4 bg-white/30 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 에러 UI
  if (error && !analysis) {
    return (
      <div className="min-h-screen bg-blob-violet">
        <div className="px-4 py-6 max-w-lg mx-auto pb-24">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">AI 곡 분석</h1>
            </div>
          </div>
          <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-white/50 shadow-sm text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="font-semibold text-gray-900 mb-2">분석 실패</p>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <button
              onClick={loadAIAnalysis}
              className="px-6 py-2.5 rounded-xl bg-violet-600 text-white font-medium text-sm hover:bg-violet-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="min-h-screen bg-blob-violet">
      <div className="px-4 py-6 max-w-lg mx-auto pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm border border-white/40 flex items-center justify-center hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">AI 곡 분석</h1>
            <p className="text-xs text-gray-500">작품 정보와 연주 가이드</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Song Title Card */}
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-6 shadow-sm border border-white/50 mb-6">
          <div className="flex items-start gap-4">
            {getComposerPortrait(analysis.meta.composer) ? (
              <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border-2 border-white/60 shadow-md">
                <Image
                  src={getComposerPortrait(analysis.meta.composer)!}
                  alt={analysis.meta.composer}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-violet-200/50 flex items-center justify-center shrink-0 border-2 border-white/60">
                <Music className="w-8 h-8 text-violet-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{analysis.meta.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{analysis.meta.composer}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${getDifficultyColor(analysis.meta.difficulty_level)}`}>
                  {getDifficultyLabel(analysis.meta.difficulty_level)}
                </span>
                {analysis.meta.key && (
                  <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                    {analysis.meta.key}
                  </span>
                )}
                <span className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 ${getVerificationColor(analysis.verification_status)}`}>
                  {getVerificationIcon(analysis.verification_status)}
                  {getVerificationLabel(analysis.verification_status)}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-gray-100">
            <div className="bg-violet-50/50 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-gray-900">{analysis.meta.opus || "-"}</p>
              <p className="text-xs text-gray-500 mt-0.5">작품번호</p>
            </div>
            <div className="bg-violet-50/50 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-gray-900">{analysis.meta.key || "-"}</p>
              <p className="text-xs text-gray-500 mt-0.5">조성</p>
            </div>
          </div>

          {isCached && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                저장된 분석 결과를 불러왔습니다
              </p>
            </div>
          )}

        </div>

        {/* Analysis Sections — schema_version 기반 자동 분기 */}
        <AnalysisDisplay analysis={analysis} />
      </div>
    </div>
  );
}

export default function SongDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-violet-50/50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
      </div>
    }>
      <SongDetailContent />
    </Suspense>
  );
}
