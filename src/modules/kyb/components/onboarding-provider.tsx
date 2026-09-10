"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import {
  AmlMember,
  buildOwnersAnswersFromAmlMembers,
  resolveAmlScreeningResult,
} from "@/modules/kyb/lib/aml-screening";
import { SHOULD_USE_DEMO_PREFILL, SHOULD_USE_LOCAL_ONBOARDING } from "@/modules/kyb/lib/app-flags";
import { DEV_BYPASS_USER, establishDevBypassSession } from "@/modules/kyb/lib/dev-auth";
import {
  buildKybAnswersFromCompanyContext,
  buildKybSatFiscalDataFromCompanyContext,
  readActiveKybCompanyContext,
} from "@/modules/kyb/lib/kyb-company-context";
import { OnboardingModuleKey } from "@/modules/kyb/lib/onboarding-config";
import {
  createLocalAdminUser,
  createLocalOrganization,
  deleteLocalAdminUser,
  deleteLocalOrganization,
  filterLocalAdminUsers,
  readLocalOrganizations,
  updateLocalAdminUser,
  updateLocalOrganization,
} from "@/modules/kyb/lib/local-admin-store";
import {
  demoAmlMembers,
  demoKycMembers,
  demoPrefillAnswers,
  demoSatFiscalData,
} from "@/modules/kyb/lib/demo-prefill";
import {
  commercialInfoChecklistSections,
  companyInfoChecklistSections,
  kybChecklistSections,
  pldAmlChecklistSections,
  technicalChecklistSections,
} from "@/modules/kyb/lib/onboarding-config";

type ProgressState = Record<OnboardingModuleKey, number>;
type VisibilityState = Record<OnboardingModuleKey, boolean>;
type KycMemberInput = {
  name: string;
  email: string;
  role: string;
  rfc: string;
  curp: string;
};

export type RequirementMetadata = {
  requirement_code: string;
  status: "pending" | "approved" | "rejected";
  observations: string | null;
  s3_key: string | null;
};

type OnboardingContextValue = {
  progress: ProgressState;
  visibleModules: VisibilityState;
  isSidebarCollapsed: boolean;
  isMobileSidebarOpen: boolean;
  kybLocked: boolean;
  kybSubmitted: boolean;
  kybStatusMessage: string | null;
  toggleSidebar: () => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  submitKybDocumentation: (file: File) => Promise<void>;
  submitSectionDocumentation: (moduleKey: OnboardingModuleKey, file: File | null) => Promise<void>;
  moduleSubmitted: Record<OnboardingModuleKey, boolean>;
  moduleLocked: Record<OnboardingModuleKey, boolean>;
  moduleStatusMessage: Record<OnboardingModuleKey, string | null>;
  answers: Record<string, any>;
  updateAnswer: (code: string, value: any) => void;
  saveIndividualAnswer: (requirementCode: string, value: any) => Promise<void>;
  
  // Conexión y sesión de red reales
  isAuthenticated: boolean;
  user: any;
  isLoading: boolean;
  logout: () => void;
  saveSectionAnswers: (moduleKey: OnboardingModuleKey) => Promise<void>;
  uploadFileAnswer: (requirementCode: string, file: File) => Promise<any>;
  deleteFileAnswer: (requirementCode: string) => Promise<void>;
  downloadFileUrl: (requirementCode: string) => Promise<string>;
  requirementsMetadata: Record<string, RequirementMetadata>;

  // Capacidades Operacionales del Administrador (Zelify Admin)
  auditOrganizationId: string | null;
  isAuditMode: boolean;
  organizationsList: any[];
  usersList: any[];
  startAudit: (orgId: string) => void;
  stopAudit: () => void;
  fetchOrganizations: () => Promise<void>;
  createOrganization: (orgData: { legalName: string; rfc: string; status: string }) => Promise<void>;
  updateOrganization: (orgId: string, orgData: Partial<{ legalName: string; status: string }>) => Promise<void>;
  deleteOrganization: (orgId: string) => Promise<void>;
  fetchUsers: (orgId?: string) => Promise<void>;
  createUser: (userData: { email: string; role: string; password?: string; organizationId: string | null }) => Promise<void>;
  updateUser: (userId: string, userData: any) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  verifyRequirementAnswer: (requirementCode: string, status: "approved" | "rejected", observations?: string | null) => Promise<void>;
  updateVisibility: (visibilityPayload: Partial<Record<string, boolean>>) => Promise<void>;

  // Propietarios / directivos (captura en KYB, validación AML)
  ownersList: AmlMember[];
  registerOwner: (memberData: {
    name: string;
    email: string;
    role: string;
    ownershipPercent: number;
    rfc: string;
    curp: string;
  }) => void;
  updateOwner: (
    memberId: string,
    memberData: Partial<{
      name: string;
      email: string;
      role: string;
      ownershipPercent: number;
      rfc: string;
      curp: string;
    }>,
  ) => void;
  removeOwner: (memberId: string) => void;
  setOwnerIneDocument: (memberId: string, fileName: string | null) => void;
  startOwnerScreening: (memberId: string) => void;

  // Simulador SAT & KYC
  kycMembersList: any[];
  satConnected: boolean;
  satFiscalData: any | null;
  registerKycMember: (memberData: KycMemberInput) => boolean;
  updateKycStatus: (memberId: string, status: "pending" | "approved" | "rejected" | "validating", observations?: string | null) => void;
  connectSatSimulator: (rfc: string) => Promise<void>;
  resetSatKycSimulation: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

const LOCAL_ANSWERS_KEY = "zelify_local_onboarding_answers";

function isSameKycIdentity(
  currentMember: Pick<KycMemberInput, "email" | "rfc" | "curp">,
  nextMember: Pick<KycMemberInput, "email" | "rfc" | "curp">,
) {
  return (
    currentMember.email.trim().toLowerCase() === nextMember.email.trim().toLowerCase() ||
    currentMember.rfc.trim().toUpperCase() === nextMember.rfc.trim().toUpperCase() ||
    currentMember.curp.trim().toUpperCase() === nextMember.curp.trim().toUpperCase()
  );
}
const LOCAL_PROGRESS_KEY = "zelify_local_onboarding_progress";
const LOCAL_MODULE_SUBMITTED_KEY = "zelify_local_module_submitted";
const LOCAL_MODULE_LOCKED_KEY = "zelify_local_module_locked";
const LOCAL_MODULE_STATUS_KEY = "zelify_local_module_status";
const LOCAL_OWNERS_KEY = "zelify_kyb_owners";
const AML_SCREENING_DELAY_MS = 4000;

const localProgressChecklistMap = {
  kyb: kybChecklistSections,
  pldAml: pldAmlChecklistSections,
  technical: technicalChecklistSections,
  businessPlan: commercialInfoChecklistSections,
  companyInfo: companyInfoChecklistSections,
} as const;

function parseStoredObject<T>(rawValue: string | null, fallback: T): T {
  if (!rawValue) return fallback;

  try {
    const parsed = JSON.parse(rawValue);

    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      Object.keys(parsed).length === 0
    ) {
      return fallback;
    }

    return parsed as T;
  } catch {
    return fallback;
  }
}

