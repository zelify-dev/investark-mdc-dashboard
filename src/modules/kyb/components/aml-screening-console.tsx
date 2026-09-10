"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { AML_BLACKLIST_SOURCES, AmlMember } from "@/modules/kyb/lib/aml-screening";

type AmlScreeningConsoleProps = {
  member: AmlMember;
};

export function AmlScreeningConsole({ member }: AmlScreeningConsoleProps) {
  const [pipelineText, setPipelineText] = useState("");
  const [processedCount, setProcessedCount] = useState(0);

  useEffect(() => {
    if (member.screeningStatus !== "validating") {
      setPipelineText("");
      setProcessedCount(0);
      return;
    }

    let step = 0;
    setPipelineText(`Iniciando consulta en ${AML_BLACKLIST_SOURCES[0]}...`);
    setProcessedCount(0);

    const interval = setInterval(() => {
      if (step < AML_BLACKLIST_SOURCES.length) {
        setPipelineText(`Procesando lista restrictiva: ${AML_BLACKLIST_SOURCES[step]}`);
        setProcessedCount(step + 1);
        step += 1;
        return;
      }

      setPipelineText("Consolidando resultado de screening PLD/AML...");
    }, 650);

    return () => clearInterval(interval);
  }, [member.id, member.screeningStatus]);

  if (member.screeningStatus === "validating") {
    return (
      <div className="mt-2 space-y-2">
        <div className="relative">
          <input
            readOnly
            value={pipelineText}
            className="w-full rounded-lg border border-sky-200 bg-sky-50/60 px-3 py-2 pr-9 font-mono text-[10px] text-sky-900"
          />
          <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-sky-600" />
        </div>
        <div className="flex flex-wrap gap-1">
          {AML_BLACKLIST_SOURCES.map((source, index) => (
            <span
              key={source}
              className={[
                "rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide border",
                index < processedCount
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : index === processedCount
                  ? "border-sky-200 bg-sky-50 text-sky-700"
                  : "border-slate-200 bg-slate-50 text-slate-400",
              ].join(" ")}
            >
              {source}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (member.screeningStatus === "approved") {
    return (
      <div className="mt-2">
        <div className="relative">
          <input
            readOnly
            value="Resultado: Aprobado — Sin coincidencias en listas restrictivas"
            className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 pr-9 text-[10px] font-semibold uppercase tracking-wide text-emerald-800"
          />
          <CheckCircle2 className="absolute right-2.5 top-2.5 h-4 w-4 text-emerald-600" />
        </div>
      </div>
    );
  }

  if (member.screeningStatus === "rejected") {
    return (
      <div className="mt-2 space-y-1">
        <div className="relative">
          <input
            readOnly
            value="Resultado: Rechazado — Coincidencia detectada"
            className="w-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 pr-9 text-[10px] font-semibold uppercase tracking-wide text-rose-800"
          />
          <XCircle className="absolute right-2.5 top-2.5 h-4 w-4 text-rose-600" />
        </div>
        {member.screeningDetails && (
          <p className="text-[10px] text-rose-600">{member.screeningDetails}</p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2">
      <input
        readOnly
        value="Pendiente de validación en listas restrictivas"
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] text-slate-500"
      />
    </div>
  );
}
