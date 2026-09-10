"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Camera, Eye, EyeOff, User, X } from "lucide-react";

import { WorkspaceShell } from "@/components/ui/templates/workspace-shell/workspace-shell";
import { AppAvatar } from "@/components/ui/atoms/avatar/app-avatar";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import {
  AuthError,
  authPasswordChange,
  getMe,
  getSessions,
  getStoredOrganization,
  getStoredRoles,
  initiateEmailChange,
  initiatePhoneChange,
  revokeSession,
  syncMe,
  updateMe,
  uploadProfilePhoto,
  verifyEmailChange,
  verifyPhoneChange,
  type AuthUser,
  type SessionItem,
} from "@/lib/auth-api";
import { resolveProfilePhotoUrl } from "@/lib/auth-dashboard";

import "@/components/ui/templates/workspace-page.css";
import "./my-account-screen.css";

type Feedback = { type: "ok" | "err"; text: string } | null;
type ModalKind = "personal" | "email" | "phone" | "password" | null;
type OtpStep = 1 | 2;

const ROLE_LABELS: Record<string, string> = {
  ORG_ADMIN: "Administrador",
  OWNER: "Propietario",
  BUSINESS: "Negocio",
  DEVELOPER: "Desarrollador",
  ZELIFY_TEAM: "Equipo Zelify",
  MERCHANT_ADMIN: "Admin comercio",
  MERCHANT_USER: "Usuario comercio",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  DISABLED: "Deshabilitado",
  INACTIVE: "Inactivo",
  PENDING: "Pendiente",
};

const COUNTRY_CODES = [
  { code: "+52", label: "🇲🇽 +52" },
  { code: "+1", label: "🇺🇸 +1" },
  { code: "+34", label: "🇪🇸 +34" },
  { code: "+57", label: "🇨🇴 +57" },
  { code: "+51", label: "🇵🇪 +51" },
  { code: "+56", label: "🇨🇱 +56" },
];

/** Requisitos reales del flujo actual en cliente (authPasswordChange). */
const PASSWORD_MIN_LENGTH = 8;

function initialsFrom(name?: string | null, email?: string | null): string {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  return (email?.[0] || "?").toUpperCase();
}

