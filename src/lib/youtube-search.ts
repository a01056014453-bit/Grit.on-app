/**
 * YouTube Data API v3 — 추천 연주 영상 검색
 * 연주자 + 곡명으로 실제 YouTube 영상 URL 획득
 */

const API_KEY = process.env.YOUTUBE_API_KEY || "";
const BASE_URL = "https://www.googleapis.com/youtube/v3/search";

interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channelTitle: string;
  url: string;
}

/**
 * 연주자 + 곡명으로 YouTube 영상 검색
 * @returns 가장 관련성 높은 영상 1개의 URL, 실패 시 검색 페이지 URL
 */
export async function searchYouTubeVideo(
  artist: string,
  composer: string,
  pieceTitle: string,
): Promise<YouTubeSearchResult | null> {
  if (!API_KEY) return null;

  try {
    const query = `${artist} ${composer} ${pieceTitle}`;
    const params = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "video",
      maxResults: "1",
      videoCategoryId: "10", // Music 카테고리
      key: API_KEY,
    });

    const res = await fetch(`${BASE_URL}?${params}`);
    if (!res.ok) return null;

    const data = await res.json();
    const item = data.items?.[0];

    if (!item?.id?.videoId) return null;

    return {
      videoId: item.id.videoId,
      title: item.snippet?.title ?? "",
      channelTitle: item.snippet?.channelTitle ?? "",
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    };
  } catch {
    return null;
  }
}

/**
 * 여러 연주자의 YouTube 영상을 병렬 검색
 * @returns artist → url 매핑
 */
export async function searchYouTubeVideos(
  performances: { artist: string }[],
  composer: string,
  pieceTitle: string,
): Promise<Record<string, string>> {
  if (!API_KEY) return {};

  const results = await Promise.allSettled(
    performances.map(async (perf) => {
      const result = await searchYouTubeVideo(perf.artist, composer, pieceTitle);
      return { artist: perf.artist, url: result?.url ?? "" };
    }),
  );

  const urlMap: Record<string, string> = {};
  for (const result of results) {
    if (result.status === "fulfilled" && result.value.url) {
      urlMap[result.value.artist] = result.value.url;
    }
  }
  return urlMap;
}
