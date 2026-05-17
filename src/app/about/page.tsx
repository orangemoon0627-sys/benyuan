import Link from "next/link";
import { ArrowUpRight, Download, Smartphone } from "lucide-react";

const accessItems = [
  "TestFlight 用于当前内测分发。",
  "网页端测试入口统一进入完整流程。",
  "正式上架后这里会切换为 App Store。",
];

export default function AboutPage() {
  return (
    <main className="benyuan-site-page benyuan-download-page">
      <div className="benyuan-site-space" aria-hidden>
        <span className="benyuan-site-orbit benyuan-site-orbit-a" />
        <span className="benyuan-site-orbit benyuan-site-orbit-b" />
        <span className="benyuan-site-starfield" />
      </div>

      <section className="benyuan-download-hero">
        <Link href="/" className="benyuan-download-brand">
          本源
          <span>Origin</span>
        </Link>
        <div className="benyuan-download-copy">
          <p>DOWNLOAD / TESTFLIGHT</p>
          <h1>把本源带回你的 iPhone。</h1>
          <span>完整体验包含 13 条线索、四轮剧场、精神星图和长图保存。Web 端作为入口，把测试流程和 App 保持在同一条轨道上。</span>
        </div>
        <div className="benyuan-download-device" aria-hidden>
          <div className="benyuan-download-moon" />
          <Smartphone className="h-10 w-10" />
        </div>
        <div className="benyuan-download-actions">
          <a className="benyuan-site-primary" href="https://testflight.apple.com/" target="_blank" rel="noreferrer">
            打开 TestFlight
            <Download aria-hidden className="h-4 w-4" />
          </a>
          <Link className="benyuan-site-secondary" href="/collect">
            进入完整测试
            <ArrowUpRight aria-hidden className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="benyuan-download-notes">
        {accessItems.map((item, index) => (
          <article key={item}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{item}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
