"use client";

import { FormEvent, useRef, useState } from "react";
import { FileText, Plus, Trash2, UserCheck } from "lucide-react";
import { useOnboarding } from "@/modules/kyb/components/onboarding-provider";
import { isOwnerKybComplete } from "@/modules/kyb/lib/aml-screening";

export function OwnersKybPanel() {
  const {
    ownersList,
    registerOwner,
    removeOwner,
    setOwnerIneDocument,
    moduleLocked,
    isAuditMode,
  } = useOnboarding();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Socio / Accionista");
  const [ownershipPercent, setOwnershipPercent] = useState("25");
  const [rfc, setRfc] = useState("");
  const [curp, setCurp] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const isDisabled = moduleLocked.kyb || isAuditMode;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!name.trim() || !email.trim() || !rfc.trim() || !curp.trim()) {
      setFormError("Nombre, correo, RFC y CURP son obligatorios para el proceso KYB.");
      return;
    }

    const ownership = Number(ownershipPercent);
    if (Number.isNaN(ownership) || ownership < 0 || ownership > 100) {
      setFormError("El porcentaje debe estar entre 0 y 100.");
      return;
    }

    if (rfc.trim().length < 13) {
      setFormError("El RFC físico debe tener 13 caracteres.");
      return;
    }

    if (curp.trim().length < 18) {
      setFormError("El CURP debe tener 18 caracteres.");
      return;
    }

    registerOwner({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      ownershipPercent: ownership,
      rfc: rfc.trim().toUpperCase(),
      curp: curp.trim().toUpperCase(),
    });

    setName("");
    setEmail("");
    setRole("Socio / Accionista");
    setOwnershipPercent("25");
    setRfc("");
    setCurp("");
  };

  const handleIneUpload = (ownerId: string, file: File) => {
    setOwnerIneDocument(ownerId, file.name);
  };

  return (
    <div className="mb-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50/30 p-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
          Proceso KYB · Sección 1.5
        </p>
        <h4 className="mt-1 text-sm font-semibold text-slate-900">
          Propietarios, directivos y accionistas
        </h4>
        <p className="mt-1 text-xs text-slate-500">
          Registre cada integrante con nombre completo e INE. Los campos 1.5.1 a 1.5.4 se completan
          automáticamente y en PLD/AML solo se validarán en lista negra (sin alta adicional).
        </p>
      </div>

      {!isDisabled && (
        <form
          onSubmit={handleSubmit}
          className="grid gap-3 rounded-xl border border-slate-200/80 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <input
            type="text"
            placeholder="Nombre completo *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-slate-50/30 px-3 py-2 text-xs"
          />
          <input
            type="email"
            placeholder="Correo *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-slate-50/30 px-3 py-2 text-xs"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-slate-50/30 px-3 py-2 text-xs"
          >
            <option value="Socio / Accionista">Socio / Accionista</option>
            <option value="CEO">CEO</option>
            <option value="CFO">CFO</option>
            <option value="Presidente / Director">Presidente / Director</option>
            <option value="Representante Legal">Representante Legal</option>
            <option value="Otro">Otro</option>
          </select>
          <input
            type="number"
            min={0}
            max={100}
            placeholder="% participación"
            value={ownershipPercent}
            onChange={(e) => setOwnershipPercent(e.target.value)}
            className="bg-slate-50/30 px-3 py-2 text-xs"
          />
          <input
            type="text"
            maxLength={13}
            placeholder="RFC (13) *"
            value={rfc}
            onChange={(e) => setRfc(e.target.value)}
            className="bg-slate-50/30 px-3 py-2 text-xs uppercase"
          />
          <input
            type="text"
            maxLength={18}
            placeholder="CURP (18) *"
            value={curp}
            onChange={(e) => setCurp(e.target.value)}
            className="bg-slate-50/30 px-3 py-2 text-xs uppercase"
          />
          <div className="sm:col-span-2 lg:col-span-3 flex flex-wrap items-center gap-2">
            {formError && <p className="text-[11px] font-semibold text-rose-600">{formError}</p>}
            <button
              type="submit"
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-900"
            >
              <Plus size={14} />
              Agregar integrante KYB
            </button>
          </div>
        </form>
      )}

      {ownersList.length === 0 ? (
        <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Agregue al menos un propietario o directivo para iniciar el expediente 1.5.
        </p>
      ) : (
        <div className="space-y-2">
          {ownersList.map((owner) => {
            const kybDone = isOwnerKybComplete(owner);

            return (
              <div
                key={owner.id}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900">{owner.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {owner.role} · {owner.ownershipPercent}% · {owner.email}
                    </p>
                    <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                      RFC {owner.rfc} · CURP {owner.curp}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={[
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase",
                        kybDone
                          ? "border border-emerald-100 bg-emerald-50 text-emerald-700"
                          : "border border-amber-100 bg-amber-50 text-amber-700",
                      ].join(" ")}
                    >
                      <UserCheck size={12} />
                      {kybDone ? "KYB completo" : "KYB pendiente"}
                    </span>
                    {!isDisabled && (
                      <button
                        type="button"
                        onClick={() => removeOwner(owner.id)}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-rose-600"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    INE (identificación oficial) *
                  </label>
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      ref={(node) => {
                        fileInputRefs.current[owner.id] = node;
                      }}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={isDisabled}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleIneUpload(owner.id, file);
                      }}
                    />
                    <button
                      type="button"
                      disabled={isDisabled}
                      onClick={() => fileInputRefs.current[owner.id]?.click()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold uppercase text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                    >
                      <FileText size={12} />
                      {owner.ineDocument ? "Reemplazar INE" : "Adjuntar INE"}
                    </button>
                    {owner.ineDocument && (
                      <span className="truncate text-[10px] font-mono text-slate-600">
                        {owner.ineDocument}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
