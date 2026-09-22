"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, ShieldCheck } from "lucide-react";
import { AdvisorKycPanel } from "@/modules/mdc/components/advisor-kyc-panel";
import "@/modules/mdc/screens/mdc-screen.css";
import {
  listAdvisorKycCases,
  type AdvisorKycCase,
} from "@/modules/mdc/services/advisor-kyc.service";
import {
  evaluateWapiOwner,
  fetchWapiOwnerProgress,
  normalizePhone,
  uploadWapiDocument,
  type WapiDocumentCategory,
} from "@/modules/crm/services/wapi-client";

type CrmProspectPanelProps = {
  phone: string;
  contactName: string | null;
};

type ProspectTab = "ficha" | "documentos";

const CATEGORIES: { id: WapiDocumentCategory; label: string; hint: string }[] = [
  { id: "nomina", label: "Nómina", hint: "PDF de recibo" },
  { id: "extracto", label: "Extracto", hint: "Estado de cuenta" },
  { id: "comprobante_domicilio", label: "Domicilio", hint: "Agua, luz o predial" },
];

export function CrmProspectPanel({ phone, contactName }: CrmProspectPanelProps) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ProspectTab>("ficha");
  const [kycCase, setKycCase] = useState<AdvisorKycCase | null>(null);
  const [linkedCaseId, setLinkedCaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const digits = normalizePhone(phone);
  const caseId = kycCase?.caseId || linkedCaseId;
  const ownerId = caseId || digits;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setKycCase(null);
    setLinkedCaseId(null);
    setFeedback("");
    setTab("ficha");
    void listAdvisorKycCases(digits)
      .then((cases) => {
        if (cancelled) return;
        const match =
          cases.find((item) => normalizePhone(item.contact?.phone || "") === digits) ||
          cases.find((item) => String(item.profile?.phone || "") === digits) ||
          null;
        setKycCase(match);
      })
      .catch((err) => {
        if (!cancelled) setFeedback(err instanceof Error ? err.message : "No se pudo buscar la ficha.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [digits]);

  const progressQuery = useQuery({
    queryKey: ["wapi-docs-progress", ownerId],
    queryFn: () => fetchWapiOwnerProgress(ownerId),
    enabled: Boolean(ownerId) && tab === "documentos",
    refetchInterval: tab === "documentos" ? 4000 : false,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ category, file }: { category: WapiDocumentCategory; file: File }) =>
      uploadWapiDocument(category, file, ownerId),
    onSuccess: () => {
      setFeedback("Documento enviado a análisis.");
      void queryClient.invalidateQueries({ queryKey: ["wapi-docs-progress", ownerId] });
    },
    onError: (err) => setFeedback(err instanceof Error ? err.message : "No se pudo subir el PDF."),
  });

  const evaluateMutation = useMutation({
    mutationFn: () => evaluateWapiOwner(ownerId),
    onSuccess: (data) => setFeedback(`Reglas: ${data.finalDecision}`),
    onError: (err) => setFeedback(err instanceof Error ? err.message : "No se pudo evaluar."),
  });

  const progress = progressQuery.data;

  return (
    <aside className="crm-wa__prospect">
      <header className="crm-wa__prospect-head">
        <p>Ficha del prospecto</p>
        <h3>{contactName || digits}</h3>
        <small>{digits}</small>
      </header>
      <div className="crm-wa__prospect-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className={`crm-tab${tab === "ficha" ? " is-active" : ""}`}
          aria-selected={tab === "ficha"}
          onClick={() => setTab("ficha")}
        >
          Ficha
        </button>
        <button
          type="button"
          role="tab"
          className={`crm-tab${tab === "documentos" ? " is-active" : ""}`}
          aria-selected={tab === "documentos"}
          onClick={() => setTab("documentos")}
        >
          Documentos
        </button>
      </div>
      <div className="crm-wa__scroll crm-wa__prospect-body">
        {feedback ? <p className="crm-wa__prospect-feedback">{feedback}</p> : null}
        {tab === "ficha" ? (
          loading ? (
            <p className="crm-wa__muted">Buscando expediente…</p>
          ) : (
            <AdvisorKycPanel
              caseId={caseId}
              applicant={{
                firstName: kycCase?.identity?.firstNames || contactName?.split(" ")[0] || "",
                lastName: kycCase?.identity?.lastNames || (contactName || "").split(" ").slice(1).join(" "),
                email: kycCase?.contact?.email || "",
                phone: digits.length === 10 ? digits : kycCase?.contact?.phone || "",
                curp: kycCase?.identity?.curp || "",
              }}
              onFeedback={setFeedback}
              onCaseLinked={(nextCaseId) => {
                setLinkedCaseId(nextCaseId);
                setKycCase((current) => (current ? { ...current, caseId: nextCaseId } : current));
              }}
              onUserLinked={(userId) =>
                setKycCase((current) => (current ? { ...current, userId } : current))
              }
            />
          )
        ) : (
          <div className="crm-wa__docs">
            <p className="crm-wa__docs-lead">
              Expediente BDA. Usa el mismo owner ({ownerId}) para nóminas, extracto y domicilio.
            </p>
            {progress ? (
              <p className="crm-wa__docs-progress">
                Nóminas {progress.completed.nomina || 0}/{progress.required.nomina || 5} · Extracto{" "}
                {progress.completed.extracto || 0}/{progress.required.extracto || 1} · Domicilio{" "}
                {progress.completed.comprobante_domicilio || 0}/{progress.required.comprobante_domicilio || 1}
              </p>
            ) : null}
            {CATEGORIES.map((item) => (
              <label key={item.id} className="crm-upload">
                <span className="crm-upload__icon">
                  <FileUp size={16} />
                </span>
                <span className="crm-upload__copy">
                  <strong>{item.label}</strong>
                  <em>{uploadMutation.isPending ? "Subiendo…" : item.hint}</em>
                </span>
                <span className="crm-btn crm-btn--ghost crm-btn--sm">Elegir PDF</span>
                <input
                  type="file"
                  accept="application/pdf"
                  disabled={uploadMutation.isPending}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) uploadMutation.mutate({ category: item.id, file });
                  }}
                />
              </label>
            ))}
            <ul className="crm-wa__docs-list">
              {(progress?.documents ?? []).map((doc) => (
                <li key={doc.documentId}>
                  <strong>{doc.originalFileName || doc.documentId}</strong>
                  <em>
                    {doc.category} · {doc.status}
                  </em>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="crm-btn crm-btn--primary crm-btn--block"
              disabled={evaluateMutation.isPending}
              onClick={() => evaluateMutation.mutate()}
            >
              <ShieldCheck size={16} />
              {evaluateMutation.isPending ? "Evaluando…" : "Evaluar reglas"}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
