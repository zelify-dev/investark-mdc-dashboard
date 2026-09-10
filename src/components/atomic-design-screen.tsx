"use client";

import Link from "next/link";
import { useState } from "react";

import { AppAvatar } from "@/components/ui/atoms/avatar/app-avatar";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppCheckbox } from "@/components/ui/atoms/checkbox/app-checkbox";
import { FieldLabel } from "@/components/ui/atoms/field-label/field-label";
import { AppIconButton } from "@/components/ui/atoms/icon-button/app-icon-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { AppSelect } from "@/components/ui/atoms/select/app-select";
import { SectionTitle } from "@/components/ui/atoms/section-title/section-title";
import { AppText } from "@/components/ui/atoms/text/app-text";
import { ContextSelector } from "@/components/ui/molecules/context-selector/context-selector";
import { DropdownMenu } from "@/components/ui/molecules/dropdown-menu/dropdown-menu";
import { FormField } from "@/components/ui/molecules/form-field/form-field";
import { NavTab } from "@/components/ui/molecules/nav-tab/nav-tab";
import { NavTabDropdown } from "@/components/ui/molecules/nav-tab-dropdown/nav-tab-dropdown";
import { PanelHeader } from "@/components/ui/molecules/panel-header/panel-header";
import { ProfileTrigger } from "@/components/ui/molecules/profile-trigger/profile-trigger";
import { TableFilters } from "@/components/ui/molecules/table-filters/table-filters";
import { TopbarSearchBox } from "@/components/ui/molecules/search-box/topbar-search-box";
import { StatCard } from "@/components/ui/molecules/stat-card/stat-card";
import { ActivityFeed } from "@/components/ui/organisms/activity-feed/activity-feed";
import { GeneralSetupSubNav } from "@/components/ui/organisms/settings-general-subnav/settings-general-subnav";
import { FinancialSetupSubNav } from "@/components/ui/organisms/financial-setup-subnav/financial-setup-subnav";
import { AccountingWorkspaceSubNav } from "@/modules/accounting/components/accounting-workspace-subnav";
import { WebhooksSetupSubNav } from "@/modules/settings/components/webhooks-setup-subnav";
import { QuickViewList } from "@/components/ui/organisms/quick-view-list/quick-view-list";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { StatusList } from "@/components/ui/organisms/status-list/status-list";
import { SummaryGrid } from "@/components/ui/organisms/summary-grid/summary-grid";
import { TaskQueue } from "@/components/ui/organisms/task-queue/task-queue";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";
import { FinancialTableRowActions } from "@/modules/settings/components/financial-table-row-actions/financial-table-row-actions";
import { getTopNavDropdown } from "@/config/top-nav-dropdowns";
import { IndicatorTile } from "@/components/ui/molecules/indicator-tile/indicator-tile";

import "./home-screen.css";
import "./atomic-design-screen.css";

const activityItems = [
  {
    type: "Client onboarding",
    title: "Corporate client approved for treasury operations",
    meta: "Branch: Andean Treasury Group",
    time: "8 min ago",
    marker: "CL",
  },
  {
    type: "Transaction review",
    title: "Large transfer routed to secondary review",
    meta: "Account: 002-4481 / Amount: $86,420",
    time: "14 min ago",
    marker: "TX",
  },
];

const statusItems = [
  { label: "Overdue", value: "12" },
  { label: "Due today", value: "29" },
  { label: "Upcoming", value: "41" },
];

const quickViewItems = [
  { count: "21", label: "High-value transactions", meta: "Saved view" },
  { count: "9", label: "Branches pending approval", meta: "Approval queue" },
  { count: "7", label: "Daily reconciliation queue", meta: "Operations" },
];

const summaryItems = [
  {
    title: "Settlement health",
    description: "Core settlement flows remain within expected thresholds.",
  },
  {
    title: "Review workload",
    description: "Manual review volume increased compared to the morning baseline.",
  },
  {
    title: "Platform availability",
    description: "Operational services remain available with no degraded modules.",
  },
];

