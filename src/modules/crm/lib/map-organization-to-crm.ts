import type { AuthOrganization, OrganizationDetails } from "@/lib/auth-api";
import { DEFAULT_PROCESS } from "@/modules/crm/data/kumaza-crm.seed";
import type { CrmOrgConfig, CrmProcessConfig } from "@/modules/crm/data/kumaza-crm.types";

const COUNTRY_LABELS: Record<string, string> = {
  MX: "México",
  MEX: "México",
  US: "Estados Unidos",
  USA: "Estados Unidos",
  GT: "Guatemala",
  CO: "Colombia",
  PE: "Perú",
  CL: "Chile",
  AR: "Argentina",
};

function countryLabel(code?: string | null): string {
  const raw = (code || "").trim();
  if (!raw) return "";
  return COUNTRY_LABELS[raw.toUpperCase()] || raw;
}

function withOrgName(text: string, name: string): string {
  const safe = name.trim() || "la organización";
  return text.replace(/Kumaza/g, safe);
}

export function emptyCrmOrg(partial?: Partial<CrmOrgConfig>): CrmOrgConfig {
  return {
    orgId: "",
    tradeName: "",
    legalName: "",
    businessName: "",
    taxId: "",
    countries: "",
    website: "",
    industry: "",
    whatsappPhone: "",
    wabaId: "",
    ...partial,
  };
}

export function mapStoredOrgToCrm(org: AuthOrganization | null): CrmOrgConfig {
  if (!org?.id) return emptyCrmOrg();
  return emptyCrmOrg({
    orgId: org.id,
    tradeName: org.name || "",
    legalName: org.name || "",
    businessName: org.name || "",
  });
}

export function mapOrganizationToCrm(org: OrganizationDetails): CrmOrgConfig {
  const tradeName = org.name || "";
  const legalName = org.company_legal_name || tradeName;
  return emptyCrmOrg({
    orgId: org.id,
    tradeName,
    legalName,
    businessName: legalName,
    taxId: org.fiscal_id || "",
    countries: countryLabel(org.country),
    website: org.website || "",
    industry: org.industry || "",
  });
}

export function processForOrg(name: string, current = DEFAULT_PROCESS): CrmProcessConfig {
  if (!current.welcome.includes("Kumaza") && !current.finish.includes("Kumaza")) return current;
  return {
    ...current,
    welcome: withOrgName(current.welcome, name),
    finish: withOrgName(current.finish, name),
  };
}
