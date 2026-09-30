import type { Metadata } from "next";
import { Noto_Sans_SC, Noto_Serif_SC } from "next/font/google";
import "./globals.css";

/** 思源宋体（Noto Serif SC = Source Han Serif SC），展览标题 / 年号 / 地名 */
const display = Noto_Serif_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-display",
  display: "swap",
  // 关闭近似无衬线 fallback，缺字时落入 Songti/SimSun 真衬线
  adjustFontFallback: false,
});

const body = Noto_Sans_SC({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
  display: "swap",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "全景明朝 | 交互式历史时间轴",
  description:
    "穿越 1368–1644：沿明朝时间轴探索各朝皇帝、大事件与疆域变迁。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${display.variable} ${body.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
