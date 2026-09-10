import type { Messages } from "./en";
import { en } from "./en";
import { es } from "./es";

import type { Locale } from "../locales";

export type { Messages };

export function getMessages(locale: Locale): Messages {
  return locale === "es" ? es : en;
}

export { en, es };
