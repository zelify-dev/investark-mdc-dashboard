"use client";

/**
 * Rutas protegidas (sessionStorage + JWT), alineado con dashboard_prod.
 * Sin sesión → /login. Con sesión en /login o /register → redirección al dashboard.
 */

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  AuthError,
  clearAuthSession,
  clearSessionExpiredFlash,
  getAccessToken,
  getMe,
  getStoredRoles,
  markSessionExpiredFlash,
  peekSessionExpiredFlash,
} from "@/lib/auth-api";
import { getDefaultDashboardPath } from "@/lib/dashboard-routing";

import "./auth-guard.css";

const DEMO_BYPASS_STORAGE_KEY = "zelify_demo_bypass";

function isPublicAuthPath(path: string | null | undefined): boolean {
  if (!path) return false;
  return path === "/login" || path === "/register";
}

function isOpenPublicPath(path: string | null | undefined): boolean {
  if (!path) return false;
  return path === "/aml-analisis" || path.startsWith("/aml-analisis/");
}

function isPublicPath(path: string | null | undefined): boolean {
  return isPublicAuthPath(path) || isOpenPublicPath(path);
}

function isDemoBypassSession(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(DEMO_BYPASS_STORAGE_KEY) === "true";
}

function Spinner() {
  return (
    <div className="zelify-auth-guard-spinner" role="status" aria-live="polite">
      <div className="zelify-auth-guard-spinner__ring" aria-hidden />
    </div>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isMounted, setIsMounted] = useState(() => {
    if (typeof window === "undefined") return false;
    return isPublicPath(window.location.pathname);
  });

  const isValidatingRef = useRef(false);
  const lastValidationRef = useRef(0);

  const getIsPublic = useCallback(() => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname;
      if (isPublicPath(p)) return true;
    }
    return isPublicPath(pathname);
  }, [pathname]);

  const isPublic = getIsPublic();

  const validateActiveSession = useCallback(
    async (force = false) => {
      if (typeof window === "undefined" || getIsPublic()) return;
      if (isValidatingRef.current) return;
      if (isDemoBypassSession()) {
        setIsAuthenticated(true);
        setIsMounted(true);
        return;
      }

      const auth = sessionStorage.getItem("isAuthenticated");
      const token = getAccessToken();
      if (auth !== "true" || !token) {
        setIsAuthenticated(false);
        setIsMounted(true);
        const p = pathname || window.location.pathname;
        if (!isPublicPath(p)) {
          if (peekSessionExpiredFlash()) {
            clearSessionExpiredFlash();
            router.replace("/login?reason=session_expired");
          } else {
            router.replace("/login");
          }
        }
        return;
      }

      const now = Date.now();
      if (!force && now - lastValidationRef.current < 30_000) {
        return;
      }

      isValidatingRef.current = true;
      try {
        await getMe();
        lastValidationRef.current = now;
        setIsAuthenticated(true);
        setIsMounted(true);
      } catch (err) {
        if (err instanceof AuthError && (err.statusCode === 401 || err.statusCode === 403)) {
          markSessionExpiredFlash();
          clearAuthSession();
          setIsAuthenticated(false);
          setIsMounted(true);
          router.replace("/login?reason=session_expired");
          return;
        }
        setIsAuthenticated(true);
        setIsMounted(true);
      } finally {
        isValidatingRef.current = false;
      }
    },
    [getIsPublic, pathname, router]
  );

  useLayoutEffect(() => {
    if (getIsPublic()) {
      setIsMounted(true);
    }
  }, [getIsPublic]);

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === "undefined") return;

      const auth = sessionStorage.getItem("isAuthenticated");
      const token = getAccessToken();
      const demoBypass = isDemoBypassSession();

      if ((auth === "true" && token) || demoBypass) {
        setIsAuthenticated(true);
        setIsMounted(true);

        const path = pathname || window.location.pathname;
        if (isPublicAuthPath(path)) {
          router.replace(getDefaultDashboardPath(getStoredRoles()));
        } else if (!demoBypass) {
          void validateActiveSession(true);
        }
      } else {
        setIsAuthenticated(false);
        setIsMounted(true);

        const path = pathname || window.location.pathname;
        if (!isPublicPath(path)) {
          if (peekSessionExpiredFlash()) {
            clearSessionExpiredFlash();
            router.replace("/login?reason=session_expired");
          } else {
            router.replace("/login");
          }
        }
      }
    };

    checkAuth();

    const handleAuthChange = () => checkAuth();

    const handleWindowFocus = () => {
      const path = pathname || (typeof window !== "undefined" ? window.location.pathname : "");
      if (path && !isPublicPath(path)) {
        void validateActiveSession();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      const path = pathname || (typeof window !== "undefined" ? window.location.pathname : "");
      if (path && !isPublicPath(path)) {
        void validateActiveSession();
      }
    };

    window.addEventListener("authchange", handleAuthChange);
    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("authchange", handleAuthChange);
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pathname, router, validateActiveSession]);

  if (isPublic) {
    return <>{children}</>;
  }

  if (!isMounted) {
    return <Spinner />;
  }

  if (isAuthenticated === false) {
    return <Spinner />;
  }

  if (isAuthenticated === null) {
    return <Spinner />;
  }

  return <>{children}</>;
}
