"use client";

import { useEffect, useRef, useState } from "react";

const PROCESSING_STATUSES = new Set(["PROCESSING", "UPLOADED", "SENT_TO_BDA"]);
const FAILED_STATUSES = new Set(["FAILED", "REJECTED"]);
/** Carga lenta esperada (~2–3 s) mientras el servidor procesa. */
const PROCESS_MS = 2_800;
const WAIT_MS = 40_000;
/** Cierre suave a 100% cuando el servidor ya respondió (no salto brusco). */
const FINISH_MS = 850;
const MORADO_4 = "#271A59";
const START_PERCENT = 2;

export type AnalysisProgressMode = "consolidated-wait" | "document";

function easeOut(t: number, power = 2.6) {
  const clamped = Math.min(Math.max(t, 0), 1);
  return 1 - Math.pow(1 - clamped, power);
}

function finishingVisible(failed: boolean, completed: boolean, sawAnalyzing: boolean) {
  return sawAnalyzing && (failed || completed);
}

/** Porcentaje simulado mientras espera respuesta: arranca cerca de 0 y sube despacio. */
export function analysisBarPercent(elapsedMs: number, mode: AnalysisProgressMode) {
  if (mode === "consolidated-wait") {
    return START_PERCENT + 48 * easeOut(elapsedMs / WAIT_MS, 1.7);
  }
  // Documento: ~2% → ~92% en ~2.8 s (no llega a 100 hasta el finish suave)
  return START_PERCENT + 90 * easeOut(elapsedMs / PROCESS_MS, 2.4);
}

function AnimatedEllipsis() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const id = window.setInterval(() => {
      setCount((current) => (current % 3) + 1);
    }, 420);
    return () => window.clearInterval(id);
  }, []);

  return <span aria-hidden>{ ".".repeat(count) }</span>;
}

function narrativeLabel(params: {
  mode: AnalysisProgressMode;
  status?: string | null;
  manualDecision?: string | null;
  elapsedMs: number;
  finishing: boolean;
  settled: boolean;
}) {
  if (params.manualDecision === "APPROVED") return { text: "Completado", ellipsis: false };
  if (params.manualDecision === "REJECTED") return { text: "Rechazado", ellipsis: false };
  if (FAILED_STATUSES.has(params.status ?? "")) return { text: "Fallido", ellipsis: false };
  if (params.status === "MANUAL_REVIEW_REQUIRED") return { text: "Revisión manual", ellipsis: false };
  if (params.settled && params.status === "COMPLETED") return { text: "Completado", ellipsis: false };
  if (params.finishing || params.status === "COMPLETED") return { text: "Completando", ellipsis: true };

  if (params.mode === "consolidated-wait") {
    if (params.elapsedMs < 8_000) return { text: "Recibiendo PDF", ellipsis: true };
    if (params.elapsedMs < 20_000) return { text: "Analizando estructura", ellipsis: true };
    return { text: "Análisis de Cortex", ellipsis: true };
  }

  // Ventana corta (~2–3 s) alineada a PROCESS_MS
  if (params.elapsedMs < 900) return { text: "Recibiendo PDF", ellipsis: true };
  if (params.elapsedMs < 2_000) return { text: "Analizando estructura", ellipsis: true };
  return { text: "Completando", ellipsis: true };
}

