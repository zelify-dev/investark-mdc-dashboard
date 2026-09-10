import type { CreditClientProfile } from "@/modules/cortex/types/credit-pricing.types";
import { recalculateAllClientRates } from "@/modules/lim/services/deposit-pricing.engine";
import type { DemoClient, LimDemoState } from "@/modules/lim/types/deposit-pricing.types";

/** Tres casos corporativos de pricing (tour B2–B5); uno vinculado a cartera CORTEX. */
export const FEATURED_DEPOSIT_CASE_IDS = ["PM-DEMO-002", "PM-DEMO-003", "PM-DEMO-004"] as const;

const FEATURED_CREDIT_LINKS: Record<(typeof FEATURED_DEPOSIT_CASE_IDS)[number], string | undefined> = {
  "PM-DEMO-002": undefined,
  "PM-DEMO-003": undefined,
  "PM-DEMO-004": "CL-PERS-002",
};

export const FEATURED_CORPORATE_CLIENTS: DemoClient[] = [
  {
    id: "PM-DEMO-002",
    creditClientId: FEATURED_CREDIT_LINKS["PM-DEMO-002"],
    featuredCase: true,
    name: "Grupo Delta Industrial SA",
    personType: "PM",
    averageBalance: 50_000_000,
    balanceMetric: "SPM",
    productTypes: ["VISTA", "PLAZO"],
    segment: "Corporativo",
  },
  {
    id: "PM-DEMO-003",
    creditClientId: FEATURED_CREDIT_LINKS["PM-DEMO-003"],
    featuredCase: true,
    name: "Inversiones del Norte SA",
    personType: "PM",
    averageBalance: 120_000_000,
    balanceMetric: "SPM",
    productTypes: ["VISTA"],
    segment: "VIP",
  },
  {
    id: "PM-DEMO-004",
    creditClientId: FEATURED_CREDIT_LINKS["PM-DEMO-004"],
    featuredCase: true,
    name: "TechStart Solutions SA de CV",
    personType: "PM",
    averageBalance: 35_000_000,
    balanceMetric: "SPM",
    productTypes: ["VISTA", "PLAZO"],
    incrementalBalance30d: 22_500_000,
    segment: "Corporativo",
  },
];

function segmentFromProductId(productId: string): string {
  if (productId.startsWith("AUTO")) return "Automotriz";
  if (productId.startsWith("PERS")) return "Personal";
  if (productId.startsWith("LINEA")) return "Línea revolvente";
  return "Crédito";
}

export function creditClientToDepositClient(c: CreditClientProfile): DemoClient {
  return {
    id: c.id,
    creditClientId: c.id,
    name: c.name,
    personType: c.entityType,
    averageBalance: c.amount,
    loanAmountMxn: c.amount,
    balanceMetric: c.entityType === "PM" ? "SPM" : "SPD",
    productTypes: ["VISTA"],
    segment: segmentFromProductId(c.productId),
  };
}

export function buildCreditLinkedDepositClients(creditClients: CreditClientProfile[]): DemoClient[] {
  const linkedIds = new Set(Object.values(FEATURED_CREDIT_LINKS));
  return creditClients
    .filter((c) => !linkedIds.has(c.id))
    .map(creditClientToDepositClient);
}

export function buildFullLimClientList(creditClients: CreditClientProfile[]): DemoClient[] {
  return [...FEATURED_CORPORATE_CLIENTS, ...buildCreditLinkedDepositClients(creditClients)];
}

export function syncLimBalancesFromCredit(
  state: LimDemoState,
  creditClients: CreditClientProfile[],
): LimDemoState {
  const fullList = buildFullLimClientList(creditClients);
  const byId = new Map(state.clients.map((c) => [c.id, c]));
  const mergedClients = [
    ...state.clients,
    ...fullList.filter((c) => !byId.has(c.id)),
  ];

  const clients = mergedClients.map((dep) => {
    const linkId = dep.creditClientId ?? dep.id;
    const credit = creditClients.find((c) => c.id === linkId);
    if (!credit) return dep;

    if (dep.featuredCase) {
      return {
        ...dep,
        creditClientId: credit.id,
        loanAmountMxn: credit.amount,
        name: credit.name,
        personType: credit.entityType,
        segment: segmentFromProductId(credit.productId),
      };
    }

    return {
      ...dep,
      creditClientId: credit.id,
      name: credit.name,
      personType: credit.entityType,
      averageBalance: credit.amount,
      loanAmountMxn: credit.amount,
      segment: segmentFromProductId(credit.productId),
    };
  });

  return recalculateAllClientRates({ ...state, clients });
}

export function getCreditClientForDeposit(
  depositClient: DemoClient,
  creditClients: CreditClientProfile[],
): CreditClientProfile | undefined {
  const linkId = depositClient.creditClientId ?? depositClient.id;
  return creditClients.find((c) => c.id === linkId);
}
