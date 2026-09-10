"use client";

import type { PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { defaultLocale, isLocale, localeCookieName, type Locale } from "@/i18n/locales";
import { getMessages, type Messages } from "@/i18n/messages";
import { createTranslator, type Translate } from "@/i18n/translate";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
};

const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = PropsWithChildren<{
  initialLocale: Locale;
  initialMessages: Messages;
}>;

export function I18nProvider({ children, initialLocale, initialMessages }: I18nProviderProps) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<Messages>(initialMessages);

  useEffect(() => {
    setLocaleState(initialLocale);
    setMessages(initialMessages);
  }, [initialLocale, initialMessages]);

  const setLocale = useCallback(
    (next: Locale) => {
      const normalized = isLocale(next) ? next : defaultLocale;
      document.cookie = `${localeCookieName}=${normalized};path=/;max-age=31536000;SameSite=Lax`;
      setLocaleState(normalized);
      setMessages(getMessages(normalized));
      router.refresh();
    },
    [router]
  );

  const t = useMemo(() => createTranslator(messages), [messages]);

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
