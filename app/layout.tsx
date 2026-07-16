import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://github-neofetch.vercel.app"),
  title: "GitHub Neofetch",
  description: "把 GitHub 公开资料渲染成一张可分享的终端风格名片。",
  openGraph: {
    title: "GitHub Neofetch",
    description: "把 GitHub 公开资料渲染成一张可分享的终端风格名片。",
    type: "website",
    siteName: "GitHub Neofetch"
  },
  twitter: { card: "summary_large_image" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
