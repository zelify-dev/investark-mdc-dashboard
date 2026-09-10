"use client";

import { useState, useEffect, useTransition } from "react";
import { useOnboarding } from "@/modules/kyb/components/onboarding-provider";
import { demoSatCredentials } from "@/modules/kyb/lib/demo-prefill";
import {
  Users,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Lock,
  RefreshCw,
  FileSpreadsheet,
  ArrowRight,
  Plus,
} from "lucide-react";

const PRELOADED_KYC_MEMBERS: Array<{
  name: string;
  email: string;
  role: string;
  rfc: string;
  curp: string;
}> = [
  {
    name: "Adriana López Serrano",
    email: "adriana.lopez@nexopay.com.mx",
    role: "CEO",
    rfc: "LOSA900214MZ8",
    curp: "LOSA900214MNLPDR03",
  },
  {
    name: "Jorge Medina Palacios",
    email: "jorge.medina@nexopay.com.mx",
    role: "CFO",
    rfc: "MEPJ880731KQ2",
    curp: "MEPJ880731HNEDLR07",
  },
  {
    name: "Daniela Cruz Ortega",
    email: "daniela.cruz@nexopay.com.mx",
    role: "Representante",
    rfc: "CUOD910526TR4",
    curp: "CUOD910526MNLRRG08",
  },
  {
    name: "Mauricio Peña Salgado",
    email: "mauricio.pena@nexopay.com.mx",
    role: "Socio",
    rfc: "PESM870903DA1",
    curp: "PESM870903HDFXLR02",
  },
  {
    name: "Fernanda Ríos Villaseñor",
    email: "fernanda.rios@nexopay.com.mx",
    role: "CEO",
    rfc: "RIVF920118PU6",
    curp: "RIVF920118MJCLSR01",
  },
];

