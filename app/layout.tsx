import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "保守思想解析システム — 保守度診断",
  description: "あなたの思想は、どこに属するのか。",
  openGraph: {
    title: "保守思想解析システム",
    description: "あなたの思想は、どこに属するのか。",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="washi-noise">{children}</body>
    </html>
  );
}
