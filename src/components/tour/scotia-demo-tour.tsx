"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ScotiaDemoTab, ScotiaTourAction, ScotiaTourStep } from "./scotia-demo-tour-steps";
import { SCOTIA_DEMO_TOUR_STEPS } from "./scotia-demo-tour-steps";

const PAD = 10;
const CARD_W = 300;
const CARD_H = 148;
const GAP = 14;

interface ScotiaDemoTourProps {
  active: boolean;
  steps?: ScotiaTourStep[];
  stepIndex: number;
  onStepChange: (index: number) => void;
  onTabChange: (tab: ScotiaDemoTab) => void;
  onAction?: (action: ScotiaTourAction) => void;
  onComplete: () => void;
  onDismiss: () => void;
}

function buildClipPath(rect: DOMRect): string {
  const x = Math.max(0, rect.left - PAD);
  const y = Math.max(0, rect.top - PAD);
  const w = rect.width + PAD * 2;
  const h = rect.height + PAD * 2;
  const W = window.innerWidth;
  const H = window.innerHeight;
  const x2 = x + w;
  const y2 = y + h;

  return `polygon(evenodd, 0 0, ${W}px 0, ${W}px ${H}px, 0 ${H}px, 0 0, ${x}px ${y}px, ${x2}px ${y}px, ${x2}px ${y2}px, ${x}px ${y2}px, ${x}px ${y}px)`;
}

function rectsOverlap(a: DOMRect, b: { top: number; left: number; width: number; height: number }): boolean {
  return !(a.right < b.left || a.left > b.left + b.width || a.bottom < b.top || a.top > b.top + b.height);
}

function pickCardPosition(rect: DOMRect, vw: number, vh: number): { top: number; left: number } {
  const frame = {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  };

  const candidates = [
    { top: frame.top + frame.height + GAP, left: frame.left },
    { top: Math.max(16, frame.top - CARD_H - GAP), left: frame.left },
    { top: frame.top, left: frame.left + frame.width + GAP },
    { top: frame.top, left: frame.left - CARD_W - GAP },
    { top: 16, left: vw - CARD_W - 16 },
    { top: vh - CARD_H - 16, left: 16 },
    { top: 16, left: 16 },
  ];

  const frameRect = new DOMRect(frame.left, frame.top, frame.width, frame.height);

  for (const c of candidates) {
    const clamped = {
      top: Math.min(Math.max(16, c.top), vh - CARD_H - 16),
      left: Math.min(Math.max(16, c.left), vw - CARD_W - 16),
      width: CARD_W,
      height: CARD_H,
    };
    if (!rectsOverlap(frameRect, clamped)) {
      return { top: clamped.top, left: clamped.left };
    }
  }

  return { top: Math.max(16, vh - CARD_H - 16), left: Math.max(16, vw - CARD_W - 16) };
}