export default function SatKycSimulationPage() {
  const {
    answers,
    kycMembersList,
    satConnected,
    satFiscalData,
    registerKycMember,
    updateKycStatus,
    connectSatSimulator,
    resetSatKycSimulation,
    user,
  } = useOnboarding();

  const [activeTab, setActiveTab] = useState<"kyc" | "sat">("kyc");
  const [isPending, startTransition] = useTransition();
  const [currentPresetIndex, setCurrentPresetIndex] = useState(0);

  // Estados del Formulario de Miembros
  const [memberName, setMemberName] = useState(PRELOADED_KYC_MEMBERS[0].name);
  const [memberEmail, setMemberEmail] = useState(PRELOADED_KYC_MEMBERS[0].email);
  const [memberRole, setMemberRole] = useState(PRELOADED_KYC_MEMBERS[0].role);
  const [memberRfc, setMemberRfc] = useState(PRELOADED_KYC_MEMBERS[0].rfc);
  const [memberCurp, setMemberCurp] = useState(PRELOADED_KYC_MEMBERS[0].curp);
  const [formError, setFormError] = useState<string | null>(null);

  // Estados del Modal de KYC
  const [activeKycMember, setActiveKycMember] = useState<any | null>(null);
  const [kycStep, setKycStep] = useState(1);
  const [ineUploaded, setIneUploaded] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [facialScanned, setFacialScanned] = useState(false);
  const [isFacialScanning, setIsFacialScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isRenapoChecking, setIsRenapoChecking] = useState(false);

  // Estados del Login SAT
  const [satRfc, setSatRfc] = useState(demoSatCredentials.rfc);
  const [satPassword, setSatPassword] = useState(demoSatCredentials.password);
  const [simFailSat, setSimFailSat] = useState(false);
  const [satError, setSatError] = useState<string | null>(null);
  const [satSyncStep, setSatSyncStep] = useState(0);
  const [isSatConnecting, setIsSatConnecting] = useState(false);
  // Autocompletar RFC de la empresa desde onboarding o sesión
  useEffect(() => {
    if (typeof answers["1.1.8"] === "string" && answers["1.1.8"].trim().length > 0) {
      setSatRfc(answers["1.1.8"].trim().toUpperCase());
      return;
    }

    if (user?.organization_rfc) {
      setSatRfc(user.organization_rfc);
    }
  }, [answers, user]);

  useEffect(() => {
    const preset = PRELOADED_KYC_MEMBERS[currentPresetIndex];
    if (!preset) return;

    setMemberName(preset.name);
    setMemberEmail(preset.email);
    setMemberRole(preset.role);
    setMemberRfc(preset.rfc);
    setMemberCurp(preset.curp);
  }, [currentPresetIndex]);

  useEffect(() => {
    const usedEmails = new Set(kycMembersList.map((member) => member.email.toLowerCase()));
    const currentPreset = PRELOADED_KYC_MEMBERS[currentPresetIndex];

    if (!currentPreset || !usedEmails.has(currentPreset.email.toLowerCase())) {
      return;
    }

    const nextPresetIndex = findNextPresetIndex(currentPresetIndex, usedEmails);
    if (nextPresetIndex !== currentPresetIndex) {
      setCurrentPresetIndex(nextPresetIndex);
    }
  }, [currentPresetIndex, kycMembersList]);

  const findNextPresetIndex = (startIndex: number, usedEmails: Set<string>) => {
    for (let offset = 1; offset <= PRELOADED_KYC_MEMBERS.length; offset += 1) {
      const nextIndex = (startIndex + offset) % PRELOADED_KYC_MEMBERS.length;
      const nextPreset = PRELOADED_KYC_MEMBERS[nextIndex];
      if (!usedEmails.has(nextPreset.email.toLowerCase())) {
        return nextIndex;
      }
    }

    return startIndex;
  };

  // Validación automática en el paso 4 de KYC individual (simulando backend real)
  useEffect(() => {
    if (kycStep === 4 && activeKycMember) {
      const runAutomaticVerification = async () => {
        setIsRenapoChecking(true);
        // Esperar 3 segundos para dar sensación de procesamiento y cruce de datos real
        await new Promise((resolve) => setTimeout(resolve, 3000));
        
        const nameLower = activeKycMember.name.toLowerCase();
        const emailLower = activeKycMember.email.toLowerCase();
        // Si el nombre o correo contiene la palabra error/fallo/rechazo, simulamos un rechazo de biometría
        const isTriggerFailure = 
          nameLower.includes("error") || 
          nameLower.includes("fallo") || 
          nameLower.includes("rechazo") ||
          emailLower.includes("error") ||
          emailLower.includes("fallo") ||
          emailLower.includes("rechazo");

        const finalStatus = isTriggerFailure ? "rejected" : "approved";
        
        updateKycStatus(
          activeKycMember.id,
          finalStatus,
          finalStatus === "rejected" ? "La biometría facial no coincide plenamente con el registro de INE o RENAPO." : null
        );

        setIsRenapoChecking(false);
        setActiveKycMember(null);
      };

      runAutomaticVerification();
    }
  }, [kycStep, activeKycMember, updateKycStatus]);

  // Manejar registro de miembro
  const handleRegisterMember = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!memberName.trim() || !memberEmail.trim() || !memberRfc.trim() || !memberCurp.trim()) {
      setFormError("Todos los campos del miembro son obligatorios.");
      return;
    }

    if (memberRfc.length < 13) {
      setFormError("El RFC físico de una persona debe tener exactamente 13 caracteres.");
      return;
    }

    if (memberCurp.length < 18) {
      setFormError("El CURP debe tener exactamente 18 caracteres.");
      return;
    }

    const wasRegistered = registerKycMember({
      name: memberName.trim(),
      email: memberEmail.trim().toLowerCase(),
      role: memberRole,
      rfc: memberRfc.trim().toUpperCase(),
      curp: memberCurp.trim().toUpperCase(),
    });

    if (!wasRegistered) {
      setFormError("Ese miembro ya existe en la lista KYC. Revise correo, RFC o CURP.");
      return;
    }

    const usedEmails = new Set(
      [...kycMembersList, { email: memberEmail.trim().toLowerCase() }].map((member) =>
        member.email.toLowerCase(),
      ),
    );
    const nextPresetIndex = findNextPresetIndex(currentPresetIndex, usedEmails);
    setCurrentPresetIndex(nextPresetIndex);
  };

  // Iniciar flujo KYC
  const startKycFlow = (member: any) => {
    setActiveKycMember(member);
    setKycStep(1);
    setIneUploaded(false);
    setProofUploaded(false);
    setFacialScanned(false);
    setScanProgress(0);
    setIsRenapoChecking(false);
  };

  // Simular escaneo facial
  const handleFacialScan = () => {
    setIsFacialScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsFacialScanning(false);
          setFacialScanned(true);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  // Confirmar resultado KYC
  const finishKycSimulation = async (status: "approved" | "rejected") => {
    setIsRenapoChecking(true);
    // Simular cruce de datos
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    updateKycStatus(
      activeKycMember.id,
      status,
      status === "rejected" ? "La biometría facial no coincide plenamente con el registro de INE." : null
    );

    setIsRenapoChecking(false);
    setActiveKycMember(null);
  };

  // Iniciar Conexión SAT
  const handleConnectSat = async (e: React.FormEvent) => {
    e.preventDefault();
    setSatError(null);

    if (!satRfc.trim() || !satPassword.trim()) {
      setSatError("Por favor, ingrese el RFC de la empresa y su contraseña CIEC.");
      return;
    }

    if (satRfc.trim().length !== 12) {
      setSatError("El RFC de una persona moral (empresa) debe tener exactamente 12 caracteres.");
      return;
    }

    setIsSatConnecting(true);
    setSatSyncStep(1);

    // Simular logs progresivos de red
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSatSyncStep(2);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const isPasswordError =
        satPassword.toLowerCase() === "error" ||
        satPassword.toLowerCase() === "fallo" ||
        satPassword.toLowerCase() === "incorrecto";
      if (isPasswordError) {
        throw new Error("Credenciales inválidas ante el SAT (RFC o Contraseña CIEC incorrectos).");
      }

      setSatSyncStep(3);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSatSyncStep(4);
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSatSyncStep(5);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await connectSatSimulator(satRfc.trim());
    } catch (err: any) {
      setSatError(err.message || "Error al sincronizar con el SAT.");
    } finally {
      setIsSatConnecting(false);
      setSatSyncStep(0);
    }
  };

  const kycApprovedCount = kycMembersList.filter((m) => m.kycStatus === "approved").length;

  return (
    <div className="max-w-[1380px] bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.01)] space-y-6">
      {/* Encabezado Principal */}
      <div className="border-b border-slate-100 pb-5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
            Módulo de Verificación
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl mt-1">
            Conexión
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 max-w-3xl">
            Complete la validación de identidad (Liveness Check individual) de los miembros registrados y autorice la sincronización tributaria automática ante el SAT para la evaluación de cumplimiento.
          </p>
        </div>
      </div>

      {/* Tabs Navegación Interna */}
      <div className="flex border-b border-slate-100 text-xs font-semibold uppercase tracking-wider">
        <button
          onClick={() => setActiveTab("kyc")}
          className={[
            "px-4 py-2.5 border-b-2 -mb-[2px] transition-all",
            activeTab === "kyc"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-400 hover:text-slate-700",
          ].join(" ")}
        >
          1. Miembros y Verificación Individual
        </button>
        <button
          onClick={() => setActiveTab("sat")}
          className={[
            "px-4 py-2.5 border-b-2 -mb-[2px] transition-all",
            activeTab === "sat"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-400 hover:text-slate-700",
          ].join(" ")}
        >
          2. Conexión Fiscal
        </button>
      </div>

      {/* ========================================== */}
      {/* PESTAÑA 1: MIEMBROS & VERIFICACION INDIVIDUAL       */}
      {/* ========================================== */}
      {activeTab === "kyc" && (
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
          {/* Formulario Registro de Miembro */}
          <div className="lg:col-span-1 border border-slate-200/80 rounded-xl p-5 space-y-4 h-fit bg-slate-50/20">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Plus size={14} />
              <span>Registrar Miembro</span>
            </h3>
            
            <form onSubmit={handleRegisterMember} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Ej. Juan Proaño"
                  className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-950 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="juan@empresa.com"
                  className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-950 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Rol Operativo
                  </label>
                  <select
                    value={memberRole}
                    onChange={(e) => setMemberRole(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-slate-950 focus:outline-none"
                  >
                    <option value="CEO">CEO / Dir Gral</option>
                    <option value="CFO">CFO / Finanzas</option>
                    <option value="Socio">Socio / Accionista</option>
                    <option value="Representante">Representante Legal</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    RFC Físico
                  </label>
                  <input
                    type="text"
                    value={memberRfc}
                    onChange={(e) => setMemberRfc(e.target.value)}
                    placeholder="13 caracteres"
                    maxLength={13}
                    className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-950 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  CURP
                </label>
                <input
                  type="text"
                  value={memberCurp}
                  onChange={(e) => setMemberCurp(e.target.value)}
                  placeholder="18 caracteres"
                  maxLength={18}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-950 focus:outline-none uppercase"
                />
              </div>

              {formError && (
                <p className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center rounded-lg bg-slate-950 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-900"
              >
                <span>Registrar Miembro</span>
              </button>
            </form>
          </div>

          {/* Tabla de Miembros Registrados */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Users size={14} />
              <span>Miembros de la Organización</span>
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Nombre / Correo</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">CURP y RFC</th>
                    <th className="px-4 py-3">Estado Verificación</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {kycMembersList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No hay socios, accionistas o directivos registrados aún. Agréguelos en el formulario de la izquierda.
                      </td>
                    </tr>
                  ) : (
                    kycMembersList.map((member) => (
                      <tr key={member.id} className="hover:bg-slate-50/40">
                        <td className="px-4 py-3.5 font-semibold text-slate-800">
                          <div>{member.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono font-normal mt-0.5">
                            {member.email}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {member.role}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 font-mono text-[10px]">
                          <div>CURP: {member.curp}</div>
                          <div>RFC: {member.rfc}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          {member.kycStatus === "approved" ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 border border-emerald-100">
                              Aprobado
                            </span>
                          ) : member.kycStatus === "rejected" ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700 border border-rose-100">
                              Rechazado
                            </span>
                          ) : member.kycStatus === "validating" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-700 border border-sky-100">
                              <Loader2 className="h-3 w-3 animate-spin text-sky-600" />
                              <span>Validando</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600 border border-slate-200/50">
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {member.kycStatus === "approved" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 pr-2">
                              <CheckCircle2 size={13} />
                              <span>Validado</span>
                            </span>
                          ) : member.kycStatus === "validating" ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-sky-600 pr-2">
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-500 shrink-0" />
                              <span>Procesando</span>
                            </span>
                          ) : (
                            <a
                              href="https://pegalo-zelify.vercel.app/kyc-zelify?start=identity"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                updateKycStatus(member.id, "validating");
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all"
                            >
                              <ArrowRight size={13} />
                              <span>Completar verificación</span>
                            </a>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* PESTAÑA 2: SINCRONIZACIÓN SAT FISCAL       */}
      {/* ========================================== */}
      {activeTab === "sat" && (
        <div className="space-y-6">
          {!satConnected ? (
            /* Pantalla de Sincronización */
            <div className="max-w-xl mx-auto border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 bg-slate-50/10">
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-950 text-white">
                  <Lock size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Conexión e-firma
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Autorice la consulta automatizada de la información fiscal de su organización ante el Servicio de Administración Tributaria.
                </p>
              </div>

              {isSatConnecting ? (
                /* Proceso de Sincronización Progresivo */
                <div className="space-y-5 border border-slate-200/80 bg-white rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-800 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Estableciendo Conexión Fiscal...
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className={satSyncStep >= 1 ? "text-emerald-600 font-bold" : "text-slate-300"}>
                        {satSyncStep >= 2 ? "✓" : "●"}
                      </span>
                      <span className={satSyncStep >= 1 ? "text-slate-700 font-semibold" : ""}>
                        1. Conectando con sat.gob.mx en canal seguro...
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={satSyncStep >= 2 ? "text-emerald-600 font-bold" : "text-slate-300"}>
                        {satSyncStep >= 3 ? "✓" : "●"}
                      </span>
                      <span className={satSyncStep >= 2 ? "text-slate-700 font-semibold" : ""}>
                        2. Validando claves CIEC y credenciales tributarias...
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={satSyncStep >= 3 ? "text-emerald-600 font-bold" : "text-slate-300"}>
                        {satSyncStep >= 4 ? "✓" : "●"}
                      </span>
                      <span className={satSyncStep >= 3 ? "text-slate-700 font-semibold" : ""}>
                        3. Descargando Constancia de Situación Fiscal...
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={satSyncStep >= 4 ? "text-emerald-600 font-bold" : "text-slate-300"}>
                        {satSyncStep >= 5 ? "✓" : "●"}
                      </span>
                      <span className={satSyncStep >= 4 ? "text-slate-700 font-semibold" : ""}>
                        4. Consultando Opinión de Cumplimiento (Art. 32-D)...
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={satSyncStep >= 5 ? "text-emerald-600 font-bold" : "text-slate-300"}>
                        {satSyncStep >= 6 ? "✓" : "●"}
                      </span>
                      <span className={satSyncStep >= 5 ? "text-slate-700 font-semibold" : ""}>
                        5. Extrayendo histórico declarativo mensual...
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Formulario de Login */
                <form onSubmit={handleConnectSat} className="space-y-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      RFC de la Organización
                    </label>
                    <input
                      type="text"
                      value={satRfc}
                      onChange={(e) => setSatRfc(e.target.value)}
                      placeholder="Ej. ZEL160824ABC"
                      maxLength={12}
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-950 focus:outline-none uppercase"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      Contraseña Tributaria (CIEC)
                    </label>
                    <input
                      type="password"
                      value={satPassword}
                      onChange={(e) => setSatPassword(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-950 focus:outline-none"
                    />
                  </div>

                  {/* El interruptor de fallo de simulación se remueve de la UI para no evidenciar el mock. 
                      Para simular un fallo de credenciales, ingrese "error", "fallo" o "incorrecto" en la contraseña. */}

                  {satError && (
                    <p className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2.5">
                      {satError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center rounded-lg bg-slate-950 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-900 transition-all"
                  >
                    <span>Conectar e Importar del SAT</span>
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* Panel Fiscal Reportado */
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                    Reporte Fiscal de la Empresa
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Última sincronización en caliente con el SAT realizada con éxito.
                  </p>
                </div>
                <button
                  onClick={resetSatKycSimulation}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-all"
                >
                  <RefreshCw size={13} />
                  <span>Desconectar SAT</span>
                </button>
              </div>

              {satFiscalData && (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
                  {/* Ficha Fiscal */}
                  <div className="md:col-span-1 border border-slate-200 rounded-xl p-5 space-y-4 bg-slate-50/10">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Cédula de Identificación Fiscal
                    </h4>
                    <div className="space-y-3.5 text-xs text-slate-700">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Razón Social</p>
                        <p className="font-semibold text-slate-800 mt-0.5">{satFiscalData.legalName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">RFC</p>
                        <p className="font-mono text-slate-800 font-semibold mt-0.5">{satFiscalData.rfc}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Régimen</p>
                        <p className="text-slate-600 mt-0.5">{satFiscalData.regime}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Estatus</p>
                          <span className="inline-flex rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100 mt-0.5">
                            {satFiscalData.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Antigüedad</p>
                          <p className="text-slate-800 font-semibold mt-0.5">{satFiscalData.yearsActive} años</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cumplimiento e Ingresos */}
                  <div className="md:col-span-2 space-y-6">
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                      {/* Opinión de Cumplimiento */}
                      <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Opinión de Cumplimiento (32-D)
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shrink-0">
                            <ShieldCheck size={18} />
                          </span>
                          <span className="text-sm font-bold text-emerald-700">
                            OPINIÓN POSITIVA
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          El contribuyente se encuentra totalmente al corriente en la declaración y pago de sus impuestos federales ante el fisco.
                        </p>
                      </div>

                      {/* Score Financiero */}
                      <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Evaluación Financiera
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Salud Fiscal</p>
                            <p className="text-2xl font-bold text-slate-900 mt-0.5">{satFiscalData.financialHealthScore}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Ingreso Promedio</p>
                            <p className="text-sm font-bold text-slate-800 mt-1">{satFiscalData.averageIncome}</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Nivel de riesgo estimado para crédito comercial: <span className="font-bold text-emerald-600">BAJO</span>.
                        </p>
                      </div>
                    </div>

                    {/* Historial de Declaraciones */}
                    <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <FileSpreadsheet size={14} className="text-slate-500" />
                        <span>Historial de Declaraciones Mensuales Sincronizadas</span>
                      </h4>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/20 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              <th className="px-3 py-2">Periodo</th>
                              <th className="px-3 py-2">Estado ante el SAT</th>
                              <th className="px-3 py-2 text-right">Impuesto Determinado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {satFiscalData.declarations.map((decl: any) => (
                              <tr key={decl.month} className="hover:bg-slate-50/30">
                                <td className="px-3 py-2 font-semibold text-slate-700">{decl.month}</td>
                                <td className="px-3 py-2 text-emerald-600 font-semibold">{decl.status}</td>
                                <td className="px-3 py-2 text-right text-slate-800 font-mono">{decl.total}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* El modal se reemplazó por la redirección externa a pegalo-zelify.vercel.app */}
    </div>
  );
}
