import { jsPDF } from "jspdf";
import type { MoralCreditReportPayload } from "@/modules/mdc/types/moral-credit-report.types";
import type { ReportKind } from "@/modules/mdc/components/mdc-reports-tab";
import { formatPctMx } from "@/modules/scotia/utils/format-mxn";
import {
  explainCat,
  explainTermMonths,
  formatBps,
  humanizeAmlResult,
  humanizeVerdict,
  mxn,
  mxnPerMonth,
} from "@/modules/reporting/services/credit-report-pdf-format";

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
  coverTitle: 22,
  coverSub: 10,
  coverName: 15,
  coverBody: 9.5,
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
  kpiLabel: 7.5,
  kpiValue: 11,
  kpiSub: 7.5,
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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" });
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function decisionLabel(d: string) {
  if (d === "APROBADO") return "Aprobado";
  if (d === "REVISION") return "Revision manual";
  return "Rechazado";
}

class MoralReportPdfBuilder {
  private doc: Doc;
  private page = 1;
  private y = 0;
  private sectionNum = 0;
  private tocPage = 0;
  private anchors: { title: string; page: number }[] = [];

  constructor(
    private report: MoralCreditReportPayload,
    private reportKind: ReportKind = "full",
  ) {
    this.doc = new jsPDF({ unit: "mm", format: "a4" });
  }

  build() {
    this.drawCover();
    this.drawMetaAndToc();
    if (this.reportKind === "kyb") {
      this.drawCompliance();
    } else if (this.reportKind === "shareholders") {
      this.drawCompanyProfile();
    } else if (this.reportKind === "mdc") {
      this.drawRulesAndDecision();
    } else {
      this.drawExecutiveSummary();
      this.drawCompanyProfile();
      this.drawCompliance();
      this.drawFinancials();
      this.drawRulesAndDecision();
    }
    this.finalizeToc();

    const slug = this.report.company.legalName.replace(/\s+/g, "-").toLowerCase();
    this.doc.save(
      `informe-empresarial-${slug}-${this.report.application.appNo}-${new Date().toISOString().slice(0, 10)}.pdf`,
    );
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
    doc.text("ZELIFY · MDC CORPORATE REPORT", MARGIN, 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.headerSub);
    rgb(doc, C.muted);
    doc.text("Informe crediticio empresarial · Persona moral · MXN", MARGIN, 17);
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
    doc.text(clip(doc, this.report.meta.confidentiality, 78), MARGIN, FOOTER_Y);
    doc.text(clip(doc, this.report.meta.institution, 48), 122, FOOTER_Y);
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
    const lines = doc.splitTextToSize(norm(text), CONTENT_W - indent) as string[];
    this.ensure(lines.length * FS.line + 2);
    doc.text(lines, MARGIN + indent, this.y);
    this.y += lines.length * FS.line + 2;
  }

  private infoBox(text: string) {
    this.ensure(FS.line * 3);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(FS.body);
    rgb(this.doc, C.ink);
    this.doc.text("En pocas palabras:", MARGIN, this.y);
    this.y += FS.line;
    this.doc.setFont("helvetica", "normal");
    rgb(this.doc, C.body);
    const lines = this.doc.splitTextToSize(norm(text), CONTENT_W) as string[];
    this.ensure(lines.length * FS.line + 2);
    this.doc.text(lines, MARGIN, this.y);
    this.y += lines.length * FS.line + 4;
  }

  private bulletList(items: string[]) {
    items.forEach((item) => {
      const lines = this.doc.splitTextToSize(norm(`•  ${item}`), CONTENT_W - 4) as string[];
      this.ensure(lines.length * FS.line + 1);
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(FS.body);
      rgb(this.doc, C.body);
      this.doc.text(lines, MARGIN + 2, this.y);
      this.y += lines.length * FS.line + 1;
    });
    this.y += 2;
  }

