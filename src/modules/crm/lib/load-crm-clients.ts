import { getStoredOrganization } from "@/lib/auth-api";
import { APPLICATIONS_BY_MODE } from "@/modules/mdc/data/mdc-credit-mock";
import { fetchFinanceRequests } from "@/modules/mdc/services/mdc-finance-requests.service";

export type CrmClientRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  product: string;
  amount: number;
  status: string;
  submittedAt: string;
  personType: string;
  owner: string;
  source: string;
};

const OWNERS = ["Ana Ríos", "Luis Ortega", "María Solís", "Diego Peña"];

function uniqueClients(rows: CrmClientRow[]) {
  const map = new Map<string, CrmClientRow>();
  for (const row of rows) {
    const key = (row.email || row.name).trim().toLowerCase();
    if (!key) continue;
    const current = map.get(key);
    if (!current || new Date(row.submittedAt).getTime() > new Date(current.submittedAt).getTime()) {
      map.set(key, row);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
  );
}

function decorate(
  row: Omit<CrmClientRow, "owner" | "source" | "phone"> & { phone?: string },
  index: number,
): CrmClientRow {
  return {
    ...row,
    owner: OWNERS[index % OWNERS.length],
    source: row.personType === "moral" ? "Réplica MDC · PM" : "Réplica MDC · PF",
    phone:
      row.phone?.trim() ||
      `+52 55 ${String(1800 + index).padStart(4, "0")} ${String(2200 + index).padStart(4, "0")}`,
  };
}

export async function loadCrmClients(): Promise<CrmClientRow[]> {
  const orgId = getStoredOrganization()?.id || "ORG-001";

  if (orgId === "demo-bypass-org") {
    return uniqueClients(
      [...APPLICATIONS_BY_MODE.natural, ...APPLICATIONS_BY_MODE.moral].map((app, index) =>
        decorate(
          {
            id: app.id,
            name: app.applicantName,
            email: app.applicantEmail,
            product: app.product,
            amount: app.requestedAmount,
            status: app.status,
            submittedAt: app.submittedAt,
            personType: APPLICATIONS_BY_MODE.moral.some((item) => item.id === app.id) ? "moral" : "natural",
          },
          index,
        ),
      ),
    );
  }

  const [natural, moral] = await Promise.all([
    fetchFinanceRequests(orgId, "natural").catch(() => []),
    fetchFinanceRequests(orgId, "moral").catch(() => []),
  ]);

  return uniqueClients(
    [...natural, ...moral].map((item, index) =>
      decorate(
        {
          id: item.id,
          name:
            item.personType === "natural"
              ? `${item.firstName || ""} ${item.lastName || ""}`.trim() || item.email
              : item.businessName || item.email,
          email: item.email || "—",
          product: item.product || "—",
          amount: Number(item.amount) || 0,
          status: item.status || "pending",
          submittedAt: item.createdAt || item.updatedAt || new Date().toISOString(),
          personType: item.personType || "natural",
          phone: item.phone,
        },
        index,
      ),
    ),
  );
}
