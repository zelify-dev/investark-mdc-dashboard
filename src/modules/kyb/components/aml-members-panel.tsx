"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldAlert, Users, Zap } from "lucide-react";
import { AmlScreeningConsole } from "@/modules/kyb/components/aml-screening-console";
import { useOnboarding } from "@/modules/kyb/components/onboarding-provider";
import { isOwnerKybComplete } from "@/modules/kyb/lib/aml-screening";

const AUTO_VALIDATE_KEY = "zelify_aml_auto_validate";

export function AmlMembersPanel() {
  const { ownersList, startOwnerScreening, moduleLocked } = useOnboarding();
  const [autoValidateOnRegister, setAutoValidateOnRegister] = useState(false);

  const isDisabled = moduleLocked.pldAml;

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAutoValidateOnRegister(localStorage.getItem(AUTO_VALIDATE_KEY) === "true");
  }, []);

  useEffect(() => {
    if (!autoValidateOnRegister || isDisabled) return;

    ownersList.forEach((owner) => {
      if (owner.screeningStatus === "pending" && isOwnerKybComplete(owner)) {
        startOwnerScreening(owner.id);
      }
    });
  }, [ownersList, autoValidateOnRegister, isDisabled, startOwnerScreening]);

  const handleAutoValidateToggle = (enabled: boolean) => {
    setAutoValidateOnRegister(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTO_VALIDATE_KEY, enabled ? "true" : "false");
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "approved") {
      return (
        <span className="inline-flex items-center rounded-md border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
          Aprobado
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span className="inline-flex items-center rounded-md border border-rose-100 bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700">
          Rechazado
        </span>
      );
    }
    if (status === "validating") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-700">
          <Loader2 className="h-3 w-3 animate-spin" />
          Validando
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-md border border-slate-200/50 bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
        Pendiente
      </span>
    );
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            Validación PLD/AML
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            Screening en listas restrictivas
          </h3>
          <p className="mt-1.5 max-w-3xl text-sm text-slate-500">
            Los integrantes se cargan desde KYB (sección 1.5). Aquí solo puede validar en lista
            negra; no es posible crear nuevos miembros.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
          <ShieldAlert size={12} />
          Solo validación
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2.5">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={autoValidateOnRegister}
            onChange={(e) => handleAutoValidateToggle(e.target.checked)}
            disabled={isDisabled}
            className="rounded border-slate-300 text-slate-900 focus:ring-slate-950"
          />
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
            <Zap size={12} className="text-amber-600" />
            Activar validación automática
          </span>
        </label>
        <p className="text-[10px] text-slate-500">
          Valida automáticamente a integrantes con KYB completo (nombre + INE).
        </p>
      </div>

      <div className="mt-6">
        <h4 className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
          <Users size={14} />
          Integrantes desde KYB (1.5)
        </h4>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Integrante</th>
                <th className="px-4 py-3">KYB</th>
                <th className="px-4 py-3">INE</th>
                <th className="min-w-[280px] px-4 py-3">Screening / Listas negras</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ownersList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No hay integrantes registrados. Agréguelos en{" "}
                    <strong>Información del negocio → 1.5 Propietarios y Directivos</strong>.
                  </td>
                </tr>
              ) : (
                ownersList.map((member) => {
                  const kybDone = isOwnerKybComplete(member);

                  return (
                    <tr key={member.id} className="align-top hover:bg-slate-50/40">
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        <div>{member.name}</div>
                        <div className="mt-0.5 text-[10px] font-normal text-slate-500">
                          {member.role} · {member.ownershipPercent}%
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={[
                            "text-[10px] font-bold uppercase",
                            kybDone ? "text-emerald-700" : "text-amber-700",
                          ].join(" ")}
                        >
                          {kybDone ? "Completo" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[10px] text-slate-500">
                        {member.ineDocument || "Sin INE"}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="mb-2">{getStatusBadge(member.screeningStatus)}</div>
                        <AmlScreeningConsole member={member} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {kybDone &&
                          (member.screeningStatus === "pending" ||
                            member.screeningStatus === "rejected") && (
                            <button
                              type="button"
                              disabled={isDisabled}
                              onClick={() => startOwnerScreening(member.id)}
                              className="rounded-lg bg-slate-950 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                            >
                              Validar
                            </button>
                          )}
                        {!kybDone && (
                          <span className="text-[10px] font-semibold uppercase text-slate-400">
                            Complete KYB
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
