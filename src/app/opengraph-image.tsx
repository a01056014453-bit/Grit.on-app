import { ImageResponse } from "next/og";

/**
 * OG 이미지 (1200×630) — 파일 컨벤션으로 자동으로 og:image / twitter:image에 연결됨.
 * satori 기본 폰트에 한글 글리프가 없어 텍스트는 영문으로 유지.
 */
export const runtime = "edge";
export const alt = "Sempre - 클래식 연습 코치";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
          color: "#FFFFFF",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 140,
            height: 140,
            borderRadius: 36,
            background: "rgba(255,255,255,0.15)",
            fontSize: 84,
            marginBottom: 40,
          }}
        >
          🎻
        </div>
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: -2 }}>
          Sempre
        </div>
        <div
          style={{
            fontSize: 34,
            marginTop: 20,
            opacity: 0.85,
            letterSpacing: 1,
          }}
        >
          AI Practice Coach for Classical Musicians
        </div>
      </div>
    ),
    { ...size },
  );
}
