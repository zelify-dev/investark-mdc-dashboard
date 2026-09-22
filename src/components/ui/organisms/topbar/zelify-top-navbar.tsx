"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LanguageSwitcher } from "@/components/common/language-switcher/language-switcher";
import {
  type ZelifyTopNavItem,
  resolveActiveTopNavId,
  zelifyTopNavItems,
} from "@/config/navigation";
import { getTopNavDropdown, resolveTopNavDropdown } from "@/config/top-nav-dropdowns";
import { NavTabDropdown } from "@/components/ui/molecules/nav-tab-dropdown/nav-tab-dropdown";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppIconButton } from "@/components/ui/atoms/icon-button/app-icon-button";
import { DropdownMenu } from "@/components/ui/molecules/dropdown-menu/dropdown-menu";
import { NavTab } from "@/components/ui/molecules/nav-tab/nav-tab";
import { ProfileMenu } from "@/components/ui/molecules/profile-trigger/profile-menu";
import { TopbarSearchBox } from "@/components/ui/molecules/search-box/topbar-search-box";
import { useBranding } from "@/providers/branding-provider";
import { useI18n } from "@/providers/i18n-provider";
import {
  getOrganization,
  getOrganizationBranding,
  getStoredOrganization,
  getStoredUser,
  pickOrganizationLogoUrl,
} from "@/lib/auth-api";
import { resolveProfilePhotoUrl } from "@/lib/auth-dashboard";
import type { DropdownMenuItem } from "@/components/ui/molecules/dropdown-menu/dropdown-menu";

import "./zelify-top-navbar.css";

const CREATE_MENU_ITEMS = [
  { labelKey: "topbar.createMenu.client", href: "/customers" },
  { labelKey: "topbar.createMenu.organization", href: "/branches" },
  { labelKey: "topbar.createMenu.group", href: "/groups" },
  { labelKey: "topbar.createMenu.account", href: "/deposits" },
  { labelKey: "topbar.createMenu.user", href: "/settings/access" },
  { labelKey: "topbar.createMenu.communication", href: "/settings/templates" },
] as const;

const VIEW_MENU_ITEMS = [
  { labelKey: "topbar.viewMenu.overview", href: "/mdc?tab=overview" },
  { labelKey: "topbar.viewMenu.products", href: "/mdc?tab=products" },
  { labelKey: "topbar.viewMenu.applications", href: "/mdc?tab=applications" },
  { labelKey: "topbar.viewMenu.rules", href: "/mdc?tab=rules" },
  { labelKey: "topbar.viewMenu.traceability", href: "/mdc?tab=traceability" },
  { labelKey: "topbar.viewMenu.payments", href: "/mdc?tab=payments" },
  { labelKey: "topbar.viewMenu.collections", href: "/mdc?tab=collections" },
] as const;

type ZelifyTopNavbarProps = {
  /** Si se omite, se infiere desde la ruta actual. */
  activeNavId?: string;
  userName?: string;
  userInitials?: string;
  items?: ZelifyTopNavItem[];
  variant?: "default" | "mdc";
};

