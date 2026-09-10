"use client";

import { SectionTitle } from "@/components/ui/atoms/section-title/section-title";
import { AppText } from "@/components/ui/atoms/text/app-text";

import "./general-setup-section-placeholder.css";

type GeneralSetupSectionPlaceholderProps = {
  title: string;
};

export function GeneralSetupSectionPlaceholder({
  title,
}: GeneralSetupSectionPlaceholderProps) {
  return (
    <div className="zelify-general-setup-placeholder">
      <SectionTitle>{title}</SectionTitle>
      <AppText tone="muted">Contenido próximamente.</AppText>
    </div>
  );
}
