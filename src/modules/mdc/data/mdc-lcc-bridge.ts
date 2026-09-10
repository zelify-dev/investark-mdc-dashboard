import { applicationsListMock, type Application } from "@/modules/mdc/data/mdc-credit-mock";
import { MDC_PRODUCTS, type MdcProduct } from "@/modules/mdc/data/mdc-products-mock";

const MDC_APPS_STORAGE_KEY = "mdc:applications";
const MDC_PRODUCTS_STORAGE_KEY = "mdc:products";

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function normalizeProductName(name: string) {
  if (name === "BNPL") return "Credito personal";
  if (name === "Prestamo personal") return "Credito automotriz";
  if (name.toLowerCase().includes("plazo fijo")) return "Credito personal";
  return name;
}

function normalizeRequestedAmount(product: string, requestedAmount: number) {
  if (product === "Credito personal") {
    if (requestedAmount < 25_000) return 25_000 + Math.round(requestedAmount * 60);
    return Math.min(Math.max(requestedAmount, 25_000), 800_000);
  }
  if (product === "Credito automotriz") {
    if (requestedAmount < 100_000) return 100_000 + Math.round(requestedAmount * 14);
    return Math.min(Math.max(requestedAmount, 100_000), 2_500_000);
  }
  return requestedAmount;
}

function normalizeApps(apps: Application[]) {
  return apps.map((app) => {
    const product = normalizeProductName(app.product);
    return {
      ...app,
      product,
      requestedAmount: normalizeRequestedAmount(product, app.requestedAmount),
    };
  });
}

function normalizeProducts(products: MdcProduct[]) {
  return products
    .filter((product) => !product.name.toLowerCase().includes("plazo fijo"))
    .map((product) => {
      const name = normalizeProductName(product.name);
      if (name === "Credito automotriz") {
        return {
          ...product,
          name,
          metrics: {
            activeClients: product.metrics.activeClients < 8 ? 10 : product.metrics.activeClients,
            totalPortfolio: product.metrics.totalPortfolio < 1_000_000 ? 5_460_000 : product.metrics.totalPortfolio,
          },
        };
      }
      if (name === "Credito personal") {
        return {
          ...product,
          name,
          metrics: {
            activeClients: product.metrics.activeClients < 6 ? 8 : product.metrics.activeClients,
            totalPortfolio: product.metrics.totalPortfolio < 500_000 ? 1_880_000 : product.metrics.totalPortfolio,
          },
        };
      }
      return { ...product, name };
    });
}

export type MdcLccSnapshot = {
  portfolioBalanceMxn: number;
  monthlyInflowBaseMxn: number;
  monthlyOutflowBaseMxn: number;
  liquidityReserveBaseMxn: number;
  expectedInflows30dMxn: number;
  expectedOutflows30dMxn: number;
  activeClients: number;
  fundedApplications: number;
  productNames: string[];
};

export function readMdcLccSnapshot(): MdcLccSnapshot {
  const products = normalizeProducts(readStored<MdcProduct[]>(MDC_PRODUCTS_STORAGE_KEY, MDC_PRODUCTS));
  const apps = normalizeApps(readStored<Application[]>(MDC_APPS_STORAGE_KEY, applicationsListMock));

  const portfolioBalanceMxn = products.reduce((sum, product) => sum + product.metrics.totalPortfolio, 0);
  const activeClients = products.reduce((sum, product) => sum + product.metrics.activeClients, 0);
  const productNames = Array.from(new Set(products.map((product) => product.name)));

  const fundedStatuses = new Set<Application["status"]>(["approved", "overridden"]);
  const pipelineStatuses = new Set<Application["status"]>(["pending", "manualReview"]);

  const fundedApplications = apps.filter((app) => fundedStatuses.has(app.status)).length;
  const fundedAmount = apps
    .filter((app) => fundedStatuses.has(app.status))
    .reduce((sum, app) => sum + app.requestedAmount, 0);
  const pipelineAmount = apps
    .filter((app) => pipelineStatuses.has(app.status))
    .reduce((sum, app) => sum + app.requestedAmount, 0);
  const declinedAmount = apps
    .filter((app) => app.status === "declined")
    .reduce((sum, app) => sum + app.requestedAmount, 0);

  // Modelo de acople: usa montos del pipeline MDC para anclar flujo base de LCC.
  const monthlyInflowBaseMxn = Math.max(
    Math.round(portfolioBalanceMxn * 0.022 + fundedAmount * 0.25 + pipelineAmount * 0.08),
    100_000,
  );

  const monthlyOutflowBaseMxn = Math.max(
    Math.round(portfolioBalanceMxn * 0.018 + fundedAmount * 0.18 + declinedAmount * 0.07),
    80_000,
  );

  const liquidityReserveBaseMxn = Math.max(Math.round(portfolioBalanceMxn * 0.14), 120_000);
  const expectedInflows30dMxn = Math.round(monthlyInflowBaseMxn * 1.12);
  const expectedOutflows30dMxn = Math.round(monthlyOutflowBaseMxn * 1.08);

  return {
    portfolioBalanceMxn,
    monthlyInflowBaseMxn,
    monthlyOutflowBaseMxn,
    liquidityReserveBaseMxn,
    expectedInflows30dMxn,
    expectedOutflows30dMxn,
    activeClients,
    fundedApplications,
    productNames,
  };
}
