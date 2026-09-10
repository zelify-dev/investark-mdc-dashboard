"use client";

import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import "@/components/ui/templates/workspace-page.css";
import { AppText } from "@/components/ui/atoms/text/app-text";

type WorkspacePlaceholderScreenProps = {
  title: string;
};

export function WorkspacePlaceholderScreen({ title }: WorkspacePlaceholderScreenProps) {
  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner">
          <h1 className="zelify-workspace-page__title">{title}</h1>
          <AppText tone="muted">Contenido próximamente.</AppText>
        </div>
      </div>
    </div>
  );
}
