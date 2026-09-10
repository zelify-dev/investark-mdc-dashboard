"use client";

import { useEffect, useRef, useState } from "react";
import { OwnersSectionSync } from "@/modules/kyb/components/owners-section-sync";
import { useOnboarding } from "@/modules/kyb/components/onboarding-provider";
import {
  ChecklistSection,
  ChecklistItem,
  OnboardingModuleKey,
} from "@/modules/kyb/lib/onboarding-config";
import { FileText, X, Paperclip, Loader2, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";

type ChecklistSectionProps = {
  section: ChecklistSection;
};

const kindBadgeBaseClass =
  "border px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider";

function getDisplayCode(code: string) {
  if (code.startsWith("SECCIÓN 4")) {
    return code.replace("SECCIÓN 4", "SECCIÓN 3");
  }

  if (code.startsWith("SECCIÓN 5")) {
    return code.replace("SECCIÓN 5", "SECCIÓN 4");
  }

  if (code.startsWith("4.")) {
    return code.replace(/^4\./, "3.");
  }

  if (code.startsWith("5.")) {
    return code.replace(/^5\./, "4.");
  }

  return code;
}

export function ChecklistSectionPanel({ section }: ChecklistSectionProps) {
  const { answers, updateAnswer, moduleLocked, isAuditMode, visibleModules, updateVisibility } =
    useOnboarding();
  const [openSubsections, setOpenSubsections] = useState<Record<string, boolean>>(
    () =>
      section.subsections.reduce((acc, subsection, index) => {
        acc[subsection.code] = index === 0;
        return acc;
      }, {} as Record<string, boolean>),
  );

  // Determinar si este panel completo está bloqueado (porque ya se envió la sección)
  const isSectionLocked =
    moduleLocked.kyb && section.code === "SECCIÓN 1" ||
    moduleLocked.pldAml && section.code === "SECCIÓN 2" ||
    moduleLocked.technical && section.code === "SECCIÓN 3" ||
    moduleLocked.businessPlan && section.code === "SECCIÓN 4" ||
    moduleLocked.companyInfo && section.code === "SECCIÓN 5";

  const getAnsweredCount = (items: ChecklistItem[]) =>
    items.filter((item) => {
      const value = answers[item.code];
      if (typeof value === "string") {
        return value.trim().length > 0;
      }
      return value !== undefined && value !== null && value !== "";
    }).length;

  const shouldDisplayItem = (item: ChecklistItem) => {
    if (item.code === "5.1.2") {
      return answers["5.1.1"] === "Sí";
    }

    if (item.code === "5.3.2" || item.code === "5.3.3") {
      return answers["5.3.1"] === "Sí";
    }

    if (item.code === "5.3.4") {
      return answers["5.3.1"] === "Sí";
    }

    return true;
  };

  return (
    <section className="bg-transparent py-4 first:pt-0">
      {/* CABECERA DE VISIBILIDAD PARA EL ADMINISTRADOR */}
      {isAuditMode && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Control de Visibilidad (Vista Empresa)
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Seleccione qué módulos pueden ser editados y visualizados por la empresa cliente.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs font-medium">
              {[
                { key: "kyb", label: "1. Negocio", apiKey: "showKyb" },
                { key: "pldAml", label: "2. PLD/AML", apiKey: "showPldAml" },
                { key: "businessPlan", label: "3. Comercial", apiKey: "showBusinessPlan" },
                { key: "companyInfo", label: "4. Empresa", apiKey: "showCompanyInfo" },
              ].map((mod) => (
                <label key={mod.key} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={visibleModules[mod.key as OnboardingModuleKey] ?? true}
                    onChange={async (e) => {
                      try {
                        await updateVisibility({ [mod.apiKey]: e.target.checked });
                      } catch (err) {
                        alert("Error al actualizar los permisos de visibilidad.");
                      }
                    }}
                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-950"
                  />
                  <span className="text-slate-700">{mod.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
              {getDisplayCode(section.code)}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              {section.title}
            </h3>
            {section.description && (
              <p className="mt-1.5 max-w-4xl text-sm leading-relaxed text-slate-500">
                {section.description}
              </p>
            )}
          </div>
          <div className="inline-flex self-start rounded-full border border-slate-100 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
            {section.subsections.reduce((count, subsection) => count + subsection.items.length, 0)}{" "}
            requisitos
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-8">
        {section.subsections.map((subsection) => (
          <div key={subsection.code} className="border-t border-slate-100 pt-5">
            {(() => {
              const visibleItems = subsection.items.filter(shouldDisplayItem);
              const completedItems = getAnsweredCount(visibleItems);
              const totalItems = visibleItems.length;
              const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
              const pendingItems = totalItems - completedItems;
              const isCompleted = progressPercent === 100;

              return (
            <div className="zelify-kyb-panel overflow-hidden">
              <button
                type="button"
                onClick={() =>
                  setOpenSubsections((current) => ({
                    ...current,
                    [subsection.code]: !current[subsection.code],
                  }))
                }
                className="zelify-kyb-subsection-trigger flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {getDisplayCode(subsection.code)} · {subsection.title}
                  </p>
                  {subsection.description && (
                    <p className="mt-1 text-xs text-slate-400">{subsection.description}</p>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <div className="hidden items-center gap-2 sm:flex">
                    {!isCompleted && (
                      <span className="text-[11px] font-medium text-slate-400">
                        {pendingItems} pendiente{pendingItems === 1 ? "" : "s"}
                      </span>
                    )}
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                        isCompleted
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : progressPercent > 0
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-600 border border-rose-200",
                      ].join(" ")}
                    >
                      {isCompleted ? "Completo" : `${progressPercent}%`}
                    </span>
                  </div>
                  <ChevronDown
                    className={[
                      "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                      openSubsections[subsection.code] ? "rotate-180" : "",
                    ].join(" ")}
                  />
                </div>
              </button>

              {openSubsections[subsection.code] && (
                <div className="border-t border-slate-100 bg-transparent px-4 pb-2">
                  {subsection.code === "1.5" && <OwnersSectionSync />}

                  <div className="hidden grid-cols-[100px_minmax(0,1fr)_150px] border-b border-slate-100 pb-2 pt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 md:grid">
                    <span>Referencia</span>
                    <span>Requerimiento e Interacción</span>
                    <span className="text-right pr-4">Tipo</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {visibleItems.map((item) => (
                      <ChecklistItemRow
                        key={item.code}
                        item={item}
                        value={answers[item.code]}
                        onChange={(val) => updateAnswer(item.code, val)}
                        disabled={isSectionLocked || isAuditMode}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
              );
            })()}
          </div>
        ))}
      </div>
    </section>
  );
}

// Componente secundario para renderizar y manejar la interacción de cada fila individualmente
type ChecklistItemRowProps = {
  item: ChecklistItem;
  value: any;
  onChange: (val: any) => void;
  disabled: boolean;
};

function ChecklistItemRow({ item, value, onChange, disabled }: ChecklistItemRowProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectObservations, setRejectObservations] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [textDraft, setTextDraft] = useState(
    typeof value === "string" ? value : value !== undefined && value !== null ? String(value) : "",
  );

  const {
    uploadFileAnswer,
    deleteFileAnswer,
    downloadFileUrl,
    requirementsMetadata,
    isAuditMode,
    verifyRequirementAnswer,
    saveIndividualAnswer,
    updateAnswer: updateGlobalAnswer,
  } = useOnboarding();

  // Obtener metadatos de auditoría del backend
  const metadata = requirementsMetadata[item.code];
  const normalizedValue = typeof value === "string" ? value.trim() : value;
  const isPending =
    normalizedValue === undefined ||
    normalizedValue === null ||
    normalizedValue === "";
  const showPendingHighlight = isPending && !isAuditMode;

  useEffect(() => {
    if (item.kind !== "Dato") return;

    setTextDraft(
      typeof value === "string" ? value : value !== undefined && value !== null ? String(value) : "",
    );
  }, [item.kind, value]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Resetear error y activar carga visual
      setErrorMessage(null);
      setIsUploading(true);

      try {
        await uploadFileAnswer(item.code, file);
        onChange(file.name); // Guardar nombre de forma local en answers
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : "Error al subir el archivo.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removeFile = async () => {
    setErrorMessage(null);
    setIsUploading(true);

    try {
      await deleteFileAnswer(item.code);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setErrorMessage("No fue posible eliminar el archivo del servidor.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const url = await downloadFileUrl(item.code);
      if (url) {
        window.open(url, "_blank");
      } else {
        setErrorMessage("No se pudo generar la URL de descarga.");
      }
    } catch (err) {
      setErrorMessage("Error al obtener el enlace del documento.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAuditVerify = async (status: "approved" | "rejected") => {
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const obs = status === "rejected" ? rejectObservations.trim() : null;
      await verifyRequirementAnswer(item.code, status, obs);
      setShowRejectInput(false);
      setRejectObservations("");
    } catch (err: any) {
      setErrorMessage(err.message || "Error al registrar la evaluación.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      className={[
        "grid gap-3 py-4 px-1 rounded-lg md:grid-cols-[100px_minmax(0,1fr)_150px] md:items-start transition",
        showPendingHighlight
          ? "border border-slate-200/70 bg-white hover:bg-slate-50/40"
          : "hover:bg-slate-50/30",
      ].join(" ")}
    >
      {/* Referencia */}
      <div className={["text-xs font-bold md:pt-2", showPendingHighlight ? "text-slate-400" : "text-slate-400"].join(" ")}>
        {getDisplayCode(item.code)}
      </div>

      {/* Requerimiento e Inputs Interactivos */}
      <div className="pr-4 space-y-2.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium leading-relaxed text-slate-800">
              {item.label}
            </p>
          </div>
          {item.notes && (
            <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{item.notes}</p>
          )}

          {/* Información y Mensaje de Rechazo de Auditoría */}
          {metadata && metadata.status === "rejected" && (
            <div className="mt-2 inline-flex items-start gap-1.5 border-l-2 border-rose-500 pl-3 py-0.5 bg-transparent">
              <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500 leading-none">Requerimiento rechazado</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                  {metadata.observations || "El documento no cumple con los requisitos del equipo auditor."}
                </p>
              </div>
            </div>
          )}

          {/* Estado de Aprobación */}
          {metadata && metadata.status === "approved" && (
            <div className="mt-2 inline-flex items-center gap-1 text-emerald-600 bg-emerald-50/50 border border-emerald-100/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              Aprobado por Auditor
            </div>
          )}
        </div>

        {/* MODO AUDITORÍA (SÓLO LECTURA + CONTROLES OPERACIONALES DE AUDITOR) */}
        {isAuditMode && (
          <div className="space-y-3 pt-1">
            {/* Visualización de la Respuesta del Cliente */}
            <div className="text-xs">
              {value ? (
                <div className="inline-flex items-center gap-2 text-slate-800 bg-slate-50 border border-slate-200/50 rounded-lg px-3 py-2 font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                  {item.kind === "Documento" ? (
                    <>
                      <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                      <button
                        type="button"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="hover:underline text-left truncate font-bold text-slate-700"
                        title="Haga clic para descargar de S3"
                      >
                        {isDownloading ? "Generando link..." : String(value)}
                      </button>
                    </>
                  ) : (
                    <span>{String(value)}</span>
                  )}
                </div>
              ) : (
                <span className="text-slate-400 italic text-[11px]">No proporcionado por la empresa</span>
              )}
            </div>

            {/* Acciones de Auditoría si la empresa respondió */}
            {value && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAuditVerify("approved")}
                    disabled={isVerifying || metadata?.status === "approved"}
                    className={[
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all border",
                      metadata?.status === "approved"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 cursor-not-allowed"
                        : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700",
                    ].join(" ")}
                  >
                    Aprobar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRejectInput(!showRejectInput)}
                    disabled={isVerifying}
                    className={[
                      "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all border",
                      metadata?.status === "rejected"
                        ? "bg-rose-50 border-rose-200 text-rose-700"
                        : "bg-white border-slate-200 text-slate-600 hover:border-rose-300 hover:text-rose-700",
                    ].join(" ")}
                  >
                    Rechazar
                  </button>
                </div>

                {showRejectInput && (
                  <div className="flex items-center gap-2 max-w-lg mt-2">
                    <input
                      type="text"
                      value={rejectObservations}
                      onChange={(e) => setRejectObservations(e.target.value)}
                      placeholder="Indique las observaciones del rechazo..."
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-slate-950 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAuditVerify("rejected")}
                      disabled={isVerifying || !rejectObservations.trim()}
                      className="rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 transition-all disabled:opacity-50 shrink-0"
                    >
                      {isVerifying ? "..." : "Enviar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRejectInput(false);
                        setRejectObservations("");
                      }}
                      className="rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs px-2 py-1.5 shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODO CLIENTE: RENDERIZADO DEL INPUT EN CALIENTE */}
        {!disabled && !isAuditMode && (
          <div className="pt-1">
            {item.kind === "Dato" && (
              <input
                type="text"
                value={textDraft}
                onChange={(e) => {
                  const nextValue = e.target.value;
                  setTextDraft(nextValue);
                  onChange(nextValue);
                }}
                onBlur={async () => {
                  try {
                    await saveIndividualAnswer(item.code, textDraft);
                  } catch (err) {
                    console.error("Auto-save failed:", err);
                  }
                }}
                placeholder="Escribe el dato solicitado aquí..."
                className={[
                  "w-full max-w-lg rounded-lg px-3 py-1.5 text-xs transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)] focus:bg-white focus:outline-none",
                  showPendingHighlight
                    ? "border border-slate-200/50 bg-slate-50/60 text-slate-700 placeholder-slate-400 hover:border-slate-300 focus:border-slate-800"
                    : "bg-slate-50/60 border border-slate-200/50 text-slate-700 placeholder-slate-400 hover:border-slate-300 focus:border-slate-800",
                ].join(" ")}
              />
            )}

            {item.kind === "Declaración" && (
              <div className="flex gap-2">
                {["Sí", "No", "No aplica"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={async () => {
                      onChange(option);

                      if (item.code === "5.1.1" && option !== "Sí") {
                        updateGlobalAnswer("5.1.2", "");
                        try {
                          await saveIndividualAnswer("5.1.2", "");
                        } catch (err) {
                          console.error("Auto-clear country failed:", err);
                        }
                      }

                      if (item.code === "5.3.1" && option !== "Sí") {
                        updateGlobalAnswer("5.3.2", "");
                        updateGlobalAnswer("5.3.3", "");
                        updateGlobalAnswer("5.3.4", "");
                        try {
                          await saveIndividualAnswer("5.3.2", "");
                          await saveIndividualAnswer("5.3.3", "");
                          await saveIndividualAnswer("5.3.4", "");
                        } catch (err) {
                          console.error("Auto-clear public-officer fields failed:", err);
                        }
                      }

                      try {
                        await saveIndividualAnswer(item.code, option);
                      } catch (err) {
                        console.error("Auto-save declaration failed:", err);
                      }
                    }}
                    className={[
                      "px-3 py-1 rounded-lg border text-xs font-semibold transition-all",
                      value === option
                        ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                        : showPendingHighlight
                        ? "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {item.kind === "Documento" && (
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                  disabled={isUploading}
                />
                
                <div className="flex items-center gap-2">
                  {isUploading ? (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/50">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Procesando archivo...
                    </div>
                  ) : value ? (
                    <div className="flex items-center gap-2 bg-emerald-50/60 border border-emerald-100/50 rounded-lg px-3 py-1.5 text-xs text-emerald-800 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                      <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                      <button
                        type="button"
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className={[
                          "font-semibold truncate max-w-xs hover:underline text-left",
                          isDownloading ? "cursor-wait opacity-65" : "",
                        ].join(" ")}
                        title="Haga clic para descargar este documento de S3"
                      >
                        {isDownloading ? "Generando link S3..." : (value instanceof File ? value.name : value || "Documento subido")}
                      </button>
                      <button
                        type="button"
                        onClick={removeFile}
                        className="text-emerald-600 hover:text-rose-600 ml-1 p-0.5 hover:bg-emerald-100 rounded-full transition-all"
                        aria-label="Eliminar archivo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={[
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-[0_1px_2px_rgba(0,0,0,0.01)]",
                        showPendingHighlight
                          ? "bg-white border border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          : "bg-white border border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                      Adjuntar archivo
                    </button>
                  )}
                </div>

                {errorMessage && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">{errorMessage}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Vista estática cuando el panel está Bloqueado (modo solo lectura después de enviar) */}
        {disabled && !isAuditMode && (
          <div className="text-xs pt-0.5">
            {value ? (
              <div className="inline-flex items-center gap-2 text-slate-800 bg-slate-50 border border-slate-200/50 rounded px-2.5 py-1.5 font-semibold leading-none shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
                {item.kind === "Documento" ? (
                  <>
                    <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="hover:underline text-left truncate font-bold text-slate-700"
                      title="Haga clic para descargar de S3"
                    >
                      {isDownloading ? "Generando link S3..." : (value instanceof File ? value.name : value)}
                    </button>
                  </>
                ) : (
                  <span>{value instanceof File ? value.name : value}</span>
                )}
              </div>
            ) : (
              <span className="text-slate-400 italic text-[11px]">No proporcionado</span>
            )}

            {errorMessage && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500 mt-1">{errorMessage}</p>
            )}
          </div>
        )}
      </div>

      {/* Tipo de Requerimiento */}
      <div className="md:text-right pr-2 md:pt-1">
        <span
          className={[
            kindBadgeBaseClass,
            showPendingHighlight
              ? "border-rose-200 bg-rose-50 text-rose-600"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          ].join(" ")}
        >
          {item.kind}
        </span>
      </div>
    </div>
  );
}
