import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Paper Focus",
  description: "上传论文或网页链接，生成结构化重点总结与深度解读。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="background-glow" />
        <header className="site-header">
          <div className="site-header__inner">
            <Link className="brand" href="/">
              Paper Focus
            </Link>
            <nav className="site-nav">
              <Link href="/">首页</Link>
              <Link href="/app">工作台</Link>
              <Link href="/comparisons/new">多论文对比</Link>
            </nav>
          </div>
        </header>
        <main className="page-shell">{children}</main>
      </body>
    </html>
  );
}
