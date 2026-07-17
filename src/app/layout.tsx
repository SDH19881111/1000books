import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "📚 천권 읽기 프로젝트",
  description: "소율이의 1000권 읽기 독서 여행! 책을 읽고 도장을 찍어 보상을 받아요.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={notoSansKR.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-pink-50 min-h-screen font-noto">
        <div className="max-w-md mx-auto min-h-screen bg-gradient-to-b from-pink-50 via-yellow-50 to-mint-50 relative overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