const ROUTE_LINKS: { href: string; label: string }[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/activities", label: "Activities (System Activities)" },
  { href: "/customers", label: "Clients" },
  { href: "/accounting/journal-entries", label: "Accounting → Journal Entries" },
  { href: "/accounting/chart-of-accounts", label: "Accounting → Chart Of Accounts" },
  { href: "/accounting/balance-sheet", label: "Accounting → Balance Sheet (placeholder)" },
  { href: "/settings", label: "Administration (hub)" },
  { href: "/settings/general/organization-details", label: "General Setup → Branches" },
  { href: "/settings/general/holidays", label: "General Setup → Holidays" },
  { href: "/settings/general/client-types", label: "General Setup → Client Types" },
  { href: "/settings/organization", label: "Admin → Branches" },
  { href: "/settings/financial/currency", label: "Financial Setup → Currency" },
  { href: "/settings/financial/transaction-channels", label: "Financial Setup → Transaction Channels" },
  { href: "/settings/products", label: "Administration → Products" },
  { href: "/settings/fields", label: "Administration → Fields (placeholder)" },
  { href: "/settings/forms", label: "Administration → Forms (placeholder)" },
  { href: "/settings/templates", label: "Administration → Templates (placeholder)" },
  { href: "/settings/apps", label: "Administration → Apps (placeholder)" },
  { href: "/settings/sms", label: "Administration → SMS" },
  { href: "/settings/email", label: "Administration → Email" },
  { href: "/settings/webhooks", label: "Administration → Webhooks → Notifications" },
  { href: "/settings/webhooks/settings", label: "Administration → Webhooks → Settings (placeholder)" },
  { href: "/settings/tasks", label: "Administration → Tasks (placeholder)" },
  { href: "/settings/data", label: "Administration → Data (placeholder)" },
];

