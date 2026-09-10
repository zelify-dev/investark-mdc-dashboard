import type { Metadata } from "next";
import { AmlAnalisisView } from "@/modules/mdc/components/aml-analisis-view";

export const metadata: Metadata = {
  title: "Análisis PLD/AML · TESTAFIN",
  description:
    "Qué cubre MDC y el KYC frente al manual de prevención de lavado de TESTAFIN. Ruta pública, sin sesión.",
};

export default function AmlAnalisisPage() {
  return <AmlAnalisisView />;
}
