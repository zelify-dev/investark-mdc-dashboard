"use client";

import { SectionTitle } from "@/components/ui/atoms/section-title/section-title";
import { AppText } from "@/components/ui/atoms/text/app-text";

import "./admin-settings-placeholder-screen.css";

type AdminSettingsPlaceholderScreenProps = {
  title: string;
};

export function AdminSettingsPlaceholderScreen({ title }: AdminSettingsPlaceholderScreenProps) {
  return (
    <div className="zelify-admin-settings-placeholder">
      <SectionTitle>{title}</SectionTitle>
      <AppText tone="muted">Contenido próximamente.</AppText>
    </div>
  );
}
