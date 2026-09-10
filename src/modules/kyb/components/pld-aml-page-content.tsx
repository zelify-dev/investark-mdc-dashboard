"use client";

import { useMemo, useState } from "react";
import { AmlMembersPanel } from "@/modules/kyb/components/aml-members-panel";
import { Breadcrumb } from "@/modules/kyb/components/breadcrumb";
import { ChecklistSectionPanel } from "@/modules/kyb/components/checklist-section";
import { StatusAlert } from "@/modules/kyb/components/status-alert";
import { useOnboarding } from "@/modules/kyb/components/onboarding-provider";
import { pldAmlChecklistSections } from "@/modules/kyb/lib/onboarding-config";

export function PldAmlPageContent() {
  const {
    progress,
    moduleLocked,
    moduleSubmitted,
    moduleStatusMessage,
    submitSectionDocumentation,
  } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const moduleKey = "pldAml" as const;
  const isLocked = moduleLocked[moduleKey];
  const isSubmitted = moduleSubmitted[moduleKey];
  const statusMessage = moduleStatusMessage[moduleKey];
  const isDisabled = isLocked || isSubmitting;

  const totalRequirements = useMemo(
    () =>
      pldAmlChecklistSections.reduce(
        (count, section) =>
          count +
          section.subsections.reduce((subtotal, subsection) => subtotal + subsection.items.length, 0),
        0,
      ),
    [],
  );

  const handleSubmit = async () => {
    if (isDisabled) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await submitSectionDocumentation(moduleKey, null);
      setSuccessMessage(
        "¡Módulo PLD/AML enviado exitosamente a revisión! Los campos interactivos han sido bloqueados.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No fue posible enviar la sección a validación.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1380px] rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.01)] sm:p-8">
      <Breadcrumb title="PLD/AML y Datos Personales" />

      <section className="mt-4 bg-transparent">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              PLD/AML y Datos Personales
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Cargue primero la documentación oficial PLD/AML y después registre integrantes para
              validación en listas restrictivas.
            </p>
          </div>
          <div className="flex items-center gap-6 self-start text-xs font-semibold uppercase tracking-wider text-slate-400 lg:self-center">
            <div>
              Requisitos
              <span className="ml-2 text-sm font-bold text-slate-800">{totalRequirements}</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-200" />
            <div>
              Progreso
              <span className="ml-2 text-sm font-bold text-slate-800">{progress.pldAml}%</span>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <StatusAlert
            tone="info"
            title="Checklist de documentación PLD/AML"
            description="Complete primero los requisitos documentales. La validación de integrantes en lista negra va en la segunda parte de esta sección."
          />
          {isSubmitted && (
            <StatusAlert
              tone="success"
              title="Documentación cargada exitosamente"
              description={`Progreso final: ${progress.pldAml}%. La edición de esta sección está bloqueada.`}
            />
          )}
        </div>

        <div className="mt-6 space-y-6">
          {pldAmlChecklistSections.map((section) => (
            <ChecklistSectionPanel key={section.code} section={section} />
          ))}
        </div>

        <div className="mt-8">
          <AmlMembersPanel />
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6">
          {errorMessage && (
            <StatusAlert tone="error" title="Error al Enviar" description={errorMessage} />
          )}
          {(successMessage || statusMessage) && (
            <StatusAlert
              tone="success"
              title="Expediente enviado"
              description={successMessage || statusMessage || ""}
            />
          )}

          {!isLocked && (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isDisabled}
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
              >
                {isSubmitting ? "Enviando expediente..." : "Enviar expediente completo"}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
