"use client";

import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { OwnersKybPanel } from "@/modules/kyb/components/owners-kyb-panel";
import { useOnboarding } from "@/modules/kyb/components/onboarding-provider";
import { isOwnerKybComplete } from "@/modules/kyb/lib/aml-screening";

export function OwnersSectionSync() {
  const { ownersList } = useOnboarding();

  return (
    <>
      <OwnersKybPanel />

      {ownersList.length > 0 && (
        <div className="mb-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Resumen · Validación AML (en PLD/AML)
            </p>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {
                ownersList.filter((member) => member.screeningStatus === "approved").length
              }
              /{ownersList.length} en lista negra
            </span>
          </div>

          <div className="space-y-2">
            {ownersList.map((member) => (
              <div
                key={member.id}
                className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-800">{member.name}</p>
                  <p className="text-[10px] text-slate-500">
                    KYB: {isOwnerKybComplete(member) ? "Completo" : "Pendiente (nombre + INE)"}
                    {member.ownershipPercent >= 25 ? ` · ${member.ownershipPercent}%` : ""}
                  </p>
                </div>

                {member.screeningStatus === "approved" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-700">
                    <CheckCircle2 size={12} />
                    AML Aprobado
                  </span>
                ) : member.screeningStatus === "rejected" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-rose-700">
                    <AlertCircle size={12} />
                    AML Rechazado
                  </span>
                ) : member.screeningStatus === "validating" ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-sky-700">
                    <Loader2 size={12} className="animate-spin" />
                    Validando AML
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase text-slate-500">
                    AML pendiente
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
