"use client";

import { EyeClosedIcon, EyeOpenIcon } from "@/assets/login-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import InputGroup from "@/components/form-elements/input-group";
import { login, verifyDashboardOtp, persistAuthSession, AuthError, syncMe, type AuthSuccessResponse } from "@/lib/auth-api";
import { getLoginAuthErrorDisplay } from "@/lib/auth-error-messages";
import { getDefaultDashboardPath } from "@/lib/dashboard-routing";
import { resetScopedDemoExperienceStorage } from "@/lib/demo-storage";
import { seedScotiaDemoStorage } from "@/modules/lim/hooks/use-lim-demo-store";
import { seedScotiaCreditStorage } from "@/modules/cortex/hooks/use-credit-demo-store";
import { resetDemoRulesState } from "@/modules/mdc/services/mdc-rules.service";
import { DEFAULT_BRANDING, useBranding } from "@/providers/branding-provider";
import "./login-page.css";

const DEMO_BYPASS_EMAIL = "demo@zwippe.com";
const DEMO_BYPASS_PASSWORD = "image.png";
const DEMO_BYPASS_STORAGE_KEY = "zelify_demo_bypass";
const CLIENT_LOGO_SRC = "/LOGO%20TULANA.svg";
const PRODUCT_LOGO_DARK = "/mdc-navbar-logo-dark.svg";

function AnimatedHalftoneBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const resizeObserverRef = useRef<ResizeObserver | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    const resize = () => {
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(resize);
      observer.observe(parent);
      resizeObserverRef.current = observer;
    }

    const start = performance.now();
    const spacing = 26;
    const waveFrequency = 1.35;
    const waveSpeed = 0.35;
    const [r, g, b] = [232, 224, 255];

    const render = (time: number) => {
      const elapsed = (time - start) / 1000;
      const logicalWidth = canvas.width / dpr;
      const logicalHeight = canvas.height / dpr;
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      const centerX = logicalWidth / 2;
      const centerY = logicalHeight / 2;
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

      for (let y = -spacing; y <= logicalHeight + spacing; y += spacing) {
        for (let x = -spacing; x <= logicalWidth + spacing; x += spacing) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const normalizedDistance = distance / maxDistance;
          const wavePhase = (normalizedDistance * waveFrequency - elapsed * waveSpeed) * Math.PI * 2;
          const pulse = (Math.cos(wavePhase) + 1) / 2;
          const edgeFade = Math.pow(1 - normalizedDistance, 1.4);
          const alpha = (0.08 + pulse * 0.5) * edgeFade;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.4 + pulse * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="zelify-login__halftone-canvas" />;
}

// ============================================================================
// TRANSLATIONS
// ============================================================================


const TRANSLATIONS = {
  en: {
    welcome: "Welcome back",
    subWelcome: "Sign in to your account to access the dashboard.",



    email: "Email",
    password: "Password",
    signIn: "Sign In",
    signingIn: "Signing in...",
    incCreds: "Incorrect credentials.",
    invalidEmail: "Email must contain '@' and a valid format.",
    reqEmail: "Email is required.",
    reqPassword: "Password is required.",
    placeholderEmail: "admin@company.com",
    placeholderPassword: "Enter your password",
    noAccount: "Don't have an account? ",
    createAccount: "Create your account",
    otpTitle: "Verify your identity",
    otpSub: "We've sent a 6-digit code to your email.",
    otpPlaceholder: "123456",
    verify: "Verify OTP",
    verifying: "Verifying...",
    otpLabel: "Verification Code",
    reqOtp: "Verification code is required.",
    organizationId: "Branch ID",
    organizationIdPlaceholder: "b9b3b8c5-0bfe-4fb8-8f6b-0e2d9a6a9d11",
    reqOrganizationId: "Branch ID is required for this email.",
    organizationIdHelp: "This email belongs to multiple branches. Enter the branch ID to continue.",
    showPasswordAria: "Show password",
    hidePasswordAria: "Hide password",
    sessionExpiredInfo: "Your session has expired. Please sign in again.",
  },
  es: {
    welcome: "Zelify Core",
    subWelcome: "Inicia sesión en tu cuenta para acceder al panel.",
    email: "Correo electrónico",
    password: "Contraseña",
    signIn: "Iniciar sesión",
    signingIn: "Iniciando sesión...",
    incCreds: "Credenciales incorrectas.",
    invalidEmail: "El correo debe contener '@' y un formato válido.",
    reqEmail: "El correo es obligatorio.",
    reqPassword: "La contraseña es obligatoria.",
    placeholderEmail: "admin@tuempresa.com",
    placeholderPassword: "Ingresa tu contraseña",
    noAccount: "¿No tienes cuenta? ",
    createAccount: "Crear cuenta",
    otpTitle: "Verifica tu identidad",
    otpSub: "Hemos enviado un código de 6 dígitos a su correo electrónico.",
    otpPlaceholder: "123456",
    verify: "Verificar código",
    verifying: "Verificando...",
    otpLabel: "Código de verificación",
    reqOtp: "El código de verificación es obligatorio.",
    organizationId: "ID de sede",
    organizationIdPlaceholder: "b9b3b8c5-0bfe-4fb8-8f6b-0e2d9a6a9d11",
    reqOrganizationId: "El ID de sede es obligatorio para este correo.",
    organizationIdHelp: "Este correo existe en múltiples sedes. Ingresa el ID de la sede para continuar.",
    showPasswordAria: "Mostrar contraseña",
    hidePasswordAria: "Ocultar contraseña",
    sessionExpiredInfo: "Tu sesión ha expirado. Inicia sesión de nuevo.",
  },
};

export default function LoginPage() {
  const { branding } = useBranding();
  const router = useRouter();
  const [data, setData] = useState({
    email: "",
    password: "",
    organization_id: "",
  });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState<"en" | "es">("es");

  const toggleLanguage = () => {
    const newLang = language === "en" ? "es" : "en";
    setLanguage(newLang);
    localStorage.setItem("zelify-language", newLang);
  };

  // Validation State
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
    organization_id: "",
  });
  const [requiresOrganizationId, setRequiresOrganizationId] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sessionExpiredInfo] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("reason") === "session_expired";
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const t = TRANSLATIONS[language];

  /** Devuelve el mensaje de error para un campo (validación en tiempo real). */
  const getFieldError = (
    name: "email" | "password" | "organization_id",
    d: { email: string; password: string; organization_id: string }
  ): string => {
    if (name === "email") {
      if (!d.email) return t.reqEmail;
      if (!d.email.includes("@") || !emailRegex.test(d.email)) return t.invalidEmail;
      return "";
    }
    if (name === "password") {
      return !d.password ? t.reqPassword : "";
    }
    if (name === "organization_id") {
      if (requiresOrganizationId && !d.organization_id.trim()) return t.reqOrganizationId;
      return "";
    }
    return "";
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sessionExpiredInfo) return;
    const params = new URLSearchParams(window.location.search);
    params.delete("reason");
    const q = params.toString();
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${q ? `?${q}` : ""}`,
    );
  }, [sessionExpiredInfo]);

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: "", password: "", organization_id: "" };

    // Email validation
    if (!data.email) {
      newErrors.email = t.reqEmail;
      isValid = false;
    } else if (!data.email.includes("@") || !emailRegex.test(data.email)) {
      // Explicit check for @ as requested, though regex covers it
      newErrors.email = t.invalidEmail;
      isValid = false;
    }

    // Password validation (basic check)
    if (!data.password) {
      newErrors.password = t.reqPassword;
      isValid = false;
    }

    if (requiresOrganizationId && !data.organization_id.trim()) {
      newErrors.organization_id = t.reqOrganizationId;
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as { name: "email" | "password" | "organization_id"; value: string };
    const nextData = { ...data, [name]: value };
    setData(nextData);
    setError("");
    if (name === "email" && requiresOrganizationId) {
      setRequiresOrganizationId(false);
      setFormErrors((prev) => ({ ...prev, organization_id: "" }));
    }
    const fieldError = getFieldError(name, nextData);
    setFormErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const normalizedEmail = data.email.trim().toLowerCase();
    const isDemoBypassLogin =
      normalizedEmail === DEMO_BYPASS_EMAIL && data.password === DEMO_BYPASS_PASSWORD;

    if (isDemoBypassLogin) {
      const demoAuthSession: AuthSuccessResponse = {
        access_token: "demo-bypass-access-token",
        refresh_token: "demo-bypass-refresh-token",
        user: {
          id: "demo-bypass-user",
          email: DEMO_BYPASS_EMAIL,
          full_name: "Demo User",
          status: "ACTIVE",
        },
        organization: {
          id: "demo-bypass-org",
          name: "Demo Organization",
          status: "ACTIVE",
        },
        roles: ["OWNER"],
      };
      persistAuthSession(demoAuthSession);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(DEMO_BYPASS_STORAGE_KEY, "true");
        resetScopedDemoExperienceStorage();
        resetDemoRulesState();
        seedScotiaDemoStorage(true);
        seedScotiaCreditStorage(true);
      }
      setLoading(false);
      router.replace(getDefaultDashboardPath(demoAuthSession.roles));
      return;
    }

    if (typeof window !== "undefined") {
      sessionStorage.removeItem(DEMO_BYPASS_STORAGE_KEY);
    }

    const authBaseUrl = process.env.NEXT_PUBLIC_AUTH_API_URL;
    if (!authBaseUrl) {
      setLoading(false);
      setError(
        language === "en"
          ? "Auth API URL is not configured. Set NEXT_PUBLIC_AUTH_API_URL in .env"
          : "La URL de la API de auth no está configurada. Configura NEXT_PUBLIC_AUTH_API_URL en .env",
      );
      return;
    }

    if (step === 1) {
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      try {
        const result = await login({
          email: data.email,
          password: data.password,
          organization_id: data.organization_id.trim() || undefined,
        });

        // Caso bypass de OTP ( tokens directos )
        if ("access_token" in result || "accessToken" in result) {
          const authResult = result as AuthSuccessResponse;
          if (authResult.user && authResult.organization) {
            persistAuthSession(authResult);
            try {
              await syncMe();
            } catch {
              /* mantener datos del response */
            }
            setLoading(false);
            router.replace(getDefaultDashboardPath(authResult.roles));
            return;
          }
        }

        if ("session_id" in result) {
          setSessionId(result.session_id);
          setStep(2);
          setLoading(false);
          return;
        }

        setLoading(false);
        const loginResult = result as { message?: string; organizations?: Array<{ id: string; name: string }> };
        if (Array.isArray(loginResult.organizations) || loginResult.message?.includes("organization_id")) {
          setRequiresOrganizationId(true);
          setFormErrors((prev) => ({
            ...prev,
            organization_id: !data.organization_id.trim() ? t.reqOrganizationId : "",
          }));
        }
        setError(loginResult.message || t.incCreds);
      } catch (err) {
        handleAuthError(err);
      }
    } else {
      // Step 2: Verify OTP
      if (!otp) {
        setError(t.reqOtp);
        setLoading(false);
        return;
      }

      try {
        const result = await verifyDashboardOtp({
          session_id: sessionId,
          otp_code: otp,
        });

        const hasToken = "access_token" in result || "accessToken" in result;
        if (hasToken && result.user && result.organization) {
          persistAuthSession(result as AuthSuccessResponse);
          try {
            await syncMe();
          } catch {
            /* mantener datos del response */
          }
          setLoading(false);
          router.replace(getDefaultDashboardPath(result.roles));
          return;
        }

        setLoading(false);
        setError(t.incCreds);
      } catch (err) {
        handleAuthError(err);
      }
    }
  };

  const handleAuthError = (err: unknown) => {
    console.error("Auth error:", err);
    setLoading(false);
    if (err instanceof AuthError) {
      setError(getLoginAuthErrorDisplay(err, step, language));
    } else {
      setError(
        err instanceof Error
          ? err.message
          : language === "en"
            ? "Connection error. Please try again."
            : "Error de conexión. Por favor intenta de nuevo.",
      );
    }
  };

  const isDefaultProductLogo =
    !branding.logoUrl || branding.logoUrl === "/mdc-navbar-logo.svg" || branding.logoUrl === DEFAULT_BRANDING.logoUrl;
  const productLogoSrc = isDefaultProductLogo ? PRODUCT_LOGO_DARK : branding.logoUrl;
  const showLoginMessage =
    step === 1 &&
    Boolean(branding.loginMessage) &&
    branding.loginMessage !== DEFAULT_BRANDING.loginMessage;

  return (
    <div className="zelify-login">
      <div className="zelify-login__backdrop" aria-hidden="true">
        <AnimatedHalftoneBackdrop />
        <div className="zelify-login__halftone" />
        <div className="zelify-login__fade" />
        <div className="zelify-login__glow" />
      </div>
      <button type="button" onClick={toggleLanguage} className="zelify-login__lang">
        {language === "en" ? "EN" : "ES"}
      </button>

      <div className="zelify-login__card-wrap">
        <div className="zelify-login__card">
          {loading ? (
            <div className="zelify-login__busy" role="status" aria-live="polite" aria-busy="true">
              <div className="zelify-login__spinner" aria-hidden />
              <span className="zelify-login__busy-text">{step === 1 ? t.signingIn : t.verifying}</span>
            </div>
          ) : null}

          {sessionExpiredInfo ? (
            <div className="zelify-login__alert zelify-login__alert--warn" role="status">
              {t.sessionExpiredInfo}
            </div>
          ) : null}

          <div className="zelify-login__brands">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={productLogoSrc}
              alt={branding.displayName || "Aethereun"}
              className={`zelify-login__logo zelify-login__logo--product${isDefaultProductLogo ? "" : " zelify-login__logo--ink"}`}
            />
            <span className="zelify-login__brand-divider" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={CLIENT_LOGO_SRC} alt="Tulana" className="zelify-login__logo zelify-login__logo--client" />
          </div>

          {step === 2 ? (
            <>
              <h1 className="zelify-login__otp-title">{t.otpTitle}</h1>
              <p className="zelify-login__subtitle">{t.otpSub}</p>
            </>
          ) : (
            <p className="zelify-login__subtitle">{t.subWelcome}</p>
          )}
          {showLoginMessage ? <p className="zelify-login__note">{branding.loginMessage}</p> : null}

          <form onSubmit={handleSubmit} className="zelify-login__fields">
            {error ? (
              <div className="zelify-login__alert zelify-login__alert--error">{error}</div>
            ) : null}

            {step === 1 ? (
              <>
                <InputGroup
                  type="email"
                  variant="minimal"
                  label={t.email}
                  className={`mb-4${formErrors.email ? " is-invalid" : ""}`}
                  placeholder={t.placeholderEmail}
                  name="email"
                  handleChange={handleChange}
                  value={data.email}
                  required
                />
                {formErrors.email ? <p className="zelify-login__field-error">{formErrors.email}</p> : null}

                <InputGroup
                  type={showPassword ? "text" : "password"}
                  variant="minimal"
                  label={t.password}
                  className={`mb-5${formErrors.password ? " is-invalid" : ""}`}
                  placeholder={t.placeholderPassword}
                  name="password"
                  handleChange={handleChange}
                  value={data.password}
                  endAdornment={
                    <button
                      type="button"
                      aria-label={showPassword ? t.hidePasswordAria : t.showPasswordAria}
                      className="group inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 shadow-none outline-none"
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? (
                        <EyeClosedIcon
                          strokeWidth={1.5}
                          className="h-[18px] w-[18px] shrink-0 text-slate-400 transition-colors group-hover:text-slate-600"
                        />
                      ) : (
                        <EyeOpenIcon
                          strokeWidth={1.5}
                          className="h-[18px] w-[18px] shrink-0 text-slate-400 transition-colors group-hover:text-slate-600"
                        />
                      )}
                    </button>
                  }
                  required
                />
                {formErrors.password ? <p className="zelify-login__field-error">{formErrors.password}</p> : null}

                {requiresOrganizationId ? (
                  <>
                    <div className="zelify-login__alert zelify-login__alert--warn">{t.organizationIdHelp}</div>
                    <InputGroup
                      type="text"
                      variant="minimal"
                      label={t.organizationId}
                      className={`mb-4${formErrors.organization_id ? " is-invalid" : ""}`}
                      placeholder={t.organizationIdPlaceholder}
                      name="organization_id"
                      handleChange={handleChange}
                      value={data.organization_id}
                      required
                    />
                    {formErrors.organization_id ? (
                      <p className="zelify-login__field-error">{formErrors.organization_id}</p>
                    ) : null}
                  </>
                ) : null}
              </>
            ) : (
              <>
                <InputGroup
                  type="text"
                  variant="minimal"
                  label={t.otpLabel}
                  className="mb-5"
                  placeholder={t.otpPlaceholder}
                  name="otp"
                  handleChange={(e) => setOtp(e.target.value)}
                  value={otp}
                  required
                />
                <button type="button" onClick={() => setStep(1)} className="zelify-login__back">
                  {language === "en" ? "Change email/password" : "Cambiar correo/contraseña"}
                </button>
              </>
            )}

            <button type="submit" disabled={loading} className="zelify-login__submit">
              {step === 1 ? t.signIn : t.verify}
            </button>

            <p className="zelify-login__footer">
              {t.noAccount}
              <Link href="/register">{t.createAccount}</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
