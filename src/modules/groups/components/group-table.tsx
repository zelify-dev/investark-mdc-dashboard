"use client";

import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppIconButton } from "@/components/ui/atoms/icon-button/app-icon-button";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { Group, GroupState } from "../types/group.types";
import { useI18n } from "@/providers/i18n-provider";

import "./group-table.css";

interface GroupTableProps {
  groups: Group[];
  onViewGroup?: (group: Group) => void;
  onEditGroup?: (group: Group) => void;
  onDeleteGroup?: (group: Group) => void;
}

export const GroupTable: React.FC<GroupTableProps> = ({ groups, onViewGroup, onEditGroup, onDeleteGroup }) => {
  const { t } = useI18n();

  return (
    <div className="zelify-group-table">
      <SettingsDataTable variant="clients">
        <thead>
          <tr>
            <th>{t("groups.list.columns.id")}</th>
            <th>Empresa</th>
            <th>Tipo</th>
            <th>Sucursal</th>
            <th>KYB</th>
            <th className="is-numeric-header">{t("groups.list.columns.membersCount")}</th>
            <th>{t("groups.list.columns.state")}</th>
            <th className="is-actions-header">{t("groups.common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={group.id}>
              <td className="is-mono-cell">{group.id}</td>
              <td className="is-primary-cell">{group.name}</td>
              <td>{group.groupType}</td>
              <td>{group.assignedBranch}</td>
              <td>{group.kybStatus ?? "Opcional"}</td>
              <td className="is-numeric-cell">{group.membersCount}</td>
              <td>
                <AppBadge tone={groupStateToTone(group.state)} size="sm">
                  {groupStateLabel(group.state, t)}
                </AppBadge>
              </td>
              <td className="is-actions-cell">
                <div className="zelify-group-table__crud">
                  <AppButton tone="neutral" type="button" className="zelify-group-table__crud-btn" onClick={() => onViewGroup?.(group)}>
                    Ver
                  </AppButton>
                  <AppButton tone="secondary" type="button" className="zelify-group-table__crud-btn" onClick={() => onEditGroup?.(group)}>
                    Editar
                  </AppButton>
                  <AppIconButton ariaLabel={t("groups.common.actionsAria").replace("{name}", group.name)} onClick={() => onDeleteGroup?.(group)}>
                    <MoreHorizontal size={16} />
                  </AppIconButton>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </SettingsDataTable>

      <div className="zelify-data-table-footer">
        <div className="zelify-data-table-footer__page-size">
          <span className="zelify-data-table-footer__info">{t("groups.common.show")}</span>
          <span className="zelify-data-table-footer__page-size-value">25</span>
        </div>
        <div className="zelify-data-table-footer__controls">
          <span className="zelify-data-table-footer__info">
            {t("groups.common.allCount").replace("{count}", String(groups.length))}
          </span>
          <div className="zelify-data-table-footer__pages">
            <button
              type="button"
              className="zelify-pagination-btn"
              disabled
              aria-label={t("groups.common.prevPageAria")}
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="zelify-pagination-btn"
              disabled
              aria-label={t("groups.common.nextPageAria")}
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

type TFn = (key: string) => string;

function groupStateLabel(state: GroupState, t: TFn): string {
  switch (state) {
    case GroupState.ACTIVE:
      return t("groups.list.states.active");
    case GroupState.INACTIVE:
      return t("groups.list.states.inactive");
    case GroupState.BLACKLISTED:
      return t("groups.list.states.blacklisted");
    case GroupState.PENDING_APPROVAL:
      return t("groups.list.states.pending");
    default:
      return state;
  }
}

function groupStateToTone(state: GroupState): "success" | "error" | "warning" | "neutral" {
  switch (state) {
    case GroupState.ACTIVE:
      return "success";
    case GroupState.INACTIVE:
      return "neutral";
    case GroupState.BLACKLISTED:
      return "error";
    case GroupState.PENDING_APPROVAL:
      return "warning";
    default:
      return "neutral";
  }
}
