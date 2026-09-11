"use client";

import type { PropsWithChildren } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getOrganizationBranding, getStoredOrganization } from "@/lib/auth-api";

export type BrandingState = {
  displayName: string;
  tagline: string;
  primaryHex: string;
  accentHex: string;
  logoUrl: string;
  logoLightUrl?: string | null;
  logoDarkUrl?: string | null;
  sourceOrgId?: string | null;
  loginMessage: string;
};

type BrandingContextValue = {
  branding: BrandingState;
  setBranding: (next: BrandingState) => void;
  resetBranding: () => void;
};

const STORAGE_KEY = "zelify-branding-settings";

export const DEFAULT_BRANDING: BrandingState = {
  displayName: "Aethereun",
  tagline: "Core banking para equipos modernos",
  primaryHex: "#271a59",
  accentHex: "#271a59",
  logoUrl: "/mdc-navbar-logo.svg",
  logoLightUrl: null,
  logoDarkUrl: null,
  sourceOrgId: null,
  loginMessage: "Mensaje opcional en la pantalla de acceso.",
};

const PRODUCT_LOGO_URLS = new Set([
  "/mdc-navbar-logo.svg",
  "/mdc-navbar-logo-dark.svg",
  DEFAULT_BRANDING.logoUrl,
]);

export function isProductLogoUrl(url?: string | null): boolean {
  return !url || PRODUCT_LOGO_URLS.has(url);
}

/** Logo de la organización para el navbar oscuro. Prefiere la variante clara. */
export function resolveOrgNavbarLogoUrl(branding: BrandingState): string | null {
  const storedOrg = getStoredOrganization();
  if (!storedOrg?.id || branding.sourceOrgId !== storedOrg.id) return null;
  const candidate = branding.logoLightUrl || branding.logoUrl;
  return isProductLogoUrl(candidate) ? null : candidate;
}

const LEGACY_GREEN_ACCENTS = new Set([
  "#c4f542",
  "#a9fb5d",
  "#98e84a",
  "#86d441",
  "#4ade80",
  "#22c55e",
  "#16a34a",
  "#84cc16",
  "#a3e635",
  "#65a30d",
  "#15803d",
  "#bef264",
]);
const LEGACY_NAVY_PRIMARY = "#1a2740";
const ZELIFY_LOGO_RE = /zelifyLogo/i;

const BrandingContext = createContext<BrandingContextValue | null>(null);

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const safe = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized.padEnd(6, "0").slice(0, 6);
  const value = Number.parseInt(safe, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function shiftHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const next = [r, g, b].map((channel) => clamp(channel + amount, 0, 255));
  return `#${next.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function getReadableText(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#102033" : "#f8fafc";
}

function isLimeOrZelifyGreen(hex: string): boolean {
  const normalized = hex.toLowerCase();
  if (LEGACY_GREEN_ACCENTS.has(normalized)) return true;
  const [r, g, b] = hexToRgb(hex);
  return g > 140 && g > r + 20 && g > b + 20;
}

function sanitizeBranding(input: BrandingState): BrandingState {
  const primary = input.primaryHex.toLowerCase();
  const dropGreen = isLimeOrZelifyGreen(input.accentHex) || primary === LEGACY_NAVY_PRIMARY;
  const dropZelifyLogo = ZELIFY_LOGO_RE.test(input.logoUrl);

  return {
    ...input,
    displayName: /zelify/i.test(input.displayName) ? DEFAULT_BRANDING.displayName : input.displayName,
    primaryHex: dropGreen || primary === LEGACY_NAVY_PRIMARY ? DEFAULT_BRANDING.primaryHex : input.primaryHex,
    accentHex: dropGreen ? DEFAULT_BRANDING.accentHex : input.accentHex,
    logoUrl: dropZelifyLogo ? DEFAULT_BRANDING.logoUrl : input.logoUrl,
    logoLightUrl: input.logoLightUrl ?? null,
    logoDarkUrl: input.logoDarkUrl ?? null,
    sourceOrgId: input.sourceOrgId ?? null,
  };
}

function applyBrandingToDocument(branding: BrandingState) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const [accentR, accentG, accentB] = hexToRgb(branding.accentHex);
  const [primaryR, primaryG, primaryB] = hexToRgb(branding.primaryHex);

  root.style.setProperty("--zelify-brand-primary", branding.primaryHex);
  root.style.setProperty("--zelify-brand-primary-rgb", `${primaryR}, ${primaryG}, ${primaryB}`);
  const accentLuminance = (0.299 * accentR + 0.587 * accentG + 0.114 * accentB) / 255;
  const hoverShift = accentLuminance > 0.55 ? -18 : 22;
  const activeShift = accentLuminance > 0.55 ? -34 : 10;

  root.style.setProperty("--zelify-brand-green", branding.accentHex);
  root.style.setProperty("--zelify-brand-green-hover", shiftHex(branding.accentHex, hoverShift));
  root.style.setProperty("--zelify-brand-green-active", shiftHex(branding.accentHex, activeShift));
  root.style.setProperty("--zelify-brand-on-green", getReadableText(branding.accentHex));
  root.style.setProperty("--zelify-brand-green-rgb", `${accentR}, ${accentG}, ${accentB}`);
}

function getStoredBranding(): BrandingState {
  if (typeof window === "undefined") return DEFAULT_BRANDING;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_BRANDING;
  try {
    const parsed = JSON.parse(raw) as Partial<BrandingState>;
    return sanitizeBranding({ ...DEFAULT_BRANDING, ...parsed });
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_BRANDING;
  }
}

export function BrandingProvider({ children }: PropsWithChildren) {
  const [branding, setBrandingState] = useState<BrandingState>(getStoredBranding);

  useEffect(() => {
    applyBrandingToDocument(branding);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(branding));
    }
  }, [branding]);

  useEffect(() => {
    let cancelled = false;

    const syncOrganizationBranding = async () => {
      const org = getStoredOrganization();
      if (!org?.id) return;
      try {
        const data = await getOrganizationBranding(org.id);
        if (cancelled) return;
        setBrandingState((current) =>
          sanitizeBranding({
            ...current,
            displayName: org.name || current.displayName,
            logoUrl: data.url_log || DEFAULT_BRANDING.logoUrl,
            logoLightUrl: data.url_log_light ?? null,
            logoDarkUrl: data.url_log_dark ?? null,
            sourceOrgId: org.id,
            primaryHex: data.color_a || current.primaryHex,
            accentHex: data.color_b || current.accentHex,
          }),
        );
      } catch {
        // Si el branding aún no existe o falla la carga, se mantiene el estado local.
      }
    };

    void syncOrganizationBranding();
    window.addEventListener("authchange", syncOrganizationBranding);
    window.addEventListener("storage", syncOrganizationBranding);
    return () => {
      cancelled = true;
      window.removeEventListener("authchange", syncOrganizationBranding);
      window.removeEventListener("storage", syncOrganizationBranding);
    };
  }, []);

  const value = useMemo<BrandingContextValue>(
    () => ({
      branding,
      setBranding: (next) => {
        const sanitized = sanitizeBranding(next);
        setBrandingState(sanitized);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
        }
      },
      resetBranding: () => {
        setBrandingState(DEFAULT_BRANDING);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_BRANDING));
        }
      },
    }),
    [branding]
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}

export function useBranding(): BrandingContextValue {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error("useBranding must be used within BrandingProvider");
  }
  return context;
}