"use client";

import { SectionTitle } from "@/components/ui/atoms/section-title/section-title";
import { AppText } from "@/components/ui/atoms/text/app-text";

import { AccountingPageHeader } from "../components/accounting-page-header";

import "./accounting-section-placeholder-screen.css";

type AccountingSectionPlaceholderScreenProps = {
  sectionTitle: string;
};

export function AccountingSectionPlaceholderScreen({
  sectionTitle,
}: AccountingSectionPlaceholderScreenProps) {
  return (
    <div className="zelify-accounting-section-placeholder">
      <AccountingPageHeader />
      <SectionTitle>{sectionTitle}</SectionTitle>
      <AppText tone="muted">Contenido próximamente.</AppText>
    </div>
  );
}
