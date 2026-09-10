import { DEFAULT_RULES } from "@/modules/cortex/data/credit-catalog";
import type { CreditReportPayload, CreditReportRuleRow } from "../types/credit-report.types";

function monthlyPayment(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 100 / 12;
  return Math.round((principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1));
}

function buildRules(): CreditReportRuleRow[] {
  const rules = DEFAULT_RULES.automotriz;
  const verdictMap: Record<string, { verdict: CreditReportRuleRow["verdict"]; detail: string; policyRef?: string }> = {
    "r-auto-buro": { verdict: "CUMPLE", detail: "Puntaje Buró 738 (mínimo 650). Mejor historial que ~82% de reportados en México." },
    "r-auto-enganche": { verdict: "CUMPLE", detail: "Enganche 20%: $63,980 MXN de recursos propios; transferencia validada contra cotización de agencia." },
    "r-auto-mora": { verdict: "CUMPLE", detail: "Sin atrasos reportados; todos sus créditos aparecen al corriente." },
    "r-auto-kyc": { verdict: "CUMPLE", detail: "INE y selfie coinciden; no figura como funcionario público (PEP)." },
    "r-auto-capacidad": { verdict: "CUMPLE", detail: "La mensualidad usaría 14.5% del sueldo neto; por debajo del tope de política (35%)." },
    "r-auto-monto": { verdict: "CUMPLE", detail: "Solicita $255,920 MXN; dentro del rango permitido por producto y política comercial." },
    "r-auto-plazo": { verdict: "CUMPLE", detail: "4 años (48 pagos mensuales); dentro del rango de 1 a 5 años." },
    "r-auto-modelo": { verdict: "CUMPLE", detail: "KIA Soluto 2025; vehículo nuevo y elegible conforme a política de antigüedad." },
    "r-auto-seguro": { verdict: "CUMPLE", detail: "Cotización de seguro de cobertura amplia vigente por 12 meses." },
    "r-auto-factura": { verdict: "CUMPLE", detail: "Proforma y documentación comercial de agencia KIA en orden." },
    "r-auto-nomina": { verdict: "CUMPLE", detail: "Puede domiciliar nómina en Atlas; aplica descuento en la tasa." },
    "r-auto-tdc": { verdict: "CUMPLE", detail: "Tarjeta BBVA activa; usa 44.5% del límite (aceptable)." },
  };

  return rules
    .filter((r) => r.id !== "r-auto-eco")
    .map((r) => ({
    id: r.id,
    group: r.group ?? "validacion",
    label: r.label,
    description: r.description,
    verdict: verdictMap[r.id]?.verdict ?? "CUMPLE",
    detail: verdictMap[r.id]?.detail ?? "Validación satisfactoria",
    bpsDiscount: r.bpsDiscount,
    policyRef: verdictMap[r.id]?.policyRef,
  }));
}

