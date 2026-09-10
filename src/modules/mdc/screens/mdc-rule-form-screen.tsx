"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { getStoredOrganization } from "@/lib/auth-api";
import { createRule, updateRule } from "@/modules/mdc/services/mdc-rules.service";
import type { CreditRuleRow, RuleProduct } from "@/modules/mdc/data/mdc-rules-mock";
import { MdcFormPage } from "@/modules/mdc/components/mdc-form-page";
import { readRuleFormSession } from "@/modules/mdc/lib/mdc-form-session";
import { RuleModal, buildDecisionBands, type RuleFormState } from "@/modules/mdc/screens/mdc-screen";

type RuleFormSession = {
  initial: RuleFormState;
  isEditing: boolean;
  editingRuleId: string | null;
  initialBulkRules?: CreditRuleRow[];
  mode: "natural" | "moral";
  availableFields: { value: string; label: string }[];
  products: RuleProduct[];
  productDetails?: unknown[];
};

export function MdcRuleFormScreen() {
  const router = useRouter();
  const session = useMemo(() => readRuleFormSession<RuleFormSession>(), []);
  const mode = session?.mode || "natural";
  const backHref = `/mdc?tab=rules&mode=${mode}`;

  if (!session) {
    return (
      <MdcFormPage title="Regla de crédito" subtitle="No hay una regla en edición." backHref={backHref} backLabel="Volver a reglas">
        <p>Abre esta vista desde Productos o Reglas para conservar el estado del formulario.</p>
      </MdcFormPage>
    );
  }

  return (
    <MdcFormPage
      title={session.isEditing ? "Editar regla" : "Nueva regla"}
      subtitle="Define umbrales, bandas y condiciones de evaluación del producto."
      backHref={backHref}
      backLabel="Volver a reglas"
    >
      <RuleModal
        open
        layout="page"
        onClose={() => router.push(backHref)}
        initial={session.initial}
        initialBulkRules={session.initialBulkRules}
        availableFields={session.availableFields}
        isEditing={session.isEditing}
        products={session.products}
        productDetails={session.productDetails}
        onSave={async (form, duplicateToProduct) => {
          const orgId = getStoredOrganization()?.id || "demo-bypass-org";
          const payload: any = {
            name: form.name || "Nueva regla",
            products: form.product ? [form.product] : [],
            field: form.field || "custom.field",
            operator: form.operator,
            value: form.evaluationMode === "bands" ? "" : form.value || "0",
            dataType: form.dataType,
            severity: form.evaluationMode === "bands" ? "warn" : form.severity,
            description: form.description,
            status: form.status,
            decisionBands: buildDecisionBands(form),
            individualPerson: mode === "natural",
            legalEntity: mode === "moral",
            ...(form.conditions ? { conditions: form.conditions } : {}),
          };
          if (session.editingRuleId) {
            await updateRule(session.editingRuleId, payload, orgId);
            if (duplicateToProduct) {
              await createRule({ ...payload, products: [duplicateToProduct] }, orgId);
            }
          } else {
            await createRule(payload, orgId);
          }
          router.push(backHref);
        }}
      />
    </MdcFormPage>
  );
}