export default function AtomicDesignScreen() {
  const [filtersOpen, setFiltersOpen] = useState(true);

  return (
    <div className="atomic-design-page">
      <ZelifyTopNavbar activeNavId="dashboard" />

      <main className="atomic-design-page__content">
        <section className="atomic-design-page__hero">
          <div>
            <span className="atomic-design-page__eyebrow">Component Library</span>
            <h1 className="atomic-design-page__title">Atomic design catalog</h1>
            <AppText className="atomic-design-page__lead" tone="muted">
              Catálogo interno de átomos, moléculas y organismos reutilizables. Las pantallas de
              producto combinan estos bloques con Tamagui donde aplica.
            </AppText>
          </div>

          <div className="atomic-design-page__status">
            <div className="atomic-design-page__status-card">
              <span className="atomic-design-page__status-label">Design system</span>
              <strong>Zelify (CSS) + Tamagui</strong>
              <AppText tone="muted">
                Los átomos y organismos de este catálogo usan clases `zelify-*` (CSS por componente).
                En paralelo, gran parte del producto sigue usando Tamagui (`YStack`, `XStack`, tema,
                etc.) para layout y piezas legacy; la idea es ir alineando pantallas nuevas o
                refactorizadas con estos bloques.
              </AppText>
            </div>
            <div className="atomic-design-page__status-card">
              <span className="atomic-design-page__status-label">Rutas de ejemplo</span>
              <ul className="atomic-design-page__route-list">
                {ROUTE_LINKS.map((r) => (
                  <li key={r.href}>
                    <Link href={r.href}>{r.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <CatalogSection
          title="Atoms"
          description="Primitivos: botón, input (surface / ghost), select, etiquetas, checkbox, badge, texto."
        >
          <PreviewCard label="AppButton">
            <div className="atomic-design-demo__button-row">
              <AppButton tone="primary">Primary</AppButton>
              <AppButton tone="secondary">Secondary</AppButton>
              <AppButton tone="neutral">Neutral</AppButton>
              <AppButton tone="primary" className="zelify-button--compact">
                Compact
              </AppButton>
            </div>
          </PreviewCard>
          <PreviewCard label="AppInput">
            <div className="atomic-design-demo__stack">
              <AppText tone="muted">surface (formularios)</AppText>
              <AppInput placeholder="Texto en fondo claro" />
              <AppText tone="muted">ghost (topbar)</AppText>
              <div className="atomic-design-demo__dark-input-shell">
                <AppInput variant="ghost" placeholder="Búsqueda…" />
              </div>
            </div>
          </PreviewCard>
          <PreviewCard label="AppSelect">
            <AppSelect defaultValue="usd" size="md">
              <option value="usd">US Dollar (USD)</option>
              <option value="gbp">British Pound (GBP)</option>
            </AppSelect>
          </PreviewCard>
          <PreviewCard label="FieldLabel">
            <FieldLabel htmlFor="demo-fl">Etiqueta de campo</FieldLabel>
          </PreviewCard>
          <PreviewCard label="SectionTitle">
            <SectionTitle>Título de sección</SectionTitle>
          </PreviewCard>
          <PreviewCard label="AppCheckbox">
            <AppCheckbox id="demo-cb" label="Saturday" defaultChecked />
          </PreviewCard>
          <PreviewCard label="AppIconButton">
            <AppIconButton ariaLabel="Notifications">
              <BellIcon />
            </AppIconButton>
          </PreviewCard>
          <PreviewCard label="AppAvatar">
            <AppAvatar initials="JC" />
          </PreviewCard>
          <PreviewCard label="AppBadge">
            <div className="atomic-design-demo__badge-row">
              <AppBadge tone="success" size="sm">
                Active
              </AppBadge>
              <AppBadge tone="neutral" size="sm">
                Default
              </AppBadge>
            </div>
          </PreviewCard>
          <PreviewCard label="AppText">
            <div className="atomic-design-demo__text-group">
              <AppText tone="strong">Primary text</AppText>
              <AppText tone="muted">Muted operational copy</AppText>
            </div>
          </PreviewCard>
        </CatalogSection>

        <CatalogSection
          title="Molecules"
          description="Bloques compuestos: campo con label, navegación, filtros de tabla, etc."
        >
          <PreviewCard label="FormField">
            <FormField
              label={<FieldLabel htmlFor="atomic-ff">Nombre</FieldLabel>}
              control={<AppInput id="atomic-ff" placeholder="Valor" />}
            />
          </PreviewCard>
          <PreviewCard label="ContextSelector">
            <ContextSelector label="ALL ORGANIZATIONS" icon={<ChevronDownIcon />} />
          </PreviewCard>
          <PreviewCard label="NavTab">
            <div className="atomic-design-demo__nav-tabs">
              <NavTab label="Dashboard" isActive />
              <NavTab label="Products" trailingIcon={<ChevronDownIcon />} />
            </div>
          </PreviewCard>
          <PreviewCard label="NavTabDropdown" wide>
            <AppText tone="muted">
              Pasa el cursor sobre la pestaña (menú fijado con portal). Datos de ejemplo: Clients.
            </AppText>
            <div className="atomic-design-demo__nav-tabs atomic-design-demo__nav-tabs--elevated">
              <NavTabDropdown
                label="Clients"
                href="/customers"
                isActive={false}
                entries={getTopNavDropdown("Clients") ?? []}
              />
            </div>
          </PreviewCard>
          <PreviewCard label="FinancialTableRowActions">
            <FinancialTableRowActions rowLabel="atomic-demo" />
          </PreviewCard>
          <PreviewCard label="DropdownMenu">
            <div className="atomic-design-demo__menu-shell">
              <DropdownMenu
                className="atomic-design-demo__dropdown"
                items={["Client", "Branch", "Account", "User"]}
              />
            </div>
          </PreviewCard>
          <PreviewCard label="PanelHeader">
            <PanelHeader
              eyebrow="Operational summary"
              title="System summary"
              aside={<AppBadge className="atomic-design-demo__badge">3 monitored areas</AppBadge>}
            />
          </PreviewCard>
          <PreviewCard label="ProfileTrigger">
            <ProfileTrigger
              name="Juan Carlos"
              initials="JC"
              trailingIcon={<ChevronDownIcon />}
            />
          </PreviewCard>
          <PreviewCard label="TopbarSearchBox">
            <TopbarSearchBox
              results={[
                { group: "Clients", label: "Andean Treasury Group" },
                { group: "Accounts", label: "002-4481 Operating Account" },
                { group: "Transactions", label: "TX-2026-04-18-88214" },
              ]}
            />
          </PreviewCard>
          <PreviewCard label="StatCard">
            <StatCard label="Transactions Today" value="284,901" delta="$18.4M settled" />
          </PreviewCard>
          <PreviewCard label="IndicatorTile">
            <IndicatorTile
              label="Loans awaiting approval"
              value="37"
              meta="9 submitted in the last hour"
            />
          </PreviewCard>
          <PreviewCard label="TableFilters" wide>
            <div className="atomic-design-demo__table-filters">
              <AppButton tone="secondary" type="button" onClick={() => setFiltersOpen((v) => !v)}>
                {filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
              </AppButton>
              <TableFilters isVisible={filtersOpen} onClear={() => setFiltersOpen(false)} />
            </div>
          </PreviewCard>
        </CatalogSection>

        <CatalogSection
          title="Organisms"
          description="Bloques de producto: feeds, tablas de settings, topbar completo."
        >
          <PreviewCard label="ActivityFeed" wide>
            <ActivityFeed items={activityItems} />
          </PreviewCard>
          <PreviewCard label="StatusList">
            <StatusList items={statusItems} />
          </PreviewCard>
          <PreviewCard label="QuickViewList">
            <QuickViewList items={quickViewItems} />
          </PreviewCard>
          <PreviewCard label="TaskQueue" wide>
            <TaskQueue
              summary={statusItems}
              tasks={[
                {
                  title: "Control total client balance",
                  owner: "Juan Carlos",
                  dueDate: "18-04-2026",
                },
                {
                  title: "Review status of loans",
                  owner: "Operations team",
                  dueDate: "18-04-2026",
                },
              ]}
            />
          </PreviewCard>
          <PreviewCard label="SummaryGrid" wide>
            <SummaryGrid items={summaryItems} />
          </PreviewCard>
          <PreviewCard label="SettingsDataTable">
            <SettingsDataTable>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Example</td>
                  <td>123</td>
                </tr>
              </tbody>
            </SettingsDataTable>
          </PreviewCard>
          <PreviewCard label="GeneralSetupSubNav" wide>
            <div className="atomic-design-demo__general-subnav">
              <GeneralSetupSubNav />
            </div>
          </PreviewCard>
          <PreviewCard label="FinancialSetupSubNav" wide>
            <div className="atomic-design-demo__general-subnav">
              <FinancialSetupSubNav />
            </div>
          </PreviewCard>
          <PreviewCard label="AccountingWorkspaceSubNav" wide>
            <div className="atomic-design-demo__general-subnav">
              <AccountingWorkspaceSubNav />
            </div>
          </PreviewCard>
          <PreviewCard label="WebhooksSetupSubNav" wide>
            <div className="atomic-design-demo__general-subnav">
              <WebhooksSetupSubNav />
            </div>
          </PreviewCard>
          <PreviewCard label="SandboxBanner" wide>
            <SandboxBanner />
          </PreviewCard>
          <PreviewCard label="ZelifyTopNavbar" full>
            <div className="atomic-design-demo__navbar-shell">
              <ZelifyTopNavbar activeNavId="dashboard" />
            </div>
          </PreviewCard>
        </CatalogSection>

        <CatalogSection
          title="Templates / shells"
          description="Layouts de página que componen organismos; enlazan rutas reales del workspace."
        >
          <PreviewCard label="WorkspaceShell" wide>
            <AppText tone="muted">
              Envuelve contenido con <code className="atomic-design-page__code">ZelifyTopNavbar</code>{" "}
              activo por ruta. Usado en{" "}
              <Link href="/customers/CL-882914">/customers/[customerId]</Link>.
            </AppText>
          </PreviewCard>
          <PreviewCard label="GeneralSetupShell" wide>
            <AppText tone="muted">
              Navbar + barra Administration + pestañas General Setup + cuerpo +{" "}
              <strong>Sandbox</strong>. Ver{" "}
              <Link href="/settings/general/organization-details">/settings/general/*</Link>.
            </AppText>
          </PreviewCard>
          <PreviewCard label="FinancialSetupShell" wide>
            <AppText tone="muted">
              Navbar + subnave Financial Setup + cuerpo + Sandbox. Ver{" "}
              <Link href="/settings/financial/currency">/settings/financial/*</Link>.
            </AppText>
          </PreviewCard>
          <PreviewCard label="AccountingWorkspaceShell" wide>
            <AppText tone="muted">
              Navbar + pestañas Accounting (Balance Sheet, Chart Of Accounts, …) + cuerpo + Sandbox. Ver{" "}
              <Link href="/accounting/chart-of-accounts">/accounting/*</Link>.
            </AppText>
          </PreviewCard>
          <PreviewCard label="WebhooksSetupShell" wide>
            <AppText tone="muted">
              Navbar + Notifications | Settings + cuerpo + Sandbox. Ver{" "}
              <Link href="/settings/webhooks">/settings/webhooks</Link>.
            </AppText>
          </PreviewCard>
          <PreviewCard label="AdminSectionSettingsShell (SMS / Email)" wide>
            <AppText tone="muted">
              Navbar + subnave única “Settings” para integraciones. Ver{" "}
              <Link href="/settings/sms">/settings/sms</Link> y{" "}
              <Link href="/settings/email">/settings/email</Link>.
            </AppText>
          </PreviewCard>
        </CatalogSection>
      </main>
    </div>
  );
}

type CatalogSectionProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

function CatalogSection({ title, description, children }: CatalogSectionProps) {
  return (
    <section className="atomic-design-section">
      <div className="atomic-design-section__header">
        <h2 className="atomic-design-section__title">{title}</h2>
        <AppText tone="muted" className="atomic-design-section__description">
          {description}
        </AppText>
      </div>
      <div className="atomic-design-section__grid">{children}</div>
    </section>
  );
}

type PreviewCardProps = {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
  full?: boolean;
};

function PreviewCard({ label, children, wide = false, full = false }: PreviewCardProps) {
  const classes = [
    "atomic-design-card",
    wide ? "is-wide" : "",
    full ? "is-full" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={classes}>
      <span className="atomic-design-card__label">{label}</span>
      <div className="atomic-design-card__body">{children}</div>
    </article>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9 16.25a1.87 1.87 0 0 0 1.83-1.5H7.17A1.87 1.87 0 0 0 9 16.25ZM14.25 13.25H3.75v-.75l1.5-1.5V7.75a3.75 3.75 0 1 1 7.5 0V11l1.5 1.5v.75Z"
        fill="#F8FAFC"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3.5 5.25 7 8.75l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