  private kpiRow(kpis: { label: string; value: string; sub?: string }[]) {
    const n = kpis.length;
    const gap = 4;
    const w = (CONTENT_W - gap * (n - 1)) / n;
    const h = 22;
    this.ensure(h + 6);
    kpis.forEach((k, i) => {
      const x = MARGIN + i * (w + gap);
      fill(this.doc, [248, 250, 252]);
      this.doc.roundedRect(x, this.y - 2, w, h, 1.5, 1.5, "F");
      stroke(this.doc, C.rule);
      this.doc.setLineWidth(0.15);
      this.doc.roundedRect(x, this.y - 2, w, h, 1.5, 1.5, "S");
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(FS.kpiLabel);
      rgb(this.doc, C.muted);
      this.doc.text(clip(this.doc, k.label, w - 4), x + 3, this.y + 3);
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(FS.kpiValue);
      rgb(this.doc, C.ink);
      this.doc.text(clip(this.doc, k.value, w - 4), x + 3, this.y + 10);
      if (k.sub) {
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(FS.kpiSub);
        rgb(this.doc, C.muted);
        this.doc.text(clip(this.doc, k.sub, w - 4), x + 3, this.y + 16);
      }
    });
    this.y += h + 8;
  }

  private twoColGrid(pairs: [string, string][], labelW = 52) {
    const valW = CONTENT_W - labelW - 4;
    pairs.forEach(([label, value]) => {
      this.ensure(8);
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(FS.body);
      rgb(this.doc, C.muted);
      this.doc.text(norm(label), MARGIN, this.y);
      this.doc.setFont("helvetica", "normal");
      rgb(this.doc, C.body);
      const lines = this.doc.splitTextToSize(norm(value), valW) as string[];
      this.doc.text(lines, MARGIN + labelW, this.y);
      this.y += Math.max(7, lines.length * FS.line);
    });
    this.y += 3;
  }