export function ZelifyTopNavbar({
  activeNavId: activeNavIdProp,
  userName = "Juan Carlos",
  userInitials = "JC",
  items = zelifyTopNavItems,
}: ZelifyTopNavbarProps) {
  const { t } = useI18n();
  const pathname = usePathname();
  const activeNavId = activeNavIdProp ?? resolveActiveTopNavId(pathname, items);
  const viewMenuItems: DropdownMenuItem[] = VIEW_MENU_ITEMS.map((item) => ({
    label: t(item.labelKey),
    href: item.href,
  }));
  const createMenuItems: DropdownMenuItem[] = CREATE_MENU_ITEMS.map((item) => ({
    label: t(item.labelKey),
    href: item.href,
  }));

  const [isCondensed, setIsCondensed] = useState(false);
  const [openMenu, setOpenMenu] = useState<null | "view" | "create">(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [drawerSection, setDrawerSection] = useState<null | "view">(null);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  
  const [actualUserName, setActualUserName] = useState(userName);
  const [actualUserInitials, setActualUserInitials] = useState(userInitials);
  const [actualUserPhoto, setActualUserPhoto] = useState<string | null>(null);

  useEffect(() => {
    const syncUser = () => {
      const user = getStoredUser();
      if (user && user.full_name) {
        setActualUserName(user.full_name);
        const initials = user.full_name
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();
        if (initials) setActualUserInitials(initials);
      } else if (user && user.email) {
        setActualUserName(user.email.split("@")[0]);
        setActualUserInitials(user.email[0].toUpperCase());
      }
      setActualUserPhoto(resolveProfilePhotoUrl(user?.photo));
    };
    syncUser();
    window.addEventListener("user-updated", syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener("user-updated", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, [userName, userInitials]);

  const lastScrollY = useRef(0);
  const viewMenuRef = useRef<HTMLDivElement | null>(null);
  const createMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;

      if (currentScrollY <= 12) {
        setIsCondensed(false);
      } else if (scrollingDown && currentScrollY > 64) {
        setIsCondensed(true);
      } else if (!scrollingDown) {
        setIsCondensed(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (viewMenuRef.current?.contains(target) || createMenuRef.current?.contains(target)) {
        return;
      }

      setOpenMenu(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setIsMobileDrawerOpen(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Bloquear scroll del body cuando el drawer móvil está abierto
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileDrawerOpen]);

  return (
    <>
    <header className={`zelify-topbar-wrapper zelify-topbar-wrapper--mdc${isCondensed ? " is-condensed" : ""}`}>
      {/* Nivel Superior: Marca y Acciones */}
      <div className="zelify-topbar-primary">
        <div className="zelify-topbar__brand-wrap">
          <BrandBlock brandAlt={t("topbar.brandAlt")} />
        </div>

        <div className="zelify-topbar__actions">
          <div className="zelify-topbar__menu-anchor zelify-topbar__desktop-only" ref={createMenuRef}>
            <TopbarActionButton
              tone="primary"
              isOpen={openMenu === "create"}
              onClick={() =>
                setOpenMenu((current) => (current === "create" ? null : "create"))
              }
            >
              {t("topbar.create")}
            </TopbarActionButton>
            {openMenu === "create" ? (
              <DropdownMenu
                className="zelify-topbar-dropdown"
                items={createMenuItems}
              />
            ) : null}
          </div>

          <div className="zelify-topbar__menu-anchor zelify-topbar__desktop-only" ref={viewMenuRef}>
            <TopbarActionButton
              tone="secondary"
              isOpen={openMenu === "view"}
              onClick={() =>
                setOpenMenu((current) => (current === "view" ? null : "view"))
              }
            >
              {t("topbar.view")}
            </TopbarActionButton>
            {openMenu === "view" ? (
              <DropdownMenu
                className="zelify-topbar-dropdown"
                items={viewMenuItems}
              />
            ) : null}
          </div>

          <TopbarSearchBox placeholder={t("topbar.searchPlaceholder")} />
          <AppIconButton
            ariaLabel={t("topbar.notifications")}
            className="zelify-topbar-icon-button"
          >
            <BellIcon />
          </AppIconButton>
          <ProfileMenu
            name={actualUserName}
            initials={actualUserInitials}
            photoUrl={actualUserPhoto}
            settingsHref="/settings?section=profile"
          />
          <LanguageSwitcher compact />

          {/* Botón hamburguesa: visible solo en móvil */}
          <button
            type="button"
            aria-label="Abrir menú"
            aria-expanded={isMobileDrawerOpen}
            className="zelify-topbar-hamburger"
            onClick={() => setIsMobileDrawerOpen(true)}
          >
            <HamburgerIcon />
          </button>
        </div>
        {/* Fin Nivel Superior Actions */}
      </div>
      {/* Fin Nivel Superior Primary */}

      {/* Nivel Inferior: Navegación de rutas */}
      <div className="zelify-topbar-secondary">
        <nav className="zelify-topbar__nav" aria-label={t("topbar.navPrimary")}>
          {items.map((item) => {
            const rawDropdown = getTopNavDropdown(item.id);
            const dropdown = rawDropdown ? resolveTopNavDropdown(rawDropdown, t) : null;
            if (dropdown?.length) {
              return (
                <NavTabDropdown
                  key={item.id}
                  instanceId={item.id}
                  label={t(item.labelKey)}
                  href={item.href}
                  isActive={item.id === activeNavId}
                  entries={dropdown}
                />
              );
            }
            return (
              <NavTab
                key={item.id}
                label={t(item.labelKey)}
                href={item.href}
                isActive={item.id === activeNavId}
                trailingIcon={item.hasDropdown ? <ChevronDownIcon /> : null}
              />
            );
          })}
        </nav>
        <Link
          href="/mdc/manual"
          className={`zelify-topbar__manual${pathname.startsWith("/mdc/manual") ? " is-active" : ""}`}
        >
          Manual de usuario
        </Link>
      </div>

      {/* Sidebar móvil deslizable */}
      <MobileSidebar
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        viewLabel={t("topbar.view")}
        viewMenuItems={viewMenuItems}
        openSection={drawerSection}
        onToggleSection={(section) =>
          setDrawerSection((current) => (current === section ? null : section))
        }
        sidebarRef={sidebarRef}
      />
    </header>
    <div className="zelify-topbar-spacer" aria-hidden="true" />
    </>
  );
}

/* ─── Mobile Sidebar Drawer ───────────────────────────────── */
type MobileSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  viewLabel: string;
  viewMenuItems: DropdownMenuItem[];
  openSection: null | "view";
  onToggleSection: (section: "view") => void;
  sidebarRef: React.RefObject<HTMLDivElement | null>;
};

function MobileSidebar({
  isOpen,
  onClose,
  viewLabel,
  viewMenuItems,
  openSection,
  onToggleSection,
  sidebarRef,
}: MobileSidebarProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="zelify-mobile-drawer-backdrop"
          aria-hidden="true"
          onClick={onClose}
        />
      )}

      {/* Panel deslizable */}
      <div
        ref={sidebarRef}
        className={`zelify-mobile-drawer${isOpen ? " is-open" : ""}`}
        aria-hidden={!isOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de acciones"
      >
        {/* Header del drawer */}
        <div className="zelify-mobile-drawer__header">
          <span className="zelify-mobile-drawer__title">Acciones</span>
          <button
            type="button"
            aria-label="Cerrar menú"
            className="zelify-mobile-drawer__close"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="zelify-mobile-drawer__section">
          <a href="/mdc/manual" className="zelify-mobile-drawer__menu-item" onClick={onClose}>
            Manual de usuario
          </a>
        </div>
        {/* Accesos MDC */}
        <div className="zelify-mobile-drawer__section">
          <button
            type="button"
            className={`zelify-mobile-drawer__section-trigger${openSection === "view" ? " is-open" : ""}`}
            onClick={() => onToggleSection("view")}
            aria-expanded={openSection === "view"}
          >
            <span>{viewLabel}</span>
            <DrawerChevron isOpen={openSection === "view"} />
          </button>
          {openSection === "view" && (
            <ul className="zelify-mobile-drawer__menu">
              {viewMenuItems.map((item, i) => {
                const entry = typeof item === "string" ? { label: item } : item;
                return (
                  <li key={i}>
                    {entry.href ? (
                      <a href={entry.href} className="zelify-mobile-drawer__menu-item" onClick={onClose}>
                        {entry.label}
                      </a>
                    ) : (
                      <button type="button" className="zelify-mobile-drawer__menu-item" onClick={() => { entry.onClick?.(); onClose(); }}>
                        {entry.label}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function DrawerChevron({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms ease" }}
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type BrandBlockProps = {
  brandAlt: string;
};

function BrandBlock({ brandAlt }: BrandBlockProps) {
  const { branding } = useBranding();
  const productLogoUrl = "/mdc-navbar-logo-dark.svg";
  const productLogoAlt =
    branding.displayName && !/zelify/i.test(branding.displayName)
      ? branding.displayName
      : brandAlt || "Aethereun";

  const [clientLogoUrl, setClientLogoUrl] = useState<string | null>(null);
  const [clientLogoAlt, setClientLogoAlt] = useState("Cliente");

  useEffect(() => {
    const org = getStoredOrganization();
    if (org?.name) setClientLogoAlt(org.name);

    const fromSession = pickOrganizationLogoUrl(org) || pickOrganizationLogoUrl(branding);
    setClientLogoUrl(fromSession);

    if (!org?.id) return;

    let cancelled = false;
    void Promise.allSettled([getOrganizationBranding(org.id), getOrganization(org.id)]).then(
      ([brandingResult, orgResult]) => {
        if (cancelled) return;
        const brandingData = brandingResult.status === "fulfilled" ? brandingResult.value : null;
        const details = orgResult.status === "fulfilled" ? orgResult.value : null;
        const next =
          pickOrganizationLogoUrl(brandingData) ||
          pickOrganizationLogoUrl(details) ||
          fromSession;
        setClientLogoUrl(next);
        if (details?.name) setClientLogoAlt(details.name);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [branding.logoUrl, branding.displayName]);

  return (
    <div className="zelify-topbar__brand">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={productLogoUrl}
        alt={productLogoAlt}
        className="zelify-topbar__brand-logo"
      />

      {clientLogoUrl ? (
        <>
          <span className="zelify-topbar__brand-divider" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={clientLogoUrl}
            alt={clientLogoAlt}
            className="zelify-topbar__brand-logo zelify-topbar__brand-logo--partner"
          />
        </>
      ) : null}
    </div>
  );
}

type TopbarActionButtonProps = {
  children: string;
  tone: "primary" | "secondary";
  isOpen?: boolean;
  onClick?: () => void;
};

function TopbarActionButton({
  children,
  tone,
  isOpen = false,
  onClick,
}: TopbarActionButtonProps) {
  return (
    <AppButton
      aria-haspopup="menu"
      aria-expanded={isOpen}
      onClick={onClick}
      className={`zelify-topbar-button ${tone === "primary" ? "is-primary" : "is-secondary"} ${isOpen ? "is-open" : ""}`}
    >
      {children}
      <ChevronDownIcon />
    </AppButton>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9 16.25a1.87 1.87 0 0 0 1.83-1.5H7.17A1.87 1.87 0 0 0 9 16.25ZM14.25 13.25H3.75v-.75l1.5-1.5V7.75a3.75 3.75 0 1 1 7.5 0V11l1.5 1.5v.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

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
