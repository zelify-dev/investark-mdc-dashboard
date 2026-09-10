"use client";

import { useState } from "react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { DEFAULT_BRANDING, useBranding, type BrandingState } from "@/providers/branding-provider";

import "./settings-workspace-shared.css";
import "./branding-screen.css";

export function BrandingScreen() {
  const { branding, setBranding, resetBranding } = useBranding();
  return (
    <BrandingEditor
      key={JSON.stringify(branding)}
      branding={branding}
      setBranding={setBranding}
      resetBranding={resetBranding}
    />
  );
}

function BrandingEditor({
  branding,
  setBranding,
  resetBranding,
}: {
  branding: BrandingState;
  setBranding: (next: BrandingState) => void;
  resetBranding: () => void;
}) {
  const [draft, setDraft] = useState<BrandingState>(branding);
  const [saved, setSaved] = useState(false);

  function updateField<K extends keyof BrandingState>(field: K, value: BrandingState[K]) {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleLogoUpload(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : DEFAULT_BRANDING.logoUrl;
      updateField("logoUrl", result);
    };
    reader.readAsDataURL(file);
  }

  function handleReset() {
    setDraft(branding);
    setSaved(false);
  }

  function handleSave() {
    setBranding(draft);
    setSaved(true);
  }

  function handleRestoreDefaults() {
    resetBranding();
    setDraft(DEFAULT_BRANDING);
    setSaved(true);
  }

  return (
    <div className="zelify-settings-workspace zelify-branding">
      <div className="zelify-branding__head">
        <h1 className="zelify-settings-workspace__title">Marca e identidad</h1>
      </div>
      <p className="zelify-branding__lead">
        Define cómo ve tu institución la aplicación: nombre visible, colores y mensajes del acceso.
      </p>

      <div className="zelify-branding__grid">
        <section className="zelify-policy-card zelify-branding__form">
          <h2>Identidad</h2>
          <label className="zelify-branding__field">
            Nombre para mostrar
            <AppInput value={draft.displayName} onChange={(e) => updateField("displayName", e.target.value)} />
          </label>
          <label className="zelify-branding__field">
            Eslogan (subtítulo)
            <AppInput value={draft.tagline} onChange={(e) => updateField("tagline", e.target.value)} />
          </label>
          <label className="zelify-branding__field">
            URL del logotipo
            <AppInput value={draft.logoUrl} onChange={(e) => updateField("logoUrl", e.target.value)} placeholder="https://…" />
          </label>
          <label className="zelify-branding__field">
            Subir logotipo
            <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e.target.files?.[0] ?? null)} />
          </label>
          <label className="zelify-branding__field">
            Mensaje en pantalla de login
            <AppInput value={draft.loginMessage} onChange={(e) => updateField("loginMessage", e.target.value)} />
          </label>
        </section>

        <section className="zelify-policy-card zelify-branding__colors">
          <h2>Paleta</h2>
          <div className="zelify-branding__color-row">
            <label>
              Primario
              <input type="color" value={draft.primaryHex} onChange={(e) => updateField("primaryHex", e.target.value)} aria-label="Color primario" />
              <AppInput value={draft.primaryHex} onChange={(e) => updateField("primaryHex", e.target.value)} />
            </label>
            <label>
              Acento
              <input type="color" value={draft.accentHex} onChange={(e) => updateField("accentHex", e.target.value)} aria-label="Color de acento" />
              <AppInput value={draft.accentHex} onChange={(e) => updateField("accentHex", e.target.value)} />
            </label>
          </div>
          <div className="zelify-branding__preview">
            <div className="zelify-branding__preview-bar" style={{ background: draft.primaryHex || "#271a59" }}>
              {draft.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.logoUrl} alt={draft.displayName || "Logo"} className="zelify-branding__preview-logo" />
              ) : (
                <strong>{draft.displayName || "Aethereun"}</strong>
              )}
              <span className="zelify-branding__preview-nav">General · Organización · Acceso</span>
              <span className="zelify-branding__preview-cta" style={{ background: draft.accentHex || "#271a59" }}>
                Acción
              </span>
            </div>
            <div className="zelify-branding__preview-page">
              <p>{draft.tagline || "Vista previa de la barra y el acento."}</p>
              <div className="zelify-branding__preview-card">
                <strong style={{ color: draft.primaryHex }}>{draft.displayName || "Institución"}</strong>
                <span>Así se verá la navegación con esta paleta.</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="zelify-policy-footer">
        <AppButton type="button" tone="neutral" onClick={handleReset}>
          Restablecer borrador
        </AppButton>
        <AppButton type="button" tone="secondary" onClick={handleRestoreDefaults}>
          Restaurar defaults
        </AppButton>
        <AppButton type="button" tone="primary" onClick={handleSave}>
          Guardar marca
        </AppButton>
      </div>
      {saved ? <p className="zelify-branding__saved">Marca actualizada.</p> : null}
    </div>
  );
}