function isZeroProgressState(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const numericValues = Object.values(value as Record<string, unknown>).filter(
    (item) => typeof item === "number",
  ) as number[];

  return numericValues.length > 0 && numericValues.every((item) => item === 0);
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Estados de onboarding
  const [progress, setProgress] = useState<ProgressState>({
    kyb: 0,
    pldAml: 0,
    technical: 0,
    businessPlan: 0,
    companyInfo: 0,
    satKyc: 0,
  });

  const [visibleModules, setVisibleModules] = useState<VisibilityState>({
    kyb: true,
    pldAml: true,
    technical: false,
    businessPlan: true,
    companyInfo: true,
    satKyc: true,
  });

  const [moduleSubmitted, setModuleSubmitted] = useState<Record<OnboardingModuleKey, boolean>>({
    kyb: false,
    pldAml: false,
    technical: false,
    businessPlan: false,
    companyInfo: false,
    satKyc: false,
  });

  const [moduleLocked, setModuleLocked] = useState<Record<OnboardingModuleKey, boolean>>({
    kyb: false,
    pldAml: false,
    technical: false,
    businessPlan: false,
    companyInfo: false,
    satKyc: false,
  });

  const [moduleStatusMessage, setModuleStatusMessage] = useState<Record<OnboardingModuleKey, string | null>>({
    kyb: null,
    pldAml: null,
    technical: null,
    businessPlan: null,
    companyInfo: null,
    satKyc: null,
  });

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [requirementsMetadata, setRequirementsMetadata] = useState<Record<string, RequirementMetadata>>({});

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const applyDemoPrefill = useCallback(() => {
    const seededProgress: ProgressState = {
      kyb: 65,
      pldAml: 20,
      technical: 35,
      businessPlan: 15,
      companyInfo: 80,
      satKyc: 50,
    };

    setAnswers((current) => (Object.keys(current).length > 0 ? current : { ...demoPrefillAnswers }));
    setProgress((current) => ({
      ...seededProgress,
      ...current,
      kyb: current.kyb || seededProgress.kyb,
      pldAml: current.pldAml || seededProgress.pldAml,
      technical: current.technical || seededProgress.technical,
      businessPlan: current.businessPlan || seededProgress.businessPlan,
      companyInfo: current.companyInfo || seededProgress.companyInfo,
      satKyc: current.satKyc || seededProgress.satKyc,
    }));
  }, []);

  // Estados del Administrador
  const [auditOrganizationId, setAuditOrganizationId] = useState<string | null>(null);
  const [isAuditMode, setIsAuditMode] = useState(false);
  const [organizationsList, setOrganizationsList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  const [ownersList, setOwnersList] = useState<AmlMember[]>([]);

  // Estados del Simulador SAT & KYC
  const [kycMembersList, setKycMembersList] = useState<any[]>([]);
  const [satConnected, setSatConnected] = useState(false);
  const [satFiscalData, setSatFiscalData] = useState<any | null>(null);

  const syncOwnersFromAmlMembers = useCallback((members: AmlMember[]) => {
    const ownerAnswers = buildOwnersAnswersFromAmlMembers(members);
    setAnswers((current) => ({
      ...current,
      ...ownerAnswers,
    }));
  }, []);

  const persistOwners = useCallback((members: AmlMember[]) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_OWNERS_KEY, JSON.stringify(members));
    }
  }, []);

  // Cargar estado de simulación desde localStorage al montar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedOwners =
        localStorage.getItem(LOCAL_OWNERS_KEY) ||
        localStorage.getItem("zelify_local_aml_members");
      const savedMembers = localStorage.getItem("zelify_sim_members");
      const savedSatConnected = localStorage.getItem("zelify_sim_sat_connected");
      const savedSatFiscal = localStorage.getItem("zelify_sim_sat_fiscal");

      if (savedOwners) {
        try {
          const parsedOwners = JSON.parse(savedOwners) as AmlMember[];
          setOwnersList(parsedOwners);
          syncOwnersFromAmlMembers(parsedOwners);
        } catch (e) {
          console.error("Error al cargar propietarios KYB:", e);
        }
      } else if (SHOULD_USE_DEMO_PREFILL) {
        setOwnersList(demoAmlMembers);
        syncOwnersFromAmlMembers(demoAmlMembers);
        persistOwners(demoAmlMembers);
      }

      if (savedMembers) {
        try {
          setKycMembersList(JSON.parse(savedMembers));
        } catch (e) {
          console.error("Error al cargar miembros simulados:", e);
        }
      }
      if (savedSatConnected === "true") {
        setSatConnected(true);
      }
      if (savedSatFiscal) {
        try {
          setSatFiscalData(JSON.parse(savedSatFiscal));
        } catch (e) {
          console.error("Error al cargar datos SAT simulados:", e);
        }
      }
    }
  }, [persistOwners, syncOwnersFromAmlMembers]);

  // Resolver validación AML en lista negra
  useEffect(() => {
    const validatingMembers = ownersList.filter((member) => member.screeningStatus === "validating");
    if (validatingMembers.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      let hasChanges = false;

      const updatedMembers = ownersList.map((member) => {
        if (member.screeningStatus === "validating" && member.screeningStartedAt) {
          const elapsed = now - member.screeningStartedAt;
          if (elapsed >= AML_SCREENING_DELAY_MS) {
            hasChanges = true;
            const result = resolveAmlScreeningResult(member);
            return {
              ...member,
              screeningStatus: result.status,
              screeningDetails: result.details,
            };
          }
        }
        return member;
      });

      if (hasChanges) {
        setOwnersList(updatedMembers);
        persistOwners(updatedMembers);
        syncOwnersFromAmlMembers(updatedMembers);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [ownersList, persistOwners, syncOwnersFromAmlMembers]);

  // Verificar y resolver miembros en estado "validando" despues de una espera visible
  useEffect(() => {
    const validatingMembers = kycMembersList.filter((m) => m.kycStatus === "validating");
    if (validatingMembers.length === 0) return;

    const interval = setInterval(() => {
      let hasChanges = false;
      const now = Date.now();
      const updatedMembers = kycMembersList.map((m) => {
        if (m.kycStatus === "validating" && m.kycStartedAt) {
          const elapsed = now - m.kycStartedAt;
          // 60 segundos exactos para la simulacion local del KYC externo
          if (elapsed >= 60000) {
            hasChanges = true;
            const nameLower = m.name.toLowerCase();
            const emailLower = m.email.toLowerCase();
            const isTriggerFailure = 
              nameLower.includes("error") || 
              nameLower.includes("fallo") || 
              nameLower.includes("rechazo") ||
              emailLower.includes("error") ||
              emailLower.includes("fallo") ||
              emailLower.includes("rechazo");
            
            return {
              ...m,
              kycStatus: isTriggerFailure ? "rejected" : "approved",
              kycDetails: isTriggerFailure ? "La validación facial externa reportó discrepancias en los registros oficiales." : null,
            };
          }
        }
        return m;
      });

      if (hasChanges) {
        setKycMembersList(updatedMembers);
        if (typeof window !== "undefined") {
          localStorage.setItem("zelify_sim_members", JSON.stringify(updatedMembers));
        }

        // Actualizar progreso
        const approvedCount = updatedMembers.filter((m) => m.kycStatus === "approved").length;
        const progressPercent = updatedMembers.length > 0 ? Math.round((approvedCount / updatedMembers.length) * 50) : 0;
        const satBonus = satConnected ? 50 : 0;
        setProgress((prev) => ({
          ...prev,
          satKyc: progressPercent + satBonus,
        }));
      }
    }, 1000); // Verificar cada segundo para actualizar la cuenta regresiva visual

    return () => clearInterval(interval);
  }, [kycMembersList, satConnected]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed((current) => !current);
  }, []);

  const openMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(true);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  // Carga inicial y sesión activa
  useEffect(() => {
    if (typeof window !== "undefined") {
      let token = localStorage.getItem("zelify_access_token");
      let userDataStr = localStorage.getItem("zelify_user");

      if (SHOULD_USE_LOCAL_ONBOARDING && (!token || !userDataStr)) {
        establishDevBypassSession();
        token = localStorage.getItem("zelify_access_token");
        userDataStr = localStorage.getItem("zelify_user");
      }

      if (token && userDataStr) {
        const parsedUser = JSON.parse(userDataStr);
        setIsAuthenticated(true);
        setUser(parsedUser);
        
        // Restaurar modo auditoría si existía una sesión previa
        if (parsedUser.role === "admin_zelify") {
          const savedAuditId = localStorage.getItem("zelify_audit_org_id");
          if (savedAuditId) {
            setAuditOrganizationId(savedAuditId);
            setIsAuditMode(true);
          }
        }
      } else {
        setIsAuthenticated(true);
        setUser(DEV_BYPASS_USER);
      }
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !SHOULD_USE_LOCAL_ONBOARDING ||
      !isAuthenticated ||
      !user
    ) {
      return;
    }

    const savedAnswers = localStorage.getItem(LOCAL_ANSWERS_KEY);
    const savedProgress = localStorage.getItem(LOCAL_PROGRESS_KEY);
    const savedSubmitted = localStorage.getItem(LOCAL_MODULE_SUBMITTED_KEY);
    const savedLocked = localStorage.getItem(LOCAL_MODULE_LOCKED_KEY);
    const savedStatus = localStorage.getItem(LOCAL_MODULE_STATUS_KEY);
    const savedMembers = localStorage.getItem("zelify_sim_members");
    const savedOwners =
      localStorage.getItem(LOCAL_OWNERS_KEY) ||
      localStorage.getItem("zelify_local_aml_members");
    const savedSatConnected = localStorage.getItem("zelify_sim_sat_connected");
    const savedSatFiscal = localStorage.getItem("zelify_sim_sat_fiscal");
    const activeKybCompanyContext = readActiveKybCompanyContext();
    const isLocalMdcApplication = activeKybCompanyContext?.applicationId?.startsWith("local-");
    const seededProgress = {
      kyb: 65,
      pldAml: 20,
      technical: 35,
      businessPlan: 15,
      companyInfo: 80,
      satKyc: 50,
    };
    const parsedProgress = parseStoredObject(savedProgress, seededProgress);
    const baseAnswers = activeKybCompanyContext
      ? parseStoredObject(savedAnswers, {})
      : parseStoredObject(savedAnswers, demoPrefillAnswers);
    const nextAnswers = activeKybCompanyContext
      ? {
          ...baseAnswers,
          ...buildKybAnswersFromCompanyContext(activeKybCompanyContext),
        }
      : baseAnswers;
    const baseSatFiscal = activeKybCompanyContext
      ? parseStoredObject(savedSatFiscal, {})
      : parseStoredObject(savedSatFiscal, null);
    const nextSatFiscal = activeKybCompanyContext
      ? {
          ...(isLocalMdcApplication ? {} : (baseSatFiscal ?? demoSatFiscalData)),
          ...buildKybSatFiscalDataFromCompanyContext(activeKybCompanyContext),
        }
      : baseSatFiscal;

    setAnswers(nextAnswers);
    setProgress(isZeroProgressState(parsedProgress) ? seededProgress : parsedProgress);
    setModuleSubmitted(parseStoredObject(savedSubmitted, {
      kyb: false,
      pldAml: false,
      technical: false,
      businessPlan: false,
      companyInfo: false,
      satKyc: false,
    }));
    setModuleLocked(parseStoredObject(savedLocked, {
      kyb: false,
      pldAml: false,
      technical: false,
      businessPlan: false,
      companyInfo: false,
      satKyc: false,
    }));
    setModuleStatusMessage(parseStoredObject(savedStatus, {
      kyb: null,
      pldAml: null,
      technical: null,
      businessPlan: null,
      companyInfo: null,
      satKyc: null,
    }));
    const loadedOwners = parseStoredObject(savedOwners, demoAmlMembers);
    setOwnersList(loadedOwners);
    syncOwnersFromAmlMembers(loadedOwners);
    setKycMembersList(parseStoredObject(savedMembers, demoKycMembers));
    setSatConnected(savedSatConnected ? savedSatConnected === "true" : false);
    setSatFiscalData(nextSatFiscal);
  }, [isAuthenticated, user, syncOwnersFromAmlMembers]);

  useEffect(() => {
    if (typeof window === "undefined" || !SHOULD_USE_LOCAL_ONBOARDING) return;
    localStorage.setItem(LOCAL_ANSWERS_KEY, JSON.stringify(answers));
  }, [answers]);

  useEffect(() => {
    if (typeof window === "undefined" || !SHOULD_USE_LOCAL_ONBOARDING) return;
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    if (typeof window === "undefined" || !SHOULD_USE_LOCAL_ONBOARDING) return;
    localStorage.setItem(LOCAL_MODULE_SUBMITTED_KEY, JSON.stringify(moduleSubmitted));
    localStorage.setItem(LOCAL_MODULE_LOCKED_KEY, JSON.stringify(moduleLocked));
    localStorage.setItem(LOCAL_MODULE_STATUS_KEY, JSON.stringify(moduleStatusMessage));
  }, [moduleSubmitted, moduleLocked, moduleStatusMessage]);

  useEffect(() => {
    if (!SHOULD_USE_LOCAL_ONBOARDING) return;

    const countCompletedItems = (moduleKey: keyof typeof localProgressChecklistMap) => {
      const allItems = localProgressChecklistMap[moduleKey].flatMap((section) =>
        section.subsections.flatMap((subsection) => subsection.items),
      );

      const total = allItems.length;
      const completed = allItems.filter((item) => {
        const value = answers[item.code];

        if (value === undefined || value === null) {
          return false;
        }

        if (typeof value === "string") {
          return value.trim().length > 0;
        }

        return Boolean(value);
      }).length;

      return total === 0 ? 0 : Math.round((completed / total) * 100);
    };

    const approvedCount = kycMembersList.filter((member) => member.kycStatus === "approved").length;
    const kycMemberProgress =
      kycMembersList.length > 0 ? Math.round((approvedCount / kycMembersList.length) * 50) : 0;
    const satProgress = satConnected ? 50 : 0;

    setProgress((current) => ({
      ...current,
      kyb: moduleSubmitted.kyb ? 100 : countCompletedItems("kyb"),
      pldAml: moduleSubmitted.pldAml ? 100 : countCompletedItems("pldAml"),
      technical: moduleSubmitted.technical ? 100 : countCompletedItems("technical"),
      businessPlan: moduleSubmitted.businessPlan ? 100 : countCompletedItems("businessPlan"),
      companyInfo: moduleSubmitted.companyInfo ? 100 : countCompletedItems("companyInfo"),
      satKyc: moduleSubmitted.satKyc ? 100 : kycMemberProgress + satProgress,
    }));
  }, [answers, kycMembersList, satConnected, moduleSubmitted]);

  const fetchOnboardingData = useCallback(async () => {
    return;
  }, []);

  // Refrescar al montar o cambiar de organización auditada
  useEffect(() => {
    if (isAuthenticated && (user?.organization_id || user?.organizationId || isAuditMode)) {
      fetchOnboardingData();
    }
  }, [isAuthenticated, user, isAuditMode, auditOrganizationId, fetchOnboardingData]);

  // Modificar respuesta localmente
  const updateAnswer = useCallback((code: string, value: any) => {
    setAnswers((current) => ({
      ...current,
      [code]: value,
    }));
  }, []);

  // Guardar una respuesta individual de texto o declaración en red (Auto-Save)
  const saveIndividualAnswer = useCallback(async (requirementCode: string, value: any) => {
    setAnswers((current) => ({
      ...current,
      [requirementCode]: value !== undefined && value !== null ? String(value) : "",
    }));
  }, []);

  // 1. Guardar respuestas de texto (PUT /answers)
  const saveSectionAnswers = useCallback(async (moduleKey: OnboardingModuleKey) => {
    const sectionProgress: Record<OnboardingModuleKey, number> = {
      kyb: 100,
      pldAml: 100,
      technical: 100,
      businessPlan: 100,
      companyInfo: 100,
      satKyc: 100,
    };
    setProgress((current) => ({
      ...current,
      [moduleKey]: sectionProgress[moduleKey],
    }));
  }, []);

  // 2. Cargar Documento Multipart (POST /upload/:requirementCode)
  const uploadFileAnswer = useCallback(async (requirementCode: string, file: File) => {
    setAnswers((current) => ({
      ...current,
      [requirementCode]: file.name,
    }));
    return { local: true, requirementCode, fileName: file.name };
  }, []);

  // 3. Eliminar Documento (DELETE /answers/:requirementCode)
  const deleteFileAnswer = useCallback(async (requirementCode: string) => {
    updateAnswer(requirementCode, null);
  }, [updateAnswer]);

  // 4. Obtener URL de Descarga Prefirmada de S3 (GET /download/:requirementCode)
  const downloadFileUrl = useCallback(async (requirementCode: string): Promise<string> => {
    return "";
  }, []);

  // 5. Enviar y Congelar Sección (POST /submit/:sectionCode)
  const submitSectionDocumentation = useCallback(async (moduleKey: OnboardingModuleKey, file: File | null) => {
    await saveSectionAnswers(moduleKey);

    if (file) {
      const localDocumentSlots: Record<OnboardingModuleKey, string> = {
        kyb: "1.6.1",
        pldAml: "2.1.1",
        technical: "3.2.4",
        businessPlan: "4.1.1",
        companyInfo: "5.4.1",
        satKyc: "6.1.1",
      };
      await uploadFileAnswer(localDocumentSlots[moduleKey], file);
    }

    setModuleSubmitted((current) => ({ ...current, [moduleKey]: true }));
    setModuleLocked((current) => ({ ...current, [moduleKey]: true }));
    setModuleStatusMessage((current) => ({
      ...current,
      [moduleKey]: "Expediente guardado localmente en modo demo.",
    }));
  }, [saveSectionAnswers, uploadFileAnswer]);

  // Mantener compatibilidad con submitKybDocumentation original
  const submitKybDocumentation = useCallback(async (file: File) => {
    await submitSectionDocumentation("kyb", file);
  }, [submitSectionDocumentation]);

  // Cerrar sesión
  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("zelify_access_token");
      localStorage.removeItem("zelify_user");
      localStorage.removeItem("zelify_audit_org_id");
      setIsAuthenticated(false);
      setUser(null);
      setAuditOrganizationId(null);
      setIsAuditMode(false);
      establishDevBypassSession();
      setIsAuthenticated(true);
      setUser(DEV_BYPASS_USER);
      router.push("/kyb");
    }
  }, [router]);


  // ==========================================
  // CAPACIDADES EXCLUSIVAS DEL ADMINISTRADOR (admin_zelify)
  // ==========================================

  // Activar modo auditoría para revisar una empresa específica
  const startAudit = useCallback((orgId: string) => {
    if (user?.role !== "admin_zelify") return;
    
    console.log(`[Admin Audit]: Iniciando auditoría e inspección en red para la organización ${orgId}`);
    localStorage.setItem("zelify_audit_org_id", orgId);
    setAuditOrganizationId(orgId);
    setIsAuditMode(true);
    
    // Redirige directamente al expediente KYB de esa empresa para inspeccionarla
    router.push("/kyb");
  }, [user, router]);

  // Finalizar auditoría y regresar al panel de control administrativo
  const stopAudit = useCallback(() => {
    console.log("[Admin Audit]: Finalizando modo auditoría. Regresando a panel general.");
    localStorage.removeItem("zelify_audit_org_id");
    setAuditOrganizationId(null);
    setIsAuditMode(false);
    
    // Limpiar respuestas locales
    setAnswers({});
    setRequirementsMetadata({});
    setProgress({
      kyb: 0,
      pldAml: 0,
      technical: 0,
      businessPlan: 0,
      companyInfo: 0,
      satKyc: 0,
    });
    
    router.push("/kyb");
  }, [router]);

  // 1. Obtener lista de Organizaciones (GET /admin/organizations)
  const fetchOrganizations = useCallback(async () => {
    if (user?.role !== "admin_zelify") return;
    setOrganizationsList(readLocalOrganizations());
  }, [user]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin_zelify") {
      fetchOrganizations();
    }
  }, [isAuthenticated, user, fetchOrganizations]);

  // 2. Crear Organización (POST /admin/organizations)
  const createOrganization = useCallback(async (orgData: { legalName: string; rfc: string; status: string }) => {
    if (user?.role !== "admin_zelify") return;
    setOrganizationsList(createLocalOrganization(orgData));
  }, [user]);

  // 3. Editar Organización (PATCH /admin/organizations/:id)
  const updateOrganization = useCallback(async (orgId: string, orgData: Partial<{ legalName: string; status: string }>) => {
    if (user?.role !== "admin_zelify") return;
    setOrganizationsList(updateLocalOrganization(orgId, orgData));
  }, [user]);

  // 4. Eliminar Organización (DELETE /admin/organizations/:id)
  const deleteOrganization = useCallback(async (orgId: string) => {
    if (user?.role !== "admin_zelify") return;
    setOrganizationsList(deleteLocalOrganization(orgId));
    setUsersList(filterLocalAdminUsers());
  }, [user]);

  // 5. Obtener lista de Usuarios (GET /admin/users)
  const fetchUsers = useCallback(async (orgId?: string) => {
    if (user?.role !== "admin_zelify") return;
    setUsersList(filterLocalAdminUsers(orgId));
  }, [user]);

  // 6. Crear Usuario (POST /admin/users)
  const createUser = useCallback(async (userData: { email: string; role: string; password?: string; organizationId: string | null }) => {
    if (user?.role !== "admin_zelify") return;
    setUsersList(
      createLocalAdminUser({
        email: userData.email,
        role: userData.role,
        organizationId: userData.organizationId,
      }),
    );
  }, [user]);

  // 7. Editar Usuario (PATCH /admin/users/:id)
  const updateUser = useCallback(async (userId: string, userData: any) => {
    if (user?.role !== "admin_zelify") return;
    setUsersList(
      updateLocalAdminUser(userId, {
        email: userData.email,
        role: userData.role,
        organizationId: userData.organizationId ?? userData.organization_id,
      }),
    );
  }, [user]);

  // 8. Eliminar Usuario (DELETE /admin/users/:id)
  const deleteUser = useCallback(async (userId: string) => {
    if (user?.role !== "admin_zelify") return;
    setUsersList(deleteLocalAdminUser(userId));
  }, [user]);

  // 9. Verificar y Validar Respuestas del Cliente (Aprobado/Rechazado en auditoría)
  // PATCH /admin/organizations/:orgId/answers/:requirementCode/verify
  const verifyRequirementAnswer = useCallback(async (requirementCode: string, status: "approved" | "rejected", observations?: string | null) => {
    if (user?.role !== "admin_zelify" || !isAuditMode || !auditOrganizationId) return;
    setRequirementsMetadata((current) => ({
      ...current,
      [requirementCode]: {
        requirement_code: requirementCode,
        status,
        observations: observations ?? null,
        s3_key: current[requirementCode]?.s3_key ?? null,
      },
    }));
  }, [user, isAuditMode, auditOrganizationId]);

  // 10. Actualizar Visibilidad de Módulos Dinámicamente para una empresa
  // PATCH /organizations/:orgId/onboarding/visibility
  const updateVisibility = useCallback(async (visibilityPayload: Partial<Record<string, boolean>>) => {
    if (user?.role !== "admin_zelify" || !isAuditMode || !auditOrganizationId) return;
    setVisibleModules((current) => ({
      kyb: visibilityPayload.showKyb ?? visibilityPayload.kyb ?? current.kyb,
      pldAml: visibilityPayload.showPldAml ?? visibilityPayload.pldAml ?? current.pldAml,
      technical:
        visibilityPayload.showTechnical ?? visibilityPayload.technical ?? current.technical,
      businessPlan:
        visibilityPayload.showBusinessPlan ??
        visibilityPayload.businessPlan ??
        current.businessPlan,
      companyInfo:
        visibilityPayload.showCompanyInfo ??
        visibilityPayload.companyInfo ??
        current.companyInfo,
      satKyc: visibilityPayload.showSatKyc ?? visibilityPayload.satKyc ?? current.satKyc,
    }));
  }, [user, isAuditMode, auditOrganizationId]);
  // ==========================================
  // PROPIETARIOS KYB (captura) + SCREENING AML
  // ==========================================

  const syncOwnerToKycList = useCallback((member: AmlMember) => {
    setKycMembersList((current) => {
      const alreadyExists = current.some((kycMember) =>
        isSameKycIdentity(kycMember, member),
      );
      if (alreadyExists) return current;

      const updated = [
        ...current,
        {
          id: `kyc-${member.id}`,
          name: member.name,
          email: member.email,
          role: member.role,
          rfc: member.rfc,
          curp: member.curp,
          kycStatus: "pending",
          kycDetails: null,
        },
      ];

      if (typeof window !== "undefined") {
        localStorage.setItem("zelify_sim_members", JSON.stringify(updated));
      }

      return updated;
    });
  }, []);

  const registerOwner = useCallback(
    (memberData: {
      name: string;
      email: string;
      role: string;
      ownershipPercent: number;
      rfc: string;
      curp: string;
    }) => {
      const newMember: AmlMember = {
        id: Math.random().toString(36).substring(2, 11),
        name: memberData.name,
        email: memberData.email,
        role: memberData.role as AmlMember["role"],
        ownershipPercent: memberData.ownershipPercent,
        rfc: memberData.rfc,
        curp: memberData.curp,
        ineDocument: null,
        screeningStatus: "pending",
        screeningDetails: null,
      };

      setOwnersList((current) => {
        const updated = [...current, newMember];
        persistOwners(updated);
        syncOwnersFromAmlMembers(updated);
        return updated;
      });

      syncOwnerToKycList(newMember);
    },
    [persistOwners, syncOwnersFromAmlMembers, syncOwnerToKycList],
  );

  const updateOwner = useCallback(
    (
      memberId: string,
      memberData: Partial<{
        name: string;
        email: string;
        role: string;
        ownershipPercent: number;
        rfc: string;
        curp: string;
      }>,
    ) => {
      setOwnersList((current) => {
        const updated = current.map((member) =>
          member.id === memberId
            ? {
                ...member,
                ...(memberData.name !== undefined ? { name: memberData.name } : {}),
                ...(memberData.email !== undefined ? { email: memberData.email } : {}),
                ...(memberData.role !== undefined
                  ? { role: memberData.role as AmlMember["role"] }
                  : {}),
                ...(memberData.ownershipPercent !== undefined
                  ? { ownershipPercent: memberData.ownershipPercent }
                  : {}),
                ...(memberData.rfc !== undefined ? { rfc: memberData.rfc } : {}),
                ...(memberData.curp !== undefined ? { curp: memberData.curp } : {}),
              }
            : member,
        );
        persistOwners(updated);
        syncOwnersFromAmlMembers(updated);
        return updated;
      });
    },
    [persistOwners, syncOwnersFromAmlMembers],
  );

  const removeOwner = useCallback(
    (memberId: string) => {
      setOwnersList((current) => {
        const updated = current.filter((member) => member.id !== memberId);
        persistOwners(updated);
        syncOwnersFromAmlMembers(updated);
        return updated;
      });
    },
    [persistOwners, syncOwnersFromAmlMembers],
  );

  const setOwnerIneDocument = useCallback(
    (memberId: string, fileName: string | null) => {
      setOwnersList((current) => {
        const updated = current.map((member) =>
          member.id === memberId ? { ...member, ineDocument: fileName } : member,
        );
        persistOwners(updated);
        return updated;
      });
    },
    [persistOwners],
  );

  const startOwnerScreening = useCallback(
    (memberId: string) => {
      setOwnersList((current) => {
        const updated = current.map((member) =>
          member.id === memberId
            ? {
                ...member,
                screeningStatus: "validating" as const,
                screeningDetails: null,
                screeningStartedAt: Date.now(),
              }
            : member,
        );
        persistOwners(updated);
        return updated;
      });
    },
    [persistOwners],
  );

  // ==========================================
  // SIMULADOR INTERACTIVO SAT & KYC INDIVIDUAL
  // ==========================================

  const registerKycMember = useCallback((memberData: KycMemberInput) => {
    let wasRegistered = false;

    setKycMembersList((current) => {
      const alreadyExists = current.some((member) => isSameKycIdentity(member, memberData));
      if (alreadyExists) {
        return current;
      }

      const newMember = {
        id: Math.random().toString(36).substring(2, 11),
        ...memberData,
        kycStatus: "pending",
        kycDetails: null,
      };
      const updated = [...current, newMember];
      wasRegistered = true;

      if (typeof window !== "undefined") {
        localStorage.setItem("zelify_sim_members", JSON.stringify(updated));
      }
      return updated;
    });

    return wasRegistered;
  }, []);

  const updateKycStatus = useCallback((memberId: string, status: "pending" | "approved" | "rejected" | "validating", observations?: string | null) => {
    setKycMembersList((current) => {
      const updated = current.map((m) => {
        if (m.id === memberId) {
          return {
            ...m,
            kycStatus: status,
            kycDetails: observations || null,
            kycStartedAt: status === "validating" ? Date.now() : m.kycStartedAt,
          };
        }
        return m;
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("zelify_sim_members", JSON.stringify(updated));
      }

      // Re-calcular progreso
      const approvedCount = updated.filter((m) => m.kycStatus === "approved").length;
      const progressPercent = updated.length > 0 ? Math.round((approvedCount / updated.length) * 50) : 0;
      const satBonus = satConnected ? 50 : 0;

      setProgress((prev) => ({
        ...prev,
        satKyc: progressPercent + satBonus,
      }));

      return updated;
    });
  }, [satConnected]);

  const connectSatSimulator = useCallback(async (rfc: string) => {
    console.log(`[SAT Simulator]: Iniciando sincronización para RFC ${rfc}...`);
    
    // Simular latencia de red
    await new Promise((resolve) => setTimeout(resolve, 3500));

    const normalizedRfc = rfc.trim().toUpperCase();
    const companyLegalName =
      typeof answers["1.1.1"] === "string" && answers["1.1.1"].trim().length > 0
        ? answers["1.1.1"].trim()
        : demoSatFiscalData.legalName;
    const companyRegistrationDate =
      typeof answers["1.1.7"] === "string" && answers["1.1.7"].trim().length > 0
        ? answers["1.1.7"].trim()
        : demoSatFiscalData.registrationDate;

    const registeredAt = new Date(companyRegistrationDate);
    const now = new Date();
    let yearsActive = demoSatFiscalData.yearsActive;

    if (!Number.isNaN(registeredAt.getTime())) {
      yearsActive = now.getFullYear() - registeredAt.getFullYear();
      const hasNotReachedAnniversary =
        now.getMonth() < registeredAt.getMonth() ||
        (now.getMonth() === registeredAt.getMonth() && now.getDate() < registeredAt.getDate());
      if (hasNotReachedAnniversary) {
        yearsActive -= 1;
      }
      yearsActive = Math.max(yearsActive, 0);
    }

    const simulatedData = {
      ...demoSatFiscalData,
      rfc: normalizedRfc,
      legalName: companyLegalName,
      registrationDate: companyRegistrationDate,
      declarations: [
        { month: "Dic 2025", status: "Presentada", total: "$124,512.43" },
        { month: "Ene 2026", status: "Presentada", total: "$142,308.55" },
        { month: "Feb 2026", status: "Presentada", total: "$138,924.12" },
        { month: "Mar 2026", status: "Presentada", total: "$156,011.89" },
        { month: "Abr 2026", status: "Presentada", total: "$165,432.70" },
        { month: "May 2026", status: "Presentada", total: "$172,110.36" },
      ],
      averageIncome: "$149,883.34",
      financialHealthScore: "A+",
      riskIndicator: "Bajo",
      yearsActive,
    };

    setSatConnected(true);
    setSatFiscalData(simulatedData);
    
    if (typeof window !== "undefined") {
      localStorage.setItem("zelify_sim_sat_connected", "true");
      localStorage.setItem("zelify_sim_sat_fiscal", JSON.stringify(simulatedData));
    }

    setProgress((prev) => {
      const approvedCount = kycMembersList.filter((m) => m.kycStatus === "approved").length;
      const progressPercent = kycMembersList.length > 0 ? Math.round((approvedCount / kycMembersList.length) * 50) : 0;
      return {
        ...prev,
        satKyc: progressPercent + 50,
      };
    });
  }, [answers, kycMembersList]);

  const resetSatKycSimulation = useCallback(() => {
    console.log("[SAT Simulator]: Reiniciando todos los datos de simulación.");
    setKycMembersList([]);
    setSatConnected(false);
    setSatFiscalData(null);
    
    if (typeof window !== "undefined") {
      localStorage.removeItem("zelify_sim_members");
      localStorage.removeItem("zelify_sim_sat_connected");
      localStorage.removeItem("zelify_sim_sat_fiscal");
    }

    setProgress((prev) => ({
      ...prev,
      satKyc: 0,
    }));
  }, []);


  const value = useMemo(
    () => ({
      progress,
      visibleModules,
      isSidebarCollapsed,
      isMobileSidebarOpen,
      kybLocked: moduleLocked.kyb,
      kybSubmitted: moduleSubmitted.kyb,
      kybStatusMessage: moduleStatusMessage.kyb,
      toggleSidebar,
      openMobileSidebar,
      closeMobileSidebar,
      submitKybDocumentation,
      submitSectionDocumentation,
      moduleSubmitted,
      moduleLocked,
      moduleStatusMessage,
      answers,
      updateAnswer,
      saveIndividualAnswer,
      
      // Estados y acciones de red reales
      isAuthenticated,
      user,
      isLoading,
      logout,
      saveSectionAnswers,
      uploadFileAnswer,
      deleteFileAnswer,
      downloadFileUrl,
      requirementsMetadata,

      // Capacidades Admin
      auditOrganizationId,
      isAuditMode,
      organizationsList,
      usersList,
      startAudit,
      stopAudit,
      fetchOrganizations,
      createOrganization,
      updateOrganization,
      deleteOrganization,
      fetchUsers,
      createUser,
      updateUser,
      deleteUser,
      verifyRequirementAnswer,
      updateVisibility,

      ownersList,
      registerOwner,
      updateOwner,
      removeOwner,
      setOwnerIneDocument,
      startOwnerScreening,

      // Simulador SAT & KYC
      kycMembersList,
      satConnected,
      satFiscalData,
      registerKycMember,
      updateKycStatus,
      connectSatSimulator,
      resetSatKycSimulation,
    }),
    [
      closeMobileSidebar,
      isMobileSidebarOpen,
      isSidebarCollapsed,
      moduleLocked,
      moduleStatusMessage,
      moduleSubmitted,
      openMobileSidebar,
      progress,
      submitKybDocumentation,
      submitSectionDocumentation,
      toggleSidebar,
      visibleModules,
      answers,
      updateAnswer,
      saveIndividualAnswer,
      
      isAuthenticated,
      user,
      isLoading,
      logout,
      saveSectionAnswers,
      uploadFileAnswer,
      deleteFileAnswer,
      downloadFileUrl,
      requirementsMetadata,

      auditOrganizationId,
      isAuditMode,
      organizationsList,
      usersList,
      startAudit,
      stopAudit,
      fetchOrganizations,
      createOrganization,
      updateOrganization,
      deleteOrganization,
      fetchUsers,
      createUser,
      updateUser,
      deleteUser,
      verifyRequirementAnswer,
      updateVisibility,

      ownersList,
      registerOwner,
      updateOwner,
      removeOwner,
      setOwnerIneDocument,
      startOwnerScreening,

      kycMembersList,
      satConnected,
      satFiscalData,
      registerKycMember,
      updateKycStatus,
      connectSatSimulator,
      resetSatKycSimulation,
    ],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider.");
  }

  return context;
}
