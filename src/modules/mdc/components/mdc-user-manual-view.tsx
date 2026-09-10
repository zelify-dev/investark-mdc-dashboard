"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import manual from "@/modules/mdc/data/mdc-user-manual.json";

import "./mdc-user-manual-view.css";

type ManualBlock = {
  type: "paragraph" | "heading" | "step" | "figure";
  text?: string;
  caption?: string;
  src?: string | null;
};

type ManualSection = {
  id: string;
  title: string;
  page: number;
  blocks: ManualBlock[];
};

const sections = manual.sections as ManualSection[];

function ManualBlocks({
  section,
  onOpenFigure,
}: {
  section: ManualSection;
  onOpenFigure: (src: string, caption: string) => void;
}) {
  return (
    <>
      {section.blocks.map((block, index) => {
        if (block.type === "figure") {
          return (
            <figure key={`${section.id}-fig-${index}`} className="mdc-manual-figure">
              {block.src ? (
                <button
                  type="button"
                  className="mdc-manual-figure__btn"
                  onClick={() => onOpenFigure(block.src as string, block.caption || "Figura del manual")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={block.src} alt={block.caption || "Figura del manual"} />
                  <span>Ver imagen</span>
                </button>
              ) : null}
              {block.caption ? <figcaption>{block.caption}</figcaption> : null}
            </figure>
          );
        }

        if (block.type === "step" || block.type === "heading") {
          return (
            <h3 key={`${section.id}-h-${index}`} className="mdc-manual-article__sub">
              {block.text}
            </h3>
          );
        }

        return (
          <p key={`${section.id}-p-${index}`} className="mdc-manual-article__p">
            {block.text}
          </p>
        );
      })}
    </>
  );
}

export function MdcUserManualView() {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [lightbox, setLightbox] = useState<{ src: string; caption: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const clickingRef = useRef(false);

  const activeIndex = Math.max(0, sections.findIndex((section) => section.id === activeId));
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter((section) => section.title.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (clickingRef.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const nextId = visible[0]?.target.id;
        if (nextId) setActiveId(nextId);
      },
      { root, rootMargin: "-12% 0px -72% 0px", threshold: 0 }
    );

    const nodes = sections
      .map((section) => root.querySelector<HTMLElement>(`#${CSS.escape(section.id)}`))
      .filter((node): node is HTMLElement => Boolean(node));
    nodes.forEach((node) => observer.observe(node));

    const onScroll = () => {
      const max = root.scrollHeight - root.clientHeight;
      setProgress(max > 0 ? Math.min(100, (root.scrollTop / max) * 100) : 0);
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      root.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    const activeButton = document.querySelector<HTMLButtonElement>(".mdc-manual-toc__item.is-active");
    activeButton?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  function goToSection(id: string) {
    const root = scrollRef.current;
    const target = root?.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!root || !target) return;
    clickingRef.current = true;
    setActiveId(id);
    root.scrollTo({ top: Math.max(0, target.offsetTop - 12), behavior: "smooth" });
    window.setTimeout(() => {
      clickingRef.current = false;
    }, 500);
  }

  function goRelative(delta: number) {
    const next = sections[activeIndex + delta];
    if (next) goToSection(next.id);
  }

  return (
    <div className="zelify-workspace-page mdc-manual-page">
      <ZelifyTopNavbar variant="mdc" />
      <div className="mdc-manual-page__body">
        <aside className="mdc-manual-toc" aria-label="Secciones del manual">
          <p className="mdc-manual-toc__eyebrow">Manual de usuario</p>
          <h1 className="mdc-manual-toc__title">{manual.title}</h1>
          <p className="mdc-manual-toc__sub">{manual.subtitle}</p>
          <label className="mdc-manual-search">
            <span>Buscar sección</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="KYC, pagos, sucursales…"
            />
          </label>
          <nav className="mdc-manual-toc__nav">
            {filtered.map((section) => {
              const index = sections.findIndex((item) => item.id === section.id);
              return (
                <button
                  key={section.id}
                  type="button"
                  className={`mdc-manual-toc__item${section.id === activeId ? " is-active" : ""}`}
                  onClick={() => goToSection(section.id)}
                >
                  <em>{String(index + 1).padStart(2, "0")}</em>
                  <span>{section.title}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="mdc-manual-scroll" ref={scrollRef}>
          <div className="mdc-manual-progress" aria-hidden>
            <i style={{ width: `${progress}%` }} />
          </div>

          <header className="mdc-manual-hero">
            <p>MDC · Tulana Finanzas</p>
            <h2>Manual operativo del Motor MDC</h2>
            <span>
              Recorre el documento completo. El índice de la izquierda se queda fijo y marca la sección en la que estás.
            </span>
          </header>

          {sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className={`mdc-manual-section${section.id === activeId ? " is-current" : ""}`}
            >
              <header className="mdc-manual-article__head">
                <p>Sección {index + 1} de {sections.length}</p>
                <h2>{section.title}</h2>
              </header>
              <ManualBlocks section={section} onOpenFigure={(src, caption) => setLightbox({ src, caption })} />
            </section>
          ))}

          <div className="mdc-manual-pager">
            <button type="button" onClick={() => goRelative(-1)} disabled={activeIndex <= 0}>
              Anterior
            </button>
            <span>{activeIndex + 1} / {sections.length}</span>
            <button type="button" onClick={() => goRelative(1)} disabled={activeIndex >= sections.length - 1}>
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {lightbox ? (
        <div className="mdc-manual-lightbox" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}>
          <div className="mdc-manual-lightbox__card" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.src} alt={lightbox.caption} />
            <p>{lightbox.caption}</p>
            <button type="button" onClick={() => setLightbox(null)}>Cerrar</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
