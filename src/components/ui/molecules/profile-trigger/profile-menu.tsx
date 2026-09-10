"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { AppAvatar } from "@/components/ui/atoms/avatar/app-avatar";
import { clearAuthSession, logout } from "@/lib/auth-api";
import { clearApiCache } from "@/lib/api-cache";
import { useI18n } from "@/providers/i18n-provider";

import "@/components/ui/organisms/topbar/zelify-top-navbar.css";
import "./profile-menu.css";

type ProfileMenuProps = {
  name: string;
  initials: string;
  /** Ruta de ajustes del usuario (p. ej. Mi cuenta). */
  settingsHref?: string;
  photoUrl?: string | null;
};

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3.5 5.25 7 8.75l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfileMenu({
  name,
  initials,
  settingsHref = "/settings/account",
  photoUrl,
}: ProfileMenuProps) {
  const { t } = useI18n();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  /** El panel va en portal a `body`; debe contarse como “dentro” para no cerrar antes del click en Cerrar sesión. */
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0, minWidth: 220 });
  const [signingOut, setSigningOut] = useState(false);

  const updatePosition = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
    const minW = 220;
    setPos({
      top: r.bottom + 8,
      right: Math.max(12, vw - r.right),
      minWidth: Math.min(minW, vw - 24),
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || dropdownRef.current?.contains(t)) return;
      setOpen(false);
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

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
    } catch {
      clearAuthSession();
      clearApiCache();
    } finally {
      /** Recarga completa: evita estado raro del router y coincide con sesión ya borrada en sessionStorage. */
      window.location.assign("/login");
    }
  };

  const panel =
    mounted && open ? (
      <div
        ref={dropdownRef}
        id={menuId}
        className="zelify-dropdown-menu zelify-profile-menu__dropdown"
        role="menu"
        style={{
          position: "fixed",
          top: pos.top,
          right: pos.right,
          minWidth: pos.minWidth,
          zIndex: 1200,
        }}
      >
        <Link
          href={settingsHref}
          role="menuitem"
          className="zelify-dropdown-menu__item"
          onClick={() => setOpen(false)}
        >
          {t("topbar.profileMenu.userSettings")}
        </Link>
        <div className="zelify-profile-menu__separator" role="separator" />
        <button
          type="button"
          role="menuitem"
          className="zelify-dropdown-menu__item zelify-profile-menu__sign-out flex items-center justify-center gap-2"
          disabled={signingOut}
          onClick={handleSignOut}
        >
          {signingOut ? (
            <>
              <span
                className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-solid border-current border-t-transparent opacity-90"
                aria-hidden
              />
              <span>{t("topbar.profileMenu.signingOut")}</span>
            </>
          ) : (
            t("topbar.profileMenu.signOut")
          )}
        </button>
      </div>
    ) : null;

  return (
    <div className="zelify-profile-menu" ref={rootRef}>
      <button
        type="button"
        className="zelify-profile-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={t("topbar.profileMenu.ariaLabel")}
        onClick={() => {
          setOpen((v) => !v);
        }}
      >
        <AppAvatar initials={initials} src={photoUrl} className="zelify-profile-trigger__avatar" />
        <span className="zelify-profile-trigger__meta">
          <strong>{name}</strong>
        </span>
        <ChevronDownIcon />
      </button>
      {panel && typeof document !== "undefined" ? createPortal(panel, document.body) : null}
      {signingOut && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[1300] flex flex-col items-center justify-center gap-3 bg-black/35 backdrop-blur-[2px]"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <div
                className="h-11 w-11 animate-spin rounded-full border-[3px] border-solid border-white border-t-transparent"
                aria-hidden
              />
              <span className="text-sm font-medium text-white">{t("topbar.profileMenu.signingOut")}</span>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
