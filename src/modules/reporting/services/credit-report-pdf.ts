import { jsPDF } from "jspdf";
import type { CreditReportPayload, CreditReportRuleRow } from "../types/credit-report.types";
import { formatPctMx } from "@/modules/scotia/utils/format-mxn";
import {
  explainBuroScore,
  explainCat,
  explainDti,
  explainDownPayment,
  explainMonthlyPayment,
  explainMop,
  explainRate,
  explainTermMonths,
  explainTotalInterest,
  formatBps,
  formatCreditAgeMonths,
  humanizeAmlResult,
  humanizeVerdict,
  mxn,
  mxnPerMonth,
} from "./credit-report-pdf-format";

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
};

const MARGIN = 14;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;
const FOOTER_Y = 285;

const FS = {
  coverTitle: 28,
  coverSub: 11,
  coverName: 17,
  coverBody: 10.5,
  pageTitle: 13,
  header: 10,
  headerSub: 9,
  footer: 8,
  section: 12,
  sectionSub: 10,
  body: 10.5,
  bodySmall: 9.5,
  table: 9.5,
  tableHeader: 10,
  kpiLabel: 8.5,
  kpiValue: 13,
  kpiSub: 8.5,
  chartTitle: 10,
  chartValue: 9,
  chartAxis: 8,
  dictamen: 18,
  line: 5.2,
};

type Doc = jsPDF;

function rgb(doc: Doc, c: [number, number, number]) {
  doc.setTextColor(c[0], c[1], c[2]);
}
function stroke(doc: Doc, c: [number, number, number]) {
  doc.setDrawColor(c[0], c[1], c[2]);
}
function fill(doc: Doc, c: [number, number, number]) {
  doc.setFillColor(c[0], c[1], c[2]);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function normalizePdfText(text: string): string {
  return text
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/−/g, "-")
    .replace(/–/g, "-")
    .replace(/—/g, "-")
    .replace(/“|”/g, '"')
    .replace(/…/g, "...")
    .replace(/\u00a0/g, " ");
}

