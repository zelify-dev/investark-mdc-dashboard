"use client";

import { useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCreditDemoStore } from "@/modules/cortex/hooks/use-credit-demo-store";
import type { Application, MdcApplicantMode } from "@/modules/mdc/data/mdc-credit-mock";
import type { CreditRuleRow, RuleProduct } from "@/modules/mdc/data/mdc-rules-mock";
import { MdcFormPage } from "@/modules/mdc/components/mdc-form-page";
import { readApplicationDetailSession } from "@/modules/mdc/lib/mdc-form-session";
import { AppDetailModal } from "@/modules/mdc/screens/mdc-screen";

type ApplicationDetailSession = {
  app: Application;
  mode: MdcApplicantMode;
  rules?: CreditRuleRow[];
};

export function MdcApplicationDetailScreen() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const creditStore = useCreditDemoStore();
  const session = useMemo(() => readApplicationDetailSession<ApplicationDetailSession>(), []);
  const mode = (searchParams.get("mode") || session?.mode || "natural") as MdcApplicantMode;
  const backHref = `/mdc?tab=applications&mode=${mode}`;
  const app = session?.app && session.app.id === params.id ? session.app : null;

  if (!app) {
    return (
      <MdcFormPage title="Solicitud" subtitle="No se encontró el detalle en esta sesión." backHref={backHref} backLabel="Volver a solicitudes">
        <p>Abre el detalle desde la tabla de solicitudes para conservar el estado y los documentos asociados.</p>
      </MdcFormPage>
    );
  }

  const rules = (session.rules || []).filter((rule) => rule.products.includes(app.product as RuleProduct));

  return (
    <MdcFormPage
      title={app.applicantName}
      subtitle={`${app.appNo} · ${app.product} · seguimiento, documentos y decisión.`}
      backHref={backHref}
      backLabel="Volver a solicitudes"
    >
      <AppDetailModal
        app={app}
        rules={rules}
        mode={mode}
        creditStore={creditStore}
        layout="page"
        onClose={() => router.push(backHref)}
      />
    </MdcFormPage>
  );
}
