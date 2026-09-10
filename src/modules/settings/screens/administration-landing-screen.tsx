"use client";

import Link from "next/link";
import {
  AppWindow,
  Building2,
  CircleDollarSign,
  Database,
  FileStack,
  FileText,
  Landmark,
  LayoutList,
  ListTodo,
  Mail,
  MessageSquare,
  Settings,
  Shield,
  Webhook,
} from "lucide-react";

import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";
import { useI18n } from "@/providers/i18n-provider";

import {
  ADMIN_HUB_CARD_DEFS,
  type AdminHubCardIcon,
  type AdminHubNavId,
} from "../data/administration-landing.data";

import "./administration-landing-screen.css";

function HubCardIcon({ name, featured }: { name: AdminHubCardIcon; featured: boolean }) {
  const className = [
    "zelify-admin-landing__card-icon",
    featured ? "zelify-admin-landing__card-icon--featured" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const stroke = 1.75;
  switch (name) {
    case "general":
      return (
        <span className={className} aria-hidden>
          <Settings size={22} strokeWidth={stroke} />
        </span>
      );
    case "financial":
      return (
        <span className={className} aria-hidden>
          <Landmark size={22} strokeWidth={stroke} />
        </span>
      );
    case "organization":
      return (
        <span className={className} aria-hidden>
          <Building2 size={22} strokeWidth={stroke} />
        </span>
      );
    case "access":
      return (
        <span className={className} aria-hidden>
          <Shield size={22} strokeWidth={stroke} />
        </span>
      );
    case "products":
      return (
        <span className={className} aria-hidden>
          <CircleDollarSign size={22} strokeWidth={stroke} />
        </span>
      );
    case "fields":
      return (
        <span className={className} aria-hidden>
          <LayoutList size={22} strokeWidth={stroke} />
        </span>
      );
    case "forms":
      return (
        <span className={className} aria-hidden>
          <FileText size={22} strokeWidth={stroke} />
        </span>
      );
    case "sms":
      return (
        <span className={className} aria-hidden>
          <MessageSquare size={22} strokeWidth={stroke} />
        </span>
      );
    case "email":
      return (
        <span className={className} aria-hidden>
          <Mail size={22} strokeWidth={stroke} />
        </span>
      );
    case "webhooks":
      return (
        <span className={className} aria-hidden>
          <Webhook size={22} strokeWidth={stroke} />
        </span>
      );
    case "templates":
      return (
        <span className={className} aria-hidden>
          <FileStack size={22} strokeWidth={stroke} />
        </span>
      );
    case "apps":
      return (
        <span className={className} aria-hidden>
          <AppWindow size={22} strokeWidth={stroke} />
        </span>
      );
    case "tasks":
      return (
        <span className={className} aria-hidden>
          <ListTodo size={22} strokeWidth={stroke} />
        </span>
      );
    case "data":
      return (
        <span className={className} aria-hidden>
          <Database size={22} strokeWidth={stroke} />
        </span>
      );
    default:
      return (
        <span className={className} aria-hidden>
          <Settings size={22} strokeWidth={stroke} />
        </span>
      );
  }
}

function hubCardTitleKey(navAdminId: AdminHubNavId): string {
  return `nav.admin.${navAdminId}`;
}

function hubCardDescriptionKey(navAdminId: AdminHubNavId): string {
  return `administrationHub.descriptions.${navAdminId}`;
}

export function AdministrationLandingScreen() {
  const { t } = useI18n();

  return (
    <div className="zelify-admin-landing">
      <ZelifyTopNavbar />
      <div className="zelify-admin-landing__body">
        <div className="zelify-admin-landing__inner">
          <header className="zelify-admin-landing__header">
            <h1 className="zelify-admin-landing__title">{t("administrationHub.title")}</h1>
          </header>

          <div className="zelify-admin-landing__layout">
            <div className="zelify-admin-landing__main">
              <ul className="zelify-admin-landing__card-grid">
                {ADMIN_HUB_CARD_DEFS.map((card) => (
                  <li key={card.href} className="zelify-admin-landing__card-cell">
                    <Link
                      href={card.href}
                      className={[
                        "zelify-admin-landing__card",
                        card.featured ? "zelify-admin-landing__card--featured" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                    <HubCardIcon name={card.icon} featured={card.featured} />
                    <h2
                      className={[
                        "zelify-admin-landing__card-title",
                        card.featured ? "zelify-admin-landing__card-title--featured" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {t(hubCardTitleKey(card.navAdminId))}
                    </h2>
                    <p className="zelify-admin-landing__card-desc">{t(hubCardDescriptionKey(card.navAdminId))}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      <SandboxBanner />
    </div>
  );
}
