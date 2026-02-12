import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "GRIT.ON - 클래식 연습 코치",
    template: "%s | GRIT.ON",
  },
  description: "AI 기반 클래식 음악 연습 지원 앱. 체계적인 연습 계획과 실시간 분석으로 실력을 향상시키세요.",
  keywords: ["클래식", "음악", "연습", "코치", "AI", "바이올린", "피아노", "음악교육", "연습실", "음악분석"],
  authors: [{ name: "GRIT.ON Team" }],
  creator: "GRIT.ON",
  publisher: "GRIT.ON",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GRIT.ON",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://griton-app.vercel.app",
    siteName: "GRIT.ON",
    title: "GRIT.ON - 클래식 연습 코치",
    description: "AI 기반 클래식 음악 연습 지원 앱. 체계적인 연습 계획과 실시간 분석으로 실력을 향상시키세요.",
    images: [
      {
        url: "https://griton-app.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "GRIT.ON - 클래식 연습 코치",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GRIT.ON - 클래식 연습 코치",
    description: "AI 기반 클래식 음악 연습 지원 앱. 체계적인 연습 계획과 실시간 분석으로 실력을 향상시키세요.",
    images: ["https://griton-app.vercel.app/og-image.png"],
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${montserrat.variable} antialiased`}>{children}</body>
    </html>
  );
}
