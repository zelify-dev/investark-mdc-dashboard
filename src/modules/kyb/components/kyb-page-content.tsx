"use client";

import { useMemo, useState } from "react";
import { Breadcrumb } from "@/modules/kyb/components/breadcrumb";
import { ChecklistSectionPanel } from "@/modules/kyb/components/checklist-section";
import { StatusAlert } from "@/modules/kyb/components/status-alert";
import { useOnboarding } from "@/modules/kyb/components/onboarding-provider";
import { kybChecklistSections } from "@/modules/kyb/lib/onboarding-config";

export function KybPageContent() {
  const {
    progress,
    visibleModules,
    moduleLocked,
    moduleSubmitted,
    moduleStatusMessage,
    submitSectionDocumentation,
  } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isHidden = !visibleModules.kyb;
  const kybLocked = moduleLocked.kyb;
  const kybSubmitted = moduleSubmitted.kyb;
  const kybStatusMessage = moduleStatusMessage.kyb;

  const isDisabled = kybLocked || isSubmitting || isHidden;
  
  // El botón está activo siempre que el panel no esté congelado/bloqueado
  const canSubmit = !isDisabled;

  const requirementCount = useMemo(
    () =>
      kybChecklistSections.reduce(
        (count, section) =>
          count +
          section.subsections.reduce(
            (subtotal, subsection) => subtotal + subsection.items.length,
            0,
          ),
        0,
      ),
    [],
  );

  const lockDescription = useMemo(
    () =>
      `Progreso final: ${progress.kyb}%. No es posible modificar datos o subir nuevos soportes mientras el expediente se encuentre bajo revisión del equipo de validación.`,
    [progress.kyb],
  );

  if (isHidden) {
    return null;
  }

  const handleSubmit = async () => {
    if (isDisabled) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      // Envía la sección a revisión congelando todos los campos interactivos de red
      await submitSectionDocumentation("kyb", null);
      setSuccessMessage("¡Sección 1 — Información del negocio enviada exitosamente a revisión! Los campos han sido bloqueados.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No fue posible enviar la información del negocio a validación.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="zelify-kyb-surface max-w-[1380px] p-6 sm:p-8">
      <Breadcrumb title="Sección 1 — Información del negocio" />

      <section className="bg-transparent mt-4">
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Información del negocio
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Esta vista refleja el checklist oficial aprobado para onboarding
              empresarial en México. Complete todos los campos de texto y cargue los archivos solicitados en cada fila correspondiente.
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-slate-400 self-start lg:self-center">
            <div>
              Requisitos
              <span className="ml-2 text-sm font-bold text-slate-800">{requirementCount}</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <div>
              Progreso
              <span className="ml-2 text-sm font-bold text-slate-800">{progress.kyb}%</span>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <StatusAlert
            tone="info"
            title="Información importante"
            description="Complete la información solicitada en cada casilla interactiva. Los datos se guardan automáticamente. Una vez que finalice, presione 'Enviar información del negocio' al final para congelar el formulario y pasar a auditoría."
          />

          {kybSubmitted && (
            <StatusAlert
              tone="success"
              title="Información del negocio ya enviada."
              description={lockDescription}
            />
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2 border-b border-slate-100 pb-5 text-xs font-medium text-slate-400 lg:flex-row lg:gap-8">
          <p>
            <span className="font-semibold text-slate-700">Alcance:</span> Datos constitutivos, representante legal, accionistas y poderes.
          </p>
          <p className="hidden lg:block text-slate-200">|</p>
          <p>
            <span className="font-semibold text-slate-700">Formato:</span> Llenado dinámico e interactivo por casillero.
          </p>
          <p className="hidden lg:block text-slate-200">|</p>
          <p>
            <span className="font-semibold text-slate-700">Estado:</span> {kybSubmitted ? "Bajo revisión de Zelify" : "Edición en proceso"}
          </p>
        </div>

        <div className="mt-6 space-y-6">
          {kybChecklistSections.map((section) => (
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

            {(successMessage || kybStatusMessage) && (
              <StatusAlert
                tone="success"
                title="Expediente enviado"
                description={successMessage || kybStatusMessage || ""}
              />
            )}
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Progreso Sección 1:
              <span className="ml-2 text-sm font-bold text-slate-800">{progress.kyb}%</span>
            </div>
            
            {!kybLocked && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
              >
                {isSubmitting ? "Enviando información..." : "Enviar información del negocio"}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
