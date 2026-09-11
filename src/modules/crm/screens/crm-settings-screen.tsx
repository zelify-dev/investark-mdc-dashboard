"use client";

import { useState } from "react";

import { AppButton } from "@/components/ui/atoms/button/app-button";
import { CrmPageHeader } from "@/modules/crm/components/crm-page-header";
import { DOC_KIND_LABEL } from "@/modules/crm/data/kumaza-crm.seed";
import type { DocKind } from "@/modules/crm/data/kumaza-crm.types";
import { useCrmSession } from "@/modules/crm/lib/crm-session";

import "./crm-ops.css";

const DOC_OPTIONS: DocKind[] = ["nomina", "estado_cuenta", "comprobante_domicilio"];

export function CrmSettingsScreen() {
  const { org, process, setOrg, setProcess } = useCrmSession();
  const [notice, setNotice] = useState<string | null>(null);

  const toggleDoc = (kind: DocKind, field: "requiredDocs" | "validationOrder") => {
    const current = process[field];
    const next = current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind];
    setProcess({ ...process, [field]: next });
  };

  return (
    <div className="crm-ops">
      <CrmPageHeader
        title="Configuración"
        subtitle={`Parámetros de WhatsApp Business para la organización ${org.orgId}.`}
      />

      <div className="crm-ops__grid">
        <section className="crm-ops__card">
          <h2>Información de la organización</h2>
          <p>Datos fiscales y de canal para habilitar la verificación por WhatsApp.</p>
          <label>
            Nombre comercial
            <input value={org.tradeName} onChange={(event) => setOrg({ ...org, tradeName: event.target.value })} />
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
        <AppButton tone="primary" onClick={() => setNotice("Configuración guardada en la sesión de CRM (módulo quemado).")}>
          Guardar configuración
        </AppButton>
        {notice ? <p className="crm-ops__note">{notice}</p> : null}
      </div>
    </div>
  );
}
