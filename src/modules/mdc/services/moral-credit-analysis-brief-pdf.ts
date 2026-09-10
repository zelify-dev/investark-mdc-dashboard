import { jsPDF } from "jspdf";

const C = {
  brand: [17, 39, 72] as [number, number, number],
  brandSoft: [232, 239, 247] as [number, number, number],
  ink: [23, 23, 23] as [number, number, number],
  body: [64, 72, 86] as [number, number, number],
  muted: [107, 114, 128] as [number, number, number],
  rule: [210, 218, 230] as [number, number, number],
  ok: [25, 111, 61] as [number, number, number],
  warn: [161, 98, 7] as [number, number, number],
  danger: [153, 27, 27] as [number, number, number],
  accent: [149, 255, 11] as [number, number, number],
};

const MARGIN = 14;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = 285;

const FS = {
  coverTitle: 22,
  coverSub: 10,
  pageTitle: 12,
  header: 9,
  headerSub: 8,
  footer: 7.5,
  section: 11,
  sectionSub: 9,
  body: 9.5,
  bodySmall: 8.5,
  table: 8.5,
  tableHeader: 9,
  line: 4.8,
};

type Doc = jsPDF;
type Col = { header: string; width: number; align?: "left" | "right" | "center" };

function rgb(doc: Doc, c: [number, number, number]) {
  doc.setTextColor(c[0], c[1], c[2]);
}
function fill(doc: Doc, c: [number, number, number]) {
  doc.setFillColor(c[0], c[1], c[2]);
}
function stroke(doc: Doc, c: [number, number, number]) {
  doc.setDrawColor(c[0], c[1], c[2]);
}

function norm(text: string) {
  return text
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/−/g, "-")
    .replace(/–|—/g, "-")
    .replace(/“|”/g, '"');
}

function clip(doc: Doc, text: string, maxW: number) {
  const safe = norm(text);
  if (doc.getTextWidth(safe) <= maxW) return safe;
  let out = safe;
  while (out.length > 1 && doc.getTextWidth(`${out}...`) > maxW) out = out.slice(0, -1);
  return `${out}...`;
}

function fmtDate(d = new Date()) {
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
}

export async function loadZelifyLogoDataUrl(svgPath = "/zelifyLogo_dark.svg"): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("loadZelifyLogoDataUrl solo esta disponible en el navegador.");
  }
  const res = await fetch(svgPath);
  const svgText = await res.text();
  const blob = new Blob([svgText], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("No se pudo cargar el logotipo Zelify."));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 488;
    canvas.height = 140;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas no disponible.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

class MoralAnalysisBriefPdfBuilder {
  private doc: Doc;
  private page = 1;
  private y = 0;
  private sectionNum = 0;
  private tocPage = 0;
  private anchors: { title: string; page: number }[] = [];
  private readonly reportId: string;
  private readonly generatedAt: string;

