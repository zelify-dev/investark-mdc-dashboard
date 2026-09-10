import { jsPDF } from "jspdf";
import type { LiveReportResult, LiveReportSection } from "./live-report-query.service";

const SECTION_LABEL: Record<LiveReportSection, string> = {
  kyc: "KYC y verificación de identidad",
  rules: "Reglas de decisión",
  documents: "Documentación y extracción",
};

function printable(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Sin información";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return String(value)
    .replace(/[áàä]/gi, "a")
    .replace(/[éèë]/gi, "e")
    .replace(/[íìï]/gi, "i")
    .replace(/[óòö]/gi, "o")
    .replace(/[úùü]/gi, "u")
    .replace(/ñ/gi, "n");
}

function flatten(value: unknown, prefix = ""): Array<{ label: string; value: string }> {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => flatten(entry, `${prefix} ${index + 1}`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !["url", "webviewUrl", "kycWebviewUrl"].includes(key))
      .flatMap(([key, entry]) => flatten(entry, prefix ? `${prefix} · ${key}` : key));
  }
  return prefix ? [{ label: prefix, value: printable(value) }] : [];
}

function displayLabel(label: string): string {
  return label
    .replace(/ · /g, " / ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

type PdfModule = { title: string; fields: Array<{ label: string; value: string }> };

function reportModules(section: LiveReportResult["sections"][number]): PdfModule[] {
  const record = asRecord(section.data);
  if (!record) return [];

  if (section.section === "kyc") {
    const session = asRecord(record.session) || record;
    const onboarding = asRecord(session.onboarding);
    const showModule = (module: NonNullable<typeof section.kycModules>[number]) => !section.kycModules || section.kycModules.includes(module);
    return [
      ...(showModule("session") ? [{ title: "Estado de la sesión", fields: flatten({ sessionId: session.sessionId, status: session.status, userId: session.userId, completedAt: session.completedAt }) }] : []),
      ...(showModule("identity") ? [{ title: "Identidad", fields: flatten(session.identity) }] : []),
      ...(showModule("contact") ? [{ title: "Contacto", fields: flatten(onboarding?.contact) }] : []),
      ...(showModule("personal") ? [{ title: "Datos personales", fields: flatten(onboarding?.personal) }] : []),
      ...(showModule("address") ? [{ title: "Domicilio", fields: flatten({ verificacion: session.address, registro: onboarding?.address }) }] : []),
      ...(showModule("references") ? [{ title: "Referencias", fields: flatten(onboarding?.references) }] : []),
      ...(showModule("curp") ? [{ title: "Consulta por CURP", fields: flatten(record.sessionByCurp) }] : []),
    ].filter((module) => module.fields.length > 0);
  }

  if (section.section === "rules") {
    const ruleResults = asRecord(record.rule) || {};
    const ruleNames = asRecord(record.ruleNames) || {};
    const ruleDetails = asRecord(record.ruleDetails) || {};
    const modules = [
      { title: "Resumen de decisión", fields: flatten({ finalDecision: record.finalDecision, createdAt: record.createdAt, updatedAt: record.updatedAt }) },
      ...Object.entries(ruleResults).map(([ruleId, status]) => {
        const detail = asRecord(ruleDetails[ruleId]);
        return {
          title: printable(ruleNames[ruleId] || "Regla de decisión"),
          fields: flatten({ resultado: status, descripcion: detail?.description, condiciones: detail?.conditions, productos: detail?.products }),
        };
      }),
    ].filter((module) => module.fields.length > 0);
    return modules.filter((module, index) => !section.ruleModules || (index === 0 ? section.ruleModules.includes("summary") : section.ruleModules.includes("rules")));
  }

  const progressByCategory = Array.isArray(record.progressByCategory) ? record.progressByCategory : [];
  const extractions = Array.isArray(record.extractions) ? record.extractions : [];
  const files = Array.isArray(record.files) ? record.files : [];
  const categoryByAnalysisId = new Map(
    progressByCategory.flatMap((entry) => {
      const item = asRecord(entry);
      const progress = asRecord(item?.progress);
      const documents = Array.isArray(progress?.documents) ? progress.documents : [];
      return documents.map((document) => [asRecord(document)?.analysisId, item?.category] as const).filter(([analysisId]) => typeof analysisId === "string");
    }),
  );
  const categoryAllowed = (category: unknown) => {
    if (!section.documentModules) return true;
    return (category === "nomina" && section.documentModules.includes("payroll"))
      || (category === "extracto" && section.documentModules.includes("bankStatement"))
      || (category === "comprobante_domicilio" && section.documentModules.includes("address"));
  };
  const progressModules = (!section.documentModules || section.documentModules.includes("progress")) ? progressByCategory.map((entry) => {
    const item = asRecord(entry) || {};
    return { title: `Estado: ${printable(item.category)}`, fields: flatten(item.progress) };
  }) : [];
  const documentModules = extractions.filter((entry) => {
    const extraction = asRecord(entry) || {};
    return categoryAllowed(extraction.category || categoryByAnalysisId.get(extraction.analysisId));
  }).map((entry, index) => {
    const extraction = asRecord(entry) || {};
    const file = files.map(asRecord).find((candidate) => candidate?.documentId === extraction.documentId);
    return {
      title: `Documento: ${printable(extraction.fileName || `Archivo ${index + 1}`)}`,
      fields: flatten({
        estado: extraction.status,
        tipo: extraction.documentType,
        confianza: extraction.confidence,
        procesado: extraction.processed,
        validacion: extraction.validation,
        extraccion: extraction.extraction,
        archivoDisponible: file?.available,
      }),
    };
  });
  return [...progressModules, ...documentModules].filter((module) => module.fields.length > 0);
}

export function exportLiveReportPdf(report: LiveReportResult): void {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 15;
  const contentWidth = 180;
  let y = 18;
  let page = 1;

  const chrome = () => {
    doc.setFillColor(17, 39, 72);
    doc.rect(0, 0, 210, 9, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`ZELIFY · Informe generado ${new Date().toLocaleString("es-MX")}`, margin, 289);
    doc.text(`Página ${page}`, 195, 289, { align: "right" });
  };
  const nextPage = () => {
    doc.addPage();
    page += 1;
    y = 20;
    chrome();
  };
  const ensure = (height: number) => {
    if (y + height > 280) nextPage();
  };
  const writeNote = (text: string, color: [number, number, number] = [30, 41, 59]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(printable(text), contentWidth);
    ensure(lines.length * 4.5 + 2);
    doc.text(lines, margin, y);
    y += lines.length * 4.5 + 2;
  };
  const drawFieldGrid = (fields: Array<{ label: string; value: string }>) => {
    const gap = 4;
    const columnWidth = (contentWidth - gap) / 2;
    for (let index = 0; index < fields.length; index += 2) {
      const row = fields.slice(index, index + 2).map((field) => {
        const labelLines = doc.splitTextToSize(printable(displayLabel(field.label)).toUpperCase(), columnWidth - 8);
        const valueLines = doc.splitTextToSize(printable(field.value), columnWidth - 8);
        return { field, labelLines, valueLines, height: Math.max(19, labelLines.length * 3.3 + valueLines.length * 4.3 + 10) };
      });
      const rowHeight = Math.max(...row.map((entry) => entry.height));
      ensure(rowHeight + 4);
      row.forEach((entry, column) => {
        const x = margin + column * (columnWidth + gap);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(x, y, columnWidth, rowHeight, 2, 2, "FD");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(entry.labelLines, x + 4, y + 5);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(entry.valueLines, x + 4, y + 5 + entry.labelLines.length * 3.3 + 3);
      });
      y += rowHeight + 4;
    }
  };
  const drawModule = (module: PdfModule) => {
    ensure(13);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(margin, y, contentWidth, 9, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 64, 175);
    doc.text(printable(module.title), margin + 4, y + 5.8);
    y += 13;
    drawFieldGrid(module.fields);
    y += 2;
  };

  chrome();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(15, 23, 42);
  doc.text("Informe crediticio", margin, y);
  y += 10;
  doc.setFontSize(14);
  doc.text(printable(report.subjectName), margin, y);
  y += 8;
  drawFieldGrid([
    { label: "UUID de usuario", value: report.userId },
    { label: "UUID de solicitud", value: report.financeRequestId },
  ]);
  y += 2;

  report.sections.forEach((section) => {
    ensure(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(17, 39, 72);
    doc.text(SECTION_LABEL[section.section], margin, y);
    y += 7;
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y, 195, y);
    y += 6;

    if (section.error) {
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(254, 202, 202);
      doc.roundedRect(margin, y, contentWidth, 16, 2, 2, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(153, 27, 27);
      doc.text("No disponible", margin + 4, y + 6);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(printable(section.error), contentWidth - 8).slice(0, 2), margin + 4, y + 11);
      y += 20;
      return;
    }
    const modules = reportModules(section);
    if (!modules.length) {
      writeNote("El servicio no devolvió información.", [100, 116, 139]);
      return;
    }
    modules.forEach(drawModule);
  });

  doc.save(`informe-${report.subjectName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
