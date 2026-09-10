const DEMO_PREFIX = "zelify_demo_";

const DEMO_RESET_KEYS = [
  "mdc:applications",
  "mdc:rules",
  "mdc:natural:applications",
  "mdc:moral:applications",
  "mdc:natural:rules:v3",
  "mdc:moral:rules:v3",
  "mdc:natural:products",
  "mdc:moral:products",
  "mdc:traceability:v3:natural",
  "mdc:traceability:v3:moral",
  "zelify:kyb:active-company",
  "zelify:kyb:company-registry",
] as const;

export const DEMO_STORAGE_KEYS = {
  lim: `${DEMO_PREFIX}lim_state`,
  credit: `${DEMO_PREFIX}credit_state`,
  seeded: `${DEMO_PREFIX}lim_seeded`,
  lccInboundCustomers: `${DEMO_PREFIX}lcc_inbound_customers`,
} as const;

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function readDemoJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeDemoJson<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeDemoKey(key: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(key);
}

export function resetLimDemoStorage(): void {
  removeDemoKey(DEMO_STORAGE_KEYS.lim);
  removeDemoKey(DEMO_STORAGE_KEYS.seeded);
}

export function resetScopedDemoExperienceStorage(): void {
  removeDemoKey(DEMO_STORAGE_KEYS.lim);
  removeDemoKey(DEMO_STORAGE_KEYS.credit);
  removeDemoKey(DEMO_STORAGE_KEYS.seeded);
  removeDemoKey(DEMO_STORAGE_KEYS.lccInboundCustomers);

  for (const key of DEMO_RESET_KEYS) {
    removeDemoKey(key);
  }
}