export function DocumentAnalysisProgressBar({
  trackId,
  status,
  manualDecision,
  mode = "document",
  variant = "tailwind",
}: {
  trackId: string;
  status?: string | null;
  manualDecision?: string | null;
  mode?: AnalysisProgressMode;
  variant?: "tailwind" | "mdc";
}) {
  const analyzing = mode === "consolidated-wait" || PROCESSING_STATUSES.has(status ?? "");
  const failed = FAILED_STATUSES.has(status ?? "") || status === "MANUAL_REVIEW_REQUIRED";
  const completed = status === "COMPLETED" || manualDecision === "APPROVED";
  const seenAnalyzingRef = useRef(analyzing);
  if (analyzing) seenAnalyzingRef.current = true;
  const visible = analyzing || finishingVisible(failed, completed, seenAnalyzingRef.current);

  const startedAtRef = useRef<number>(Date.now());
  const trackRef = useRef(trackId);
  const percentRef = useRef(START_PERCENT);
  const [percent, setPercent] = useState(START_PERCENT);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (trackRef.current === trackId) return;
    trackRef.current = trackId;
    startedAtRef.current = Date.now();
    seenAnalyzingRef.current = mode === "consolidated-wait" || PROCESSING_STATUSES.has(status ?? "");
    percentRef.current = START_PERCENT;
    setPercent(START_PERCENT);
    setElapsedMs(0);
    setFinishing(false);
    setSettled(false);
  }, [mode, status, trackId]);

  useEffect(() => {
    if (!visible) return undefined;

    if (completed && percentRef.current >= 99.5) {
      setSettled(true);
      setFinishing(false);
      setPercent(100);
      return undefined;
    }

    if (completed && !settled) {
      setFinishing(true);
      const from = Math.max(percentRef.current, START_PERCENT);
      const started = performance.now();
      // Si el servidor respondió muy rápido (barra aún baja), un poco más de tiempo para no “saltar”
      const duration = from < 40 ? FINISH_MS + 400 : FINISH_MS;
      let frame = 0;
      const tick = (now: number) => {
        const t = Math.min((now - started) / duration, 1);
        const next = from + (100 - from) * easeOut(t, 2.2);
        percentRef.current = next;
        setPercent(next);
        if (t < 1) {
          frame = window.requestAnimationFrame(tick);
          return;
        }
        percentRef.current = 100;
        setPercent(100);
        setFinishing(false);
        setSettled(true);
      };
      frame = window.requestAnimationFrame(tick);
      return () => window.cancelAnimationFrame(frame);
    }

    if (failed || settled) return undefined;

    const id = window.setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      setElapsedMs(elapsed);
      const next = Math.min(
        analysisBarPercent(elapsed, mode),
        mode === "consolidated-wait" ? 52 : 94,
      );
      if (next > percentRef.current) {
        percentRef.current = next;
        setPercent(next);
      }
    }, 50);

    return () => window.clearInterval(id);
  }, [completed, failed, mode, settled, visible]);

  if (!visible) return null;

  const label = narrativeLabel({
    mode,
    status,
    manualDecision,
    elapsedMs,
    finishing,
    settled,
  });
  const width = Math.min(Math.max(percent, START_PERCENT), 100);
  const barTone = failed
    ? variant === "mdc"
      ? "mdc-analysis-progress__fill mdc-analysis-progress__fill--error"
      : "bg-red-400"
    : variant === "mdc"
      ? "mdc-analysis-progress__fill"
      : "";

  const fillStyle =
    variant === "mdc"
      ? { width: `${width}%` }
      : failed
        ? { width: `${width}%` }
        : { width: `${width}%`, backgroundColor: MORADO_4 };

  if (variant === "mdc") {
    return (
      <div className="mdc-analysis-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(width)}>
        <div className="mdc-analysis-progress__copy">
          <span>
            {label.text}
            {label.ellipsis ? <AnimatedEllipsis /> : null}
          </span>
          <strong>{settled ? "Completed" : `${Math.round(width)}%`}</strong>
        </div>
        <div className="mdc-analysis-progress__track">
          <span className={barTone} style={fillStyle} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pt-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(width)}>
      <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-600">
        <span>
          {label.text}
          {label.ellipsis ? <AnimatedEllipsis /> : null}
        </span>
        <span className={settled ? "text-slate-700" : "tabular-nums text-slate-400"}>
          {settled ? "Completed" : `${Math.round(width)}%`}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-200/90">
        <div
          className={`h-full rounded-full transition-[width] duration-150 ease-out ${failed ? "bg-red-400" : ""}`}
          style={fillStyle}
        />
      </div>
    </div>
  );
}