  private table(columns: Col[], rows: string[][], opts?: { rowHeight?: number; fontSize?: number }) {
    const doc = this.doc;
    const fs = opts?.fontSize ?? FS.table;
    const minRowH = opts?.rowHeight ?? 8;
    const padX = 2;
    const padY = 2;
    const startX = MARGIN;
    const tableW = columns.reduce((s, c) => s + c.width, 0);
    const headerLineSets = columns.map((col) =>
      doc.splitTextToSize(norm(col.header), col.width - padX * 2) as string[],
    );
    const headerMaxLines = Math.max(...headerLineSets.map((l) => l.length), 1);
    const headerH = Math.max(8, headerMaxLines * 4.2 + padY * 2);

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
          col.align === "right" ? x + col.width - padX : col.align === "center" ? x + col.width / 2 : x + padX;
        doc.text(headerLineSets[index], tx, this.y + 5.4, { align: col.align ?? "left" });
        stroke(doc, C.rule);
        doc.line(x + col.width, this.y, x + col.width, this.y + headerH);
        x += col.width;
      });
      this.y += headerH;
    };

    drawHeader();
    rows.forEach((row, rowIndex) => {
      const lineSets = row.map((cell, ci) =>
        doc.splitTextToSize(norm(cell ?? "-"), columns[ci].width - padX * 2) as string[],
      );
      const maxLines = Math.max(...lineSets.map((l) => l.length), 1);
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
        const tx =
          col.align === "right" ? x + col.width - padX : col.align === "center" ? x + col.width / 2 : x + padX;
        doc.text(lineSets[ci], tx, this.y + 4.6, { align: col.align ?? "left" });
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

  private finalizeToc() {
    if (!this.tocPage) return;
    const current = this.page;
    this.doc.setPage(this.tocPage);
    this.y = 48;
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(FS.section);
    rgb(this.doc, C.brand);
    this.doc.text("Indice de contenidos", MARGIN, this.y);
    this.y += 6;
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(FS.sectionSub);
    rgb(this.doc, C.muted);
    this.doc.text("Navegacion interna del expediente empresarial", MARGIN, this.y);
    this.y += 5;
    stroke(this.doc, C.rule);
    this.doc.setLineWidth(0.25);
    this.doc.line(MARGIN, this.y, PAGE_W - MARGIN, this.y);
    this.y += 8;
    this.anchors.forEach((anchor, index) => {
      const yy = this.y;
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(FS.body);
      rgb(this.doc, C.body);
      this.doc.text(`${index + 1}. ${anchor.title}`, MARGIN, yy);
      stroke(this.doc, C.rule);
      this.doc.setLineWidth(0.1);
      this.doc.line(108, yy - 1, PAGE_W - MARGIN - 12, yy - 1);
      this.doc.setFont("helvetica", "bold");
      rgb(this.doc, C.brand);
      this.doc.text(String(anchor.page), PAGE_W - MARGIN, yy, { align: "right" });
      this.doc.link(MARGIN, yy - 4, CONTENT_W, 6, { pageNumber: anchor.page });
      this.y += 7;
    });
    this.doc.setPage(current);
  }

  /* ─── Secciones ─── */

  private drawCover() {
    const doc = this.doc;
    const c = this.report.company;
    const app = this.report.application;

    fill(doc, C.brand);
    doc.rect(0, 0, PAGE_W, 28, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.coverTitle);
    doc.setTextColor(255, 255, 255);
    doc.text("ZELIFY", MARGIN, 14);
    doc.setFontSize(FS.coverSub);
    doc.setFont("helvetica", "normal");
    doc.text("MDC Corporate Credit Report", MARGIN, 21);

    fill(doc, C.brandSoft);
    doc.roundedRect(MARGIN, 35, CONTENT_W, 30, 3, 3, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.coverTitle - 2);
    rgb(doc, C.brand);
    doc.text(
      this.reportKind === "kyb"
        ? "INFORME KYB EMPRESARIAL"
        : this.reportKind === "shareholders"
          ? "INFORME DE ESTRUCTURA ACCIONARIA"
        : this.reportKind === "mdc"
          ? "INFORME MDC EMPRESARIAL"
          : "INFORME CREDITICIO EMPRESARIAL",
      MARGIN + 6,
      47,
    );
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.coverSub);
    rgb(doc, C.muted);
    doc.text(
      this.reportKind === "kyb"
        ? "KYB · AML · Buro corporativo"
        : this.reportKind === "shareholders"
          ? "Socios · participacion · roles · gobierno corporativo"
        : this.reportKind === "mdc"
          ? "Motor MDC · Reglas · Tasa · Dictamen"
          : "KYB · AML · Buro corporativo · Finanzas · Motor MDC · Dictamen",
      MARGIN + 6,
      56,
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.coverName);
    rgb(doc, C.ink);
    doc.text(doc.splitTextToSize(c.legalName, CONTENT_W - 65) as string[], MARGIN, 78);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.coverBody);
    rgb(doc, C.body);
    doc.text(`${c.rfc} · ${c.segment} · ${app.appNo}`, MARGIN, 92);

    fill(doc, [245, 247, 250]);
    doc.roundedRect(PAGE_W - MARGIN - 58, 74, 58, 26, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.bodySmall);
    rgb(doc, C.brand);
    doc.text("Folio", PAGE_W - MARGIN - 52, 82);
    doc.setFont("helvetica", "normal");
    rgb(doc, C.body);
    doc.text(clip(doc, this.report.reportId, 50), PAGE_W - MARGIN - 52, 88);
    doc.text(fmtShort(this.report.generatedAt), PAGE_W - MARGIN - 52, 94);

    stroke(doc, C.rule);
    doc.setLineWidth(0.25);
    doc.line(MARGIN, 102, PAGE_W - MARGIN, 102);

    this.y = 110;
    const dc = c.decision === "APROBADO" ? C.ok : c.decision === "REVISION" ? C.warn : C.danger;
    fill(doc, dc);
    doc.roundedRect(MARGIN, this.y - 4, 42, 8, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.body);
    doc.setTextColor(255, 255, 255);
    doc.text(decisionLabel(c.decision), MARGIN + 4, this.y + 1.5);
    this.y += 12;

    const metaRows: [string, string][] = [
      ["Folio del informe", this.report.reportId],
      ["Fecha de generacion", fmtDate(this.report.generatedAt)],
      ["Solicitud MDC", app.appNo],
      ["Producto", c.productName],
      ["Monto solicitado", mxn(c.requestedAmount)],
      ["Plazo", explainTermMonths(c.termMonths)],
      ["Pago mensual estimado", mxnPerMonth(c.monthlyPayment)],
      ["Tasa de interes anual", formatPctMx(c.finalRate)],
      ["CAT (costo total anual)", formatPctMx(c.cat, 1)],
      ["Resultado", decisionLabel(c.decision)],
      ["Score buró corporativo", String(c.bureauScore)],
      ["DSCR proyectado", `${this.report.financials.dscr.toFixed(2)}x`],
      ["Valido hasta", fmtShort(this.report.meta.validUntil)],
      ["Analista", this.report.meta.analyst],
      ["Sucursal", this.report.meta.branch],
    ];
    metaRows.forEach(([k, v]) => {
      doc.setFont("helvetica", "bold");
      rgb(doc, C.muted);
      doc.setFontSize(FS.coverBody);
      doc.text(k, MARGIN, this.y);
      doc.setFont("helvetica", "normal");
      rgb(doc, C.body);
      const vLines = doc.splitTextToSize(v, CONTENT_W - 54) as string[];
      doc.text(vLines, MARGIN + 54, this.y);
      this.y += Math.max(7.5, vLines.length * 4.8);
    });

    this.y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(FS.bodySmall);
    rgb(doc, C.brand);
    doc.text("DICTAMEN PRELIMINAR", MARGIN, this.y);
    this.y += 5;
    doc.setFont("helvetica", "normal");
    rgb(doc, C.body);
    const dictLines = doc.splitTextToSize(c.decisionSummary, CONTENT_W) as string[];
    doc.text(dictLines, MARGIN, this.y);
    this.y += dictLines.length * 4.5 + 6;

    doc.setFont("helvetica", "bold");
    rgb(doc, C.brand);
    doc.text("DOCUMENTO CONFIDENCIAL", MARGIN, this.y);
    this.y += 5;
    doc.setFont("helvetica", "normal");
    rgb(doc, C.muted);
    doc.text(doc.splitTextToSize(this.report.meta.confidentiality, CONTENT_W) as string[], MARGIN, this.y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(FS.footer);
    rgb(doc, C.muted);
    doc.text(this.report.meta.institution, MARGIN, FOOTER_Y);
    doc.text("Powered by Zelify Core · MDC", PAGE_W - MARGIN, FOOTER_Y, { align: "right" });
  }

  private drawMetaAndToc() {
    this.newPage("Indice");
    this.tocPage = this.page;
    this.newPage("Datos del expediente");
    const c = this.report.company;
    const app = this.report.application;
    this.sectionTitle("Datos del expediente", "Trazabilidad y canal de originacion");
    this.twoColGrid(
      this.reportKind === "kyb"
        ? [
            ["Canal", this.report.meta.channel],
            ["Analista responsable", this.report.meta.analyst],
            ["ID empresa", c.id],
            ["Razon social", c.legalName],
            ["Clasificacion AML", `${c.amlStatus} · Riesgo ${c.amlRiskLevel}`],
            ["Estatus KYB", `${c.kybStatus} (${(c.kybCompleteness * 100).toFixed(0)}%)`],
            ["Representante legal", c.legalRep],
            ["RFC", c.rfc],
          ]
        : this.reportKind === "shareholders"
          ? [
              ["Canal", this.report.meta.channel],
              ["Analista responsable", this.report.meta.analyst],
              ["Razon social", c.legalName],
              ["ID empresa", c.id],
              ["RFC", c.rfc],
              ["Representante legal", c.legalRep],
              ["Accionistas", String(c.shareholders)],
              ["Segmento", c.segment],
            ]
        : this.reportKind === "mdc"
          ? [
              ["Canal", this.report.meta.channel],
              ["Analista responsable", this.report.meta.analyst],
              ["Consulta originadora", this.report.promptUsed.slice(0, 120) + (this.report.promptUsed.length > 120 ? "..." : "")],
              ["Solicitud MDC", app.appNo],
              ["Producto", c.productName],
              ["Monto solicitado", mxn(c.requestedAmount)],
              ["Estado solicitud", app.statusLabel],
              ["Riesgo MDC", `${app.riskLevel} (${app.riskScore})`],
            ]
          : [
              ["Canal", this.report.meta.channel],
              ["Analista responsable", this.report.meta.analyst],
              ["Consulta originadora", this.report.promptUsed.slice(0, 120) + (this.report.promptUsed.length > 120 ? "..." : "")],
              ["ID empresa", c.id],
              ["Clasificacion AML", `${c.amlStatus} · Riesgo ${c.amlRiskLevel}`],
              ["Estatus KYB", `${c.kybStatus} (${(c.kybCompleteness * 100).toFixed(0)}%)`],
              ["Estado solicitud", app.statusLabel],
              ["Riesgo MDC", `${app.riskLevel} (${app.riskScore})`],
            ],
    );
  }

  private drawExecutiveSummary() {
    this.beginSection("Resumen ejecutivo", "Resumen ejecutivo");
    const c = this.report.company;
    const f = this.report.financials;
    const cap = this.report.capacity;
    const rulesOk = this.report.rules.filter((r) => r.verdict === "CUMPLE").length;

    this.sectionTitle("Resumen ejecutivo", "Lo mas importante en pocas lineas");
    this.bulletList(this.report.executiveSummary);

    if (this.reportKind === "full") {
      this.sectionTitle("Lectura consolidada KYB + MDC", "Vista integral del expediente empresarial");
      this.bulletList(this.report.integratedAnalysis);
    }

    this.sectionTitle("Numeros principales (pesos mexicanos)");
    this.kpiRow([
      { label: "Resultado", value: decisionLabel(c.decision) },
      { label: "Score buró", value: String(c.bureauScore), sub: `Percentil ${c.bureauPercentile}` },
      { label: "Mensualidad", value: mxn(c.monthlyPayment), sub: explainTermMonths(c.termMonths) },
      { label: "Cuota / ingresos", value: formatPctMx(cap.quotaToRevenueRatio * 100), sub: `Tope ${formatPctMx(cap.maxAllowedQuotaRatio * 100)}` },
    ]);
    this.kpiRow([
      { label: "Credito", value: mxn(c.requestedAmount), sub: c.productName },
      { label: "Tasa anual", value: formatPctMx(c.finalRate), sub: explainCat(c.cat) },
      { label: "Reglas MDC", value: `${rulesOk} de ${this.report.rules.length}`, sub: "Cumplidas" },
      { label: "DSCR", value: `${f.dscr.toFixed(2)}x`, sub: `Apalanc. ${f.leverageRatio.toFixed(2)}x` },
    ]);

    this.infoBox(c.aiRecommendation);

    this.sectionTitle("Decision");
    this.paragraph(`${decisionLabel(c.decision)}. ${c.decisionSummary}`);

    this.sectionTitle("Fortalezas y riesgos");
    this.paragraph("Fortalezas:");
    this.bulletList(this.report.strengths);
    this.paragraph("Factores de riesgo:");
    this.bulletList(this.report.riskFactors);
  }

  private drawCompanyProfile() {
    this.beginSection("Perfil corporativo", "Perfil corporativo");
    const c = this.report.company;

    this.sectionTitle("Identificacion de la empresa");
    this.twoColGrid([
      ["Razon social", c.legalName],
      ["RFC", c.rfc],
      ["Constitucion", `${c.incorporationDate} · ${c.antiquityYears} anos`],
      ["Representante legal", c.legalRep],
      ["Empleados", String(c.employees)],
      ["Accionistas", String(c.shareholders)],
      ["Correo", c.email],
      ["Telefono", c.phone],
      ["Sitio web", c.website],
    ]);

    this.sectionTitle("Domicilio y operacion");
    this.paragraph(c.address);
    this.twoColGrid([
      ["Regiones", c.operatingRegions],
      ["Sector", c.sector],
      ["NAICS", c.naicsCode],
      ["Destino del credito", c.creditPurpose],
    ]);
    this.paragraph(c.industrySummary);
    this.paragraph(`Mercado objetivo: ${c.targetMarket}`);

    this.sectionTitle("Estructura accionaria");
    this.table(
      [
        { header: "Accionista", width: 52 },
        { header: "RFC", width: 32 },
        { header: "Part.", width: 14, align: "right" },
        { header: "Rol", width: 48 },
        { header: "Score", width: 16, align: "right" },
      ],
      this.report.shareholders.map((s) => [
        s.name,
        s.rfc,
        `${s.ownershipPct}%`,
        s.role,
        String(s.bureauScore ?? "N/A"),
      ]),
    );

    this.sectionTitle("Analisis sectorial");
    this.paragraph(this.report.sector.sectorOutlook);
    this.bulletList(this.report.sector.industryTrends);
  }

  private drawCompliance() {
    this.beginSection("Cumplimiento", "KYB, AML y buró");
    const c = this.report.company;

    this.sectionTitle("KYB · Verificacion empresarial");
    this.table(
      [
        { header: "Documento", width: 48 },
        { header: "Estado", width: 22 },
        { header: "Detalle", width: 112 },
      ],
      this.report.kybDocuments.map((d) => [d.label, d.status, d.detail]),
    );

    this.sectionTitle("AML · Listas restrictivas");
    this.table(
      [
        { header: "Lista", width: 58 },
        { header: "Resultado", width: 28 },
        { header: "Proveedor", width: 96 },
      ],
      this.report.amlChecks.map((a) => [a.listName, humanizeAmlResult(a.result), a.provider]),
    );

    this.sectionTitle("Buro de credito empresarial");
    this.kpiRow([
      { label: "Score buró", value: String(c.bureauScore), sub: c.bureauRating },
      { label: "Score socios", value: String(c.shareholderScore) },
      { label: "Max. atraso", value: `${c.maxDaysPastDue} dias` },
      { label: "Deuda total", value: mxn(c.totalCorporateDebt) },
    ]);

    this.sectionTitle("Evolucion del score (12 meses)");
    this.table(
      [
        { header: "Periodo", width: 50 },
        { header: "Puntaje", width: 30, align: "right" },
        { header: "Referencia", width: 100 },
      ],
      this.report.buroScoreHistory.map((h, i) => [
        h.period,
        String(h.score),
        i === 0 ? "Actual" : i === this.report.buroScoreHistory.length - 1 ? "Hace ~1 ano" : "",
      ]),
      { rowHeight: 7 },
    );

    this.sectionTitle("Obligaciones reportadas");
    this.table(
      [
        { header: "Acreditante", width: 34 },
        { header: "Producto", width: 38 },
        { header: "Saldo", width: 32, align: "right" },
        { header: "Limite", width: 32, align: "right" },
        { header: "MOP", width: 12, align: "center" },
        { header: "Util.", width: 14, align: "right" },
      ],
      this.report.buroTradelines.map((t) => [
        t.creditor,
        t.product,
        mxn(t.balance),
        mxn(t.limit),
        t.mop,
        `${t.utilizationPct}%`,
      ]),
    );
  }

  private drawFinancials() {
    this.beginSection("Finanzas", "Estados financieros y capacidad");
    const f = this.report.financials;
    const cap = this.report.capacity;

    this.sectionTitle("Indicadores financieros clave");
    this.kpiRow([
      { label: "Facturacion / mes", value: mxn(f.monthlyRevenue) },
      { label: "EBITDA anual", value: mxn(f.ebitda) },
      { label: "Margen EBITDA", value: formatPctMx(f.ebitdaMargin * 100) },
      { label: "Flujo libre", value: mxn(f.freeCashFlow) },
    ]);
    this.kpiRow([
      { label: "Razon corriente", value: `${f.currentRatio.toFixed(2)}x` },
      { label: "ROE / ROA", value: `${formatPctMx(f.roe * 100, 0)} / ${formatPctMx(f.roa * 100, 0)}` },
      { label: "Cobertura int.", value: `${f.interestCoverage.toFixed(1)}x` },
      { label: "Monto / ventas", value: `${f.requestedAmountToRevenue.toFixed(2)}x` },
    ]);

    this.sectionTitle("Balance general");
    this.table(
      [
        { header: "Periodo", width: 22 },
        { header: "Activos", width: 34, align: "right" },
        { header: "Pasivos", width: 34, align: "right" },
        { header: "Capital", width: 34, align: "right" },
        { header: "Efectivo", width: 36, align: "right" },
      ],
      this.report.balanceSheet.map((b) => [
        b.period,
        mxn(b.totalAssets),
        mxn(b.totalLiabilities),
        mxn(b.equity),
        mxn(b.cash),
      ]),
    );

    this.sectionTitle("Estado de resultados");
    this.table(
      [
        { header: "Periodo", width: 22 },
        { header: "Ingresos", width: 40, align: "right" },
        { header: "EBITDA", width: 40, align: "right" },
        { header: "Util. neta", width: 44, align: "right" },
      ],
      this.report.incomeStatement.map((i) => [i.period, mxn(i.revenue), mxn(i.ebitda), mxn(i.netIncome)]),
    );

    this.sectionTitle("Flujo de efectivo");
    this.table(
      [
        { header: "Periodo", width: 22 },
        { header: "Operacion", width: 40, align: "right" },
        { header: "CAPEX", width: 40, align: "right" },
        { header: "Variacion", width: 44, align: "right" },
      ],
      this.report.cashFlow.map((cf) => [
        cf.period,
        mxn(cf.operatingCashFlow),
        mxn(cf.capex),
        mxn(cf.netCashChange),
      ]),
    );

    this.sectionTitle("Ingresos verificados");
    this.table(
      [
        { header: "Concepto", width: 80 },
        { header: "Monto / mes", width: 44, align: "right" },
        { header: "%", width: 16, align: "right" },
        { header: "Fuente", width: 42 },
      ],
      this.report.revenueBreakdown
        .filter((r) => r.verified)
        .map((r) => [r.concept, mxn(r.amount), `${r.pctOfTotal}%`, r.source]),
    );

    this.sectionTitle("Concentracion de clientes");
    this.table(
      [
        { header: "Cliente", width: 58 },
        { header: "Sector", width: 38 },
        { header: "% ing.", width: 16, align: "right" },
        { header: "Plazo", width: 38 },
      ],
      this.report.clientConcentration.map((cl) => [
        cl.client,
        cl.sector,
        `${(cl.revenuePct * 100).toFixed(0)}%`,
        cl.paymentTerms,
      ]),
    );

    this.sectionTitle("Capacidad de pago empresarial");
    this.kpiRow([
      { label: "EBITDA mensual", value: mxn(cap.ebitdaMonthly) },
      { label: "Servicio deuda", value: mxn(cap.debtServiceMonthly) },
      { label: "DSCR", value: `${cap.dscr.toFixed(2)}x`, sub: `Min. ${cap.minRequiredDscr.toFixed(2)}x` },
      { label: "DSCR estres", value: `${cap.stressDscr.toFixed(2)}x` },
    ]);
    this.infoBox(
      `La cuota representa ${formatPctMx(cap.quotaToRevenueRatio * 100)} de los ingresos mensuales verificados. ` +
        `Colchon estimado: ${cap.cushionMonths.toFixed(1)} meses. Caida break-even: ${formatPctMx(cap.breakEvenRevenueDecline * 100)}.`,
    );
  }

  private drawRulesAndDecision() {
    this.beginSection("Decision MDC", "Motor de reglas y condiciones");
    const c = this.report.company;
    const ok = this.report.rules.filter((r) => r.verdict === "CUMPLE").length;
    const rev = this.report.rules.filter((r) => r.verdict === "REVISAR").length;
    const totalBps = this.report.rateCascade.reduce((s, step) => s + (step.deltaBps ?? 0), 0);

    this.sectionTitle("Motor MDC · Reglas de decision");
    this.kpiRow([
      { label: "Dictamen", value: decisionLabel(c.decision) },
      { label: "Cumplen", value: String(ok) },
      { label: "En revision", value: String(rev) },
      { label: "Tasa final", value: formatPctMx(c.finalRate), sub: formatBps(totalBps) },
    ]);
    this.table(
      [
        { header: "Regla", width: 48 },
        { header: "Veredicto", width: 24, align: "center" },
        { header: "Detalle", width: 110 },
      ],
      this.report.rules.map((r) => [r.label, humanizeVerdict(r.verdict), r.detail]),
    );

    this.sectionTitle("Cascada de tasa");
    this.table(
      [
        { header: "Concepto", width: 100 },
        { header: "Tasa", width: 30, align: "right" },
        { header: "Ajuste", width: 52, align: "right" },
      ],
      this.report.rateCascade.map((s) => [
        s.label,
        formatPctMx(s.rate),
        s.deltaBps ? formatBps(s.deltaBps) : "-",
      ]),
    );

    this.sectionTitle("Garantias propuestas");
    this.table(
      [
        { header: "Tipo", width: 32 },
        { header: "Valor", width: 34, align: "right" },
        { header: "Cob.", width: 14, align: "right" },
        { header: "Descripcion y gravamen", width: 102 },
      ],
      this.report.collateral.map((col) => [
        col.type,
        mxn(col.appraisedValue),
        `${col.coveragePct}%`,
        `${col.description} · ${col.lienStatus}`,
      ]),
    );

    this.sectionTitle("Condiciones para desembolso");
    c.conditions.forEach((cond, i) => this.paragraph(`${i + 1}. ${cond}`));

    this.sectionTitle("Monitoreo post-originacion");
    this.bulletList(this.report.monitoringPlan);

    this.sectionTitle("Trazabilidad y pagos");
    this.table(
      [
        { header: "Fecha", width: 28 },
        { header: "Evento", width: 32 },
        { header: "Detalle", width: 122 },
      ],
      [
        ...this.report.traceability.map((t) => [
          fmtShort(t.timestamp),
          t.action,
          t.details,
        ]),
        ...this.report.paymentHistory.map((p) => [
          p.date,
          `Pago ${p.method}`,
          `${mxn(p.amount)} · ${p.status} · Ref. ${p.reference ?? ""}`,
        ]),
      ],
    );
  }
}

export function exportMoralCreditReportPdf(report: MoralCreditReportPayload, reportKind: ReportKind = "full"): void {
  new MoralReportPdfBuilder(report, reportKind).build();
}
