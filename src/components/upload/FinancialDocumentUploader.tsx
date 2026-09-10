"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, File as FileIcon, Loader2, MoreHorizontal, UploadCloud, X } from "lucide-react";
import {
  fetchFinanceRequestById,
  type DocumentMatch,
  type FinancialDocumentProgress,
  type FinancialDocumentProgressDocument,
  type MdcApiError,
} from "@/modules/mdc/services/mdc-finance-requests.service";
import { useDeleteDocument, useDocumentProgress, useReplaceDocument, useUploadConsolidatedPayroll, useUploadOneDocument, isDocumentAnalyzing } from "@/modules/mdc/hooks/use-financial-documents";
import { documentMatchBadge } from "@/modules/mdc/lib/document-match-ui";

interface FinancialDocumentUploaderProps {
  userId?: string | null;
  financeRequestId?: string | null;
  onClose: () => void;
}

type AlertState = { message: string; type: "error" | "success" | "info"; step?: string; detail?: string } | null;
type DocumentCategory = "nomina" | "extracto" | "comprobante_domicilio";
type PayrollUploadMode = "individual" | "consolidated";
type UploadTarget = { category: DocumentCategory; slotIndex: number; mode: "upload" | "replace"; documentId?: string } | { category: "nomina"; slotIndex: 0; mode: "consolidated" };
type DeleteTarget = { category: DocumentCategory; documentId: string; label: string } | null;

