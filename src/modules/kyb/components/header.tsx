"use client";

import { usePathname } from "next/navigation";
import { MenuIcon } from "@/modules/kyb/components/icons";
import { useOnboarding } from "@/modules/kyb/components/onboarding-provider";

const titleMap: Record<string, { title: string; section: string }> = {
  "/admin/organizations": { title: "Gestión de Empresas", section: "Administración" },
  "/admin/users": { title: "Gestión de Usuarios", section: "Administración" },
  "/kyb": { title: "Información del negocio", section: "Sección 1" },
  "/kyb/pld-aml": {
    title: "PLD/AML y Datos Personales",
    section: "Sección 2",
  },
  "/kyb/commercial-info": {
    title: "Información Comercial",
    section: "Sección 3",
  },
  "/kyb/company-info": {
    title: "De la Empresa",
    section: "Sección 4",
  },
  "/kyb/sat-kyc": {
    title: "Conexión",
    section: "Sección 5",
  },
};

export function Header() {
  const pathname = usePathname();
  const {
    openMobileSidebar,
    isAuditMode,
    auditOrganizationId,
    organizationsList,
  } = useOnboarding();

  const auditedOrg = isAuditMode
    ? organizationsList.find((org) => org.id === auditOrganizationId)
    : null;

  const current = isAuditMode && auditedOrg
    ? {
        title: auditedOrg.legalName,
        section: "Auditoría · Expediente",
      }
    : titleMap[pathname] ?? { title: "Onboarding", section: "Zelify" };

  return (
    <header className="zelify-kyb-header border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-[72px] items-center px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={openMobileSidebar}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 lg:hidden"
            aria-label="Abrir sidebar"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
              {current.section}
            </p>
            <h1 className="truncate text-[28px] font-semibold leading-none text-slate-900">
              {current.title}
            </h1>
          </div>
        </div>
      </div>
    </header>
  );
}
