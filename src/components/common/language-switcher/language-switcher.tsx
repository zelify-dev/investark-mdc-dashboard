"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { locales, type Locale } from "@/i18n/locales";
import { useI18n } from "@/providers/i18n-provider";

import "./language-switcher.css";

type LanguageSwitcherProps = {
  compact?: boolean;
};

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const currentLabel = compact
    ? locale.toUpperCase()
    : locale === "en"
      ? t("common.english")
      : t("common.spanish");

  return (
    <div className={`zelify-lang-dropdown${compact ? " zelify-lang-dropdown--compact" : ""}`} ref={wrapRef}>
      <button
        type="button"
        className={`zelify-lang-dropdown__trigger ${open ? "is-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
      >
        <span className="zelify-lang-dropdown__trigger-text">{currentLabel}</span>
        <ChevronDown className="zelify-lang-dropdown__chevron" size={16} strokeWidth={2} aria-hidden />
      </button>
      {open ? (
        <ul id={listId} className="zelify-lang-dropdown__menu" role="listbox" aria-label={t("common.language")}>
          {locales.map((loc) => {
            const label = loc === "en" ? t("common.english") : t("common.spanish");
            const selected = loc === locale;
            return (
              <li key={loc} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`zelify-lang-dropdown__option ${selected ? "is-active" : ""}`}
                  onClick={() => {
                    setLocale(loc);
                    setOpen(false);
                  }}
                >
                  {label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
