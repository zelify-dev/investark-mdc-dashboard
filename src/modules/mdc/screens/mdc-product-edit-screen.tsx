"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { MdcFormPage } from "@/modules/mdc/components/mdc-form-page";
import { readProductEditSession } from "@/modules/mdc/lib/mdc-form-session";
import type { MdcApplicantMode, MdcProduct } from "@/modules/mdc/data/mdc-products-mock";

type ProductEditSession = {
  product: MdcProduct;
  mode: MdcApplicantMode;
};

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function MdcProductEditScreen() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const session = useMemo(() => readProductEditSession<ProductEditSession>(), []);
  const mode = (searchParams.get("mode") || session?.mode || "natural") as MdcApplicantMode;
  const backHref = `/mdc?tab=products&mode=${mode}`;
  const product = session?.product && session.product.id === params.id ? session.product : null;

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [status, setStatus] = useState<MdcProduct["status"]>(product?.status ?? "ACTIVO");
  const [interestMin, setInterestMin] = useState(String(product?.configuration.interestRate.min ?? 0));
  const [interestMax, setInterestMax] = useState(String(product?.configuration.interestRate.max ?? 0));
  const [amountMin, setAmountMin] = useState(product?.configuration.amount.min ?? 0);
  const [amountMax, setAmountMax] = useState(product?.configuration.amount.max ?? 0);
  const [residualAmount, setResidualAmount] = useState(product?.configuration.residualAmount ?? 0);
  const [termMin, setTermMin] = useState(product?.configuration.term.min ?? 0);
  const [termMax, setTermMax] = useState(product?.configuration.term.max ?? 0);
  const [frequency, setFrequency] = useState(product?.configuration.term.frequency ?? "mensual");

  const parsedInterestMin = Number(interestMin);
  const parsedInterestMax = Number(interestMax);
  const canSave =
    Boolean(product) &&
    name.trim().length > 1 &&
    amountMax >= amountMin &&
    interestMin.trim() !== "" &&
    interestMax.trim() !== "" &&
    !Number.isNaN(parsedInterestMin) &&
    !Number.isNaN(parsedInterestMax) &&
    parsedInterestMax >= parsedInterestMin;

  if (!product) {
    return (
      <MdcFormPage title="Configurar producto" subtitle="No hay un producto en edición." backHref={backHref} backLabel="Volver a productos">
        <p>Abre esta vista desde la tarjeta del producto para conservar su configuración.</p>
      </MdcFormPage>
    );
  }

  const handleSave = () => {
    if (!canSave) return;
    const storageKey = `mdc:products:v4:${mode}`;
    const updated: MdcProduct = {
      ...product,
      name: name.trim(),
      description: description.trim() || "Sin descripcion",
      status,
      configuration: {
        interestRate: { min: parsedInterestMin, max: parsedInterestMax },
        amount: { min: amountMin, max: amountMax },
        residualAmount,
        term: { min: termMin, max: termMax, frequency },
      },
    };
    try {
      const raw = window.localStorage.getItem(storageKey);
      const current = raw ? (JSON.parse(raw) as MdcProduct[]) : [];
      const next = current.some((item) => item.id === updated.id)
        ? current.map((item) => (item.id === updated.id ? updated : item))
        : [...current, updated];
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* noop */
    }
    router.push(backHref);
  };

  return (
    <MdcFormPage
      title={`Configurar · ${product.name}`}
      subtitle="Ajusta tasas, montos, plazos y el estado operativo del producto."
      backHref={backHref}
      backLabel="Volver a productos"
    >
      <form className="mdc-form-grid" onSubmit={(event) => event.preventDefault()}>
        <Field label="Nombre del producto">
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Estado">
          <select value={status} onChange={(e) => setStatus(e.target.value as MdcProduct["status"])}>
            <option value="ACTIVO">ACTIVO</option>
            <option value="INACTIVO">INACTIVO</option>
            <option value="BORRADOR">BORRADOR</option>
            <option value="SUSPENDIDO">SUSPENDIDO</option>
          </select>
        </Field>
        <Field label="Tipo de crédito / contrato" className="mdc-form-grid__full">
          <input value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Tasa interés mín. (%)">
          <input type="number" min="0" step="any" value={interestMin} onChange={(e) => { const v = e.target.value; if (v === "" || Number(v) >= 0) setInterestMin(v); }} />
        </Field>
        <Field label="Tasa interés máx. (%)">
          <input type="number" min="0" step="any" value={interestMax} onChange={(e) => { const v = e.target.value; if (v === "" || Number(v) >= 0) setInterestMax(v); }} />
        </Field>
        <Field label="Monto mínimo">
          <input type="number" min="0" value={amountMin} onChange={(e) => setAmountMin(Math.max(0, Number(e.target.value)))} />
        </Field>
        <Field label="Monto máximo">
          <input type="number" min="0" value={amountMax} onChange={(e) => setAmountMax(Math.max(0, Number(e.target.value)))} />
        </Field>
        <Field label="Monto residual (%)">
          <input type="number" min="0" value={residualAmount} onChange={(e) => setResidualAmount(Math.max(0, Number(e.target.value)))} />
        </Field>
        <Field label="Frecuencia">
          <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
            <option value="diario">diario</option>
            <option value="semanal">semanal</option>
            <option value="quincenal">quincenal</option>
            <option value="mensual">mensual</option>
          </select>
        </Field>
        <Field label="Plazo mínimo">
          <input type="number" min="0" value={termMin} onChange={(e) => setTermMin(Math.max(0, Number(e.target.value)))} />
        </Field>
        <Field label="Plazo máximo">
          <input type="number" min="0" value={termMax} onChange={(e) => setTermMax(Math.max(0, Number(e.target.value)))} />
        </Field>
        <div className="mdc-form-grid__full mdc-form-page__actions">
          <button type="button" className="mdc-btn mdc-btn--ghost" onClick={() => router.push(backHref)}>
            Cancelar
          </button>
          <button type="button" className="mdc-btn mdc-btn--primary" disabled={!canSave} onClick={handleSave}>
            Guardar cambios
          </button>
        </div>
      </form>
    </MdcFormPage>
  );
}