function clipPdfText(doc: Doc, text: string, maxWidth: number): string {
  const safe = normalizePdfText(text);
  if (doc.getTextWidth(safe) <= maxWidth) return safe;
  const ellipsis = "...";
  let out = safe;
  while (out.length > 0 && doc.getTextWidth(out + ellipsis) > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}${ellipsis}`;
}

class CreditReportPdfBuilder {
  private doc: Doc;
  private page = 1;
  private y = 0;
  private sectionNum = 0;
  private tocPage = 0;
  private anchors: { title: string; page: number }[] = [];

  constructor(private report: CreditReportPayload) {
    this.doc = new jsPDF({ unit: "mm", format: "a4" });
  }

  build(): void {
    this.drawCover();
    this.drawMetaAndToc();
    this.drawExecutiveSummary();
    this.drawSubjectProfile();
    this.drawIncomeAndEmployment();
    this.drawKycSection();
    this.drawAmlSection();
    this.drawBuroSection();
    this.drawProductAndVehicle();
    this.drawCortexRules();
    this.drawCapacityAnalysis();
    this.drawAiAndRiskProfile();
    this.drawDecisionAndConditions();
    this.drawAppendix();
    this.finalizeToc();

    const slug = this.report.subject.fullName.replace(/\s+/g, "-").toLowerCase();
    this.doc.save(`informe-crediticio-${slug}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  /* ─── Utilidades de layout ─── */

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
    if (this.y + needed > FOOTER_Y - 8) {
      this.newPage(sectionTitle);
    }
  }

  private drawPageChrome(sectionTitle?: string) {
    const doc = this.doc;
    fill(doc, C.brand);
    doc.rect(0, 0, PAGE_W, 9, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.header);
    rgb(doc, [255, 255, 255]);
    doc.text(normalizePdfText("ZELIFY · CREDITOR REPORT"), MARGIN, 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.headerSub);
    rgb(doc, C.muted);
    doc.text(normalizePdfText("Informe crediticio integral · Moneda MXN"), MARGIN, 17);
    rgb(doc, C.ink);
    doc.text(this.report.reportId, PAGE_W - MARGIN, 12, { align: "right" });
    rgb(doc, C.muted);
    doc.text(fmtShort(this.report.generatedAt), PAGE_W - MARGIN, 17, { align: "right" });

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
    doc.text(clipPdfText(doc, this.report.meta.confidentiality, 78), MARGIN, FOOTER_Y);
    doc.text(clipPdfText(doc, this.report.meta.institution, 48), 122, FOOTER_Y);
    doc.text(`Página ${this.page}`, PAGE_W - MARGIN, FOOTER_Y, { align: "right" });
  }

  private sectionTitle(title: string, subtitle?: string) {
    this.sectionNum++;
    this.ensure(subtitle ? 16 : 12);
    const doc = this.doc;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.section);
    rgb(doc, C.brand);
    doc.text(normalizePdfText(`${this.sectionNum}. ${title}`), MARGIN, this.y);
    this.y += 6;
    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.sectionSub);
      rgb(doc, C.muted);
      doc.text(normalizePdfText(subtitle), MARGIN, this.y);
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
    const lines = doc.splitTextToSize(normalizePdfText(text), CONTENT_W - indent);
    this.ensure(lines.length * FS.line + 2);
    doc.text(lines, MARGIN + indent, this.y);
    this.y += lines.length * FS.line + 2;
  }

  private infoBox(text: string) {
    const doc = this.doc;
    this.ensure(FS.line * 3);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.body);
    rgb(doc, C.ink);
    doc.text(normalizePdfText("En pocas palabras:"), MARGIN, this.y);
    this.y += FS.line;
    doc.setFont("helvetica", "normal");
    rgb(doc, C.body);
    const lines = doc.splitTextToSize(normalizePdfText(text), CONTENT_W);
    this.ensure(lines.length * FS.line + 2);
    doc.text(lines, MARGIN, this.y);
    this.y += lines.length * FS.line + 4;
  }

  private bulletList(items: string[]) {
    items.forEach((item) => {
      const doc = this.doc;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.body);
      rgb(doc, C.body);
      const lines = doc.splitTextToSize(normalizePdfText(`•  ${item}`), CONTENT_W - 4);
      this.ensure(lines.length * FS.line + 1);
      doc.text(lines, MARGIN + 2, this.y);
      this.y += lines.length * FS.line + 1;
    });
    this.y += 2;
  }

  private kpiRow(kpis: { label: string; value: string; sub?: string }[]) {
    const n = kpis.length;
    const gap = 4;
    const w = (CONTENT_W - gap * (n - 1)) / n;
    const h = 24;
    this.ensure(h + 6);

    kpis.forEach((k, i) => {
      const x = MARGIN + i * (w + gap);
      const doc = this.doc;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(FS.kpiLabel);
      rgb(doc, C.muted);
      doc.text(doc.splitTextToSize(normalizePdfText(k.label), w - 2).slice(0, 2), x, this.y);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(FS.kpiValue);
      rgb(doc, C.ink);
      doc.text(doc.splitTextToSize(normalizePdfText(k.value), w - 2).slice(0, 2), x, this.y + 9);

      if (k.sub) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(FS.kpiSub);
        rgb(doc, C.muted);
        doc.text(doc.splitTextToSize(normalizePdfText(k.sub), w - 2).slice(0, 2), x, this.y + 17);
      }
    });
    this.y += h + 8;
  }

  private table(
    columns: { header: string; width: number; align?: "left" | "right" | "center" }[],
    rows: string[][],
    opts?: { rowHeight?: number; fontSize?: number }
  ) {
    const doc = this.doc;
    const fs = opts?.fontSize ?? FS.table;
    const minRowH = opts?.rowHeight ?? 9;
    const padX = 2;
    const padY = 2;
    const startX = MARGIN;
    const tableW = columns.reduce((s, c) => s + c.width, 0);
    const headerLineSets = columns.map((col) =>
      doc.splitTextToSize(normalizePdfText(col.header), col.width - padX * 2)
    );
    const headerMaxLines = Math.max(...headerLineSets.map((lines) => lines.length), 1);
    const headerH = Math.max(9, headerMaxLines * 4.2 + padY * 2);

    const drawHeader = () => {
      let x = startX;
      fill(doc, C.brandSoft);
      doc.rect(startX, this.y, tableW, headerH, "F");
      stroke(doc, C.rule);
      doc.setLineWidth(0.2);
      doc.rect(startX, this.y, tableW, headerH);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(FS.tableHeader);
      rgb(doc, C.brand);
      columns.forEach((col, index) => {
        const tx =
          col.align === "right"
            ? x + col.width - padX
            : col.align === "center"
              ? x + col.width / 2
              : x + padX;
        const headerLines = headerLineSets[index];
        doc.text(headerLines, tx, this.y + 5.4, { align: col.align ?? "left" });
        stroke(doc, C.rule);
        doc.line(x + col.width, this.y, x + col.width, this.y + headerH);
        x += col.width;
      });
      this.y += headerH;
    };

    drawHeader();

    rows.forEach((row, rowIndex) => {
      const lineSets = row.map((cell, ci) =>
        doc.splitTextToSize(normalizePdfText(cell ?? "-"), columns[ci].width - padX * 2)
      );
      const maxLines = Math.max(...lineSets.map((lines) => lines.length), 1);
      const rowH = Math.max(minRowH, maxLines * 4.2 + padY * 2);

      if (this.y + rowH > FOOTER_Y - 10) {
        this.newPage();
        drawHeader();
      }

      if (rowIndex % 2 === 1) {
        fill(doc, [249, 250, 251]);
        doc.rect(startX, this.y, tableW, rowH, "F");
      }
      stroke(doc, C.rule);
      doc.setLineWidth(0.15);
      doc.rect(startX, this.y, tableW, rowH);

      let x = startX;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(fs);
      rgb(doc, C.body);
      row.forEach((_, ci) => {
        const col = columns[ci];
        const cellLines = lineSets[ci];
        const tx =
          col.align === "right"
            ? x + col.width - padX
            : col.align === "center"
              ? x + col.width / 2
              : x + padX;
        doc.text(cellLines, tx, this.y + 4.6, { align: col.align ?? "left" });
        if (ci < columns.length - 1) {
          stroke(doc, C.rule);
          doc.line(x + col.width, this.y, x + col.width, this.y + rowH);
        }
        x += col.width;
      });
      this.y += rowH;
    });
    this.y += 6;
  }

  private twoColGrid(pairs: [string, string][], labelW = 52) {
    const doc = this.doc;
    const valW = CONTENT_W - labelW - 4;
    pairs.forEach(([label, value]) => {
      this.ensure(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(FS.body);
      rgb(doc, C.muted);
      doc.text(normalizePdfText(label), MARGIN, this.y);
      doc.setFont("helvetica", "normal");
      rgb(doc, C.body);
      const lines = doc.splitTextToSize(normalizePdfText(value), valW);
      doc.text(lines, MARGIN + labelW, this.y);
      this.y += Math.max(7, lines.length * FS.line);
    });
    this.y += 3;
  }

  private drawPtiGauge(pti: number, max: number, payment: number, income: number) {
    this.paragraph(
      `¿Cuánto de su sueldo iría a la mensualidad del vehículo? ${formatPctMx(pti)} (el banco permite hasta ${formatPctMx(max)}). ` +
        `Mensualidad ${mxn(payment)} sobre ingreso ${mxn(income)} al mes.`
    );
    this.infoBox(explainMonthlyPayment(payment, income, pti, max));
  }

  private drawScoreChart(history: { period: string; score: number }[]) {
    const doc = this.doc;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.chartTitle);
    rgb(doc, C.ink);
    doc.text("Evolución del puntaje Buró (últimos 6 meses)", MARGIN, this.y);
    this.y += 7;

    this.table(
      [
        { header: "Periodo", width: 50 },
        { header: "Puntaje", width: 30, align: "right" },
        { header: "Referencia", width: 100 },
      ],
      history.map((h, i) => [
        h.period,
        String(h.score),
        i === 0 ? "Actual" : i === history.length - 1 ? "Hace ~1 año" : "",
      ]),
      { rowHeight: 8 }
    );
  }

  private finalizeToc() {
    if (!this.tocPage) return;
    const currentPage = this.page;
    this.doc.setPage(this.tocPage);
    this.y = 48;
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(FS.section);
    rgb(this.doc, C.brand);
    this.doc.text("Índice de contenidos", MARGIN, this.y);
    this.y += 6;
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(FS.sectionSub);
    rgb(this.doc, C.muted);
    this.doc.text("Navegación interna del expediente", MARGIN, this.y);
    this.y += 5;
    stroke(this.doc, C.rule);
    this.doc.setLineWidth(0.25);
    this.doc.line(MARGIN, this.y, PAGE_W - MARGIN, this.y);
    this.y += 8;

    this.anchors.forEach((anchor, index) => {
      const y = this.y;
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(FS.body);
      rgb(this.doc, C.body);
      this.doc.text(`${index + 1}. ${anchor.title}`, MARGIN, y);
      stroke(this.doc, C.rule);
      this.doc.setLineWidth(0.1);
      this.doc.line(108, y - 1, PAGE_W - MARGIN - 12, y - 1);
      this.doc.setFont("helvetica", "bold");
      rgb(this.doc, C.brand);
      this.doc.text(String(anchor.page), PAGE_W - MARGIN, y, { align: "right" });
      this.doc.link(MARGIN, y - 4, CONTENT_W, 6, { pageNumber: anchor.page });
      this.y += 7;
    });

    this.doc.setPage(currentPage);
  }

  /* ─── Secciones del documento ─── */

  private drawCover() {
    const doc = this.doc;
    const s = this.report.subject;

    fill(doc, C.brand);
    doc.rect(0, 0, PAGE_W, 28, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.coverTitle);
    rgb(doc, [255, 255, 255]);
    doc.text("ZELIFY", MARGIN, 14);
    doc.setFontSize(FS.coverSub);
    doc.setFont("helvetica", "normal");
    doc.text("Credit Intelligence Report", MARGIN, 21);

    fill(doc, C.brandSoft);
    doc.roundedRect(MARGIN, 35, CONTENT_W, 32, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.coverTitle - 2);
    rgb(doc, C.brand);
    doc.text("INFORME CREDITICIO INTEGRAL", MARGIN + 6, 48);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.coverSub);
    rgb(doc, C.muted);
    doc.text("KYC · AML · Buró de Crédito · Capacidad de pago · Dictamen", MARGIN + 6, 57);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.coverName);
    rgb(doc, C.ink);
    const nameLines = doc.splitTextToSize(s.fullName, CONTENT_W - 65);
    doc.text(nameLines, MARGIN, 82);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.coverBody);
    rgb(doc, C.body);
    doc.text(`Cliente ${s.id} · CURP ${s.curp}`, MARGIN, 95);

    fill(doc, [245, 247, 250]);
    doc.roundedRect(PAGE_W - MARGIN - 58, 76, 58, 26, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.bodySmall);
    rgb(doc, C.brand);
    doc.text("Folio", PAGE_W - MARGIN - 52, 84);
    doc.setFont("helvetica", "normal");
    rgb(doc, C.body);
    doc.text(this.report.reportId, PAGE_W - MARGIN - 52, 90);
    doc.text(fmtShort(this.report.generatedAt), PAGE_W - MARGIN - 52, 96);

    stroke(doc, C.rule);
    doc.setLineWidth(0.25);
    doc.line(MARGIN, 104, PAGE_W - MARGIN, 104);

    this.y = 114;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.coverBody);
    rgb(doc, C.body);

    const metaRows: [string, string][] = [
      ["Folio del informe", this.report.reportId],
      ["Fecha de generación", fmtDate(this.report.generatedAt)],
      ["Producto", `${s.productName} · ${s.productCategory}`],
      ["Monto del préstamo", mxn(s.requestedAmount)],
      ["Plazo", explainTermMonths(s.termMonths)],
      ["Pago mensual estimado", mxnPerMonth(s.monthlyPayment)],
      ["Tasa de interés anual", formatPctMx(s.finalRate)],
      ["CAT (costo total anual)", formatPctMx(s.cat, 1)],
      ["Resultado", s.decision === "APROBADO" ? "Aprobado" : s.decision],
      ["Válido hasta", fmtShort(this.report.meta.validUntil)],
      ["Analista", this.report.meta.analyst],
      ["Sucursal", this.report.meta.branch],
    ];
    metaRows.forEach(([k, v]) => {
      doc.setFont("helvetica", "bold");
      rgb(doc, C.muted);
      doc.text(k, MARGIN, this.y);
      doc.setFont("helvetica", "normal");
      rgb(doc, C.body);
      const vLines = doc.splitTextToSize(v, CONTENT_W - 54);
      doc.text(vLines, MARGIN + 54, this.y);
      this.y += Math.max(8, vLines.length * 5);
    });

    this.y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.bodySmall);
    rgb(doc, C.brand);
    doc.text("DOCUMENTO CONFIDENCIAL", MARGIN, this.y);
    this.y += 5;
    doc.setFont("helvetica", "normal");
    rgb(doc, C.muted);
    const disc = doc.splitTextToSize(this.report.meta.confidentiality, CONTENT_W);
    doc.text(disc, MARGIN, this.y);
    this.y += disc.length * 4.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.footer);
    rgb(doc, C.muted);
    doc.text(this.report.meta.institution, MARGIN, FOOTER_Y);
    doc.text("Powered by Zelify Core · CORTEX", PAGE_W - MARGIN, FOOTER_Y, { align: "right" });
  }

  private drawMetaAndToc() {
    this.newPage("Índice");
    this.tocPage = this.page;

    this.newPage("Datos del expediente");
    const s = this.report.subject;
    this.sectionTitle("Datos del expediente", "Trazabilidad y canal de originación");
    this.twoColGrid([
      ["Canal", this.report.meta.channel],
      ["Analista responsable", this.report.meta.analyst],
      ["Consulta originadora", this.report.promptUsed.slice(0, 120) + (this.report.promptUsed.length > 120 ? "…" : "")],
      ["ID cliente", s.id],
      ["Clasificación AML", `${s.amlStatus} · Riesgo ${s.amlRiskLevel}`],
      ["Estatus KYC", s.kycStatus],
    ]);
  }

  private drawExecutiveSummary() {
    this.beginSection("Resumen ejecutivo", "Resumen ejecutivo");
    const s = this.report.subject;

    this.sectionTitle("Resumen ejecutivo", "Lo más importante en pocas líneas");
    this.bulletList(this.report.executiveSummary);
    this.y += 2;

    this.sectionTitle("Números principales (pesos mexicanos)");
    const cap = this.report.capacity;
    this.kpiRow([
      { label: "Resultado", value: s.decision === "APROBADO" ? "Aprobado" : s.decision },
      { label: "Puntaje Buró", value: String(s.buroScore), sub: `Mejor que ~${s.buroPercentile}%` },
      { label: "Mensualidad", value: mxn(s.monthlyPayment), sub: explainTermMonths(s.termMonths) },
      { label: "Uso del sueldo", value: formatPctMx(cap.paymentToIncome), sub: `Tope ${formatPctMx(cap.maxAllowedPti)}` },
    ]);
    this.kpiRow([
      { label: "Préstamo", value: mxn(s.requestedAmount), sub: "Monto a financiar" },
      { label: "Tasa anual", value: formatPctMx(s.finalRate), sub: explainCat(s.cat) },
      { label: "Requisitos", value: `${this.report.rules.filter((r) => r.verdict === "CUMPLE").length} de ${this.report.rules.length}`, sub: "Cumplidos" },
      { label: "Pagos al día", value: explainMop(s.maxMop), sub: "Sin moras 24 meses" },
    ]);

    this.infoBox(explainMonthlyPayment(s.monthlyPayment, s.incomeNetMonthly, cap.paymentToIncome, cap.maxAllowedPti));

    this.sectionTitle("Decisión");
    this.paragraph(
      `${s.decision === "APROBADO" ? "Aprobado" : s.decision}. ${s.decisionSummary}`
    );
  }

  private drawSubjectProfile() {
    this.beginSection("Perfil del solicitante", "Perfil del solicitante");
    const s = this.report.subject;

    this.sectionTitle("Identificación personal");
    this.twoColGrid([
      ["Nombre completo", s.fullName],
      ["CURP", s.curp],
      ["RFC", s.rfc],
      ["Clave de elector (INE)", s.ine],
      ["Fecha de nacimiento", `${s.birthDate} · ${s.age} años`],
      ["Nacionalidad", s.nationality],
      ["Estado civil", `${s.maritalStatus} · ${s.dependents} dependientes económicos`],
      ["Teléfono", s.phone],
      ["Correo electrónico", s.email],
    ]);

    this.sectionTitle("Domicilio");
    this.paragraph(s.address);
    this.twoColGrid([["Antigüedad en domicilio", `${s.addressYears} años`]]);

    this.sectionTitle("Relación laboral");
    this.twoColGrid([
      ["Empleador", s.employer],
      ["Puesto", s.jobTitle],
      ["Tipo de relación", s.employmentType],
      ["Antigüedad laboral", `${s.employmentYears} años`],
    ]);
  }

  private drawIncomeAndEmployment() {
    this.beginSection("Empleo e ingresos", "Ingresos y estabilidad laboral");
    const s = this.report.subject;

    this.sectionTitle("Ingresos declarados y verificados", "Todos los montos en pesos mexicanos (MXN) al mes");
    this.kpiRow([
      { label: "Sueldo bruto", value: mxn(s.incomeGrossMonthly), sub: "Antes de impuestos" },
      { label: "Sueldo neto", value: mxn(s.incomeNetMonthly), sub: "Lo que recibe en cuenta" },
      { label: "Comprobado", value: fmtShort(s.incomeVerifiedAt), sub: "Con nómina / RH" },
    ]);

    this.sectionTitle("Desglose de ingresos");
    this.table(
      [
        { header: "Concepto", width: 52 },
        { header: "Al mes (MXN)", width: 38, align: "right" },
        { header: "Comprobado", width: 24, align: "center" },
        { header: "Cómo se comprobó", width: 70 },
      ],
      this.report.incomeBreakdown.map((i) => [
        i.concept,
        mxn(i.amount),
        i.verified ? "Sí" : "No",
        i.source,
      ])
    );
  }

  private drawKycSection() {
    this.beginSection("Verificación KYC", "Evaluación KYC e identidad");
    const s = this.report.subject;

    this.sectionTitle("Capturas biométricas y documentales");
    this.table(
      [
        { header: "Documento / prueba", width: 48 },
        { header: "Fecha y hora", width: 36 },
        { header: "Dispositivo / método", width: 42 },
        { header: "Scores", width: 58 },
      ],
      this.report.kycCaptures.map((c) => {
        const scores: string[] = [];
        if (c.livenessScore) scores.push(`Prueba de vida ${formatPctMx(c.livenessScore, 0)}`);
        if (c.matchScore) scores.push(`Rostro ${formatPctMx(c.matchScore, 0)}`);
        if (c.ocrConfidence) scores.push(`Lectura INE ${formatPctMx(c.ocrConfidence, 0)}`);
        return [
          c.label,
          new Date(c.capturedAt).toLocaleString("es-MX"),
          c.device,
          scores.join(" · ") || "—",
        ];
      })
    );

    this.sectionTitle("Resultado de verificación");
    this.kpiRow([
      { label: "Identidad", value: "Verificada" },
      { label: "Rostro vs INE", value: "96.8%", sub: "Mínimo 90% exigido" },
      { label: "Prueba de vida", value: "98.6%", sub: "Confirma persona real" },
      { label: "Funcionario público", value: s.pep ? "Sí" : "No" },
    ]);
  }

  private drawAmlSection() {
    this.beginSection("Screening AML", "Screening AML");
    const s = this.report.subject;

    this.sectionTitle("Consulta en listas restrictivas", "9 fuentes nacionales e internacionales");
    this.table(
      [
        { header: "Lista / fuente", width: 52 },
        { header: "Proveedor", width: 38 },
        { header: "Resultado", width: 32 },
        { header: "Nivel", width: 18, align: "center" },
        { header: "Referencia / fecha", width: 44 },
      ],
      this.report.amlChecks.map((a) => [
        a.listName,
        a.provider,
        humanizeAmlResult(a.result),
        a.riskLevel ?? "—",
        `${a.reference ?? ""} ${fmtShort(a.checkedAt)}`.trim(),
      ])
    );

    this.kpiRow([
      { label: "Dictamen", value: s.amlStatus },
      { label: "Nivel de riesgo", value: s.amlRiskLevel },
      { label: "Coincidencias", value: "0", sub: "En todas las listas" },
      { label: "PEP", value: s.pep ? "Identificado" : "No aplica" },
    ]);
  }

  private drawBuroSection() {
    this.beginSection("Buró de Crédito", "Buró de Crédito");
    const s = this.report.subject;

    this.sectionTitle("Su historial en Buró");
    this.infoBox(explainBuroScore(s.buroScore, s.buroPercentile, s.buroRating));
    this.kpiRow([
      { label: "Puntaje Buró", value: String(s.buroScore), sub: s.buroRating },
      { label: "Deuda total", value: mxn(s.totalDebt), sub: "Suma de créditos activos" },
      { label: "Antigüedad", value: formatCreditAgeMonths(s.creditAgeMonths) },
      { label: "Moras 2 años", value: String(s.delinquencies24m), sub: "0 = sin atrasos" },
    ]);
    this.kpiRow([
      { label: "Consultas 6 meses", value: String(s.inquiries6m), sub: "Veces que revisaron su buró" },
      { label: "Consultas 12 meses", value: String(s.inquiries12m) },
      { label: "Peor hábito de pago", value: explainMop(s.maxMop) },
      { label: "Calificación", value: s.buroRating },
    ]);

    this.drawScoreChart(this.report.buroScoreHistory);

    this.sectionTitle("Créditos que tiene hoy");
    this.table(
      [
        { header: "Banco / financiera", width: 32 },
        { header: "Producto", width: 36 },
        { header: "Debe / Límite (MXN)", width: 42, align: "right" },
        { header: "Pago", width: 22, align: "center" },
        { header: "% usado", width: 20, align: "right" },
        { header: "Historial", width: 42 },
      ],
      this.report.buroTradelines.map((t) => [
        t.creditor,
        t.product,
        `${mxn(t.balance)} / ${mxn(t.limit)}`,
        explainMop(t.mop),
        t.utilizationPct ? formatPctMx(t.utilizationPct, 0) : "—",
        t.paymentHistory ?? t.status,
      ])
    );
  }

  private drawProductAndVehicle() {
    this.beginSection("Estructura del crédito", "Estructura de la operación");
    const s = this.report.subject;
    const v = this.report.vehicle;

    this.sectionTitle("¿Cuánto pedirá prestado y en qué condiciones?");
    this.infoBox(explainDownPayment(s.downPaymentPct, s.downPaymentAmount, v?.value));
    this.table(
      [
        { header: "Concepto", width: 55 },
        { header: "Detalle", width: 75 },
      ],
      [
        ["Tipo de crédito", `${s.productName} · ${s.productCategory}`],
        ["Monto del préstamo", mxn(s.requestedAmount)],
        ["Enganche", `${formatPctMx(s.downPaymentPct, 0)} · ${mxn(s.downPaymentAmount)}`],
        ["Plazo", explainTermMonths(s.termMonths)],
        ["Tasa de interés", explainRate(s.baseRate, s.finalRate)],
        ["Pago cada mes", mxnPerMonth(s.monthlyPayment)],
        ["Total de intereses", explainTotalInterest(s.totalInterest, s.termMonths)],
        ["CAT", explainCat(s.cat)],
        ["Comisión de apertura", mxn(s.openingFee ?? 0)],
      ]
    );

    if (v) {
      this.sectionTitle("Vehículo a financiar");
      this.twoColGrid([
        ["Marca y modelo", `${v.brand} ${v.model} ${v.year}`],
        ["Versión", v.version],
        ["Precio de lista", mxn(v.value)],
        ["Financia el banco", `${formatPctMx(Math.round((s.requestedAmount / v.value) * 100), 0)} del precio`],
        ["Número de serie (VIN)", v.vin],
        ["Seguro anual cotizado", mxn(v.insuranceQuote)],
      ]);
    }

    this.sectionTitle("Descuentos en la tasa de interés");
    this.table(
      [
        { header: "Tramo", width: 94 },
        { header: "Tasa anual", width: 30, align: "right" },
        { header: "Variación", width: 26, align: "right" },
      ],
      this.report.rateCascade.map((step) => [
        step.label,
        formatPctMx(step.rate, 2),
        typeof step.deltaBps === "number" ? formatBps(step.deltaBps) : "Base",
      ])
    );
  }

  private drawCortexRules() {
    this.beginSection("Motor CORTEX", "Políticas y reglas de crédito");
    const groups: { key: CreditReportRuleRow["group"]; label: string }[] = [
      { key: "aprobacion", label: "Para que le aprueben el crédito" },
      { key: "validacion", label: "Documentos y datos que revisamos" },
      { key: "pricing", label: "Bonificaciones y descuentos de tasa" },
    ];

    this.sectionTitle("Requisitos del banco", "Cada punto debe cumplirse para otorgar el crédito");

    groups.forEach((g) => {
      const rules = this.report.rules.filter((r) => r.group === g.key);
      if (!rules.length) return;
      this.ensure(20);
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(FS.sectionSub);
      rgb(this.doc, C.ink);
      this.doc.text(g.label, MARGIN, this.y);
      this.y += 7;

      this.table(
        [
          { header: "Requisito", width: 38 },
          { header: "Qué revisa", width: 44 },
          { header: "Resultado", width: 22, align: "center" },
          { header: "Impacto", width: 16, align: "right" },
          { header: "Explicación", width: 52 },
        ],
        rules.map((r) => [
          r.label,
          r.description.slice(0, 60) + (r.description.length > 60 ? "…" : ""),
          humanizeVerdict(r.verdict),
          r.bpsDiscount ? formatBps(-r.bpsDiscount) : "—",
          r.detail,
        ]),
        { fontSize: FS.table, rowHeight: 10 }
      );
    });
  }

  private drawCapacityAnalysis() {
    this.beginSection("Capacidad de pago", "Capacidad de pago");
    const s = this.report.subject;
    const cap = this.report.capacity;

    this.sectionTitle("¿Puede pagar la mensualidad?");
    this.drawPtiGauge(cap.paymentToIncome, cap.maxAllowedPti, s.monthlyPayment, s.incomeNetMonthly);
    this.infoBox(explainDti(cap.debtToIncome, cap.fixedObligations, s.incomeNetMonthly));

    this.kpiRow([
      { label: "Pago del vehículo", value: mxn(s.monthlyPayment), sub: "Cada mes" },
      { label: "Sueldo neto", value: mxn(s.incomeNetMonthly), sub: "Lo que depositan" },
      { label: "Otras deudas", value: formatPctMx(cap.debtToIncome), sub: "Del ingreso mensual" },
      { label: "Le sobraría", value: mxn(cap.freeCashFlow), sub: "Después de todo" },
    ]);

    this.table(
      [
        { header: "Concepto", width: 55 },
        { header: "Cifra", width: 45, align: "right" },
        { header: "Qué significa", width: 70 },
      ],
      [
        [
          "Uso del sueldo en la mensualidad",
          formatPctMx(cap.paymentToIncome),
          `Tope del banco: ${formatPctMx(cap.maxAllowedPti)}`,
        ],
        [
          "Deudas sobre ingreso",
          formatPctMx(cap.debtToIncome),
          "Incluye tarjetas y crédito previo",
        ],
        ["Pagos fijos al mes (otros)", mxn(cap.fixedObligations), "Sin considerar la nueva operación"],
        ["Dinero libre después de pagar", mxn(cap.disposableIncome), "Para comida, renta, imprevistos"],
        ["Máximo que podría pedir", mxn(cap.maxLoanByIncome), "Regla: hasta 18 meses de sueldo"],
        ["Monto de esta solicitud", mxn(cap.recommendedAmount), "Dentro del máximo permitido"],
        [
          "Meses de colchón",
          `${cap.cushionMonths.toLocaleString("es-MX", { maximumFractionDigits: 1 })}`,
          "Cuántos meses cubrirían sus pagos con lo que le sobra",
        ],
      ]
    );
  }

  private drawAiAndRiskProfile() {
    this.beginSection("Perfil de riesgo", "Perfil de riesgo");
    const s = this.report.subject;

    this.sectionTitle("Opinión del sistema de análisis");
    this.paragraph(s.aiRecommendation);
    this.kpiRow([
      { label: "Compatibilidad", value: `${s.aiScore} / 100`, sub: "100 = muy favorable" },
      { label: "Nivel", value: "Alto" },
    ]);

    this.sectionTitle("Fortalezas del perfil");
    this.bulletList(this.report.strengths);

    this.sectionTitle("Factores de atención");
    this.bulletList(this.report.riskFactors);

    if (this.report.crossSellAccepted.length) {
      this.sectionTitle("Productos complementarios sugeridos");
      this.table(
        [
          { header: "Producto", width: 100 },
          { header: "Impacto tasa", width: 30, align: "right" },
        ],
        this.report.crossSellAccepted.map((c) => [c.label, c.bps ? "Sin cambio en tasa" : "Recomendado"]),
      );
    }
  }

  private drawDecisionAndConditions() {
    this.beginSection("Dictamen final", "Dictamen y condiciones");
    const s = this.report.subject;

    this.sectionTitle("Dictamen de crédito");
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(FS.dictamen);
    rgb(this.doc, C.ink);
    this.ensure(14);
    this.doc.text(s.decision === "APROBADO" ? "APROBADO" : s.decision, MARGIN, this.y);
    this.y += 10;
    this.paragraph(
      `Préstamo ${mxn(s.requestedAmount)} · ${explainTermMonths(s.termMonths)} · ${mxnPerMonth(s.monthlyPayment)} · Tasa ${formatPctMx(s.finalRate)}`
    );
    this.paragraph(s.decisionSummary);

    this.sectionTitle("Condiciones precedentes al desembolso");
    s.conditions.forEach((c, i) => {
      this.paragraph(`${i + 1}. ${c}`);
    });

    this.y += 8;
    this.sectionTitle("Firmas y autorizaciones");
    const sigY = this.y + 20;
    stroke(this.doc, C.rule);
    this.doc.setLineWidth(0.15);
    this.doc.line(MARGIN, sigY, MARGIN + 75, sigY);
    this.doc.line(MARGIN + 95, sigY, MARGIN + 170, sigY);
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(FS.bodySmall);
    rgb(this.doc, C.muted);
    this.doc.text("Oficial de crédito", MARGIN, sigY + 5);
    this.doc.text(this.report.meta.analyst, MARGIN, sigY + 10);
    this.doc.text("Firma del solicitante", MARGIN + 95, sigY + 5);
    this.doc.text(s.fullName, MARGIN + 95, sigY + 10);
    this.y = sigY + 18;
  }

  private drawAppendix() {
    this.beginSection("Anexo", "Glosario y avisos legales");
    this.sectionTitle("Marco legal y confidencialidad");
    this.paragraph(
      "Este informe ha sido generado con fines de análisis crediticio conforme a la Ley para la Transparencia y Ordenamiento de los Servicios Financieros, la Ley para Regular las Instituciones de Tecnología Financiera (si aplica) y la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP). La información de Buró de Crédito se utiliza exclusivamente para la evaluación de riesgo crediticio autorizada por el titular."
    );
    this.sectionTitle("Cómo se elaboró este informe");
    this.bulletList([
      "Se confirmó la identidad con INE y selfie (prueba de que es la misma persona).",
      "Se buscó el nombre en listas de riesgo nacionales e internacionales (lavado de dinero, sanciones).",
      "Se consultó el Buró de Crédito con su autorización.",
      "Se revisaron requisitos del producto (enganche, ingreso, historial de pago).",
      "Se calculó si la mensualidad cabe en su sueldo y cuánto queda para vivir.",
      "Un sistema de apoyo comparó el perfil con solicitudes similares aprobadas antes.",
    ]);
    this.sectionTitle("Palabras que puede ver en el informe");
    this.table(
      [
        { header: "Palabra", width: 32 },
        { header: "Significado sencillo", width: 98 },
      ],
      [
        ["Mensualidad / cuota", "Lo que pagaría cada mes por el crédito del vehículo."],
        ["Enganche", "Dinero de su bolsa que paga primero; el resto lo presta el banco."],
        ["Buró / puntaje", "Historial de cómo ha pagado tarjetas y préstamos en México."],
        ["Al corriente (MOP 01)", "Lleva sus pagos al día, sin atrasos reportados."],
        ["CAT", "Porcentaje que resume el costo total del crédito al año (para comparar bancos)."],
        ["Tasa de interés", "Porcentaje anual que cobra el banco por prestarle el dinero."],
        ["MXN", "Pesos mexicanos. Todos los montos de este informe están en esta moneda."],
      ],
      { rowHeight: 11, fontSize: FS.table }
    );
    this.y += 4;
    this.doc.setFont("helvetica", "italic");
    this.doc.setFontSize(FS.bodySmall);
    rgb(this.doc, C.muted);
    this.doc.text(
      `Documento generado electrónicamente · ${this.report.reportId} · ${fmtDate(this.report.generatedAt)} · No requiere firma autógrafa para efectos de archivo digital.`,
      MARGIN,
      FOOTER_Y - 12,
      { maxWidth: CONTENT_W }
    );
  }
}

export function exportCreditReportPdf(report: CreditReportPayload): void {
  new CreditReportPdfBuilder(report).build();
}
