"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import "@/components/ui/templates/workspace-page.css";
import "@/modules/mdc/screens/mdc-screen.css";
import "./mdc-form-page.css";

type MdcFormPageProps = {
  title?: string;
  subtitle?: string;
  backHref: string;
  backLabel?: string;
  flush?: boolean;
  children: ReactNode;
};

export function MdcFormPage({
  title,
  subtitle,
  backHref,
  backLabel = "Volver",
  flush = false,
  children,
}: MdcFormPageProps) {
  const router = useRouter();

  return (
    <div className={`zelify-workspace-page mdc-workspace mdc-workspace--solo mdc-form-page${flush ? " mdc-form-page--flush" : ""}`}>
      <ZelifyTopNavbar />
      <div className="zelify-workspace-page__scroll mdc-workspace__body">
        <div className="mdc-workspace__main">
          <div className="mdc-root mdc-form-page__scroll">
            <div className="mdc-overview-hero mdc-prod-hero mdc-form-page__hero">
              <button type="button" className="mdc-form-page__back" onClick={() => router.push(backHref)}>
                ← {backLabel}
              </button>
              {title || subtitle ? (
                <div className="mdc-prod-hero__row">
                  <div>
                    {title ? <h1 className="mdc-overview-hero__title">{title}</h1> : null}
                    {subtitle ? <p className="mdc-prod-hero__sub">{subtitle}</p> : null}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="mdc-form-page__card">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
