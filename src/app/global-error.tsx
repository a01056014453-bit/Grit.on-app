"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 360, padding: "0 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1
            style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 8 }}
          >
            앱에 문제가 발생했습니다
          </h1>
          <p
            style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}
          >
            잠시 후 다시 시도해주세요.
          </p>
          <button
            onClick={reset}
            style={{
              padding: "12px 24px",
              backgroundColor: "#7c3aed",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
