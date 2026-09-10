"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { CustomerProfileHeader } from "@/components/ui/organisms/customers/customer-profile-header";
import { CustomerOverview } from "@/components/ui/organisms/customers/customer-overview";
import { CustomerActivityFeed } from "@/components/ui/organisms/customers/customer-activity-feed";
import { WorkspaceShell } from "@/components/ui/templates/workspace-shell/workspace-shell";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { customersService } from "@/modules/customers/services/customers.service";
import type { Customer as ListCustomer } from "@/modules/customers/types/customer.types";
import { resolveCustomerProfile } from "@/modules/customers/services/customer-profile-resolver";
import "./customer-detail-page.css";

type CustomerDetailPageProps = {
  params: Promise<{ customerId: string }>;
};

type TabId = "overview" | "products" | "attachments" | "tasks" | "communications" | "comments";
type CustomerDocument = {
  id: string;
  title: string;
  description: string;
  image: string;
};
type CedulaField = {
  label: string;
  value: string;
};
type VerificationMetric = {
  label: string;
  value: string;
};
const NARIAT_PRELOAD_DELAY_MS = 80_000;
const NARIAT_FULL_NAME_MATCHES = new Set([
  "NARIAT OSBALDO BENITEZ LEON",
  "NARIAT OSBALDO BENITES LEON",
]);

function normalizeNameForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function isNariatSpecialCustomer(customer: { fullName: string }): boolean {
  const normalized = normalizeNameForMatch(customer.fullName);
  return NARIAT_FULL_NAME_MATCHES.has(normalized);
}

