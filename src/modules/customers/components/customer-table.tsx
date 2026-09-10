"use client";

import React from "react";

import "./customer-table.css";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { AppAvatar } from "@/components/ui/atoms/avatar/app-avatar";
import { Customer, KycStatus, AmlStatus } from "../types/customer.types";
import { useI18n } from "@/providers/i18n-provider";

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({ customers, onEdit, onDelete }) => {
  const { t } = useI18n();

  return (
    <div className="zelify-customer-table">
      <SettingsDataTable variant="clients">
        <thead>
          <tr>
            <th>{t("customers.list.columns.fullName")}</th>
            <th>{t("customers.list.columns.id")}</th>
            <th>Tipo doc.</th>
            <th>Documento</th>
            <th>Fecha nacimiento</th>
            <th>KYC</th>
            <th>AML</th>
            <th>Última actualización</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>
                <Link href={`/customers/${customer.id}`} className="zelify-customer-table__name-link">
                  <AppAvatar
                    initials={initialsFromName(customer.fullName)}
                    className="zelify-customer-table__avatar"
                  />
                  <span>{customer.fullName}</span>
                </Link>
              </td>
              <td>
                <span className="zelify-mono">{customer.id}</span>
              </td>
              <td>{documentTypeLabel(customer.documentType)}</td>
              <td>{customer.documentNumber || "—"}</td>
              <td>{customer.birthDate || "—"}</td>
              <td>{kycLabel(customer.kycStatus)}</td>
              <td>{amlLabel(customer.amlStatus)}</td>
              <td>{customer.lastModified}</td>
              <td>
                <button type="button" className="zelify-pagination-btn" onClick={() => onEdit(customer)}>Editar</button>
                <button type="button" className="zelify-pagination-btn" onClick={() => onDelete(customer.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </SettingsDataTable>

      <div className="zelify-data-table-footer">
        <div className="zelify-data-table-footer__page-size">
          <span className="zelify-data-table-footer__info">{t("customers.common.show")}</span>
          <span className="zelify-data-table-footer__page-size-value">25</span>
        </div>
        <div className="zelify-data-table-footer__controls">
          <span className="zelify-data-table-footer__info">
            {t("customers.common.allCount").replace("{count}", String(customers.length))}
          </span>
          <div className="zelify-data-table-footer__pages">
            <button
              type="button"
              className="zelify-pagination-btn"
              disabled
              aria-label={t("customers.common.prevPageAria")}
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="zelify-pagination-btn"
              disabled
              aria-label={t("customers.common.nextPageAria")}
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function initialsFromName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function kycLabel(status?: KycStatus): string {
  if (!status) return "Opcional";
  const map: Record<KycStatus, string> = {
    NOT_STARTED: "No iniciado",
    PENDING: "Pendiente",
    VERIFIED: "Verificado",
    REJECTED: "Rechazado",
  };
  return map[status];
}

function amlLabel(status?: AmlStatus): string {
  if (!status) return "Opcional";
  const map: Record<AmlStatus, string> = {
    NOT_STARTED: "No iniciado",
    CLEAR: "Limpio",
    REVIEW: "En revisión",
    BLOCKED: "Bloqueado",
  };
  return map[status];
}

function documentTypeLabel(type?: string): string {
  const map: Record<string, string> = {
    INE: "INE",
    CURP: "CURP",
    RFC: "RFC",
    PASAPORTE: "Pasaporte",
    RESIDENCIA: "Tarjeta de residencia",
  };
  return type ? (map[type] ?? type) : "—";
}