function friendlyRole(code: string): string {
  const key = code.trim().toUpperCase();
  return ROLE_LABELS[key] || code.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

function friendlyStatus(status?: string | null): string {
  if (!status) return "—";
  const key = status.trim().toUpperCase();
  return STATUS_LABELS[key] || status;
}

function isActiveStatus(status?: string | null): boolean {
  return String(status || "").toUpperCase() === "ACTIVE";
}

/** Evita mostrar hashes/IDs técnicos que a veces llegan en `phone`. */
function formatPhoneDisplay(phone?: string | null): string {
  const value = String(phone || "").trim();
  if (!value) return "Sin teléfono";
  const digits = value.replace(/\D/g, "");
  const looksLikeHash = /^[a-f0-9]{16,}$/i.test(value.replace(/[^a-f0-9]/gi, ""));
  const hasEnoughDigits = digits.length >= 8;
  if (!hasEnoughDigits || looksLikeHash) return "Sin teléfono";
  return value;
}

function shortUserAgent(ua?: string | null): string {
  const value = String(ua || "").trim();
  if (!value) return "Dispositivo desconocido";
  if (/Edg\//i.test(value)) return "Microsoft Edge";
  if (/Chrome\//i.test(value) && !/Chromium/i.test(value)) return "Google Chrome";
  if (/Firefox\//i.test(value)) return "Mozilla Firefox";
  if (/Safari\//i.test(value) && !/Chrome\//i.test(value)) return "Safari";
  if (/Mobile|Android|iPhone|iPad/i.test(value)) return "Móvil";
  return value.length > 42 ? `${value.slice(0, 42)}…` : value;
}

function formatSessionWhen(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    const day = new Intl.DateTimeFormat("es-MX", { day: "2-digit" }).format(date);
    const month = new Intl.DateTimeFormat("es-MX", { month: "short" })
      .format(date)
      .replace(".", "")
      .replace(/^\w/, (c) => c.toUpperCase());
    const time = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
    return `${day}-${month}, ${time.toLowerCase()}`;
  } catch {
    return iso;
  }
}

function errMessage(err: unknown, fallback: string): string {
  return err instanceof AuthError ? err.message : fallback;
}

function AccountModal({
  title,
  description,
  steps,
  activeStep,
  error,
  onClose,
  footer,
  children,
}: {
  title: string;
  description?: string;
  steps?: { label: string }[];
  activeStep?: number;
  error?: string | null;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="my-account-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="my-account-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-account-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="my-account-modal__head">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
            <div>
              <h2 id="my-account-modal-title" className="my-account-modal__title">
                {title}
              </h2>
              {description ? <p className="my-account-modal__desc">{description}</p> : null}
            </div>
            <button
              type="button"
              className="my-account-modal__eye"
              aria-label="Cerrar"
              onClick={onClose}
              style={{ position: "static", transform: "none" }}
            >
              <X size={18} />
            </button>
          </div>
          {steps?.length ? (
            <div className="my-account-modal__steps" aria-hidden="true">
              {steps.map((step, index) => {
                const n = index + 1;
                const cls = [
                  "my-account-modal__step",
                  activeStep === n ? "is-active" : "",
                  activeStep && activeStep > n ? "is-done" : "",
                ]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <div key={step.label} className={cls}>
                    <span className="my-account-modal__step-num">{n}</span>
                    <span>{step.label}</span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
        <div className="my-account-modal__body">
          {error ? <p className="my-account-modal__error">{error}</p> : null}
          {children}
        </div>
        <div className="my-account-modal__footer">{footer}</div>
      </div>
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="my-account-modal__field">
      <label className="my-account-modal__label" htmlFor={id}>
        {label}
      </label>
      <div className="my-account-modal__password-wrap">
        <AppInput
          id={id}
          type={show ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="my-account-modal__eye"
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
          onClick={() => setShow((v) => !v)}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export function MyAccountScreen({ embedded = false }: { embedded?: boolean } = {}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [orgName, setOrgName] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const [modal, setModal] = useState<ModalKind>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  const [fullNameDraft, setFullNameDraft] = useState("");
  const [usernameDraft, setUsernameDraft] = useState("");

  const [emailDraft, setEmailDraft] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailStep, setEmailStep] = useState<OtpStep>(1);

  const [phoneCountry, setPhoneCountry] = useState("+52");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneStep, setPhoneStep] = useState<OtpStep>(1);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const photoUrl = useMemo(() => resolveProfilePhotoUrl(user?.photo), [user?.photo]);

  const primaryRole = useMemo(() => {
    if (!roles.length) return "Sin rol";
    return friendlyRole(roles[0]);
  }, [roles]);

  const passwordLengthOk = newPassword.trim().length >= PASSWORD_MIN_LENGTH;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const me = await getMe();
      const u = (me.user || (me as unknown as AuthUser)) as AuthUser;
      setUser(u);
      setOrgName(me.organization?.name || getStoredOrganization()?.name || "");
      setRoles(
        Array.isArray(me.roles) && me.roles.length ? me.roles.map(String) : getStoredRoles()
      );
      await syncMe();
      try {
        setSessions(await getSessions());
      } catch {
        setSessions([]);
      }
    } catch (err) {
      setFeedback({ type: "err", text: errMessage(err, "No se pudo cargar el perfil.") });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const closeModal = () => {
    if (busy) return;
    setModal(null);
    setModalError(null);
    setEmailStep(1);
    setPhoneStep(1);
    setEmailDraft("");
    setEmailOtp("");
    setPhoneLocal("");
    setPhoneOtp("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const openPersonal = () => {
    setFullNameDraft(user?.full_name || "");
    setUsernameDraft(user?.username || "");
    setModalError(null);
    setModal("personal");
  };

  const openEmail = () => {
    setEmailDraft("");
    setEmailOtp("");
    setEmailStep(1);
    setModalError(null);
    setModal("email");
  };

  const openPhone = () => {
    setPhoneCountry("+52");
    setPhoneLocal("");
    setPhoneOtp("");
    setPhoneStep(1);
    setModalError(null);
    setModal("phone");
  };

  const openPassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setModalError(null);
    setModal("password");
  };

  const onPhoto = async (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: "err", text: "La foto no puede superar 5 MB." });
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      await uploadProfilePhoto(file);
      await refresh();
      setFeedback({ type: "ok", text: "Foto actualizada." });
    } catch (err) {
      setFeedback({ type: "err", text: errMessage(err, "No se pudo subir la foto.") });
    } finally {
      setBusy(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const onSavePersonal = async () => {
    if (!fullNameDraft.trim()) {
      setModalError("El nombre completo es obligatorio.");
      return;
    }
    setBusy(true);
    setModalError(null);
    try {
      await updateMe({
        full_name: fullNameDraft.trim(),
        username: usernameDraft.trim() || undefined,
      });
      await refresh();
      setModal(null);
      setFeedback({ type: "ok", text: "Información personal actualizada." });
    } catch (err) {
      setModalError(errMessage(err, "No se pudo guardar el perfil."));
    } finally {
      setBusy(false);
    }
  };

  const onSendEmailOtp = async () => {
    const email = emailDraft.trim();
    if (!email || !email.includes("@")) {
      setModalError("Ingresa un correo válido.");
      return;
    }
    setBusy(true);
    setModalError(null);
    try {
      await initiateEmailChange(email);
      setEmailStep(2);
      setFeedback({ type: "ok", text: "Código enviado al nuevo correo." });
    } catch (err) {
      setModalError(errMessage(err, "No se pudo enviar el código."));
    } finally {
      setBusy(false);
    }
  };

  const onVerifyEmailOtp = async () => {
    const code = emailOtp.trim();
    if (!/^\d{6}$/.test(code)) {
      setModalError("Ingresa el código de 6 dígitos.");
      return;
    }
    setBusy(true);
    setModalError(null);
    try {
      await verifyEmailChange(code);
      await refresh();
      setModal(null);
      setEmailStep(1);
      setEmailDraft("");
      setEmailOtp("");
      setFeedback({ type: "ok", text: "Correo actualizado." });
    } catch (err) {
      setModalError(errMessage(err, "Código incorrecto o expirado."));
    } finally {
      setBusy(false);
    }
  };

  const buildPhoneE164 = () => {
    const local = phoneLocal.replace(/\D/g, "");
    if (!local) return "";
    return `${phoneCountry}${local}`;
  };

  const onSendPhoneOtp = async () => {
    const phone = buildPhoneE164();
    if (phoneLocal.replace(/\D/g, "").length < 8) {
      setModalError("Ingresa un número de teléfono válido.");
      return;
    }
    setBusy(true);
    setModalError(null);
    try {
      await initiatePhoneChange(phone);
      setPhoneStep(2);
      setFeedback({ type: "ok", text: "Código enviado al teléfono." });
    } catch (err) {
      setModalError(errMessage(err, "No se pudo enviar el código."));
    } finally {
      setBusy(false);
    }
  };

  const onVerifyPhoneOtp = async () => {
    const code = phoneOtp.trim();
    if (!/^\d{6}$/.test(code)) {
      setModalError("Ingresa el código de 6 dígitos.");
      return;
    }
    setBusy(true);
    setModalError(null);
    try {
      await verifyPhoneChange(code);
      await refresh();
      setModal(null);
      setPhoneStep(1);
      setPhoneLocal("");
      setPhoneOtp("");
      setFeedback({ type: "ok", text: "Teléfono actualizado." });
    } catch (err) {
      setModalError(errMessage(err, "Código incorrecto o expirado."));
    } finally {
      setBusy(false);
    }
  };

  const onChangePassword = async () => {
    if (!currentPassword) {
      setModalError("Ingresa tu contraseña actual.");
      return;
    }
    if (!passwordLengthOk) {
      setModalError(`La nueva contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setModalError("La confirmación no coincide con la nueva contraseña.");
      return;
    }
    setBusy(true);
    setModalError(null);
    try {
      await authPasswordChange({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setModal(null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFeedback({ type: "ok", text: "Contraseña actualizada." });
    } catch (err) {
      setModalError(errMessage(err, "No se pudo cambiar la contraseña."));
    } finally {
      setBusy(false);
    }
  };

  const onRevoke = async (sessionId: string) => {
    setBusy(true);
    setFeedback(null);
    try {
      await revokeSession(sessionId);
      setSessions(await getSessions());
      setFeedback({ type: "ok", text: "Sesión revocada." });
    } catch (err) {
      setFeedback({ type: "err", text: errMessage(err, "No se pudo revocar la sesión.") });
    } finally {
      setBusy(false);
    }
  };

  const verifiedChip = (verified?: boolean) => (
    <span className={`my-account__verify${verified ? " my-account__verify--ok" : ""}`}>
      {verified ? "Verificado" : "No Verificado"}
    </span>
  );

  const content = (
      <div className={`my-account${embedded ? " my-account--embedded" : ""}`}>
        <header className="my-account__page-head">
          <h1>Mi cuenta</h1>
          <p>
            Administra tu información personal y la seguridad de tu cuenta
            {orgName ? ` · ${orgName}` : ""}.
          </p>
        </header>

        {feedback ? (
          <div className={`my-account__toast my-account__toast--${feedback.type}`} role="status">
            {feedback.text}
          </div>
        ) : null}

        {loading ? (
          <p className="my-account__loading">Cargando perfil…</p>
        ) : (
          <div className="my-account__stack">
            <section className="my-account__card my-account__profile" aria-label="Perfil">
              {photoUrl ? (
                <AppAvatar
                  initials={initialsFrom(user?.full_name, user?.email)}
                  src={photoUrl}
                  className="zelify-profile-trigger__avatar my-account__profile-avatar"
                />
              ) : (
                <span
                  className="zelify-avatar my-account__profile-avatar my-account__profile-avatar--empty"
                  aria-hidden="true"
                >
                  <User size={32} strokeWidth={1.5} />
                </span>
              )}
              <div className="my-account__profile-meta">
                <h2 className="my-account__profile-name">{user?.full_name || "—"}</h2>
                <p className="my-account__profile-email">{user?.email || "—"}</p>
                <div className="my-account__badges">
                  <span className="my-account__chip my-account__chip--role">{primaryRole}</span>
                  <span
                    className={`my-account__chip ${
                      isActiveStatus(user?.status)
                        ? "my-account__chip--active"
                        : "my-account__chip--inactive"
                    }`}
                  >
                    <span className="my-account__chip-dot" />
                    {friendlyStatus(user?.status).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="my-account__photo">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(e) => void onPhoto(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  className="my-account__btn-outline my-account__btn-outline--caps"
                  disabled={busy}
                  onClick={() => photoInputRef.current?.click()}
                >
                  <Camera size={15} />
                  Cambiar foto
                </button>
                <p className="my-account__photo-hint">JPG, PNG o WebP · Máx. 5MB</p>
              </div>
            </section>

            <div className="my-account__grid-2">
              <section className="my-account__card">
                <div className="my-account__card-head">
                  <div>
                    <h2 className="my-account__card-title">Información personal</h2>
                    <p className="my-account__card-desc">Datos visibles en el dashboard.</p>
                  </div>
                  <button
                    type="button"
                    className="my-account__btn-outline"
                    disabled={busy}
                    onClick={openPersonal}
                  >
                    Editar
                  </button>
                </div>
                <div className="my-account__fields-stack">
                  <div className="my-account__field">
                    <span className="my-account__field-label">Nombre completo</span>
                    <div className="my-account__field-value">{user?.full_name || "—"}</div>
                  </div>
                  <div className="my-account__field">
                    <span className="my-account__field-label">Usuario</span>
                    <div className="my-account__field-value">
                      {user?.username ? `@${user.username.replace(/^@/, "")}` : "—"}
                    </div>
                  </div>
                </div>
              </section>

              <section className="my-account__card">
                <div className="my-account__card-head">
                  <div>
                    <h2 className="my-account__card-title">Información de Contacto</h2>
                    <p className="my-account__card-desc">Cambios con verificación OTP.</p>
                  </div>
                </div>
                <div className="my-account__fields-stack">
                  <div className="my-account__field my-account__field--row">
                    <div className="my-account__field-main">
                      <span className="my-account__field-label">Correo</span>
                      <div className="my-account__field-value-row">
                        <span className="my-account__field-value">{user?.email || "—"}</span>
                        {verifiedChip(user?.email_verified)}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="my-account__btn-outline"
                      disabled={busy}
                      onClick={openEmail}
                    >
                      Cambiar
                    </button>
                  </div>
                  <div className="my-account__field my-account__field--row">
                    <div className="my-account__field-main">
                      <span className="my-account__field-label">Teléfono</span>
                      <div className="my-account__field-value-row">
                        <span className="my-account__field-value">
                          {formatPhoneDisplay(user?.phone)}
                        </span>
                        {verifiedChip(user?.phone_verified)}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="my-account__btn-outline"
                      disabled={busy}
                      onClick={openPhone}
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <section className="my-account__card">
              <div className="my-account__card-head">
                <div>
                  <h2 className="my-account__card-title">Seguridad</h2>
                  <p className="my-account__card-desc">Contraseña y sesiones activas.</p>
                </div>
              </div>
              <div className="my-account__security-grid">
                <div>
                  <div className="my-account__field my-account__field--row">
                    <div className="my-account__field-main">
                      <span className="my-account__field-label">Contraseña</span>
                      <div className="my-account__field-value my-account__field-value--dots">
                        ••••••••
                      </div>
                    </div>
                    <button
                      type="button"
                      className="my-account__btn-outline"
                      disabled={busy}
                      onClick={openPassword}
                    >
                      Cambiar
                    </button>
                  </div>
                  <p className="my-account__tip">
                    Usa una contraseña única. Tras cambiarla, puedes revocar sesiones.
                  </p>
                </div>

                <div className="my-account__sessions-block">
                  <h3 className="my-account__sessions-title">Sesiones</h3>
                  {sessions.length === 0 ? (
                    <p className="my-account__empty">Sin sesiones listadas.</p>
                  ) : (
                    <div className="my-account__sessions">
                      {sessions.map((s) => {
                        const when = formatSessionWhen(s.last_seen_at || s.created_at);
                        return (
                          <div key={s.id} className="my-account__session">
                            <div style={{ minWidth: 0 }}>
                              <p className="my-account__session-title">
                                {shortUserAgent(s.user_agent)} ·{" "}
                                {s.active === false ? "Inactiva" : "Activa"}
                              </p>
                              <p
                                className="my-account__session-meta"
                                title={s.user_agent || undefined}
                              >
                                {s.ip || "IP —"}
                                {when ? ` · ${when}` : ""}
                              </p>
                            </div>
                            <button
                              type="button"
                              className="my-account__link-revoke"
                              disabled={busy}
                              onClick={() => void onRevoke(s.id)}
                            >
                              Revocar
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {modal === "personal" ? (
          <AccountModal
            title="Editar información personal"
            description="Solo se actualizan nombre completo y nombre de usuario."
            error={modalError}
            onClose={closeModal}
            footer={
              <>
                <AppButton tone="secondary" disabled={busy} onClick={closeModal}>
                  Cancelar
                </AppButton>
                <AppButton tone="primary" disabled={busy} onClick={() => void onSavePersonal()}>
                  {busy ? "Guardando…" : "Guardar"}
                </AppButton>
              </>
            }
          >
            <div className="my-account-modal__field">
              <label className="my-account-modal__label" htmlFor="ma-full-name">
                Nombre completo
              </label>
              <AppInput
                id="ma-full-name"
                value={fullNameDraft}
                onChange={(e) => setFullNameDraft(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="my-account-modal__field">
              <label className="my-account-modal__label" htmlFor="ma-username">
                Nombre de usuario
              </label>
              <AppInput
                id="ma-username"
                value={usernameDraft}
                onChange={(e) => setUsernameDraft(e.target.value)}
                placeholder="usuario"
                autoComplete="username"
              />
            </div>
          </AccountModal>
        ) : null}

        {modal === "email" ? (
          <AccountModal
            title="Cambiar correo electrónico"
            description="Te enviaremos un código al nuevo correo para confirmar el cambio."
            steps={[{ label: "Nuevo correo" }, { label: "Verificar código" }]}
            activeStep={emailStep}
            error={modalError}
            onClose={closeModal}
            footer={
              <>
                {emailStep === 2 ? (
                  <div className="my-account-modal__footer-left">
                    <AppButton tone="neutral" disabled={busy} onClick={() => void onSendEmailOtp()}>
                      Reenviar código
                    </AppButton>
                  </div>
                ) : null}
                <AppButton tone="secondary" disabled={busy} onClick={closeModal}>
                  Cancelar
                </AppButton>
                {emailStep === 1 ? (
                  <AppButton tone="primary" disabled={busy} onClick={() => void onSendEmailOtp()}>
                    {busy ? "Enviando…" : "Enviar código"}
                  </AppButton>
                ) : (
                  <AppButton tone="primary" disabled={busy} onClick={() => void onVerifyEmailOtp()}>
                    {busy ? "Verificando…" : "Confirmar"}
                  </AppButton>
                )}
              </>
            }
          >
            {emailStep === 1 ? (
              <div className="my-account-modal__field">
                <label className="my-account-modal__label" htmlFor="ma-email">
                  Nuevo correo electrónico
                </label>
                <AppInput
                  id="ma-email"
                  type="email"
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  placeholder="nuevo@correo.com"
                  autoComplete="email"
                />
              </div>
            ) : (
              <div className="my-account-modal__field">
                <label className="my-account-modal__label" htmlFor="ma-email-otp">
                  Código de 6 dígitos
                </label>
                <AppInput
                  id="ma-email-otp"
                  inputMode="numeric"
                  maxLength={6}
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  autoComplete="one-time-code"
                />
                <p className="my-account__photo-hint">Enviado a {emailDraft.trim()}</p>
              </div>
            )}
          </AccountModal>
        ) : null}

        {modal === "phone" ? (
          <AccountModal
            title="Cambiar número de teléfono"
            description="Te enviaremos un código SMS al nuevo número."
            steps={[{ label: "Nuevo número" }, { label: "Verificar código" }]}
            activeStep={phoneStep}
            error={modalError}
            onClose={closeModal}
            footer={
              <>
                {phoneStep === 2 ? (
                  <div className="my-account-modal__footer-left">
                    <AppButton tone="neutral" disabled={busy} onClick={() => void onSendPhoneOtp()}>
                      Reenviar código
                    </AppButton>
                  </div>
                ) : null}
                <AppButton tone="secondary" disabled={busy} onClick={closeModal}>
                  Cancelar
                </AppButton>
                {phoneStep === 1 ? (
                  <AppButton tone="primary" disabled={busy} onClick={() => void onSendPhoneOtp()}>
                    {busy ? "Enviando…" : "Enviar código"}
                  </AppButton>
                ) : (
                  <AppButton tone="primary" disabled={busy} onClick={() => void onVerifyPhoneOtp()}>
                    {busy ? "Verificando…" : "Confirmar"}
                  </AppButton>
                )}
              </>
            }
          >
            {phoneStep === 1 ? (
              <div className="my-account-modal__field">
                <span className="my-account-modal__label">Nuevo teléfono</span>
                <div className="my-account-modal__phone">
                  <select
                    className="zelify-input zelify-input--surface"
                    value={phoneCountry}
                    onChange={(e) => setPhoneCountry(e.target.value)}
                    aria-label="Código de país"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <AppInput
                    inputMode="tel"
                    value={phoneLocal}
                    onChange={(e) => setPhoneLocal(e.target.value)}
                    placeholder="5512345678"
                    autoComplete="tel-national"
                  />
                </div>
              </div>
            ) : (
              <div className="my-account-modal__field">
                <label className="my-account-modal__label" htmlFor="ma-phone-otp">
                  Código de 6 dígitos
                </label>
                <AppInput
                  id="ma-phone-otp"
                  inputMode="numeric"
                  maxLength={6}
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  autoComplete="one-time-code"
                />
                <p className="my-account__photo-hint">Enviado a {buildPhoneE164()}</p>
              </div>
            )}
          </AccountModal>
        ) : null}

        {modal === "password" ? (
          <AccountModal
            title="Cambiar contraseña"
            description="Por seguridad, confirma tu contraseña actual."
            error={modalError}
            onClose={closeModal}
            footer={
              <>
                <AppButton tone="secondary" disabled={busy} onClick={closeModal}>
                  Cancelar
                </AppButton>
                <AppButton tone="primary" disabled={busy} onClick={() => void onChangePassword()}>
                  {busy ? "Actualizando…" : "Actualizar contraseña"}
                </AppButton>
              </>
            }
          >
            <PasswordField
              id="ma-current-password"
              label="Contraseña actual"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
            />
            <PasswordField
              id="ma-new-password"
              label="Nueva contraseña"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
            />
            <PasswordField
              id="ma-confirm-password"
              label="Confirmar nueva contraseña"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />
            <div className="my-account-modal__reqs">
              Requisitos de seguridad
              <ul>
                <li className={passwordLengthOk ? "is-met" : undefined}>
                  Mínimo {PASSWORD_MIN_LENGTH} caracteres
                </li>
              </ul>
            </div>
          </AccountModal>
        ) : null}
      </div>
  );

  if (embedded) return content;

  return (
    <WorkspaceShell>
      <div className="zelify-workspace-page">{content}</div>
    </WorkspaceShell>
  );
}
