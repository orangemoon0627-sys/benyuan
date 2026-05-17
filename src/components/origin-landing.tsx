"use client";

import Link from "next/link";
import { ArrowDown, ArrowRight, Download, LogIn, Sparkles, UserRound } from "lucide-react";

const journeySteps = [
  {
    index: "01",
    title: "信息收集",
    text: "图像、歌单、珍视物、社交文字和选择题先汇成精神底图。",
    signal: "INPUT FIELD",
  },
  {
    index: "02",
    title: "剧场四轮",
    text: "四轮私小说选择从你的材料生长出来，补足欲望、边界和防御方式。",
    signal: "THEATER RUN",
  },
  {
    index: "03",
    title: "星图显影",
    text: "规则分型确定主星体，再生成当次独有的精神星图、路径与共鸣理由。",
    signal: "CONSTELLATION",
  },
];

const signalMarks = ["声音气候", "图像母题", "珍视物", "关系姿态", "时间重力", "欲望反应", "四轮选择"];

const archetypes = [
  { name: "远潮观月者", english: "Far-Tide Moon", theme: "月相 / 远海" },
  { name: "星图筑序者", english: "Star-Map Architect", theme: "轨道 / 秩序" },
  { name: "月港栖岸者", english: "Moon-Harbor", theme: "月港 / 暖岸" },
  { name: "存在游牧者", english: "Existential Nomad", theme: "深空 / 迁徙" },
  { name: "雨窗抒写者", english: "Rain-Window Scribe", theme: "低光 / 书写" },
  { name: "事件视界沉潜者", english: "Event Horizon", theme: "黑洞 / 边界" },
  { name: "星云织梦者", english: "Nebula Weaver", theme: "星云 / 未定形" },
  { name: "日冕引燃者", english: "Solar Corona", theme: "日冕 / 行动" },
  { name: "类地栖居者", english: "Terrestrial Planet", theme: "类地 / 栖居" },
  { name: "深空锚定者", english: "Deep Space Anchor", theme: "锚点 / 深空" },
];

export function OriginLanding() {
  return (
    <main className="benyuan-site-page">
      <div className="benyuan-site-space" aria-hidden>
        <span className="benyuan-site-orbit benyuan-site-orbit-a" />
        <span className="benyuan-site-orbit benyuan-site-orbit-b" />
        <span className="benyuan-site-starfield" />
      </div>

      <header className="benyuan-site-nav">
        <Link href="/" className="benyuan-site-brand" aria-label="本源首页">
          <span>本源</span>
          <i>Origin</i>
        </Link>
        <nav aria-label="本源官网导航">
          <a href="#entry">入口</a>
          <a href="#run">流程</a>
          <a href="#stars">星体</a>
          <Link href="/about">下载</Link>
        </nav>
        <div className="benyuan-site-nav-actions">
          <Link href="/collect" className="benyuan-site-icon-link">
            <UserRound aria-hidden className="h-4 w-4" />
            <span>账户</span>
          </Link>
          <Link href="/collect" className="benyuan-site-icon-link">
            <LogIn aria-hidden className="h-4 w-4" />
            <span>登录 / 注册</span>
          </Link>
          <Link href="/about" className="benyuan-site-icon-link">
            <Download aria-hidden className="h-4 w-4" />
            <span>下载</span>
          </Link>
        </div>
      </header>

      <section className="benyuan-site-hero" id="entry" aria-labelledby="benyuan-site-title">
        <div className="benyuan-site-hero-copy">
          <p className="benyuan-site-line">ORIGIN CONSTELLATION</p>
          <h1 id="benyuan-site-title">本源</h1>
          <p className="benyuan-site-slogan">其实在宇宙大爆炸的那一瞬间，你就已经诞生了。</p>
          <div className="benyuan-site-hero-inline-actions">
            <Link href="/collect" className="benyuan-site-primary">
              开始完整测试
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <a href="#run" className="benyuan-site-secondary">
              继续向下
              <ArrowDown aria-hidden className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="benyuan-site-hero-visual" aria-hidden>
          <div className="benyuan-site-eclipse">
            <span />
            <i />
          </div>
          <div className="benyuan-site-visual-caption">
            <strong>从首页直接进入测试</strong>
            <span>Web 版不再是说明页，而是一条可以向下推进的精神星图入口。</span>
          </div>
        </div>

        <div className="benyuan-site-hero-panel">
          <p>HOT</p>
          <h2>穿过线索、剧场与黑洞边界，最后显影你的主星体。</h2>
          <div className="benyuan-site-actions">
            <Link href="/collect" className="benyuan-site-primary">
              开始完整测试
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <a href="#run" className="benyuan-site-secondary">
              向下进入
              <ArrowDown aria-hidden className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="benyuan-site-run" id="run" aria-label="本源 Web 测试流程">
        <div className="benyuan-site-section-head">
          <p>THE RUN</p>
          <h2>官网本身就是测试游戏的第一道门。</h2>
        </div>
        <div className="benyuan-site-run-track">
          {journeySteps.map((step) => (
            <article key={step.index}>
              <span>{step.index}</span>
              <p>{step.signal}</p>
              <h3>{step.title}</h3>
              <em>{step.text}</em>
            </article>
          ))}
        </div>
      </section>

      <section className="benyuan-site-signal-stage" aria-label="本源采集信号">
        <div>
          <Sparkles aria-hidden className="h-5 w-5" />
          <h2>不是重新发明测试，而是把 App 当前核心流程搬到 Web 的纵向空间里。</h2>
        </div>
        <div className="benyuan-site-signal-river">
          {signalMarks.map((signal) => (
            <span key={signal}>{signal}</span>
          ))}
        </div>
      </section>

      <section className="benyuan-site-stars" id="stars" aria-label="本源十个固定主星体">
        <div className="benyuan-site-section-head benyuan-site-section-head-wide">
          <p>PRIMARY STARS</p>
          <h2>主星体保持固定十类，结果叙事由当次材料显影。</h2>
        </div>

        <div className="benyuan-site-star-focus">
          <div className="benyuan-site-featured-orb" aria-hidden>
            <span />
          </div>
          <div>
            <p>RULE FIRST</p>
            <h3>规则先定主星体，材料再决定这一次报告的温度、路径和推荐理由。</h3>
            <span>同样落在一个主星体，也不会拿到同一份固定模板。歌单、图片、社交文字和剧场选择会改变精神肖像的细节。</span>
          </div>
        </div>

        <div className="benyuan-site-star-grid">
          {archetypes.map((item, index) => (
            <article key={item.name}>
              <div className="benyuan-site-mini-orb" data-variant={index % 5} aria-hidden>
                <span />
              </div>
              <p>{item.theme}</p>
              <h3>{item.name}</h3>
              <span>{item.english}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="benyuan-site-cta">
        <div className="benyuan-site-cta-visual" aria-hidden>
          <span />
        </div>
        <div>
          <p>ENTER THE RUN</p>
          <h2>现在进入 Web 版测试。</h2>
          <span>下一屏开始信息收集，随后进入四轮剧场，并通过现有接口生成精神星图。</span>
        </div>
        <Link href="/collect" className="benyuan-site-primary">
          进入本源测试
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