type NominaSlot = {
  index: number;
  label: string;
  document?: FinancialDocumentProgressDocument;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type FinanceRequestLookup = {
  user?: {
    id?: string;
  };
  data?: {
    user?: {
      id?: string;
    };
  };
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getDocumentError(error: unknown, fallback: string) {
  const typed = error && typeof error === "object" ? error as Partial<MdcApiError> : null;
  return {
    message: typed?.message || fallback,
    step: typed?.step,
    detail: typed?.detail,
  };
}

function isUuid(value?: string | null): value is string {
  return Boolean(value && UUID_RE.test(value));
}

function extractUserIdFromFinanceRequest(payload: FinanceRequestLookup): string | null {
  const direct = payload?.user?.id;
  const nested = payload?.data?.user?.id;
  if (isUuid(direct)) return direct;
  if (isUuid(nested)) return nested;
  return null;
}

function statusLabel(status?: string | null, manualDecision?: string | null) {
  if (manualDecision === "APPROVED") return "Aprobado manualmente";
  if (manualDecision === "REJECTED") return "Rechazado manualmente";
  switch (status) {
    case "COMPLETED":
      return "Completado";
    case "PROCESSING":
    case "UPLOADED":
    case "SENT_TO_BDA":
      return "Analizando…";
    case "MANUAL_REVIEW_REQUIRED":
      return "Revisión manual";
    case "FAILED":
      return "Fallido";
    case "REJECTED":
      return "Rechazado";
    default:
      return "Pendiente";
  }
}

function statusClassName(status?: string | null, manualDecision?: string | null) {
  if (manualDecision === "APPROVED") return "bg-emerald-50 text-emerald-700";
  if (manualDecision === "REJECTED") return "bg-red-50/70 text-red-600";
  switch (status) {
    case "COMPLETED":
      return "bg-[#75fa4c]/10 text-slate-700";
    case "PROCESSING":
      return "bg-slate-200/80 text-slate-600";
    case "MANUAL_REVIEW_REQUIRED":
      return "bg-slate-200/80 text-slate-600";
    case "FAILED":
    case "REJECTED":
      return "bg-red-50/70 text-red-600";
    default:
      return "bg-slate-200/80 text-slate-500";
  }
}

function KycMatchChip({ match }: { match?: DocumentMatch | null }) {
  const badge = documentMatchBadge(match);
  if (!badge || !match) return null;
  return (
    <span
      title={match.note}
      className={`inline-flex h-7 shrink-0 items-center justify-center whitespace-nowrap rounded-md px-2 text-center text-[9.5px] font-semibold tracking-wide ${badge.chipClassName}`}
    >
      {badge.label}
    </span>
  );
}

/** Menú ⋮ en portal — evita recorte por overflow del modal. */
function DocumentActionsMenu({
  open,
  onToggle,
  onClose,
  disabled,
  ariaLabel,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  disabled?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      setPos(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 168;
    const menuHeight = 96;
    const gap = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < menuHeight + 16 ? rect.top - menuHeight - gap : rect.bottom + gap;
    const left = Math.min(Math.max(12, rect.right - menuWidth), window.innerWidth - menuWidth - 12);
    setPos({ top, left });
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        className="flex h-8 w-8 items-center justify-center border-0 bg-transparent text-slate-500 shadow-none outline-none ring-0 transition hover:text-slate-800 disabled:opacity-60"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Cerrar menú"
                className="fixed inset-0 z-[220] cursor-default border-0 bg-transparent"
                onClick={onClose}
              />
              <div
                role="menu"
                className="fixed z-[230] w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-[11px] shadow-lg"
                style={{ top: pos.top, left: pos.left }}
                onClick={(e) => e.stopPropagation()}
              >
                {children}
              </div>
            </>,
            document.body
          )
        : null}
    </div>
  );
}

function occupyingDocuments(progress: FinancialDocumentProgress | null) {
  return (progress?.documents ?? []).filter((doc) => doc.occupiesSlot !== false);
}

function rejectedAttempts(progress: FinancialDocumentProgress | null) {
  return (progress?.documents ?? []).filter((doc) => doc.occupiesSlot === false);
}

function InvalidDocumentAttempts({ attempts }: { attempts: FinancialDocumentProgressDocument[] }) {
  if (attempts.length === 0) return null;
  return (
    <div className="mb-3 space-y-1.5">
      {attempts.map((doc) => (
        <div
          key={doc.documentId || doc.analysisId || doc.fileName}
          className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-700"
        >
          <strong className="block">Se cargó un documento que no corresponde</strong>
          <span>
            {doc.fileName ? `${doc.fileName}: ` : ""}
            {doc.errorMessage || "El archivo no es válido para esta categoría. Sube un documento válido."}
          </span>
        </div>
      ))}
    </div>
  );
}

function categoryStatus(progress: FinancialDocumentProgress | null) {
  if (!progress) return "Pendiente";
  if (progress.failed > 0) return "Con errores";
  if (progress.manualReview > 0) return "Revisión manual";
  if (progress.uploaded === 0) return "Pendiente";
  if (progress.processingComplete) return "Completado";
  if (progress.uploadComplete) return "En proceso";
  return "Incompleto";
}

function categoryStatusClassName(progress: FinancialDocumentProgress | null) {
  const status = categoryStatus(progress);
  if (status === "Con errores") return "bg-red-50 text-red-600";
  if (status === "Revisión manual") return "bg-amber-50 text-amber-700";
  if (status === "Completado") return "bg-emerald-50 text-emerald-700";
  if (status === "En proceso") return "bg-blue-50 text-blue-700";
  return "bg-slate-100 text-slate-600";
}

export function FinancialDocumentUploader({ userId, financeRequestId, onClose }: FinancialDocumentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(isUuid(userId) ? userId : null);
  const [isResolvingUser, setIsResolvingUser] = useState(!isUuid(userId));
  const [selectedUploadTarget, setSelectedUploadTarget] = useState<UploadTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [openDocumentMenuId, setOpenDocumentMenuId] = useState<string | null>(null);
  const [payrollUploadMode, setPayrollUploadMode] = useState<PayrollUploadMode>("individual");
  const [consolidatedPayrollFile, setConsolidatedPayrollFile] = useState<File | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);
  const nominaProgressQuery = useDocumentProgress(resolvedUserId, "nomina", true);
  const extractoProgressQuery = useDocumentProgress(resolvedUserId, "extracto", true);
  const addressProgressQuery = useDocumentProgress(resolvedUserId, "comprobante_domicilio", true);
  const uploadMutation = useUploadOneDocument(resolvedUserId);
  const consolidatedPayrollMutation = useUploadConsolidatedPayroll(resolvedUserId);
  const replaceMutation = useReplaceDocument(resolvedUserId);
  const deleteMutation = useDeleteDocument(resolvedUserId);
  const nominaProgress = nominaProgressQuery.data || null;
  const extractoProgress = extractoProgressQuery.data || null;
  const addressProgress = addressProgressQuery.data || null;
  const isBootstrapping = isResolvingUser || nominaProgressQuery.isLoading || extractoProgressQuery.isLoading || addressProgressQuery.isLoading;

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setAlert(null);
      setIsResolvingUser(true);
      try {
        let nextUserId: string | null = isUuid(userId) ? userId : null;

        if (!nextUserId && financeRequestId) {
          const detail = await fetchFinanceRequestById(financeRequestId);
          nextUserId = extractUserIdFromFinanceRequest(detail);
        }

        if (!nextUserId) {
          throw new Error("No fue posible resolver el userId real del solicitante para cargar documentos.");
        }

        if (cancelled) return;
        setResolvedUserId(nextUserId);
      } catch (err: unknown) {
        if (cancelled) return;
        setAlert({
          message: getErrorMessage(err, "No fue posible cargar el progreso documental."),
          type: "error",
        });
      } finally {
        if (!cancelled) setIsResolvingUser(false);
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [financeRequestId, userId]);

  const nominaSlots = useMemo<NominaSlot[]>(() => {
    const required = Math.max(nominaProgress?.required ?? 5, 0);
    const docs = occupyingDocuments(nominaProgress);
    return Array.from({ length: required }, (_, index) => ({
      index,
      label: `Nómina ${index + 1}`,
      document: docs[index],
    }));
  }, [nominaProgress]);
  const nominaAttempts = rejectedAttempts(nominaProgress);

  const pendingNominaCount = nominaProgress?.pendingUpload ?? Math.max((nominaProgress?.required ?? 0) - (nominaProgress?.uploaded ?? 0), 0);
  const nominaSubtext = nominaProgress
    ? `${nominaProgress.completed} completado${nominaProgress.completed === 1 ? "" : "s"} · ${nominaProgress.processing} procesando · ${pendingNominaCount} pendiente${pendingNominaCount === 1 ? "" : "s"}`
    : "Cargando progreso real...";

  const extractoDocument = occupyingDocuments(extractoProgress)[0];
  const extractoAttempts = rejectedAttempts(extractoProgress);
  const extractoSubtext = extractoProgress
    ? `${extractoProgress.completed} completado${extractoProgress.completed === 1 ? "" : "s"} · ${extractoProgress.processing} procesando · ${extractoProgress.pendingUpload} pendiente${extractoProgress.pendingUpload === 1 ? "" : "s"}`
    : "Cargando progreso real...";
  const addressDocument = occupyingDocuments(addressProgress)[0];
  const addressAttempts = rejectedAttempts(addressProgress);
  const addressSubtext = addressProgress
    ? `${addressProgress.completed} completado${addressProgress.completed === 1 ? "" : "s"} · ${addressProgress.processing} procesando · ${addressProgress.pendingUpload} pendiente${addressProgress.pendingUpload === 1 ? "" : "s"}`
    : "Cargando progreso real...";

  const openFilePickerForSlot = (category: DocumentCategory, slotIndex: number) => {
    setAlert(null);
    setSelectedUploadTarget({ category, slotIndex, mode: "upload" });
    fileInputRef.current?.click();
  };

  const openFilePickerForConsolidatedPayroll = () => {
    setAlert(null);
    setSelectedUploadTarget({ category: "nomina", slotIndex: 0, mode: "consolidated" });
    fileInputRef.current?.click();
  };

  const openFilePickerForReplacement = (category: DocumentCategory, slotIndex: number, documentId: string) => {
    setAlert(null);
    setOpenDocumentMenuId(null);
    setSelectedUploadTarget({ category, slotIndex, mode: "replace", documentId });
    fileInputRef.current?.click();
  };

  const handleUploadFile = async (file: File | null, target: UploadTarget | null) => {
    if (!file || !target || !resolvedUserId) return;

    if (file.type !== "application/pdf") {
      setAlert({ message: "El archivo debe estar en formato PDF.", type: "error" });
      setSelectedUploadTarget(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (target.mode === "consolidated") {
      setConsolidatedPayrollFile(file);
      setSelectedUploadTarget(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setAlert({ message: `El archivo "${file.name}" supera el límite de 3 MB.`, type: "error" });
      setSelectedUploadTarget(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setAlert(null);
      if (target.mode === "replace" && target.documentId) {
        await replaceMutation.mutateAsync({ category: target.category, documentId: target.documentId, file });
        setAlert({ message: "Documento reemplazado y enviado a un nuevo análisis.", type: "success" });
        return;
      }

      const response = await uploadMutation.mutateAsync({ category: target.category, file });
      setAlert({
        message:
          response.status === "PROCESSING"
            ? "Documento subido y enviado a análisis"
            : "Documento subido correctamente",
        type: "success",
      });
    } catch (err: unknown) {
      const parsed = getDocumentError(err, "Ocurrió un error al subir el documento.");
      setAlert({
        ...parsed,
        type: "error",
      });
    } finally {
      setSelectedUploadTarget(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUploadConsolidatedPayroll = async () => {
    if (!consolidatedPayrollFile || !resolvedUserId) return;
    try {
      setAlert(null);
      await consolidatedPayrollMutation.mutateAsync(consolidatedPayrollFile);
      setConsolidatedPayrollFile(null);
      setAlert({ message: "PDF consolidado enviado. El progreso de nómina se actualizó desde backend.", type: "success" });
    } catch (err: unknown) {
      const parsed = getDocumentError(err, "No fue posible procesar el PDF consolidado.");
      setAlert({ ...parsed, type: "error" });
    }
  };

  const handleDeleteDocument = async () => {
    if (!deleteTarget) return;
    try {
      setAlert(null);
      setOpenDocumentMenuId(null);
      await deleteMutation.mutateAsync({ category: deleteTarget.category, documentId: deleteTarget.documentId });
      setDeleteTarget(null);
      setAlert({ message: `Documento ${deleteTarget.label} eliminado correctamente.`, type: "success" });
    } catch (err: unknown) {
      const parsed = getDocumentError(err, "No fue posible eliminar el documento.");
      setAlert({ ...parsed, type: "error" });
    }
  };

  const renderAlert = () => {
    if (!alert) return null;
    const shared = "mb-5 p-3.5 rounded-lg flex items-start gap-3 text-sm";
    if (alert.type === "error") {
      return (
        <div className={`${shared} bg-red-50 border border-red-100 text-red-700`}>
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="font-medium">{alert.message}</p>
            {alert.step || alert.detail ? (
              <details className="mt-1.5 text-xs text-red-600">
                <summary className="cursor-pointer font-semibold">Detalle técnico</summary>
                {alert.step ? <p className="mt-1">Paso: {alert.step}</p> : null}
                {alert.detail ? <p className="mt-1 break-words">{alert.detail}</p> : null}
              </details>
            ) : null}
          </div>
        </div>
      );
    }
    if (alert.type === "info") {
      return (
        <div className={`${shared} bg-amber-50 border border-amber-100 text-amber-800`}>
          <Loader2 size={18} className="mt-0.5 shrink-0" />
          <p className="font-medium">{alert.message}</p>
        </div>
      );
    }
    return (
      <div className={`${shared} bg-green-50 border border-green-100 text-green-700`}>
        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
        <p className="font-medium">{alert.message}</p>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4" onClick={onClose}>
        <div
          className="relative w-full max-w-[720px] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between px-6 pt-6 pb-4">
            <div className="pr-4">
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Motor MDC
              </span>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Carga de Documentos
              </h2>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                Flujo documental progresivo para validación de decisión
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex size-8 shrink-0 appearance-none items-center justify-center rounded-full border-0 bg-slate-100 text-slate-500 shadow-none outline-none ring-0 transition hover:bg-slate-200 hover:text-slate-800"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </div>

          <div className="max-h-[80vh] overflow-y-auto px-6 pb-6">
            {renderAlert()}

            {isBootstrapping ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-4 text-sm text-slate-600">
                <Loader2 size={18} className="animate-spin" />
                <span>Cargando progreso documental real...</span>
              </div>
            ) : (
              <>
                <section className="mb-4 rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="block text-[9.5px] font-semibold uppercase tracking-widest text-slate-400">
                        Categoría activa
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">Comprobantes de Nómina</h3>
                        <span className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${categoryStatusClassName(nominaProgress)}`}>
                          {categoryStatus(nominaProgress)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs font-medium text-slate-500">{nominaSubtext}</p>
                    </div>
                    <span className="inline-flex min-w-[88px] items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-center text-xs leading-4 font-semibold text-slate-700">
                      {nominaProgress?.uploaded ?? 0} / {nominaProgress?.required ?? 5} archivos
                    </span>
                  </div>

                  {nominaProgressQuery.error ? (
                    <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                      <strong className="block">No fue posible cargar el progreso de nómina.</strong>
                      <span>{getErrorMessage(nominaProgressQuery.error, "Error consultando la categoría.")}</span>
                    </div>
                  ) : null}

                  <div className="mb-3 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <span className="block font-semibold text-slate-400">Completados</span>
                      <strong className="text-sm text-slate-800">{nominaProgress?.completed ?? 0}</strong>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <span className="block font-semibold text-slate-400">Listos para procesar</span>
                      <strong className="text-sm text-slate-800">{nominaProgress?.processing ?? 0}</strong>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <span className="block font-semibold text-slate-400">Revisión manual</span>
                      <strong className="text-sm text-slate-800">{nominaProgress?.manualReview ?? 0}</strong>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                      <span className="block font-semibold text-slate-400">Con errores</span>
                      <strong className="text-sm text-slate-800">{nominaProgress?.failed ?? 0}</strong>
                    </div>
                  </div>

                  <fieldset className="mb-3 border-0 p-0">
                    <legend className="mb-2 text-xs font-bold text-slate-900">¿Cómo deseas cargar los comprobantes de nómina?</legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className={`cursor-pointer rounded-lg border px-3 py-2 transition ${payrollUploadMode === "individual" ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                        <input
                          type="radio"
                          name="payroll-upload-mode"
                          value="individual"
                          checked={payrollUploadMode === "individual"}
                          onChange={() => setPayrollUploadMode("individual")}
                          className="sr-only"
                        />
                        <span className="block text-xs font-bold text-slate-900">Uno por uno</span>
                        <span className="mt-0.5 block text-[11px] font-medium text-slate-500">Sube cada recibo individualmente.</span>
                      </label>
                      <label className={`cursor-pointer rounded-lg border px-3 py-2 transition ${payrollUploadMode === "consolidated" ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
                        <input
                          type="radio"
                          name="payroll-upload-mode"
                          value="consolidated"
                          checked={payrollUploadMode === "consolidated"}
                          onChange={() => setPayrollUploadMode("consolidated")}
                          className="sr-only"
                        />
                        <span className="block text-xs font-bold text-slate-900">PDF consolidado</span>
                        <span className="mt-0.5 block text-[11px] font-medium text-slate-500">Un PDF con las 5 nóminas.</span>
                      </label>
                    </div>
                  </fieldset>

                  <InvalidDocumentAttempts attempts={nominaAttempts} />

                  {payrollUploadMode === "individual" ? (
                    <div className="space-y-1.5">
                      {nominaSlots.map((slot) => {
                      const doc = slot.document;
                      const status = doc?.status ?? null;
                      const canUpload = !doc;
                      const analyzing = isDocumentAnalyzing(status);
                      const isUploadingSlot =
                        (uploadMutation.isPending || replaceMutation.isPending) &&
                        selectedUploadTarget?.category === "nomina" &&
                        selectedUploadTarget.slotIndex === slot.index;
                      const isConfirmingDelete = Boolean(deleteTarget && doc?.documentId && deleteTarget.documentId === doc.documentId);

                      return (
                        <article
                          key={slot.label}
                          className="flex min-h-[44px] flex-nowrap items-center gap-x-3 gap-y-1.5 rounded-lg bg-slate-100/70 px-3 py-2 transition hover:bg-slate-200/60"
                        >
                          <h4 className="w-[108px] shrink-0 text-xs font-bold text-slate-800">{slot.label}</h4>

                          {doc ? (
                            <p className="flex min-w-0 flex-1 items-center gap-2 text-[11px] font-medium text-slate-500">
                              <FileIcon size={13} className="shrink-0 text-slate-400" />
                              <span className="truncate">{doc.fileName || "Archivo sin nombre"}</span>
                            </p>
                          ) : (
                            <p className="min-w-0 flex-1 text-[11px] font-medium text-slate-400">Pendiente de carga</p>
                          )}

                          <span className={`inline-flex h-7 w-[150px] shrink-0 items-center justify-center whitespace-nowrap rounded-md px-2 text-center text-[9.5px] font-semibold tracking-wide ${statusClassName(status, doc?.manualDecision)}`}>
                            {statusLabel(status, doc?.manualDecision)}
                          </span>
                          <KycMatchChip match={doc?.documentMatch} />

                          <div className="ml-auto flex shrink-0 items-center gap-2">
                            {analyzing ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                                <Loader2 size={14} className="animate-spin" />
                                Analizando…
                              </span>
                            ) : null}

                            {canUpload ? (
                              <button
                                type="button"
                                className="appearance-none border-0 shadow-none outline-none ring-0 flex items-center gap-1.5 rounded-lg bg-[#000016] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-black active:scale-95 disabled:opacity-60"
                                onClick={() => openFilePickerForSlot("nomina", slot.index)}
                                disabled={uploadMutation.isPending || replaceMutation.isPending || deleteMutation.isPending || !resolvedUserId}
                              >
                                {isUploadingSlot ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <UploadCloud size={14} />
                                )}
                                Subir PDF
                              </button>
                            ) : null}
                            {doc?.documentId ? (
                              <DocumentActionsMenu
                                open={openDocumentMenuId === doc.documentId}
                                onToggle={() =>
                                  setOpenDocumentMenuId(openDocumentMenuId === doc.documentId ? null : (doc.documentId as string))
                                }
                                onClose={() => setOpenDocumentMenuId(null)}
                                disabled={uploadMutation.isPending || replaceMutation.isPending || deleteMutation.isPending}
                                ariaLabel={`Abrir opciones de ${slot.label}`}
                              >
                                <button
                                  type="button"
                                  className="block w-full px-3 py-2 text-left font-semibold text-slate-700 transition hover:bg-slate-50"
                                  onClick={() => openFilePickerForReplacement("nomina", slot.index, doc.documentId as string)}
                                >
                                  {isUploadingSlot && selectedUploadTarget?.mode === "replace" ? "Reemplazando..." : "Reemplazar"}
                                </button>
                                <button
                                  type="button"
                                  className="block w-full px-3 py-2 text-left font-semibold text-red-600 transition hover:bg-red-50"
                                  onClick={() => {
                                    setOpenDocumentMenuId(null);
                                    setDeleteTarget({ category: "nomina", documentId: doc.documentId as string, label: slot.label });
                                  }}
                                >
                                  Eliminar
                                </button>
                              </DocumentActionsMenu>
                            ) : null}
                          </div>

                          {isConfirmingDelete ? (
                            <div className="flex w-full items-center justify-end gap-2 border-t border-slate-200 pt-2 text-[11px] text-slate-600">
                              <span className="mr-auto">El documento quedará eliminado del expediente activo.</span>
                              <button type="button" className="appearance-none rounded-md border-0 bg-transparent px-2.5 py-1 font-semibold text-slate-600 shadow-none hover:bg-white" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>Cancelar</button>
                              <button type="button" className="appearance-none rounded-md border-0 bg-red-50 px-2.5 py-1 font-semibold text-red-700 shadow-none disabled:opacity-60" onClick={handleDeleteDocument} disabled={deleteMutation.isPending}>
                                {deleteMutation.isPending ? "Eliminando..." : "Confirmar eliminación"}
                              </button>
                            </div>
                          ) : null}
                        </article>
                      );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900">PDF consolidado de nómina</h4>
                            <p className="mt-1 text-[11px] font-medium leading-5 text-slate-500">
                              Sube un PDF con exactamente 5 páginas. Cada página debe contener un recibo completo de nómina del mismo solicitante.
                            </p>
                            {consolidatedPayrollFile ? (
                              <p className="mt-2 truncate text-[11px] font-semibold text-slate-700">{consolidatedPayrollFile.name}</p>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            {consolidatedPayrollFile ? (
                              <button
                                type="button"
                                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                                onClick={() => setConsolidatedPayrollFile(null)}
                                disabled={consolidatedPayrollMutation.isPending}
                              >
                                Cancelar
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                              onClick={openFilePickerForConsolidatedPayroll}
                              disabled={uploadMutation.isPending || replaceMutation.isPending || deleteMutation.isPending || consolidatedPayrollMutation.isPending || !resolvedUserId}
                            >
                              Seleccionar PDF
                            </button>
                            <button
                              type="button"
                              className="appearance-none border-0 shadow-none outline-none ring-0 flex items-center gap-1.5 rounded-lg bg-[#000016] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-black disabled:opacity-60"
                              onClick={handleUploadConsolidatedPayroll}
                              disabled={!consolidatedPayrollFile || consolidatedPayrollMutation.isPending || !resolvedUserId}
                            >
                              {consolidatedPayrollMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                              {consolidatedPayrollMutation.isPending ? "Procesando PDF consolidado..." : "Enviar consolidado"}
                            </button>
                          </div>
                        </div>
                      </div>

                      {(nominaProgress?.documents?.length ?? 0) > 0 ? (
                        <div className="space-y-1.5">
                          {nominaSlots.map((slot) => {
                            const doc = slot.document;
                            if (!doc) return null;
                            const status = doc.status ?? null;
                            const analyzing = isDocumentAnalyzing(status);
                            const isUploadingSlot =
                              replaceMutation.isPending &&
                              selectedUploadTarget?.category === "nomina" &&
                              selectedUploadTarget.mode === "replace" &&
                              selectedUploadTarget.slotIndex === slot.index;
                            const isConfirmingDelete = Boolean(deleteTarget && doc.documentId && deleteTarget.documentId === doc.documentId);

                            return (
                              <article
                                key={`consolidated-${slot.label}`}
                                className="flex min-h-[44px] flex-nowrap items-center gap-x-3 gap-y-1.5 rounded-lg bg-slate-100/70 px-3 py-2 transition hover:bg-slate-200/60"
                              >
                                <h4 className="w-[108px] shrink-0 text-xs font-bold text-slate-800">{slot.label}</h4>
                                <p className="flex min-w-0 flex-1 items-center gap-2 text-[11px] font-medium text-slate-500">
                                  <FileIcon size={13} className="shrink-0 text-slate-400" />
                                  <span className="truncate">{doc.fileName || "Archivo sin nombre"}</span>
                                </p>
                                <span className={`inline-flex h-7 w-[150px] shrink-0 items-center justify-center whitespace-nowrap rounded-md px-2 text-center text-[9.5px] font-semibold tracking-wide ${statusClassName(status, doc.manualDecision)}`}>
                                  {statusLabel(status, doc.manualDecision)}
                                </span>
                                <KycMatchChip match={doc.documentMatch} />
                                <div className="ml-auto flex shrink-0 items-center gap-2">
                                  {analyzing ? (
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                                      <Loader2 size={14} className="animate-spin" />
                                      Analizando…
                                    </span>
                                  ) : null}
                                  {doc.documentId ? (
                                    <DocumentActionsMenu
                                      open={openDocumentMenuId === doc.documentId}
                                      onToggle={() =>
                                        setOpenDocumentMenuId(openDocumentMenuId === doc.documentId ? null : (doc.documentId as string))
                                      }
                                      onClose={() => setOpenDocumentMenuId(null)}
                                      disabled={uploadMutation.isPending || replaceMutation.isPending || deleteMutation.isPending}
                                      ariaLabel={`Abrir opciones de ${slot.label}`}
                                    >
                                      <button
                                        type="button"
                                        className="block w-full px-3 py-2 text-left font-semibold text-slate-700 transition hover:bg-slate-50"
                                        onClick={() => openFilePickerForReplacement("nomina", slot.index, doc.documentId as string)}
                                      >
                                        {isUploadingSlot ? "Reemplazando..." : "Reemplazar"}
                                      </button>
                                      <button
                                        type="button"
                                        className="block w-full px-3 py-2 text-left font-semibold text-red-600 transition hover:bg-red-50"
                                        onClick={() => {
                                          setOpenDocumentMenuId(null);
                                          setDeleteTarget({ category: "nomina", documentId: doc.documentId as string, label: slot.label });
                                        }}
                                      >
                                        Eliminar
                                      </button>
                                    </DocumentActionsMenu>
                                  ) : null}
                                </div>
                                {isConfirmingDelete ? (
                                  <div className="flex w-full items-center justify-end gap-2 border-t border-slate-200 pt-2 text-[11px] text-slate-600">
                                    <span className="mr-auto">El documento quedará eliminado del expediente activo.</span>
                                    <button type="button" className="appearance-none rounded-md border-0 bg-transparent px-2.5 py-1 font-semibold text-slate-600 shadow-none hover:bg-white" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>Cancelar</button>
                                    <button type="button" className="appearance-none rounded-md border-0 bg-red-50 px-2.5 py-1 font-semibold text-red-700 shadow-none disabled:opacity-60" onClick={handleDeleteDocument} disabled={deleteMutation.isPending}>
                                      {deleteMutation.isPending ? "Eliminando..." : "Confirmar eliminación"}
                                    </button>
                                  </div>
                                ) : null}
                              </article>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-slate-500 transition hover:text-slate-700 disabled:opacity-60"
                      onClick={() => nominaProgressQuery.refetch()}
                      disabled={!resolvedUserId || nominaProgressQuery.isFetching}
                    >
                      {nominaProgressQuery.isFetching ? "Actualizando progreso..." : "Actualizar progreso"}
                    </button>
                  </div>
                </section>

                <div className="space-y-3">
                  <section className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="block text-[9.5px] font-semibold uppercase tracking-widest text-slate-400">
                          Categoría activa
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">Extracto Bancario</h3>
                          <span className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${categoryStatusClassName(extractoProgress)}`}>
                            {categoryStatus(extractoProgress)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-500">{extractoSubtext}</p>
                      </div>
                      <span className="inline-flex min-w-[88px] items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-center text-xs leading-4 font-semibold text-slate-700">
                        {extractoProgress?.uploaded ?? 0} / {extractoProgress?.required ?? 1} archivo
                      </span>
                    </div>

                    {extractoProgressQuery.error ? (
                      <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                        <strong className="block">No fue posible cargar el progreso del extracto.</strong>
                        <span>{getErrorMessage(extractoProgressQuery.error, "Error consultando la categoría.")}</span>
                      </div>
                    ) : null}

                    <InvalidDocumentAttempts attempts={extractoAttempts} />

                    <article className="flex min-h-[44px] flex-nowrap items-center gap-x-3 gap-y-1.5 rounded-lg bg-slate-100/70 px-3 py-2 transition hover:bg-slate-200/60">
                      <h4 className="w-[108px] shrink-0 text-xs font-bold text-slate-800">Extracto</h4>

                      {extractoDocument ? (
                        <p className="flex min-w-0 flex-1 items-center gap-2 text-[11px] font-medium text-slate-500">
                          <FileIcon size={13} className="shrink-0 text-slate-400" />
                          <span className="truncate">{extractoDocument.fileName || "Archivo sin nombre"}</span>
                        </p>
                      ) : (
                        <p className="min-w-0 flex-1 text-[11px] font-medium text-slate-400">Pendiente de carga · 1 PDF requerido</p>
                      )}

                      <span className={`inline-flex h-7 w-[150px] shrink-0 items-center justify-center whitespace-nowrap rounded-md px-2 text-center text-[9.5px] font-semibold tracking-wide ${statusClassName(extractoDocument?.status, extractoDocument?.manualDecision)}`}>
                        {statusLabel(extractoDocument?.status, extractoDocument?.manualDecision)}
                      </span>
                      <KycMatchChip match={extractoDocument?.documentMatch} />

                      <div className="ml-auto flex shrink-0 items-center gap-2">
                        {isDocumentAnalyzing(extractoDocument?.status) ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                            <Loader2 size={14} className="animate-spin" />
                            Analizando…
                          </span>
                        ) : null}

                        {!extractoDocument && (extractoProgress?.uploaded ?? 0) < (extractoProgress?.required ?? 1) ? (
                          <button
                            type="button"
                            className="appearance-none border-0 shadow-none outline-none ring-0 flex items-center gap-1.5 rounded-lg bg-[#000016] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-black active:scale-95 disabled:opacity-60"
                            onClick={() => openFilePickerForSlot("extracto", 0)}
                            disabled={uploadMutation.isPending || replaceMutation.isPending || deleteMutation.isPending || !resolvedUserId}
                          >
                            {uploadMutation.isPending && selectedUploadTarget?.category === "extracto" ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                            Subir PDF
                          </button>
                        ) : null}

                        {extractoDocument?.documentId ? (
                          <DocumentActionsMenu
                            open={openDocumentMenuId === extractoDocument.documentId}
                            onToggle={() =>
                              setOpenDocumentMenuId(
                                openDocumentMenuId === extractoDocument.documentId ? null : (extractoDocument.documentId as string)
                              )
                            }
                            onClose={() => setOpenDocumentMenuId(null)}
                            disabled={uploadMutation.isPending || replaceMutation.isPending || deleteMutation.isPending}
                            ariaLabel="Abrir opciones del extracto"
                          >
                            <button
                              type="button"
                              className="block w-full px-3 py-2 text-left font-semibold text-slate-700 transition hover:bg-slate-50"
                              onClick={() => openFilePickerForReplacement("extracto", 0, extractoDocument.documentId as string)}
                            >
                              {replaceMutation.isPending && selectedUploadTarget?.category === "extracto" ? "Reemplazando..." : "Reemplazar"}
                            </button>
                            <button
                              type="button"
                              className="block w-full px-3 py-2 text-left font-semibold text-red-600 transition hover:bg-red-50"
                              onClick={() => {
                                setOpenDocumentMenuId(null);
                                setDeleteTarget({ category: "extracto", documentId: extractoDocument.documentId as string, label: "Extracto" });
                              }}
                            >
                              Eliminar
                            </button>
                          </DocumentActionsMenu>
                        ) : null}
                      </div>

                      {deleteTarget && extractoDocument?.documentId && deleteTarget.documentId === extractoDocument.documentId ? (
                        <div className="flex w-full items-center justify-end gap-2 border-t border-slate-200 pt-2 text-[11px] text-slate-600">
                          <span className="mr-auto">El documento quedará eliminado del expediente activo.</span>
                          <button type="button" className="appearance-none rounded-md border-0 bg-transparent px-2.5 py-1 font-semibold text-slate-600 shadow-none hover:bg-white" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>Cancelar</button>
                          <button type="button" className="appearance-none rounded-md border-0 bg-red-50 px-2.5 py-1 font-semibold text-red-700 shadow-none disabled:opacity-60" onClick={handleDeleteDocument} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? "Eliminando..." : "Confirmar eliminación"}
                          </button>
                        </div>
                      ) : null}
                    </article>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-slate-500 transition hover:text-slate-700 disabled:opacity-60"
                        onClick={() => extractoProgressQuery.refetch()}
                        disabled={!resolvedUserId || extractoProgressQuery.isFetching}
                      >
                        {extractoProgressQuery.isFetching ? "Actualizando progreso..." : "Actualizar progreso"}
                      </button>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="block text-[9.5px] font-semibold uppercase tracking-widest text-slate-400">
                          Categoría activa
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">Comprobante de domicilio</h3>
                          <span className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${categoryStatusClassName(addressProgress)}`}>
                            {categoryStatus(addressProgress)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] font-medium text-slate-500">{addressSubtext}</p>
                      </div>
                      <span className="inline-flex min-w-[88px] items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-center text-xs leading-4 font-semibold text-slate-700">
                        {addressProgress?.uploaded ?? 0} / {addressProgress?.required ?? 1} archivo
                      </span>
                    </div>

                    {addressProgressQuery.error ? (
                      <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                        <strong className="block">No fue posible cargar el comprobante de domicilio.</strong>
                        <span>{getErrorMessage(addressProgressQuery.error, "Error consultando la categoría.")}</span>
                      </div>
                    ) : null}

                    <InvalidDocumentAttempts attempts={addressAttempts} />

                    <article className="flex min-h-[44px] flex-nowrap items-center gap-x-3 gap-y-1.5 rounded-lg bg-slate-100/70 px-3 py-2 transition hover:bg-slate-200/60">
                      <h4 className="w-[108px] shrink-0 text-xs font-bold text-slate-800">Domicilio</h4>

                      {addressDocument ? (
                        <p className="flex min-w-0 flex-1 items-center gap-2 text-[11px] font-medium text-slate-500">
                          <FileIcon size={13} className="shrink-0 text-slate-400" />
                          <span className="truncate">{addressDocument.fileName || "Archivo sin nombre"}</span>
                        </p>
                      ) : (
                        <p className="min-w-0 flex-1 text-[11px] font-medium text-slate-400">Pendiente de carga · 1 PDF requerido</p>
                      )}

                      <span className={`inline-flex h-7 w-[150px] shrink-0 items-center justify-center whitespace-nowrap rounded-md px-2 text-center text-[9.5px] font-semibold tracking-wide ${statusClassName(addressDocument?.status, addressDocument?.manualDecision)}`}>
                        {statusLabel(addressDocument?.status, addressDocument?.manualDecision)}
                      </span>
                      <KycMatchChip match={addressDocument?.documentMatch} />

                      <div className="ml-auto flex shrink-0 items-center gap-2">
                        {isDocumentAnalyzing(addressDocument?.status) ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                            <Loader2 size={14} className="animate-spin" />
                            Analizando…
                          </span>
                        ) : null}

                        {!addressDocument && (addressProgress?.uploaded ?? 0) < (addressProgress?.required ?? 1) ? (
                          <button
                            type="button"
                            className="appearance-none border-0 shadow-none outline-none ring-0 flex items-center gap-1.5 rounded-lg bg-[#000016] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-black active:scale-95 disabled:opacity-60"
                            onClick={() => openFilePickerForSlot("comprobante_domicilio", 0)}
                            disabled={uploadMutation.isPending || replaceMutation.isPending || deleteMutation.isPending || !resolvedUserId}
                          >
                            {uploadMutation.isPending && selectedUploadTarget?.category === "comprobante_domicilio" ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                            Subir PDF
                          </button>
                        ) : null}

                        {addressDocument?.documentId ? (
                          <DocumentActionsMenu
                            open={openDocumentMenuId === addressDocument.documentId}
                            onToggle={() =>
                              setOpenDocumentMenuId(
                                openDocumentMenuId === addressDocument.documentId ? null : (addressDocument.documentId as string)
                              )
                            }
                            onClose={() => setOpenDocumentMenuId(null)}
                            disabled={uploadMutation.isPending || replaceMutation.isPending || deleteMutation.isPending}
                            ariaLabel="Abrir opciones del comprobante de domicilio"
                          >
                            <button
                              type="button"
                              className="block w-full px-3 py-2 text-left font-semibold text-slate-700 transition hover:bg-slate-50"
                              onClick={() => openFilePickerForReplacement("comprobante_domicilio", 0, addressDocument.documentId as string)}
                            >
                              {replaceMutation.isPending && selectedUploadTarget?.category === "comprobante_domicilio" ? "Reemplazando..." : "Reemplazar"}
                            </button>
                            <button
                              type="button"
                              className="block w-full px-3 py-2 text-left font-semibold text-red-600 transition hover:bg-red-50"
                              onClick={() => {
                                setOpenDocumentMenuId(null);
                                setDeleteTarget({
                                  category: "comprobante_domicilio",
                                  documentId: addressDocument.documentId as string,
                                  label: "Domicilio",
                                });
                              }}
                            >
                              Eliminar
                            </button>
                          </DocumentActionsMenu>
                        ) : null}
                      </div>

                      {deleteTarget && addressDocument?.documentId && deleteTarget.documentId === addressDocument.documentId ? (
                        <div className="flex w-full items-center justify-end gap-2 border-t border-slate-200 pt-2 text-[11px] text-slate-600">
                          <span className="mr-auto">El documento quedará eliminado del expediente activo.</span>
                          <button type="button" className="appearance-none rounded-md border-0 bg-transparent px-2.5 py-1 font-semibold text-slate-600 shadow-none hover:bg-white" onClick={() => setDeleteTarget(null)} disabled={deleteMutation.isPending}>Cancelar</button>
                          <button type="button" className="appearance-none rounded-md border-0 bg-red-50 px-2.5 py-1 font-semibold text-red-700 shadow-none disabled:opacity-60" onClick={handleDeleteDocument} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? "Eliminando..." : "Confirmar eliminación"}
                          </button>
                        </div>
                      ) : null}
                    </article>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-slate-500 transition hover:text-slate-700 disabled:opacity-60"
                        onClick={() => addressProgressQuery.refetch()}
                        disabled={!resolvedUserId || addressProgressQuery.isFetching}
                      >
                        {addressProgressQuery.isFetching ? "Actualizando progreso..." : "Actualizar progreso"}
                      </button>
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="application/pdf"
        onChange={(e) => handleUploadFile(e.target.files?.[0] ?? null, selectedUploadTarget)}
      />

    </>
  );
}