export function ScotiaDemoTour({
  active,
  steps = SCOTIA_DEMO_TOUR_STEPS,
  stepIndex,
  onStepChange,
  onTabChange,
  onAction,
  onComplete,
  onDismiss,
}: ScotiaDemoTourProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [dragPos, setDragPos] = useState<{ top: number; left: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; originTop: number; originLeft: number } | null>(null);
  const step = steps[stepIndex];

  const refreshTarget = useCallback(() => {
    if (!step?.target) {
      setRect(null);
      return;
    }
    document.querySelectorAll(".scotia-tour-target--active").forEach((el) => el.classList.remove("scotia-tour-target--active"));
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (el) {
      el.classList.add("scotia-tour-target--active");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      requestAnimationFrame(() => setRect(el.getBoundingClientRect()));
    } else {
      setRect(null);
    }
    setViewport({ w: window.innerWidth, h: window.innerHeight });
  }, [step?.target]);

  useEffect(() => {
    setDragPos(null);
  }, [stepIndex]);

  useEffect(() => {
    if (!active || !step) return;
    if (step.tab) onTabChange(step.tab);
    if (step.action) onAction?.(step.action);
    const t1 = setTimeout(refreshTarget, 150);
    const t2 = setTimeout(refreshTarget, 500);
    const t3 = setTimeout(refreshTarget, step.action ? 900 : 500);
    window.addEventListener("resize", refreshTarget);
    window.addEventListener("scroll", refreshTarget, true);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("resize", refreshTarget);
      window.removeEventListener("scroll", refreshTarget, true);
    };
  }, [active, step, stepIndex, onTabChange, onAction, refreshTarget]);

  useEffect(() => {
    if (!active) {
      document.querySelectorAll(".scotia-tour-target--active").forEach((el) => el.classList.remove("scotia-tour-target--active"));
    }
  }, [active]);

  const onDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    const card = e.currentTarget.closest(".scotia-tour-card") as HTMLElement;
    if (!card) return;
    const box = card.getBoundingClientRect();
    dragRef.current = { startX: e.clientX, startY: e.clientY, originTop: box.top, originLeft: box.left };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setDragPos({
      top: dragRef.current.originTop + dy,
      left: dragRef.current.originLeft + dx,
    });
  };

  const onDragEnd = () => {
    dragRef.current = null;
  };

  if (!active || !step) return null;

  const isLast = stepIndex >= steps.length - 1;
  const frameTop = rect ? rect.top - PAD : 0;
  const frameLeft = rect ? rect.left - PAD : 0;
  const frameW = rect ? rect.width + PAD * 2 : 0;
  const frameH = rect ? rect.height + PAD * 2 : 0;

  const autoPos =
    rect && viewport.w ? pickCardPosition(rect, viewport.w, viewport.h) : { top: viewport.h / 2 - 74, left: viewport.w / 2 - 150 };

  const cardStyle: React.CSSProperties = dragPos
    ? { top: dragPos.top, left: dragPos.left, width: CARD_W }
    : rect
      ? { top: autoPos.top, left: autoPos.left, width: CARD_W }
      : {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: CARD_W,
        };

  return (
    <>
      {!rect || !viewport.w ? (
        <motionDiv className="scotia-tour-backdrop scotia-tour-backdrop--full" onClick={onDismiss} aria-hidden />
      ) : (
        <motionDiv
          className="scotia-tour-backdrop"
          style={{ clipPath: buildClipPath(rect), WebkitClipPath: buildClipPath(rect) }}
          onClick={onDismiss}
          aria-hidden
        />
      )}

      {rect && (
        <motionDiv
          className="scotia-tour-frame"
          style={{ top: frameTop, left: frameLeft, width: frameW, height: frameH }}
          aria-hidden
        />
      )}

      <motionDiv className="scotia-tour-card scotia-tour-card--compact" style={cardStyle}>
        <div
          className="scotia-tour-drag"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <span className={`scotia-tour-module scotia-tour-module--${step.module.toLowerCase()}`}>
            Módulo {step.module} · {step.stepInModule}/{step.totalInModule}
          </span>
          <span className="scotia-tour-drag-hint">Arrastra</span>
          <button type="button" className="scotia-tour-close" onClick={onDismiss} aria-label="Cerrar guía">
            ×
          </button>
        </div>

        <h3 className="scotia-tour-title">{step.title}</h3>
        <p className="scotia-tour-hint">{step.hint}</p>

        <div className="scotia-tour-actions">
          <span className="scotia-tour-progress">
            {stepIndex + 1}/{steps.length}
          </span>
          {stepIndex > 0 && (
            <button type="button" className="lim-btn-ghost lim-btn-sm" onClick={() => onStepChange(stepIndex - 1)}>
              ←
            </button>
          )}
          <button
            type="button"
            className="lim-btn-primary lim-btn-sm"
            onClick={() => {
              if (isLast) onComplete();
              else onStepChange(stepIndex + 1);
            }}
          >
            {isLast ? "Listo" : "Siguiente →"}
          </button>
        </div>
      </motionDiv>
    </>
  );
}

function motionDiv({
  className,
  style,
  onClick,
  "aria-hidden": ariaHidden,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  "aria-hidden"?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={className} style={style} onClick={onClick} aria-hidden={ariaHidden}>
      {children}
    </div>
  );
}

export type { ScotiaDemoTab, ScotiaTourAction, ScotiaTourStep };
