"use client";

import { FormEvent, useId, useState } from "react";

import { AppInput } from "@/components/ui/atoms/input/app-input";
import { FieldLabel } from "@/components/ui/atoms/field-label/field-label";
import {
  AuthError,
  authPasswordChange,
  getStoredOrganization,
  getStoredUser,
  memberPasswordReset,
  syncMe,
} from "@/lib/auth-api";

import "./must-change-password-modal.css";

const PASSWORD_MIN_LENGTH = 8;

type MustChangePasswordModalProps = {
  onSuccess: () => void;
};

function errMessage(err: unknown, fallback: string): string {
  if (err instanceof AuthError && err.message) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function MustChangePasswordModal({ onSuccess }: MustChangePasswordModalProps) {
  const formId = useId();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError("Completa todos los campos.");
      return;
    }
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setBusy(true);
    try {
      const orgId = getStoredOrganization()?.id;
      const body = {
        current_password: currentPassword,
        new_password: newPassword,
      };

      if (orgId) {
        await memberPasswordReset(orgId, body);
      } else {
        await authPasswordChange(body);
      }

      await syncMe();
      const user = getStoredUser();
      if (user?.must_change_password === true) {
        setError("La contraseña se actualizó, pero aún se requiere un cambio. Intenta de nuevo.");
        return;
      }

      onSuccess();
    } catch (err) {
      setError(errMessage(err, "No se pudo cambiar la contraseña."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="zelify-must-change-pw"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${formId}-title`}
      aria-describedby={`${formId}-desc`}
    >
      <div className="zelify-must-change-pw__card">
        <h1 id={`${formId}-title`} className="zelify-must-change-pw__title">
          Cambia tu contraseña
        </h1>
        <p id={`${formId}-desc`} className="zelify-must-change-pw__desc">
          Por seguridad, debes establecer una nueva contraseña para continuar.
        </p>

        <form className="zelify-must-change-pw__form" onSubmit={onSubmit} noValidate>
          <div className="zelify-must-change-pw__field">
            <FieldLabel htmlFor={`${formId}-current`}>Contraseña actual</FieldLabel>
            <AppInput
              id={`${formId}-current`}
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={busy}
            />
          </div>

          <div className="zelify-must-change-pw__field">
            <FieldLabel htmlFor={`${formId}-new`}>Nueva contraseña</FieldLabel>
            <AppInput
              id={`${formId}-new`}
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={busy}
            />
          </div>

          <div className="zelify-must-change-pw__field">
            <FieldLabel htmlFor={`${formId}-confirm`}>Confirmar nueva contraseña</FieldLabel>
            <AppInput
              id={`${formId}-confirm`}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={busy}
            />
          </div>

          {error ? (
            <p className="zelify-must-change-pw__error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="zelify-must-change-pw__submit" disabled={busy}>
            {busy ? "Actualizando…" : "Cambiar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
