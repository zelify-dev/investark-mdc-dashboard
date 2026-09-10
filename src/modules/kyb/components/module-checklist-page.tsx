"use client";

import { useMemo, useState } from "react";
import { Breadcrumb } from "@/modules/kyb/components/breadcrumb";
import { ChecklistSectionPanel } from "@/modules/kyb/components/checklist-section";
import { StatusAlert } from "@/modules/kyb/components/status-alert";
import { useOnboarding } from "@/modules/kyb/components/onboarding-provider";
import { ChecklistSection, OnboardingModuleKey } from "@/modules/kyb/lib/onboarding-config";

type ModuleChecklistPageProps = {
  title: string;
  description: string;
  moduleKey: OnboardingModuleKey;
  sections: ChecklistSection[];
};

export function ModuleChecklistPage({
  title,
  description,
  moduleKey,
  sections,
}: ModuleChecklistPageProps) {
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

  const isLocked = moduleLocked[moduleKey];
  const isSubmitted = moduleSubmitted[moduleKey];
  const statusMessage = moduleStatusMessage[moduleKey];

  const isDisabled = isLocked || isSubmitting;
  const canSubmit = !isDisabled;

  const totalRequirements = useMemo(
    () =>
      sections.reduce(
        (count, section) =>
          count +
          section.subsections.reduce((subtotal, subsection) => subtotal + subsection.items.length, 0),
        0,
      ),
    [sections],
  );

  const lockDescription = useMemo(
    () =>
      `Progreso final: ${progress[moduleKey]}%. La documentación de esta sección ya ha sido cargada y está bajo revisión operativa. La edición ha sido inhabilitada.`,
    [progress, moduleKey],
  );

  const handleSubmit = async () => {
    if (isDisabled) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      await submitSectionDocumentation(moduleKey, null);
      setSuccessMessage(`¡Módulo "${title}" enviado exitosamente a revisión! Los campos interactivos han sido bloqueados.`);
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
    <div className="zelify-kyb-surface max-w-[1380px] p-6 sm:p-8">
      <Breadcrumb title={title} />

      <section className="bg-transparent mt-4">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
          </div>
          <div className="flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-400 self-start lg:self-center">
            <div>
              Requisitos
              <span className="ml-2 text-sm font-bold text-slate-800">{totalRequirements}</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <div>
              Progreso
              <span className="ml-2 text-sm font-bold text-slate-800">{progress[moduleKey]}%</span>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <StatusAlert
            tone="info"
            title="Checklist oficial del expediente"
            description="Complete la información solicitada en cada casilla interactiva. Los datos se guardan automáticamente. Una vez que finalice, presione 'Enviar expediente completo' al final para congelar el formulario y pasar a auditoría."
          />

          {isSubmitted && (
            <StatusAlert
              tone="success"
              title="Documentación cargada exitosamente"
              description={lockDescription}
            />
          )}
        </div>

        <div className="mt-6 space-y-6">
          {sections.map((section) => (
            <ChecklistSectionPanel key={section.code} section={section} />
          ))}
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="space-y-3">
            {errorMessage && (
              <StatusAlert
                tone="error"
                title="Error al Enviar"
                description={errorMessage}
              />
            )}

            {(successMessage || statusMessage) && (
              <StatusAlert
                tone="success"
                title="Expediente enviado"
                description={successMessage || statusMessage || ""}
              />
            )}
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Progreso del módulo:
              <span className="ml-2 text-sm font-bold text-slate-800">{progress[moduleKey]}%</span>
            </div>

            {!isLocked && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
              >
                {isSubmitting ? "Enviando expediente..." : "Enviar expediente completo"}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