  constructor(private logoDataUrl?: string) {
    this.doc = new jsPDF({ unit: "mm", format: "a4" });
    this.reportId = `BRIEF-PM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;
    this.generatedAt = new Date().toISOString();
  }

  build(): jsPDF {
    this.drawCover();
    this.drawMetaAndToc();
    this.drawExecutiveSummary();
    this.drawAnalysisComponents();
    this.drawMdcRules();
    this.drawScoring();
    this.drawSatSection();
    this.drawOtherSources();
    this.drawInconsistencies();
    this.drawTeamMessage();
    this.drawProductLocations();
    this.finalizeToc();
    return this.doc;
  }

  private newPage(sectionTitle?: string) {
    this.doc.addPage();
    this.page++;
    this.y = 34;
    this.drawPageChrome(sectionTitle);
  }

  private beginSection(pageTitle: string, tocTitle: string) {
    this.newPage(pageTitle);
    this.anchors.push({ title: tocTitle, page: this.page });
  }

  private ensure(needed: number, sectionTitle?: string) {
    if (this.y + needed > FOOTER_Y - 8) this.newPage(sectionTitle);
  }

  private drawPageChrome(sectionTitle?: string) {
    const doc = this.doc;
    fill(doc, C.brand);
    doc.rect(0, 0, PAGE_W, 9, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.header);
    doc.setTextColor(255, 255, 255);
    doc.text("ZELIFY · ANALISIS CREDITO PERSONA MORAL", MARGIN, 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.headerSub);
    rgb(doc, C.muted);
    doc.text("Brief tecnico · MDC · KYB · Scoring empresarial", MARGIN, 17);
    rgb(doc, C.ink);
    doc.text(this.reportId, PAGE_W - MARGIN, 12, { align: "right" });
    rgb(doc, C.muted);
    doc.text(fmtDate(new Date(this.generatedAt)), PAGE_W - MARGIN, 17, { align: "right" });
    stroke(doc, C.rule);
    doc.setLineWidth(0.25);
    doc.line(MARGIN, 20, PAGE_W - MARGIN, 20);
    if (sectionTitle) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(FS.pageTitle);
      rgb(doc, C.brand);
      doc.text(sectionTitle, MARGIN, 30);
      this.y = 36;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.footer);
    rgb(doc, C.muted);
    doc.text("Documento confidencial · Uso interno Zelify", MARGIN, FOOTER_Y);
    doc.text("Motor de Decision de Credito (MDC)", 122, FOOTER_Y);
    doc.text(`Pagina ${this.page}`, PAGE_W - MARGIN, FOOTER_Y, { align: "right" });
  }

  private sectionTitle(title: string, subtitle?: string) {
    this.sectionNum++;
    this.ensure(subtitle ? 16 : 12);
    const doc = this.doc;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.section);
    rgb(doc, C.brand);
    doc.text(`${this.sectionNum}. ${title}`, MARGIN, this.y);
    this.y += 6;
    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.sectionSub);
      rgb(doc, C.muted);
      doc.text(subtitle, MARGIN, this.y);
      this.y += 5;
    }
    stroke(doc, C.rule);
    doc.setLineWidth(0.25);
    doc.line(MARGIN, this.y, PAGE_W - MARGIN, this.y);
    this.y += 6;
  }

  private paragraph(text: string, indent = 0) {
    const doc = this.doc;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.body);
    rgb(doc, C.body);
    const lines = doc.splitTextToSize(norm(text), CONTENT_W - indent);
    this.ensure(lines.length * FS.line + 2);
    doc.text(lines, MARGIN + indent, this.y);
    this.y += lines.length * FS.line + 2;
  }

  private callout(title: string, text: string, tone: "info" | "warn" = "info") {
    const doc = this.doc;
    const lines = doc.splitTextToSize(norm(text), CONTENT_W - 10);
    const h = 10 + lines.length * FS.line;
    this.ensure(h + 4);
    const bg = tone === "warn" ? [255, 249, 235] as [number, number, number] : C.brandSoft;
    fill(doc, bg);
    doc.roundedRect(MARGIN, this.y - 2, CONTENT_W, h, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.bodySmall);
    rgb(doc, tone === "warn" ? C.warn : C.brand);
    doc.text(title, MARGIN + 4, this.y + 4);
    doc.setFont("helvetica", "normal");
    rgb(doc, C.body);
    doc.text(lines, MARGIN + 4, this.y + 9);
    this.y += h + 6;
  }

  private bulletList(items: string[]) {
    items.forEach((item) => {
      const doc = this.doc;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.body);
      rgb(doc, C.body);
      const lines = doc.splitTextToSize(norm(`-  ${item}`), CONTENT_W - 4);
      this.ensure(lines.length * FS.line + 1);
      doc.text(lines, MARGIN + 2, this.y);
      this.y += lines.length * FS.line + 1;
    });
    this.y += 2;
  }

  private table(columns: Col[], rows: string[][], opts?: { rowHeight?: number; fontSize?: number }) {
    const doc = this.doc;
    const rowH = opts?.rowHeight ?? 7;
    const fontSize = opts?.fontSize ?? FS.table;
    const headerH = 8;

    this.ensure(headerH + rowH * Math.min(rows.length, 3) + 4);

    let x = MARGIN;
    fill(doc, C.brandSoft);
    doc.rect(MARGIN, this.y - 4, CONTENT_W, headerH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.tableHeader);
    rgb(doc, C.brand);
    columns.forEach((col) => {
      doc.text(clip(doc, col.header, col.width - 2), x + 1, this.y);
      x += col.width;
    });
    this.y += headerH - 2;
    stroke(doc, C.rule);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, this.y, PAGE_W - MARGIN, this.y);
    this.y += 3;

    rows.forEach((row, ri) => {
      this.ensure(rowH + 2);
      if (ri % 2 === 1) {
        fill(doc, [250, 251, 253]);
        doc.rect(MARGIN, this.y - 3.5, CONTENT_W, rowH, "F");
      }
      x = MARGIN;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fontSize);
      rgb(doc, C.body);
      row.forEach((cell, ci) => {
        const col = columns[ci];
        const lines = doc.splitTextToSize(norm(cell), col.width - 2);
        const align = col.align ?? "left";
        const tx = align === "right" ? x + col.width - 1 : align === "center" ? x + col.width / 2 : x + 1;
        doc.text(lines.slice(0, 2), tx, this.y, { align });
        x += col.width;
      });
      this.y += rowH;
    });
    this.y += 4;
  }

  private drawCover() {
    const doc = this.doc;
    fill(doc, C.brand);
    doc.rect(0, 0, PAGE_W, 32, "F");

    if (this.logoDataUrl) {
      try {
        doc.addImage(this.logoDataUrl, "PNG", MARGIN, 8, 52, 15);
      } catch {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(FS.coverTitle);
        doc.setTextColor(255, 255, 255);
        doc.text("ZELIFY", MARGIN, 18);
      }
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(FS.coverTitle);
      doc.setTextColor(255, 255, 255);
      doc.text("ZELIFY", MARGIN, 18);
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.coverSub);
    doc.setTextColor(220, 228, 238);
    doc.text("Motor de Decision de Credito · Persona Moral", MARGIN, 26);

    fill(doc, C.accent);
    doc.rect(0, 32, PAGE_W, 1.2, "F");

    fill(doc, C.brandSoft);
    doc.roundedRect(MARGIN, 42, CONTENT_W, 34, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.coverTitle - 2);
    rgb(doc, C.brand);
    doc.text("ANALISIS DE CREDITO Y SCORING", MARGIN + 6, 56);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.coverSub);
    rgb(doc, C.muted);
    doc.text("Componentes, fuentes SAT, otras fuentes de datos y validacion de consistencia", MARGIN + 6, 66);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    rgb(doc, C.ink);
    doc.text("Brief para direccion y equipo de credito", MARGIN, 90);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.body);
    rgb(doc, C.body);
    doc.text(`Generado: ${fmtDate(new Date(this.generatedAt))}`, MARGIN, 98);
    doc.text(`Folio: ${this.reportId}`, MARGIN, 104);

    fill(doc, [245, 247, 250]);
    doc.roundedRect(MARGIN, 114, CONTENT_W, 28, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.bodySmall);
    rgb(doc, C.brand);
    doc.text("Alcance del documento", MARGIN + 4, 122);
    doc.setFont("helvetica", "normal");
    rgb(doc, C.body);
    const scope = doc.splitTextToSize(
      norm(
        "Describe que componentes de analisis crediticio y scoring se muestran hoy en Zelify Core para persona moral, " +
          "que parametros provienen del SAT, que otras fuentes alimentan el motor MDC, y que puntos de data deben alinearse antes de la demo.",
      ),
      CONTENT_W - 8,
    );
    doc.text(scope, MARGIN + 4, 128);

    this.callout(
      "Nota importante",
      "La mayoria de las integraciones (SAT, Buró empresarial, AML) operan como simulacion demo en el entorno actual. " +
        "Este documento refleja el comportamiento del producto y los mocks configurados para Grupo Delta Industrial.",
      "warn",
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.footer);
    rgb(doc, C.muted);
    doc.text("Documento confidencial · Uso interno", MARGIN, FOOTER_Y);
    doc.text("Pagina 1", PAGE_W - MARGIN, FOOTER_Y, { align: "right" });
  }

  private drawMetaAndToc() {
    this.beginSection("Indice", "Indice de contenidos");
    this.tocPage = this.page;
    this.y += 4;
    const doc = this.doc;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.body);
    rgb(doc, C.muted);
    doc.text("Cargando indice...", MARGIN, this.y);
  }

  private finalizeToc() {
    const doc = this.doc;
    const savedPage = this.page;
    this.page = this.tocPage;
    doc.setPage(this.tocPage);
    this.y = 40;
    this.anchors.forEach((a) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.body);
      rgb(doc, C.body);
      doc.text(a.title, MARGIN + 2, this.y);
      rgb(doc, C.muted);
      const dots = ".".repeat(Math.max(4, 70 - a.title.length));
      doc.text(dots, MARGIN + 60, this.y);
      rgb(doc, C.brand);
      doc.text(String(a.page), PAGE_W - MARGIN, this.y, { align: "right" });
      this.y += FS.line + 1;
    });
    doc.setPage(savedPage);
    this.page = savedPage;
  }

  private drawExecutiveSummary() {
    this.beginSection("Resumen ejecutivo", "Resumen ejecutivo");
    this.sectionTitle("Respuesta para direccion");
    this.paragraph(
      "El analisis crediticio de persona moral en Zelify Core se concentra en el modulo MDC (Motor de Decision de Credito) " +
        "y en KYB corporativo, complementado por un informe consolidado en la pestana Informes (solo persona moral). " +
        "El flujo evalua identidad y documentacion, cumplimiento PLD/AML, buró empresarial, razones financieras, riesgo sectorial " +
        "y un motor de reglas con dictamen automatico o revision manual.",
    );
    this.callout(
      "Caso demo principal",
      "Grupo Delta Industrial SA de CV · APP-PM-100283 · Credito revolvente $8.8M · Dictamen REVISION MANUAL " +
        "(score buró 598, DSCR 1.18x, apalancamiento 3.05x, opinion 32-D en proceso).",
    );
    this.sectionTitle("KPIs laterales en detalle de solicitud");
    this.bulletList([
      "Segmento empresarial y antiguedad",
      "Alertas AML y completitud KYB",
      "Indice de riesgo sectorial NAICS",
      "ROE / ROA derivados del perfil financiero",
      "Score buró empresarial (barra visual 0-850)",
    ]);
  }

  private drawAnalysisComponents() {
    this.beginSection("Componentes de analisis", "Componentes de analisis mostrados");
    this.sectionTitle("Vista MDC - detalle de solicitud (6 bloques)");
    this.table(
      [
        { header: "#", width: 8 },
        { header: "Bloque", width: 42 },
        { header: "Que evalua", width: CONTENT_W - 50 },
      ],
      [
        ["1", "Captura y onboarding", "Producto, plazo, destino del credito, tipo de empresa"],
        ["2", "Verificacion y KYB", "Registro mercantil, situacion fiscal SAT, estructura societaria, UBO, expediente"],
        ["3", "Cumplimiento AML/PLD", "OFAC, ONU, PEP, prensa adversa, demandas y gravamenes"],
        ["4", "Buro y scoring", "Score buró corporativo, score socios/aval, morosidad, endeudamiento"],
        ["5", "Capacidad y sector", "Cuota/ingresos, concentracion cliente, NAICS, monto/ventas"],
        ["6", "Motor de reglas MDC", "Politicas configurables con veredicto CUMPLE / REVISAR / NO CUMPLE"],
      ],
    );

    this.sectionTitle("Informe crediticio (pestaña Informes + PDF)");
    this.bulletList([
      "Resumen ejecutivo y dictamen con condiciones",
      "Perfil corporativo, accionistas y beneficiarios reales (UBO)",
      "Expediente KYB documental y verificaciones AML",
      "Buró empresarial: tradelines, MOP, historial de score",
      "Estados financieros, ingresos verificados y concentracion de clientes",
      "Capacidad de pago (DSCR, stress test, colchon de liquidez)",
      "Reglas MDC, garantias, cascada de tasa y trazabilidad de decision",
    ]);
  }

  private drawMdcRules() {
    this.beginSection("Motor de reglas MDC", "Motor de reglas y politicas");
    this.sectionTitle("Reglas activas para productos empresariales (pm-cr-*)");
    this.table(
      [
        { header: "Regla", width: 38 },
        { header: "Campo / fuente", width: 42 },
        { header: "Umbral / logica", width: CONTENT_W - 80 },
      ],
      [
        ["Antiguedad minima", "company.antiquityMonths", ">= 24 meses"],
        ["Apalancamiento", "company.leverageRatio", "<= 2.50 aprueba; 2.50-3.49 revision; >= 3.50 rechaza"],
        ["Facturacion mensual", "company.monthlyRevenue", ">= $400,000 (validada con CFDI SAT)"],
        ["Score buro empresa", "company.bureauScore", ">= 650"],
        ["Dias max. atraso", "company.maxDaysPastDue", "<= 45 dias"],
        ["DSCR", "company.dscr", ">= 1.20"],
        ["Concentracion cliente", "company.topClientConcentration", "<= 45% (revolvente)"],
        ["Margen EBITDA", "company.ebitdaMargin", ">= 12%"],
        ["Monto vs ventas", "company.requestedAmountToRevenue", "<= 2.40 aprueba; 2.40-3.99 revision; >= 4.00 rechaza"],
        ["Riesgo sectorial NAICS", "company.naicsRiskIndex", "Indices bloqueados por politica"],
        ["Plazo arrendamiento", "company.requestedTermMonths", "<= 60 meses"],
        ["Cumplimiento fiscal 32-D", "company.taxComplianceStatus", "1 = aprueba; 0 = revision; -1 = rechaza"],
      ],
      { rowHeight: 8, fontSize: 8 },
    );

    this.sectionTitle("Razones financieras calculadas (buildMoralCompanyProfile)");
    this.bulletList([
      "Facturacion mensual y anual estimada",
      "DSCR, apalancamiento (deuda/EBITDA), margen EBITDA",
      "ROE, ROA, capital de trabajo y flujo libre",
      "Concentracion top cliente y relacion monto solicitado / ventas",
      "Indice NAICS, endeudamiento y cuota/ingresos",
      "Completitud KYB, alertas AML y cobertura UBO",
    ]);
  }

  private drawScoring() {
    this.beginSection("Metodologia de scoring", "Metodologia de scoring");
    this.table(
      [
        { header: "Score / indicador", width: 42 },
        { header: "Origen", width: CONTENT_W - 42 },
      ],
      [
        ["riskScore (0-100)", "Indice interno mock por solicitud (mdc-credit-mock)"],
        ["bureauScore", "Formula: 850 - (riskIndex / 100) x 450. Ej: riskScore 56 -> score 598"],
        ["shareholderScore", "Derivado del bureauScore con ajuste por estado de solicitud"],
        ["aiScore", "Valor mock en informe (ej. 74) - no es motor productivo"],
        ["Riesgo MDC", "low / medium / high segun bandas de bureauScore (<550 alto, 550-649 medio, >=650 bajo)"],
        ["Dictamen final", "Combinacion de reglas MDC + estado de solicitud (approved / manualReview / declined)"],
      ],
      { rowHeight: 8 },
    );
    this.callout(
      "Transparencia operativa",
      "No existe hoy un motor de scoring empresarial externo en produccion. El score buró mostrado es una transformacion del riskScore interno mas reglas MDC por bandas.",
    );
  }

  private drawSatSection() {
    this.beginSection("Parametros SAT", "Parametros y analisis SAT");
    this.sectionTitle("En el motor MDC (reglas de credito)");
    this.table(
      [
        { header: "Parametro", width: 44 },
        { header: "Descripcion", width: CONTENT_W - 44 },
      ],
      [
        ["Opinion 32-D", "company.taxComplianceStatus: 1 positiva, 0 en proceso, -1 negativa"],
        ["CFDI / facturacion", "company.monthlyRevenue validada con CFDI emitidos ante el SAT (umbral $400K/mes)"],
        ["Constancia fiscal", "Documento KYB: situacion del contribuyente y regimen"],
        ["Lista 69-B", "Verificacion en modulo AML (sin coincidencias = limpio)"],
      ],
    );

    this.sectionTitle("Simulador SAT en modulo KYB (connectSatSimulator)");
    this.paragraph(
      "Al conectar RFC en onboarding KYB se simula la sincronizacion fiscal (no es API SAT en tiempo real). " +
        "Parametros retornados:",
    );
    this.table(
      [
        { header: "Parametro", width: 48 },
        { header: "Detalle", width: CONTENT_W - 48 },
      ],
      [
        ["RFC y regimen", "Validacion formato PM; regimen general personas morales"],
        ["Estatus contribuyente", "Activo / inactivo"],
        ["Fecha de registro", "Antiguedad calculada (yearsActive)"],
        ["Opinion de cumplimiento", "Positive + detalle textual de obligaciones"],
        ["Declaraciones mensuales", "Ultimos 6 meses: mes, estatus, monto declarado"],
        ["Ingreso promedio", "Promedio de declaraciones del periodo"],
        ["financialHealthScore", "Calificacion demo (ej. A+)"],
        ["riskIndicator", "Bajo / medio / alto"],
      ],
      { rowHeight: 7.5, fontSize: 8.5 },
    );
  }

  private drawOtherSources() {
    this.beginSection("Otras fuentes de datos", "Otras fuentes de datos");
    this.table(
      [
        { header: "Fuente", width: 44 },
        { header: "Uso en persona moral", width: CONTENT_W - 44 },
      ],
      [
        ["Buro de Credito Empresarial", "Score, tradelines, MOP, historial de pago, consultas"],
        ["KYB / onboarding corporativo", "Acta constitutiva, poderes, UBO, domicilio, visita ocular"],
        ["AML / PLD", "OFAC, ONU, UE, PEP, UIF, INTERPOL, SAT 69-B, prensa adversa"],
        ["Estados financieros", "Balance, resultados, flujo de efectivo (mock en informe)"],
        ["CFDI / conciliacion bancaria", "Desglose de ingresos verificados por concepto"],
        ["Concentracion de clientes", "Porcentaje de ingresos por cliente tier-1"],
        ["Sector NAICS", "Indice de riesgo sectorial y outlook macro"],
        ["Registro Publico de Comercio", "Existencia legal y estructura societaria"],
        ["Trazabilidad MDC", "Auditoria de evaluaciones y decisiones del motor"],
        ["Pagos SPEI", "Historial de capturas de pago empresarial"],
        ["Contexto KYB empresa", "Giro, mercado, ingresos estimados, regiones de operacion"],
      ],
      { rowHeight: 8, fontSize: 8.5 },
    );
  }

  private drawInconsistencies() {
    this.beginSection("Validacion de consistencia", "Puntos a validar antes de la demo");
    this.sectionTitle("Inconsistencias conocidas - caso Grupo Delta");
    this.table(
      [
        { header: "Punto", width: 32 },
        { header: "Valor A", width: 48 },
        { header: "Valor B", width: 48 },
        { header: "Accion sugerida", width: CONTENT_W - 128 },
      ],
      [
        ["Monto", "Solicitud $8.8M", "Pool $7.6M pre-aprobado", "Alinear narrativa solicitud vs pool"],
        ["Score buro", "Motor: 598 (risk 56)", "Pool mock: 692", "Usar 598 como score operativo"],
        ["Ingresos anuales", "KYB: ~$210M", "Perfil: ~$32M", "CRITICO - unificar antes de presentar"],
        ["Opinion 32-D", "Perfil: En proceso", "SAT sim: Positive (otras empresas)", "Mantener coherencia con REVISION"],
        ["RFC en UI captura", "Muestra app.id (uuid)", "RFC real GDI150403PX6", "Corregir visualizacion en detalle"],
        ["Integracion SAT", "UI: sincronizacion SAT", "Codigo: simulador local", "Aclarar que es demo, no produccion"],
      ],
      { rowHeight: 9, fontSize: 8 },
    );
    this.callout(
      "Prioridad para manana",
      "Alinear ingresos anuales entre KYB context y perfil financiero MDC. Dejar explicito ante direccion que SAT, Buró y AML son mocks de demostracion salvo integracion backend futura.",
      "warn",
    );
  }

  private drawTeamMessage() {
    this.beginSection("Mensaje para el equipo", "Mensaje sugerido para el equipo");
    this.paragraph(
      "Persona moral - componentes de analisis crediticio: mostramos un flujo integral en MDC con onboarding/KYB, " +
        "cumplimiento AML/PLD, buró corporativo, razones financieras (DSCR, apalancamiento, EBITDA, concentracion), " +
        "riesgo sectorial NAICS y motor de reglas con dictamen.",
    );
    this.paragraph(
      "SAT: evaluamos Opinion de Cumplimiento 32-D (positiva/en proceso/negativa), constancia de situacion fiscal, " +
        "validacion de ingresos via CFDI, declaraciones mensuales y listas 69-B. En demo esto es simulado.",
    );
    this.paragraph(
      "Scoring: indice de riesgo interno transformado a score buró (formula 850-450) mas reglas MDC por bandas. " +
        "Caso Grupo Delta: score 598, DSCR 1.18x, apalancamiento 3.05x -> revision manual con condiciones.",
    );
  }

  private drawProductLocations() {
    this.beginSection("Ubicacion en producto", "Donde verlo en Zelify Core");
    this.bulletList([
      "MDC > Persona moral > Solicitudes: detalle Grupo Delta (APP-PM-100283)",
      "MDC > Persona moral > Reglas: politicas pm-cr-*",
      "MDC > Persona moral > Informes: generar y descargar PDF empresarial",
      "KYB > SAT & KYC: simulador de conexion fiscal y verificacion de socios",
      "Reporting: informes crediticios persona natural (referencia de formato PDF)",
    ]);
    this.paragraph(
      "Documento generado automaticamente por Zelify Core. Para actualizar datos demo o corregir inconsistencias, " +
        "ajustar mocks en mdc-credit-mock, mdc-grupo-delta-profile, kyb-company-context y mdc-rules-mock.",
    );
  }
}

export type ExportMoralBriefPdfOptions = {
  logoDataUrl?: string;
  fileName?: string;
};

export function buildMoralCreditAnalysisBriefPdf(logoDataUrl?: string): jsPDF {
  return new MoralAnalysisBriefPdfBuilder(logoDataUrl).build();
}

export async function exportMoralCreditAnalysisBriefPdf(options: ExportMoralBriefPdfOptions = {}) {
  const logoDataUrl = options.logoDataUrl ?? (typeof window !== "undefined" ? await loadZelifyLogoDataUrl() : undefined);
  const doc = buildMoralCreditAnalysisBriefPdf(logoDataUrl);
  const fileName =
    options.fileName ?? `brief-analisis-credito-persona-moral-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
}

export function moralCreditAnalysisBriefPdfBytes(logoDataUrl?: string): Uint8Array {
  const doc = buildMoralCreditAnalysisBriefPdf(logoDataUrl);
  const buf = doc.output("arraybuffer");
  return new Uint8Array(buf);
}
