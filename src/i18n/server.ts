import { cookies } from "next/headers";

import { defaultLocale, isLocale, localeCookieName, type Locale } from "./locales";
import { getMessages } from "./messages";
import { createTranslator } from "./translate";

export async function getLocaleFromCookie(): Promise<Locale> {
  const store = await cookies();
  const raw = store.get(localeCookieName)?.value;
  return isLocale(raw) ? raw : defaultLocale;
}

export async function getServerI18n() {
  const locale = await getLocaleFromCookie();
  const messages = getMessages(locale);
  return { locale, messages, t: createTranslator(messages) };
}
