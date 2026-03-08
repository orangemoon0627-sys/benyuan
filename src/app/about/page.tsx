const notes = [
  "本源是一种理解性镜像，不构成心理或医学诊断。",
  "MVP 只覆盖审美语法、情感气候、时间哲学三个维度。",
  "如果输入信息较少，系统会主动降低结论强度。",
  "如果内容显示出明显高风险信号，结果会切换为更现实的支持性表达。",
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 md:py-16">
      <p className="text-xs tracking-[0.28em] text-amber-200/70 uppercase">method & boundary</p>
      <h1 className="mt-4 text-5xl text-stone-100 md:text-6xl">方法说明与边界</h1>
      <p className="mt-6 text-lg leading-8 text-stone-300">
        这一版产品刻意不追求“像量表一样权威”，而是追求更稳定的理解语言、更清楚的边界，以及更克制的结果表达。
      </p>
      <div className="mt-10 space-y-4">
        {notes.map((note) => (
          <div key={note} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-base leading-8 text-stone-200">
            {note}
          </div>
        ))}
      </div>
    </main>
  );
}