export function buildJuanFernandoCreditReport(prompt: string): CreditReportPayload {
  const amount = 255_920;
  const rate = 14.25;
  const term = 48;
  const payment = monthlyPayment(amount, rate, term);
  const income = 48_500;
  const pti = Math.round((payment / income) * 1000) / 10;
  const rules = buildRules();

  return {
    reportId: `RPT-MX-2026-${String(Date.now()).slice(-6)}`,
    generatedAt: new Date().toISOString(),
    promptUsed: prompt,
    meta: {
      institution: "Zelify Financial Services México, S.A. de C.V.",
      branch: "Sucursal Corporativa · Ciudad de México",
      analyst: "María Elena Ríos · Oficial de Crédito Nivel II",
      channel: "Originación digital · App móvil + validación presencial",
      confidentiality: "CONFIDENCIAL · Uso exclusivo para análisis crediticio · LFPDPPP",
      validUntil: "2026-07-23",
    },
    subject: {
      id: "CL-RPT-2026-004821",
      fullName: "JUAN FERNANDO MENDEZ ORTIZ",
      curp: "MEOJ980415HDFNRR03",
      rfc: "MEOJ980415H68",
      ine: "MEOJ980415HDFNRR03",
      birthDate: "1998-04-15",
      age: 28,
      nationality: "Mexicana",
      maritalStatus: "Soltero",
      dependents: 0,
      email: "juan.fernando.mendez@outlook.com",
      phone: "+52 55 8234 9012",
      address: "Calz. Legaria 549, Int. 402, Col. Granada, Alcaldía Miguel Hidalgo, C.P. 11520, Ciudad de México",
      addressYears: 2.5,
      employer: "Grupo Financiero Atlas SA de CV",
      jobTitle: "Analista Senior de Tecnología",
      employmentYears: 4.2,
      employmentType: "Relación laboral subordinada · tiempo completo",
      incomeGrossMonthly: 58_200,
      incomeNetMonthly: income,
      incomeVerifiedAt: "2026-05-20",
      productId: "AUTO-NVO-01",
      productName: "Crédito Automotriz Nuevo",
      productCategory: "Crédito Automotriz",
      requestedAmount: amount,
      downPaymentPct: 20,
      downPaymentAmount: 63_980,
      termMonths: term,
      baseRate: 15.0,
      finalRate: rate,
      monthlyPayment: payment,
      totalInterest: payment * term - amount,
      cat: 18.4,
      openingFee: 11_700,
      creditScore: 738,
      buroScore: 738,
      buroPercentile: 82,
      buroRating: "Bueno",
      totalDebt: 185_400,
      creditAgeMonths: 76,
      inquiries6m: 2,
      inquiries12m: 4,
      maxMop: "01",
      delinquencies24m: 0,
      pep: false,
      kycStatus: "VERIFICADO",
      amlStatus: "APROBADO",
      amlRiskLevel: "BAJO",
      aiScore: 84,
      aiRecommendation:
        "El perfil es consistente con una operación automotriz de bajo monto relativo al ingreso. Procede con validación comercial final de la unidad, póliza y formalización del descuento por nómina.",
      decision: "APROBADO",
      decisionSummary:
        "Cumple con identidad, screening AML, historial crediticio y política de pago. La operación presenta una relación pago/ingreso conservadora (14.5%), enganche acreditado y documentación comercial consistente.",
      conditions: [
        "Entregar póliza de seguro de cobertura amplia endosada a favor de Zelify antes del desembolso.",
        "Transferir el enganche de $63,980 MXN a la agencia y adjuntar comprobante SPEI definitivo.",
        "Domiciliar nómina en Zelify dentro de los primeros 90 días para conservar la bonificación de tasa.",
      ],
    },
    vehicle: {
      brand: "KIA",
      model: "Soluto",
      year: 2025,
      version: "EX TA · Sedán 4 puertas",
      value: 319_900,
      vin: "3KPA24AD7SE123456",
      insuranceQuote: 18_600,
    },
    kycCaptures: [
      {
        id: "cap-1",
        type: "ine_front",
        label: "INE · Credencial para votar (anverso)",
        capturedAt: "2026-05-22T14:32:18-06:00",
        device: "iPhone 15 Pro · Cámara 12MP · HDR",
        matchScore: 97.2,
        ocrConfidence: 99.1,
        geolocation: "19.4401° N, 99.2006° W · CDMX",
      },
      {
        id: "cap-2",
        type: "ine_back",
        label: "INE · Credencial para votar (reverso)",
        capturedAt: "2026-05-22T14:32:41-06:00",
        device: "iPhone 15 Pro · Cámara trasera",
        ocrConfidence: 98.4,
        geolocation: "19.4401° N, 99.2006° W · CDMX",
      },
      {
        id: "cap-3",
        type: "selfie",
        label: "Prueba de vida + coincidencia facial",
        capturedAt: "2026-05-22T14:33:05-06:00",
        device: "Zelify Identity SDK v3.2 · Liveness 3D",
        livenessScore: 98.6,
        matchScore: 96.8,
        geolocation: "19.4401° N, 99.2006° W · CDMX",
      },
      {
        id: "cap-4",
        type: "proof_address",
        label: "Comprobante de domicilio · CFE",
        capturedAt: "2026-05-22T14:34:12-06:00",
        device: "Escaneo PDF certificado · Abr 2026",
        ocrConfidence: 96.2,
        geolocation: "Coincide con domicilio declarado",
      },
    ],
    amlChecks: [
      { listName: "OFAC · SDN List", provider: "Refinitiv World-Check", result: "SIN_COINCIDENCIAS", checkedAt: "2026-05-22T14:35:00-06:00", reference: "WC-20260522-88421", riskLevel: "BAJO" },
      { listName: "ONU · Lista consolidada", provider: "Refinitiv World-Check", result: "SIN_COINCIDENCIAS", checkedAt: "2026-05-22T14:35:01-06:00", reference: "WC-20260522-88421", riskLevel: "BAJO" },
      { listName: "UE · Sanciones financieras", provider: "Refinitiv World-Check", result: "SIN_COINCIDENCIAS", checkedAt: "2026-05-22T14:35:01-06:00", reference: "WC-20260522-88421", riskLevel: "BAJO" },
      { listName: "SAT · Artículo 69-B", provider: "Servicio de verificación fiscal MX", result: "SIN_COINCIDENCIAS", checkedAt: "2026-05-22T14:35:02-06:00", riskLevel: "BAJO" },
      { listName: "PEP · Nacional e internacional", provider: "CNBV / UIF / World-Check", result: "SIN_COINCIDENCIAS", checkedAt: "2026-05-22T14:35:03-06:00", riskLevel: "BAJO" },
      { listName: "Listas restrictivas CNBV", provider: "Motor AML Zelify", result: "SIN_COINCIDENCIAS", checkedAt: "2026-05-22T14:35:04-06:00", riskLevel: "BAJO" },
      { listName: "UIF · Personas bloqueadas", provider: "Unidad de Inteligencia Financiera", result: "SIN_COINCIDENCIAS", checkedAt: "2026-05-22T14:35:04-06:00", riskLevel: "BAJO" },
      { listName: "Buró · Lista de bloqueo interna", provider: "Buró de Crédito", result: "SIN_COINCIDENCIAS", checkedAt: "2026-05-22T14:35:05-06:00", riskLevel: "BAJO" },
      { listName: "INTERPOL · Notificación roja", provider: "Refinitiv World-Check", result: "SIN_COINCIDENCIAS", checkedAt: "2026-05-22T14:35:05-06:00", riskLevel: "BAJO" },
    ],
    buroTradelines: [
      { creditor: "BBVA México", product: "TDC Visa Platinum", balance: 42_300, limit: 95_000, mop: "01", status: "Al corriente", opened: "2019-03", paymentHistory: "48/48 al corriente", utilizationPct: 44.5 },
      { creditor: "Nu México", product: "TDC Mastercard", balance: 8_200, limit: 25_000, mop: "01", status: "Al corriente", opened: "2021-08", paymentHistory: "44/44 al corriente", utilizationPct: 32.8 },
      { creditor: "Mercado Pago", product: "Préstamo personal", balance: 134_900, limit: 280_000, mop: "01", status: "Al corriente", opened: "2023-01", paymentHistory: "38/38 al corriente", utilizationPct: 48.2 },
    ],
    buroScoreHistory: [
      { period: "May 2026", score: 738 },
      { period: "Feb 2026", score: 725 },
      { period: "Nov 2025", score: 718 },
      { period: "Ago 2025", score: 705 },
      { period: "May 2025", score: 692 },
      { period: "Feb 2025", score: 685 },
    ],
    rules,
    rateCascade: [
      { label: "Tasa inicial (sin descuentos)", rate: 15.0 },
      { label: "Descuento por domiciliar la nómina", rate: 14.5, deltaBps: -50 },
      { label: "Descuento por tarjeta de crédito activa", rate: 14.25, deltaBps: -25 },
    ],
    incomeBreakdown: [
      { concept: "Sueldo base", amount: 42_000, verified: true, source: "Recibo nómina Atlas · Abr 2026" },
      { concept: "Bono anual prorrateado", amount: 8_500, verified: true, source: "Estado de cuenta nómina" },
      { concept: "Vales de despensa", amount: 2_800, verified: true, source: "Comprobante RH" },
      { concept: "Otros ingresos", amount: 4_900, verified: false, source: "Declaración cliente · no considerado" },
    ],
    capacity: {
      paymentToIncome: pti,
      maxAllowedPti: 35,
      disposableIncome: income - payment - 12_400,
      debtToIncome: 38.2,
      maxLoanByIncome: income * 18,
      recommendedAmount: amount,
      cushionMonths: 3.2,
      fixedObligations: 12_400,
      freeCashFlow: income - payment - 12_400,
    },
    crossSellAccepted: [
      { label: "Seguro automotriz cobertura amplia", bps: 0 },
      { label: "Cuenta eje para domiciliación", bps: 0 },
    ],
    executiveSummary: [
      `Solicita un crédito automotriz por $255,920 MXN a 48 meses para adquirir un KIA Soluto 2025.`,
      `Su puntaje en Buró es 738: mejor historial que aproximadamente el 82% de personas con reporte en México.`,
      `Identidad confirmada con INE y selfie; no aparece en listas de riesgo (lavado de dinero o sanciones).`,
      `Gana $48,500 MXN netos al mes; la mensualidad estimada consumiría 14.5% del ingreso, por debajo del umbral de política.`,
      `Paga a tiempo todos sus créditos actuales; no tiene moras en los últimos 2 años.`,
      `Cumple 12 de 12 validaciones aplicables; tasa final 14.25% anual tras bonificaciones por nómina y relación activa.`,
    ],
    riskFactors: [
      "Mantiene una obligación personal activa con utilización cercana al 48% del límite reportado.",
      "Se observan 2 consultas al Buró en los últimos 6 meses; nivel normal, pero se mantiene en monitoreo.",
    ],
    strengths: [
      "Siempre paga a tiempo: tarjetas y préstamos al corriente.",
      "Lleva más de 4 años en el mismo empleo; ingreso comprobado con nómina.",
      "Aporta $63,980 MXN de enganche (20% del valor de la unidad); reduce el monto financiado.",
      "Califica para bonificaciones de tasa por nómina domiciliada y relación activa con tarjeta.",
    ],
  };
}

export function resolveCreditReportFromPrompt(prompt: string): CreditReportPayload {
  return buildJuanFernandoCreditReport(prompt);
}
