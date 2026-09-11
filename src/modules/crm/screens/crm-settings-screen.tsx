"use client";

import { useState } from "react";

import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AuthError, updateOrganization } from "@/lib/auth-api";
import { CrmPageHeader } from "@/modules/crm/components/crm-page-header";
import { DOC_KIND_LABEL } from "@/modules/crm/data/kumaza-crm.seed";
import type { DocKind } from "@/modules/crm/data/kumaza-crm.types";
import { useCrmSession } from "@/modules/crm/lib/crm-session";
import { mapOrganizationToCrm } from "@/modules/crm/lib/map-organization-to-crm";

import "./crm-ops.css";

const DOC_OPTIONS: DocKind[] = ["nomina", "estado_cuenta", "comprobante_domicilio"];

const COUNTRY_CODES: Record<string, string> = {
  méxico: "MX",
  mexico: "MX",
  "estados unidos": "US",
};

function toCountryCode(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 3) return trimmed.toUpperCase();
  return COUNTRY_CODES[trimmed.toLowerCase()] || trimmed;
}

export function CrmSettingsScreen() {
  const { org, orgLoading, orgError, process, setOrg, setProcess } = useCrmSession();
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleDoc = (kind: DocKind, field: "requiredDocs" | "validationOrder") => {
    const current = process[field];
    const next = current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind];
    setProcess({ ...process, [field]: next });
  };

  return (
    <div className="crm-ops">
      <CrmPageHeader
        title="Configuración"
        subtitle={
          orgLoading
            ? "Cargando datos de la organización en sesión…"
            : `Parámetros de WhatsApp Business para ${org.tradeName || "la organización logueada"}.`
        }
      />

      {orgError ? <p className="crm-ops__note">{orgError}</p> : null}

      <div className="crm-ops__grid">
        <section className="crm-ops__card">
          <h2>Información de la organización</h2>
          <p>Datos fiscales reales de la organización logueada. WhatsApp y WABA se editan aquí para el canal.</p>
          <label>
            Nombre comercial
            <input disabled={orgLoading} value={org.tradeName} onChange={(event) => setOrg({ ...org, tradeName: event.target.value })} />
          </label>
          <label>
            Nombre legal
            <input value={org.legalName} onChange={(event) => setOrg({ ...org, legalName: event.target.value })} />
          </label>
          <label>
            Razón social
            <input value={org.businessName} onChange={(event) => setOrg({ ...org, businessName: event.target.value })} />
          </label>
          <label>
            Identificación fiscal
            <input value={org.taxId} onChange={(event) => setOrg({ ...org, taxId: event.target.value })} />
          </label>
          <label>
            País o países
            <input value={org.countries} onChange={(event) => setOrg({ ...org, countries: event.target.value })} />
          </label>
          <label>
            Sitio web
            <input value={org.website} onChange={(event) => setOrg({ ...org, website: event.target.value })} />
          </label>
          <label>
            Industria
            <input value={org.industry} onChange={(event) => setOrg({ ...org, industry: event.target.value })} />
          </label>
          <label>
            Número WhatsApp Business
            <input value={org.whatsappPhone} onChange={(event) => setOrg({ ...org, whatsappPhone: event.target.value })} />
          </label>
          <label>
            WABA ID
            <input value={org.wabaId} onChange={(event) => setOrg({ ...org, wabaId: event.target.value })} />
          </label>
        </section>

        <section className="crm-ops__card">
          <h2>Configuración del proceso</h2>
          <p>Mensajes y documentos del flujo de verificación. Se pueden cambiar sin tocar código.</p>
          <label>
            Bienvenida
            <textarea value={process.welcome} onChange={(event) => setProcess({ ...process, welcome: event.target.value })} />
          </label>
          <label>
            Solicitud de documentos
            <textarea value={process.requestDocs} onChange={(event) => setProcess({ ...process, requestDocs: event.target.value })} />
          </label>
          <label>
            Seguimiento
            <textarea value={process.followUp} onChange={(event) => setProcess({ ...process, followUp: event.target.value })} />
          </label>
          <label>
            Documento rechazado
            <textarea value={process.rejectedDoc} onChange={(event) => setProcess({ ...process, rejectedDoc: event.target.value })} />
          </label>
          <label>
            Expediente completo
            <textarea value={process.completeFile} onChange={(event) => setProcess({ ...process, completeFile: event.target.value })} />
          </label>
          <label>
            Finalización
            <textarea value={process.finish} onChange={(event) => setProcess({ ...process, finish: event.target.value })} />
          </label>
          <p>Documentos requeridos</p>
          <div className="crm-ops__chips">
            {DOC_OPTIONS.map((kind) => (
              <button
                key={kind}
                type="button"
                className={process.requiredDocs.includes(kind) ? "is-on" : ""}
                onClick={() => toggleDoc(kind, "requiredDocs")}
              >
                {DOC_KIND_LABEL[kind]}
              </button>
            ))}
          </div>
          <p style={{ marginTop: 12 }}>Orden de validación</p>
          <div className="crm-ops__chips">
            {process.validationOrder.map((kind, index) => (
              <span key={kind} className="crm-badge crm-badge--info">
                {index + 1}. {DOC_KIND_LABEL[kind]}
              </span>
            ))}
          </div>
        </section>
      </div>

      <div>
        <AppButton
          tone="primary"
          disabled={saving || orgLoading || !org.orgId}
          onClick={async () => {
            if (!org.orgId) {
              setNotice("No hay organizationId en sesión.");
              return;
            }
            setSaving(true);
            setNotice(null);
            try {
              const latest = await updateOrganization(org.orgId, {
                name: org.tradeName.trim() || undefined,
                company_legal_name: org.legalName.trim() || org.businessName.trim() || undefined,
                fiscal_id: org.taxId.trim() || undefined,
                country: toCountryCode(org.countries) || undefined,
                website: org.website.trim() || undefined,
                industry: org.industry.trim() || undefined,
              });
              const next = mapOrganizationToCrm(latest);
              setOrg({
                ...next,
                whatsappPhone: org.whatsappPhone,
                wabaId: org.wabaId,
              });
              setNotice("Configuración de la organización actualizada.");
            } catch (err) {
              const message = err instanceof AuthError ? err.message : "No fue posible guardar la organización.";
              setNotice(message);
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Guardando…" : "Guardar configuración"}
        </AppButton>
        {notice ? <p className="crm-ops__note">{notice}</p> : null}
      </div>
    </div>
  );
}