function parseTimestampMs(value?: string): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { customerId } = use(params);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [listCustomers, setListCustomers] = useState<ListCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    let mounted = true;
    customersService
      .getCustomers()
      .then((data) => {
        if (!mounted) return;
        setListCustomers(data);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const customer = resolveCustomerProfile(customerId, listCustomers);
  const nariatListCustomer = listCustomers.find((row) => row.id === customerId);
  const isNariatOsbaldoCustomer = customer ? isNariatSpecialCustomer(customer) : false;
  const nariatCreatedAtMs = parseTimestampMs(nariatListCustomer?.createdAt);
  const nariatRemainingMs = isNariatOsbaldoCustomer && nariatCreatedAtMs
    ? Math.max(0, nariatCreatedAtMs + NARIAT_PRELOAD_DELAY_MS - nowMs)
    : 0;
  const isNariatInfoReady = isNariatOsbaldoCustomer && nariatRemainingMs <= 0;
  const nariatRemainingSeconds = Math.max(0, Math.ceil(nariatRemainingMs / 1000));

  useEffect(() => {
    if (!isNariatOsbaldoCustomer || !nariatCreatedAtMs) return;
    if (Date.now() >= nariatCreatedAtMs + NARIAT_PRELOAD_DELAY_MS) return;

    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isNariatOsbaldoCustomer, nariatCreatedAtMs]);

  if (loading) {
    return (
      <WorkspaceShell>
        <main className="zelify-home zelify-home--customer-detail">
          <div className="zelify-home__content zelify-home__content--customer-detail">
            <p>Cargando cliente...</p>
          </div>
        </main>
      </WorkspaceShell>
    );
  }

  if (!customer) {
    notFound();
  }

  const nariatDocuments: CustomerDocument[] = [
    {
      id: "cedula-front",
      title: "Cedula (anverso)",
      description: "Documento oficial de identidad - frente",
      image: "/mock-docs/cedula-frente-nariat.png",
    },
    {
      id: "cedula-back",
      title: "Cedula (reverso)",
      description: "Documento oficial de identidad - reverso",
      image: "/mock-docs/cedula-reverso-nariat.png",
    },
    {
      id: "proof-of-life",
      title: "Prueba de vida",
      description: "Validacion biometrica (selfie)",
      image: "/mock-docs/prueba-vida-nariat.png",
    },
  ];
  const cedulaFrontFields: CedulaField[] = [
    { label: "Documento", value: "MÉXICO — INSTITUTO NACIONAL ELECTORAL · CREDENCIAL PARA VOTAR" },
    { label: "Nombre", value: "BENITEZ LEON NARIAT OSBALDO" },
    { label: "Sexo", value: "H" },
    { label: "Domicilio", value: "AV UNIVERSIDAD 2032 A 406 · COL RODEO DE TEPEREROS 04310 · COYOACAN, CDMX" },
    { label: "Clave de elector", value: "BNLNNR98081812H600" },
    { label: "CURP", value: "BELN980818HGRRNR06" },
    { label: "Año de registro", value: "2016 02" },
    { label: "Fecha de nacimiento", value: "18/08/1998" },
    { label: "Sección", value: "0740" },
    { label: "Vigencia", value: "2022 - 2032" },
  ];
  const cedulaBackLines: string[] = [
    "IDMEX23324244648<<07400107182994",
    "9808184H3212312MEX<02<<37306<1",
    "BENITEZ<LEON<<NARIAT<OSBALDO<<",
  ];
  const verificationAnalytics: VerificationMetric[] = [
    { label: "OCR CONFIDENCE", value: "95.37%" },
    { label: "FACIAL MATCH", value: "99.31%" },
  ];
  const genericDocuments = [
    "Documento de identidad - verificado",
    "Comprobante de domicilio - vigente",
    "Declaración de origen de fondos - aprobada",
  ];
  const tasks = [
    `Revisión trimestral de perfil de riesgo (${customer.branch})`,
    `Validar datos de contacto con oficial ${customer.creditOfficer}`,
  ];
  const communications = [
    `Correo enviado: Estado de productos (${customer.email})`,
    `SMS enviado: Confirmación de actividad en cuenta (${customer.phone})`,
  ];
  const notes = [
    `Cliente asignado al centro ${customer.assignedCentre}.`,
    customer.state === "In Arrears"
      ? "Seguimiento semanal activo por mora."
      : "Sin alertas críticas en monitoreo transaccional.",
  ];
  const tabs: { id: TabId; label: string; visible: boolean }[] = [
    { id: "overview", label: "Resumen", visible: true },
    { id: "products", label: `Productos (${customer.accounts.length})`, visible: customer.accounts.length > 0 },
    { id: "attachments", label: "Documentos", visible: true },
    { id: "tasks", label: "Tareas", visible: tasks.length > 0 },
    { id: "communications", label: "Comunicaciones", visible: communications.length > 0 },
    { id: "comments", label: "Notas", visible: notes.length > 0 },
  ].filter((tab) => tab.visible);

  const renderSimpleListCard = (title: string, items: string[]) => (
    <section className="zelify-panel zelify-customer-detail-card">
      <div className="zelify-panel__header">
        <h2 className="zelify-panel__title">{title}</h2>
      </div>
      <ul className="zelify-customer-detail-list">
        {items.map((item) => (
          <li key={item} className="zelify-customer-detail-list__item">
            <span className="zelify-customer-detail-list__dot" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <WorkspaceShell>
      <main className="zelify-home zelify-home--customer-detail">
        <div className="zelify-home__content zelify-home__content--customer-detail">
          <CustomerProfileHeader customer={customer} />

          <nav className="zelify-profile-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`zelify-profile-tab ${activeTab === tab.id ? "is-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="zelify-customer-detail-grid">
            <div className="zelify-customer-detail-main">
              {activeTab === "overview" && <CustomerOverview customer={customer} />}
              {activeTab === "products" && (
                <section className="zelify-panel zelify-customer-detail-card">
                  <div className="zelify-panel__header">
                    <h2 className="zelify-panel__title">Productos Financieros</h2>
                  </div>
                  <SettingsDataTable variant="accounts">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th className="is-numeric-header">Saldo USD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.accounts.map((acc) => (
                        <tr key={acc.id}>
                          <td>
                            <strong>{acc.name}</strong>
                            <div className="zelify-mono">{acc.id}</div>
                          </td>
                          <td>{acc.type}</td>
                          <td>
                            <AppBadge tone={acc.state === "In Arrears" ? "error" : "success"} size="sm">
                              {acc.state}
                            </AppBadge>
                          </td>
                          <td className="is-numeric">
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(acc.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </SettingsDataTable>
                </section>
              )}
              {activeTab === "attachments" && (
                isNariatOsbaldoCustomer ? (
                isNariatInfoReady ? (
                <section className="zelify-panel zelify-customer-detail-card">
                  <div className="zelify-panel__header">
                    <h2 className="zelify-panel__title">Documentos KYC</h2>
                  </div>
                  <div className="zelify-verification-analytics">
                    <h3 className="zelify-verification-analytics__title">VERIFICATION ANALYTICS</h3>
                    <div className="zelify-verification-analytics__grid">
                      {verificationAnalytics.map((metric) => (
                        <article key={metric.label} className="zelify-verification-analytics__item">
                          <span>{metric.label}</span>
                          <strong>{metric.value}</strong>
                        </article>
                      ))}
                    </div>
                  </div>
                  <div className="zelify-customer-documents-details">
                    <h3 className="zelify-customer-documents-details__title">Datos de la cédula (frente)</h3>
                    <div className="zelify-customer-documents-details__grid">
                      {cedulaFrontFields.map((field) => (
                        <article key={field.label} className="zelify-customer-documents-details__item">
                          <span>{field.label}</span>
                          <strong>{field.value}</strong>
                        </article>
                      ))}
                    </div>

                    <h3 className="zelify-customer-documents-details__title">Datos de la cédula (reverso)</h3>
                    <div className="zelify-customer-documents-details__back">
                      {cedulaBackLines.map((line) => (
                        <code key={line}>{line}</code>
                      ))}
                    </div>
                  </div>
                  <div className="zelify-customer-documents-grid">
                    {nariatDocuments.map((doc) => (
                      <article key={doc.id} className="zelify-customer-document-card">
                        <div className="zelify-customer-document-card__meta">
                          <h3>{doc.title}</h3>
                          <p>{doc.description}</p>
                        </div>
                        <Image
                          src={doc.image}
                          alt={doc.title}
                          className="zelify-customer-document-card__image"
                          width={900}
                          height={560}
                          sizes="(max-width: 980px) 100vw, 33vw"
                          loading="lazy"
                        />
                      </article>
                    ))}
                  </div>
                </section>
                ) : (
                  <section className="zelify-panel zelify-customer-detail-card">
                    <div className="zelify-panel__header">
                      <h2 className="zelify-panel__title">Documentos KYC</h2>
                    </div>
                    <div className="zelify-customer-detail-list__item">
                      <span className="zelify-customer-detail-list__dot" aria-hidden />
                      <span>
                        Esperando la información de verificación para Nariat Osbaldo.
                      </span>
                    </div>
                  </section>
                )
                ) : (
                  renderSimpleListCard("Documentos KYC", genericDocuments)
                )
              )}
              {activeTab === "tasks" && (
                renderSimpleListCard("Tareas Operativas", tasks)
              )}
              {activeTab === "communications" && (
                renderSimpleListCard("Comunicaciones", communications)
              )}
              {activeTab === "comments" && (
                renderSimpleListCard("Notas Internas", notes)
              )}
            </div>

            <CustomerActivityFeed events={customer.activity} />
          </div>
        </div>
      </main>
    </WorkspaceShell>
  );
}
