import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import SplashWrapper from "@/components/SplashWrapper";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Sempre - 클래식 연습 코치",
    template: "%s | Sempre",
  },
  description: "AI 기반 클래식 음악 연습 지원 앱. 체계적인 연습 계획과 실시간 분석으로 실력을 향상시키세요.",
  keywords: ["클래식", "음악", "연습", "코치", "AI", "바이올린", "피아노", "음악교육", "연습실", "음악분석"],
  authors: [{ name: "Sempre Team" }],
  creator: "Sempre",
  publisher: "Sempre",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sempre",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://withsempre.com",
    siteName: "Sempre",
    title: "Sempre - 클래식 연습 코치",
    description: "AI 기반 클래식 음악 연습 지원 앱. 체계적인 연습 계획과 실시간 분석으로 실력을 향상시키세요.",
    // og 이미지는 src/app/opengraph-image.tsx 파일 컨벤션으로 자동 생성됨
  },
  twitter: {
    card: "summary_large_image",
    title: "Sempre - 클래식 연습 코치",
    description: "AI 기반 클래식 음악 연습 지원 앱. 체계적인 연습 계획과 실시간 분석으로 실력을 향상시키세요.",
    // twitter 이미지는 opengraph-image를 자동 사용
  },
  verification: {
    google: "63odlgaGdt4Q_LHdQkbnyxYneAaZ9YaSf3_3qpvHVro",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#8B5CF6",
};

const isDev = process.env.NODE_ENV === "development";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${montserrat.variable} antialiased`}>
        {/* 과거 목업 데이터 1회성 마이그레이션 스크립트는 출시 전 제거됨.
            (신규 방문자의 첫 로드에서 SW unregister + 캐시 전체 삭제가 일어나
            PWA 설치성·오프라인 캐시를 해치던 문제) */}
        {isDev && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    registrations.forEach(function(registration) {
                      registration.unregister();
                    });
                  });
                  if ('caches' in window) {
                    caches.keys().then(function(names) {
                      names.forEach(function(name) { caches.delete(name); });
                    });
                  }
                }
              `,
            }}
          />
        )}
        {/* ✅ 스플래시 화면 래퍼 - YAMNet 모델 로드 중 표시 */}
        <SplashWrapper>
          {children}
        </SplashWrapper>
      </body>
    </html>
  );
}
