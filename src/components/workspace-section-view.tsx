'use client';

import { useEffect, useState } from 'react';

import type { WorkspaceSectionResponse } from '@/lib/codex-platform/types';

type WorkspaceSectionViewProps = {
  spaceId: string;
  sectionId: string;
};

function SectionState({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-black/20 p-6">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate-300">{body}</p>
    </section>
  );
}

export function WorkspaceSectionView({ spaceId, sectionId }: WorkspaceSectionViewProps) {
  const [section, setSection] = useState<WorkspaceSectionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadSection() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/internal/codex/project-spaces/${spaceId}/sections/${sectionId}`, {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`workspace_section_${response.status}`);
        }

        const payload = (await response.json()) as WorkspaceSectionResponse;
        if (!cancelled) {
          setSection(payload);
        }
      } catch (nextError) {
        if (!cancelled) {
          setSection(null);
          setError(nextError instanceof Error ? nextError.message : 'workspace_section_failed');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSection();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [sectionId, spaceId]);

  if (loading) {
    return <SectionState title="Loading section" body="正在从统一 section API 读取当前 workspace 面板。" />;
  }

  if (error || !section) {
    return <SectionState title="Section unavailable" body={`当前 section 读取失败：${error ?? 'unknown_error'}`} />;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{section.spaceId}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white">{section.title}</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">{section.summary}</p>

        {section.links.length ? (
          <div className="mt-5 flex flex-wrap gap-3">
            {section.links.map((item) => (
              <a
                key={`${item.kind}-${item.href}`}
                href={item.href}
                className="rounded-full border border-white/10 bg-black/15 px-4 py-2 text-xs tracking-[0.16em] text-slate-200 transition hover:border-cyan-300/30 hover:bg-cyan-300/10"
              >
                {item.label}
              </a>
            ))}
          </div>
        ) : null}
      </section>

      {section.compatibility.length ? (
        <section className="rounded-[1.75rem] border border-white/10 bg-black/20 p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Compatibility</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {section.compatibility.map((item) => (
              <a
                key={`${item.kind}-${item.href}`}
                href={item.href}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-amber-300/30 hover:bg-amber-300/10"
              >
                <p className="text-sm font-medium text-white">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">{item.href}</p>
              </a>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        {section.panels.map((item) => (
          <section key={item.id} className="rounded-[1.75rem] border border-white/10 bg-white/6 p-6 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{item.id.replace(/-/g, ' ')}</p>
            <h3 className="mt-3 text-xl font-semibold text-white">{item.title}</h3>
            {item.summary ? <p className="mt-3 text-sm leading-7 text-slate-400">{item.summary}</p> : null}
            <div className="mt-5 space-y-3">
              {item.records.map((entry) => (
                <div key={`${item.id}-${entry.title}-${entry.detail}`} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-white">{entry.title}</p>
                    {entry.href ? <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">link</span> : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{entry.detail}</p>
                  {entry.meta ? <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">{entry.meta}</p> : null}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
