import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { moralCreditAnalysisBriefPdfBytes } from "../src/modules/mdc/services/moral-credit-analysis-brief-pdf";

async function loadLogoDataUrl(): Promise<string> {
  const svgPath = path.join(process.cwd(), "public/zelifyLogo_dark.svg");
  const png = await sharp(svgPath).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

async function main() {
  const logoDataUrl = await loadLogoDataUrl();
  const bytes = moralCreditAnalysisBriefPdfBytes(logoDataUrl);
  const outDir = path.join(process.cwd(), "docs");
  fs.mkdirSync(outDir, { recursive: true });
  const fileName = `brief-analisis-credito-persona-moral-${new Date().toISOString().slice(0, 10)}.pdf`;
  const outPath = path.join(outDir, fileName);
  fs.writeFileSync(outPath, bytes);
  console.log(`PDF generado: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
