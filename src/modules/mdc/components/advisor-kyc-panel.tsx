"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, ExternalLink, MessageCircle } from "lucide-react";
import {
  advisorKycFlags,
  advisorKycMarkerUrl,
  commitAdvisorKycUser,
  createAdvisorKycCase,
  createAdvisorKycLivenessLink,
  fetchAdvisorKycCase,
  fetchAdvisorKycLiveness,
  isAdvisorKycCaseId,
  patchAdvisorKycCase,
  runAdvisorKycFacematch,
  sendAdvisorKycEmailOtp,
  sendAdvisorKycPhoneOtp,
  uploadAdvisorKycId,
  verifyAdvisorKycEmailOtp,
  verifyAdvisorKycPhoneOtp,
  whatsappAdvisorHref,
  type AdvisorKycCase,
  type AdvisorKycCaseDraft,
} from "@/modules/mdc/services/advisor-kyc.service";
import { attachFinanceRequestKyc } from "@/modules/mdc/services/mdc-finance-requests.service";
import { isCurpLike } from "@/modules/mdc/services/zelify-kyc-onboarding.service";
import "./advisor-kyc-panel.css";

type AdvisorKycPanelProps = {
  financeRequestId?: string;
  caseId: string | null;
  applicant: {
    email?: string | null;
    phone?: string | null;
    curp?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  };
  isDemo?: boolean;
  onFeedback: (message: string) => void;
  onCaseLinked: (caseId: string) => void;
  onUserLinked: (userId: string) => void;
};

const PASSWORD_KEY = (caseId: string) => `advisor-kyc:tmp-pass:${caseId}`;

function rememberPassword(caseId: string, password: string) {
  try {
    sessionStorage.setItem(PASSWORD_KEY(caseId), password);
  } catch {
    /* ignore */
  }
}

function readPassword(caseId: string): string | null {
  try {
    return sessionStorage.getItem(PASSWORD_KEY(caseId));
  } catch {
    return null;
  }
}

function livenessLabel(status: string) {
  if (status === "passed") return "Aprobada";
  if (status === "failed") return "Falló";
  if (status === "pending") return "En prueba";
  return "Sin sesión";
}

