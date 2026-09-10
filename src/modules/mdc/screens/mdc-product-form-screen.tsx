"use client";

import { useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getStoredOrganization } from "@/lib/auth-api";
import { createTraceabilityLog } from "@/modules/mdc/services/mdc-traceability.service";
import { getMdcApiBaseUrl } from "@/modules/mdc/services/mdc-api-client";
import type { MdcApplicantMode } from "@/modules/mdc/data/mdc-credit-mock";
import { MdcFormPage } from "@/modules/mdc/components/mdc-form-page";

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export function MdcProductFormScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = (searchParams.get("mode") === "moral" ? "moral" : "natural") as MdcApplicantMode;
  const backHref = `/mdc?tab=products&mode=${mode}`;

  const [financialProduct, setFinancialProduct] = useState("");
  const [creditRate, setCreditRate] = useState<number | "">(0);
  const [defaultInterestRate, setDefaultInterestRate] = useState<number | "">(0);
  const [ivaType, setIvaType] = useState("GENERAL");
  const [paymentScheme, setPaymentScheme] = useState("AMORTIZADO");
  const [dueDatesCount, setDueDatesCount] = useState<number | "">(12);
  const [creditPoints, setCreditPoints] = useState("0.00000 x 0.00000");
  const [defaultPoints, setDefaultPoints] = useState("0.0000");
  const [ivaZone, setIvaZone] = useState("FRONTERA");
  const [paymentPeriod, setPaymentPeriod] = useState("MENSUAL");
  const [scheme, setScheme] = useState("FIJO");
  const [gracePeriod, setGracePeriod] = useState<number | "">(0);
  const [contractType, setContractType] = useState("APERTURA_CREDITO");
  const [paymentFrequency, setPaymentFrequency] = useState("MENSUAL");
  const [operationalClassification, setOperationalClassification] = useState("COMERCIAL");
  const [minimumAmount, setMinimumAmount] = useState<number | "">(10000);
  const [maximumAmount, setMaximumAmount] = useState<number | "">(500000);
  const [businessActivityIndividual, setBusinessActivityIndividual] = useState(true);
  const [indistinct, setIndistinct] = useState(false);
  const [guaranteedWithFega, setGuaranteedWithFega] = useState(false);
  const [guaranteedWithFonaga, setGuaranteedWithFonaga] = useState(false);
  const [contractDestination, setContractDestination] = useState("CAPITAL_TRABAJO");
  const [status, setStatus] = useState("ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const individualPerson = mode === "natural";
  const legalEntity = mode === "moral";
  const isValid = financialProduct.trim().length > 1 && Number(maximumAmount) >= Number(minimumAmount);

  const handleCreate = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    const currentOrg = getStoredOrganization();
    const payload = {
      orgId: currentOrg?.id || "ORG-001",
      financialProduct: financialProduct.trim(),
      creditRate: Number(creditRate),
      defaultInterestRate: Number(defaultInterestRate),
      ivaType,
      paymentScheme,
      dueDatesCount: Number(dueDatesCount),
      creditPoints,
      defaultPoints,
      ivaZone,
      paymentPeriod,
      scheme,
      gracePeriod: Number(gracePeriod),
      contractType,
      paymentFrequency,
      operationalClassification,
      minimumAmount: Number(minimumAmount),
      maximumAmount: Number(maximumAmount),
      individualPerson,
      legalEntity,
      businessActivityIndividual,
      indistinct,
      guaranteedWithFega,
      guaranteedWithFonaga,
      contractDestination,
      status,
    };

    try {
      const baseUrl = getMdcApiBaseUrl("http://localhost:3000");
      const response = await fetch(`${baseUrl}/finance-products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (payload.orgId && payload.orgId !== "demo-bypass-org") {
          await createTraceabilityLog({
            orgId: payload.orgId,
            action: "PRODUCT_CREATE",
            detail: `Producto creado: ${payload.financialProduct}`,
            channel: "Consola",
            userName: "Ejecutivo Zelify",
            correlationId: `corr-prod-${data.id ? data.id.substring(0, 8) : Date.now()}`,
          });
        }
        router.push(backHref);
        return;
      }
      alert("Hubo un error al crear el producto en el backend.");
    } catch {
      alert("No se pudo conectar al backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MdcFormPage
      title="Agregar producto"
      subtitle="Alta de producto financiero con las condiciones de tasa, monto y elegibilidad."
      backHref={backHref}
      backLabel="Volver a productos"
    >
      <form className="mdc-form-grid" onSubmit={(event) => event.preventDefault()}>
        <Field label="Nombre del producto" className="mdc-form-grid__full">
          <input value={financialProduct} onChange={(e) => setFinancialProduct(e.target.value)} />
        </Field>
        <Field label="Tasa del crédito (%)">
          <input type="number" min="0" step="any" value={creditRate} onChange={(e) => setCreditRate(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))} />
        </Field>
        <Field label="Tasa moratoria (%)">
          <input type="number" min="0" step="any" value={defaultInterestRate} onChange={(e) => setDefaultInterestRate(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))} />
        </Field>
        <Field label="Monto mínimo">
          <input type="number" min="0" value={minimumAmount} onChange={(e) => setMinimumAmount(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))} />
        </Field>
        <Field label="Monto máximo">
          <input type="number" min="0" value={maximumAmount} onChange={(e) => setMaximumAmount(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))} />
        </Field>
        <Field label="No. Vencimientos">
          <input type="number" min="0" value={dueDatesCount} onChange={(e) => setDueDatesCount(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))} />
        </Field>
        <Field label="Gracia (periodos)">
          <input type="number" min="0" value={gracePeriod} onChange={(e) => setGracePeriod(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))} />
        </Field>
        <Field label="Puntos crédito">
          <input value={creditPoints} onChange={(e) => setCreditPoints(e.target.value)} />
        </Field>
        <Field label="Puntos moratorios">
          <input value={defaultPoints} onChange={(e) => setDefaultPoints(e.target.value)} />
        </Field>
        <Field label="Tipo de IVA">
          <select value={ivaType} onChange={(e) => setIvaType(e.target.value)}>
            <option value="SIN IVA">SIN IVA</option>
            <option value="GENERAL">GENERAL</option>
          </select>
        </Field>
        <Field label="Zona IVA">
          <select value={ivaZone} onChange={(e) => setIvaZone(e.target.value)}>
            <option value="ZONA 1">ZONA 1</option>
            <option value="FRONTERA">FRONTERA</option>
          </select>
        </Field>
        <Field label="Esquema de pago">
          <select value={paymentScheme} onChange={(e) => setPaymentScheme(e.target.value)}>
            <option value="SIMPLE">SIMPLE</option>
            <option value="AMORTIZADO">AMORTIZADO</option>
          </select>
        </Field>
        <Field label="Periodo de pago">
          <select value={paymentPeriod} onChange={(e) => setPaymentPeriod(e.target.value)}>
            <option value="AL VENCIMIENTO">AL VENCIMIENTO</option>
            <option value="MENSUAL">MENSUAL</option>
          </select>
        </Field>
        <Field label="Esquema">
          <select value={scheme} onChange={(e) => setScheme(e.target.value)}>
            <option value="FIJO">FIJO</option>
            <option value="AMORTIZACIONES CONSTANTES">AMORTIZACIONES CONSTANTES</option>
          </select>
        </Field>
        <Field label="Tipo de contrato">
          <input value={contractType} onChange={(e) => setContractType(e.target.value.toUpperCase())} />
        </Field>
        <Field label="Frecuencia de pago">
          <select value={paymentFrequency} onChange={(e) => setPaymentFrequency(e.target.value)}>
            <option value="CATORCENAL">CATORCENAL</option>
            <option value="MENSUAL">MENSUAL</option>
          </select>
        </Field>
        <Field label="Clasificación operativa">
          <select value={operationalClassification} onChange={(e) => setOperationalClassification(e.target.value)}>
            <option value="AL CONSUMO">AL CONSUMO</option>
            <option value="COMERCIAL">COMERCIAL</option>
          </select>
        </Field>
        <Field label="Destino del contrato" className="mdc-form-grid__full">
          <select value={contractDestination} onChange={(e) => setContractDestination(e.target.value)}>
            <option value="CONSUMO">CONSUMO</option>
            <option value="CAPITAL_TRABAJO">CAPITAL_TRABAJO</option>
          </select>
        </Field>
        <fieldset className="mdc-form-grid__full mdc-form-fieldset">
          <legend>Elegibilidad y garantías</legend>
          <div className="mdc-form-fieldset__grid">
            {([
              { label: "Física act. empresarial", value: businessActivityIndividual, set: setBusinessActivityIndividual },
              { label: "Indistinto", value: indistinct, set: setIndistinct },
              { label: "Garantizado con FEGA", value: guaranteedWithFega, set: setGuaranteedWithFega },
              { label: "Garantizado con FONAGA", value: guaranteedWithFonaga, set: setGuaranteedWithFonaga },
            ] as { label: string; value: boolean; set: (v: boolean) => void }[]).map(({ label, value, set }) => {
              const id = label.toLowerCase().replace(/\s+/g, "-");
              return (
                <div key={id} className="mdc-form-fieldset__item">
                  <span>{label}</span>
                  <div>
                    <label>
                      <input type="radio" name={id} checked={value} onChange={() => set(true)} />
                      Sí
                    </label>
                    <label>
                      <input type="radio" name={id} checked={!value} onChange={() => set(false)} />
                      No
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        </fieldset>
        <Field label="Estado" className="mdc-form-grid__full">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ACTIVE">ACTIVO</option>
            <option value="INACTIVE">INACTIVO</option>
          </select>
        </Field>
        <div className="mdc-form-grid__full mdc-form-page__actions">
          <button type="button" className="mdc-btn mdc-btn--ghost" onClick={() => router.push(backHref)}>
            Cancelar
          </button>
          <button type="button" className="mdc-btn mdc-btn--primary" disabled={!isValid || isSubmitting} onClick={handleCreate}>
            {isSubmitting ? "Creando..." : "Crear producto"}
          </button>
        </div>
      </form>
    </MdcFormPage>
  );
}
