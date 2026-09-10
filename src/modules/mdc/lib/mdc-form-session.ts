const RULE_KEY = "mdc:rule-form:v1";
const APP_KEY = "mdc:application-detail:v1";

export function writeSessionJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(key, JSON.stringify(value));
}

export function readSessionJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeRuleFormSession(value: unknown) {
  writeSessionJson(RULE_KEY, value);
}

export function readRuleFormSession<T>() {
  return readSessionJson<T>(RULE_KEY);
}

export function writeApplicationDetailSession(value: unknown) {
  writeSessionJson(APP_KEY, value);
}

export function readApplicationDetailSession<T>() {
  return readSessionJson<T>(APP_KEY);
}

const PRODUCT_KEY = "mdc:product-edit:v1";

export function writeProductEditSession(value: unknown) {
  writeSessionJson(PRODUCT_KEY, value);
}

export function readProductEditSession<T>() {
  return readSessionJson<T>(PRODUCT_KEY);
}
