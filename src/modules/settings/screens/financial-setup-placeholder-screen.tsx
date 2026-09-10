"use client";

import { SectionTitle } from "@/components/ui/atoms/section-title/section-title";
import { AppText } from "@/components/ui/atoms/text/app-text";

import "./financial-setup-placeholder-screen.css";

type FinancialSetupPlaceholderScreenProps = {
  title: string;
};

export function FinancialSetupPlaceholderScreen({ title }: FinancialSetupPlaceholderScreenProps) {
  return (
    <div className="zelify-financial-setup-placeholder">
      <SectionTitle>{title}</SectionTitle>
      <AppText tone="muted">Contenido próximamente.</AppText>
    </div>
  );
}