export function AdvisorKycPanel({
  financeRequestId,
  caseId,
  applicant,
  isDemo = false,
  onFeedback,
  onCaseLinked,
  onUserLinked,
}: AdvisorKycPanelProps) {
  const queryClient = useQueryClient();
  const activeCaseId = isAdvisorKycCaseId(caseId) ? caseId : null;
  const [draft, setDraft] = useState<AdvisorKycCaseDraft>({
    firstNames: applicant.firstName || "",
    lastNames: applicant.lastName || "",
    email: applicant.email || "",
    phone: applicant.phone || "",
    curp: applicant.curp || "",
    birthDate: "",
    notes: "",
  });
  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [selfieImage, setSelfieImage] = useState<File | null>(null);
  const [savedPassword, setSavedPassword] = useState<string | null>(null);

  const caseQuery = useQuery({
    queryKey: ["advisor-kyc-case", activeCaseId],
    queryFn: () => fetchAdvisorKycCase(activeCaseId as string),
    enabled: Boolean(activeCaseId) && !isDemo,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const kycCase = caseQuery.data ?? null;
  const flags = advisorKycFlags(kycCase);
  const livenessPending = kycCase?.liveness.status === "pending";

  const livenessQuery = useQuery({
    queryKey: ["advisor-kyc-liveness", activeCaseId],
    queryFn: () => fetchAdvisorKycLiveness(activeCaseId as string),
    enabled: Boolean(activeCaseId) && livenessPending && !isDemo,
    refetchInterval: livenessPending ? 8_000 : false,
  });

  useEffect(() => {
    if (!kycCase) return;
    setDraft({
      firstNames: kycCase.identity.firstNames || "",
      lastNames: kycCase.identity.lastNames || "",
      email: kycCase.contact.email || "",
      phone: kycCase.contact.phone || "",
      curp: kycCase.identity.curp || "",
      birthDate: kycCase.identity.birthDate || "",
      notes: kycCase.notes || "",
    });
    const stored = readPassword(kycCase.caseId);
    if (kycCase.temporaryPassword) {
      rememberPassword(kycCase.caseId, kycCase.temporaryPassword);
      setSavedPassword(kycCase.temporaryPassword);
    } else if (stored) {
      setSavedPassword(stored);
    }
  }, [kycCase]);

  useEffect(() => {
    if (!livenessQuery.data?.case) return;
    queryClient.setQueryData(["advisor-kyc-case", activeCaseId], livenessQuery.data.case);
  }, [livenessQuery.data, activeCaseId, queryClient]);

  const persistCase = async (next: AdvisorKycCase) => {
    queryClient.setQueryData(["advisor-kyc-case", next.caseId], next);
    if (next.temporaryPassword) {
      rememberPassword(next.caseId, next.temporaryPassword);
      setSavedPassword(next.temporaryPassword);
    }
    if (next.userId) onUserLinked(next.userId);
    if (financeRequestId) {
      await attachFinanceRequestKyc(financeRequestId, {
        kycSessionId: next.caseId,
        kycWebviewUrl: next.liveness.livenessUrl || advisorKycMarkerUrl(next.caseId),
        ...(next.userId ? { zelifyUserId: next.userId } : {}),
      });
    }
    onCaseLinked(next.caseId);
  };

  const run = async (task: () => Promise<AdvisorKycCase | string>, ok?: string) => {
    try {
      const result = await task();
      if (typeof result === "string") {
        onFeedback(result);
        await caseQuery.refetch();
        return;
      }
      await persistCase(result);
      onFeedback(ok || "Expediente actualizado.");
    } catch (err) {
      onFeedback(err instanceof Error ? err.message : "No se pudo completar la acción.");
    }
  };

  const startMutation = useMutation({
    mutationFn: async () => {
      const created = await createAdvisorKycCase({
        firstNames: draft.firstNames || applicant.firstName || undefined,
        lastNames: draft.lastNames || applicant.lastName || undefined,
        email: draft.email || applicant.email || undefined,
        phone: draft.phone || applicant.phone || undefined,
        curp: draft.curp || applicant.curp || undefined,
        notes: financeRequestId ? `Solicitud ${financeRequestId}` : "Ficha CRM WhatsApp",
        profile: financeRequestId ? { financeRequestId } : { source: "crm-whatsapp" },
      });
      await persistCase(created);
      return created;
    },
    onSuccess: () => onFeedback("Ficha KYC asistido creada. Completa los datos en este panel."),
    onError: (err) => onFeedback(err instanceof Error ? err.message : "No se pudo crear la ficha."),
  });

  const livenessUrl = kycCase?.liveness.livenessUrl || livenessQuery.data?.livenessUrl || null;
  const waHref = useMemo(() => {
    if (!livenessUrl) return null;
    return whatsappAdvisorHref(
      kycCase?.contact.phone || draft.phone,
      `Hola, para continuar tu crédito abre esta prueba de vida: ${livenessUrl}`,
    );
  }, [livenessUrl, kycCase?.contact.phone, draft.phone]);

  if (isDemo) {
    return <p className="mdc-kyc-empty">KYC asistido no corre en modo demo.</p>;
  }

  if (caseId && !activeCaseId) {
    return (
      <div className="advisor-kyc">
        <p className="mdc-kyc-empty">
          Esta solicitud aún tiene el flujo self-serve. Inicia el KYC asistido del operador; no se usa kyc.zelify.com.
        </p>
        <button type="button" className="mdc-btn mdc-btn--primary" disabled={startMutation.isPending} onClick={() => startMutation.mutate()}>
          {startMutation.isPending ? "Creando ficha…" : "Iniciar KYC asistido"}
        </button>
      </div>
    );
  }

  if (!activeCaseId) {
    return (
      <div className="advisor-kyc">
        <p className="mdc-kyc-empty">
          El operador llena la ficha, verifica contacto, sube INE y liveness. El solicitante no usa el link de onboarding.
        </p>
        <button type="button" className="mdc-btn mdc-btn--primary" disabled={startMutation.isPending} onClick={() => startMutation.mutate()}>
          {startMutation.isPending ? "Creando ficha…" : "Crear ficha de prospecto"}
        </button>
      </div>
    );
  }

  if (caseQuery.isLoading && !kycCase) {
    return <p className="mdc-kyc-empty">Cargando expediente advisor-kyc…</p>;
  }

  if (caseQuery.isError && !kycCase) {
    return (
      <div className="advisor-kyc">
        <p className="mdc-kyc-warn">{caseQuery.error instanceof Error ? caseQuery.error.message : "No se pudo leer la ficha."}</p>
        <button type="button" className="mdc-btn mdc-btn--ghost" onClick={() => void caseQuery.refetch()}>
          Reintentar
        </button>
      </div>
    );
  }

  const copy = async (value: string, ok: string) => {
    try {
      await navigator.clipboard.writeText(value);
      onFeedback(ok);
    } catch {
      onFeedback("No se pudo copiar.");
    }
  };

  return (
    <div className="advisor-kyc">
      <div className="advisor-kyc__flags">
        <span className="mdc-badge mdc-badge--neutral">{kycCase?.caseId}</span>
        <span className={flags.hasUser ? "mdc-badge mdc-badge--ok" : "mdc-badge mdc-badge--warn"}>
          {flags.hasUser ? "Usuario creado" : "Solo ficha"}
        </span>
        <span className={flags.hasDocument ? "mdc-badge mdc-badge--ok" : "mdc-badge mdc-badge--neutral"}>
          {flags.hasDocument ? "INE cargada" : "Sin INE"}
        </span>
        <span
          className={
            kycCase?.liveness.status === "passed"
              ? "mdc-badge mdc-badge--ok"
              : kycCase?.liveness.status === "failed"
                ? "mdc-badge mdc-badge--bad"
                : "mdc-badge mdc-badge--warn"
          }
        >
          Liveness · {livenessLabel(kycCase?.liveness.status || "idle")}
        </span>
      </div>

      {savedPassword ? (
        <div className="advisor-kyc__password">
          <strong>Contraseña temporal</strong>
          <p>Guárdala ahora. Auth no la vuelve a devolver.</p>
          <div className="advisor-kyc__row">
            <code>{savedPassword}</code>
            <button type="button" className="mdc-kyc-icon-btn" onClick={() => void copy(savedPassword, "Contraseña copiada.")}>
              <Copy size={15} />
            </button>
          </div>
        </div>
      ) : null}

      <section className="advisor-kyc__block">
        <h5>1. Datos del prospecto</h5>
        <div className="advisor-kyc__grid">
          <label className="mdc-detail-field">
            <span>Nombres</span>
            <input value={draft.firstNames || ""} onChange={(e) => setDraft((c) => ({ ...c, firstNames: e.target.value }))} />
          </label>
          <label className="mdc-detail-field">
            <span>Apellidos</span>
            <input value={draft.lastNames || ""} onChange={(e) => setDraft((c) => ({ ...c, lastNames: e.target.value }))} />
          </label>
          <label className="mdc-detail-field">
            <span>Email</span>
            <input value={draft.email || ""} onChange={(e) => setDraft((c) => ({ ...c, email: e.target.value }))} />
          </label>
          <label className="mdc-detail-field">
            <span>Teléfono (10 dígitos)</span>
            <input
              value={draft.phone || ""}
              onChange={(e) => setDraft((c) => ({ ...c, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
            />
          </label>
          <label className="mdc-detail-field">
            <span>CURP</span>
            <input
              value={draft.curp || ""}
              onChange={(e) => setDraft((c) => ({ ...c, curp: e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 18) }))}
              className={isCurpLike(draft.curp || "") ? "mdc-input--valid" : undefined}
            />
          </label>
          <label className="mdc-detail-field">
            <span>Fecha de nacimiento</span>
            <input
              placeholder="DD/MM/YYYY"
              value={draft.birthDate || ""}
              onChange={(e) => setDraft((c) => ({ ...c, birthDate: e.target.value }))}
            />
          </label>
        </div>
        <label className="mdc-detail-field">
          <span>Notas del asesor</span>
          <textarea rows={2} value={draft.notes || ""} onChange={(e) => setDraft((c) => ({ ...c, notes: e.target.value }))} />
        </label>
        <button
          type="button"
          className="mdc-btn mdc-btn--primary"
          onClick={() => void run(() => patchAdvisorKycCase(activeCaseId, draft), "Ficha guardada.")}
        >
          Guardar ficha
        </button>
      </section>

      <section className="advisor-kyc__block">
        <h5>2. Verificar contacto</h5>
        <div className="advisor-kyc__otp">
          <div>
            <div className="advisor-kyc__inline">
              <span>Email</span>
              {kycCase?.contact.emailVerified ? <span className="mdc-badge mdc-badge--ok">Verificado</span> : <span className="mdc-badge mdc-badge--warn">Pendiente</span>}
            </div>
            <div className="advisor-kyc__row">
              <button
                type="button"
                className="mdc-btn mdc-btn--ghost"
                disabled={!flags.hasEmail}
                onClick={() => void run(() => sendAdvisorKycEmailOtp(activeCaseId, draft.email))}
              >
                Enviar OTP
              </button>
              <input value={emailCode} onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Código" />
              <button
                type="button"
                className="mdc-btn mdc-btn--primary"
                disabled={emailCode.length < 6}
                onClick={() => void run(() => verifyAdvisorKycEmailOtp(activeCaseId, emailCode, draft.email), "Correo verificado.")}
              >
                Verificar
              </button>
            </div>
          </div>
          <div>
            <div className="advisor-kyc__inline">
              <span>SMS / WhatsApp</span>
              {kycCase?.contact.phoneVerified ? <span className="mdc-badge mdc-badge--ok">Verificado</span> : <span className="mdc-badge mdc-badge--warn">Pendiente</span>}
            </div>
            <div className="advisor-kyc__row">
              <button
                type="button"
                className="mdc-btn mdc-btn--ghost"
                disabled={!flags.hasPhone}
                onClick={() => void run(() => sendAdvisorKycPhoneOtp(activeCaseId, draft.phone))}
              >
                Enviar OTP
              </button>
              <input value={phoneCode} onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Código" />
              <button
                type="button"
                className="mdc-btn mdc-btn--primary"
                disabled={phoneCode.length < 6}
                onClick={() => void run(() => verifyAdvisorKycPhoneOtp(activeCaseId, phoneCode, draft.phone), "Teléfono verificado.")}
              >
                Verificar
              </button>
            </div>
          </div>
        </div>
        <small className="mdc-kyc-meta">OTP opcional. No bloquea el alta ni el INE. Código de prueba: 202601.</small>
      </section>

      <section className="advisor-kyc__block">
        <h5>3. Usuario Auth</h5>
        {flags.hasUser ? (
          <p className="mdc-kyc-meta">userId {kycCase?.userId}</p>
        ) : (
          <button
            type="button"
            className="mdc-btn mdc-btn--primary"
            disabled={!flags.canCommitUser}
            onClick={() => void run(() => commitAdvisorKycUser(activeCaseId), "Usuario creado. Guarda la contraseña temporal.")}
          >
            Crear usuario
          </button>
        )}
        {!flags.canCommitUser && !flags.hasUser ? (
          <p className="mdc-kyc-muted">Hace falta email y teléfono de 10 dígitos.</p>
        ) : null}
      </section>

      <section className="advisor-kyc__block">
        <h5>4. INE frente y reverso</h5>
        <div className="advisor-kyc__files">
          <label>
            Frente
            <input type="file" accept="image/*" onChange={(e) => setFrontImage(e.target.files?.[0] || null)} />
          </label>
          <label>
            Reverso
            <input type="file" accept="image/*" onChange={(e) => setBackImage(e.target.files?.[0] || null)} />
          </label>
        </div>
        <button
          type="button"
          className="mdc-btn mdc-btn--primary"
          disabled={!flags.canUploadId || !frontImage || !backImage}
          onClick={() => {
            if (!frontImage || !backImage) return;
            void run(() => uploadAdvisorKycId(activeCaseId, frontImage, backImage), "INE cargada. El OCR actualiza CURP y nombre.");
          }}
        >
          Subir INE
        </button>
        {kycCase?.identity.documentId ? <p className="mdc-kyc-meta">documentId {kycCase.identity.documentId}</p> : null}
      </section>

      <section className="advisor-kyc__block">
        <h5>5. Prueba de vida</h5>
        <p className="mdc-kyc-muted">CloudFront Face Liveness. El operador genera el link y lo manda por WhatsApp.</p>
        <div className="advisor-kyc__row">
          <button
            type="button"
            className="mdc-btn mdc-btn--primary"
            onClick={() =>
              void run(async () => {
                const result = await createAdvisorKycLivenessLink(activeCaseId);
                return result.case;
              }, "Link de liveness listo. Ábrelo o envíalo por WhatsApp.")
            }
          >
            Generar link
          </button>
          {livenessUrl ? (
            <>
              <button type="button" className="mdc-kyc-icon-btn" title="Copiar" onClick={() => void copy(livenessUrl, "Link de liveness copiado.")}>
                <Copy size={15} />
              </button>
              <a className="mdc-kyc-icon-btn mdc-kyc-icon-btn--primary" href={livenessUrl} target="_blank" rel="noreferrer" title="Abrir liveness">
                <ExternalLink size={15} />
              </a>
              {waHref ? (
                <a className="mdc-btn mdc-btn--ghost advisor-kyc__wa" href={waHref} target="_blank" rel="noreferrer">
                  <MessageCircle size={15} />
                  WhatsApp
                </a>
              ) : null}
            </>
          ) : null}
        </div>
        {kycCase?.liveness.confidence != null ? (
          <p className="mdc-kyc-meta">Confianza {kycCase.liveness.confidence.toFixed(1)}</p>
        ) : null}
      </section>

      <section className="advisor-kyc__block">
        <h5>6. Facematch</h5>
        <label className="advisor-kyc__file">
          Selfie opcional
          <input type="file" accept="image/*" onChange={(e) => setSelfieImage(e.target.files?.[0] || null)} />
        </label>
        <button
          type="button"
          className="mdc-btn mdc-btn--primary"
          disabled={!flags.canFacematch}
          onClick={() =>
            void run(async () => {
              const result = await runAdvisorKycFacematch(activeCaseId, selfieImage || undefined);
              onFeedback(result.match ? `Coincidencia ${result.similarity ?? ""}`.trim() : result.message || "Sin coincidencia.");
              return result.case;
            })
          }
        >
          Comparar INE vs liveness
        </button>
        {kycCase?.liveness.faceMatchScore != null ? (
          <span className={`mdc-badge ${kycCase.liveness.faceMatchScore >= 90 ? "mdc-badge--ok" : "mdc-badge--warn"}`}>
            Score {kycCase.liveness.faceMatchScore.toFixed(1)}
          </span>
        ) : null}
        {!flags.canFacematch ? <p className="mdc-kyc-muted">Requiere usuario e INE.</p> : null}
      </section>
    </div>
  );
}
