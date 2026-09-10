"use client";

import { Download, RefreshCw, Search } from "lucide-react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { AppSelect } from "@/components/ui/atoms/select/app-select";
import { FieldLabel } from "@/components/ui/atoms/field-label/field-label";

import "./deposits-toolbar.css";

type DepositsToolbarProps = {
  search: string;
  onSearchChange: (v: string) => void;
  filterState: string;
  onFilterState: (v: string) => void;
  filterProduct: string;
  onFilterProduct: (v: string) => void;
  filterBranch: string;
  onFilterBranch: (v: string) => void;
  onDownload: () => void;
  onRefresh: () => void;
  t: (key: string) => string;
};

export function DepositsToolbar({
  search,
  onSearchChange,
  filterState,
  onFilterState,
  filterProduct,
  onFilterProduct,
  filterBranch,
  onFilterBranch,
  onDownload,
  onRefresh,
  t,
}: DepositsToolbarProps) {
  return (
    <div className="zelify-deposits-toolbar">
      <div className="zelify-deposits-toolbar__search">
        <Search className="zelify-deposits-toolbar__search-icon" size={18} strokeWidth={2} aria-hidden />
        <AppInput
          type="search"
          variant="surface"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("deposits.toolbar.searchPlaceholder")}
          autoComplete="off"
          aria-label={t("deposits.toolbar.searchPlaceholder")}
        />
      </div>

      <div className="zelify-deposits-toolbar__filters">
        <div className="zelify-deposits-toolbar__filter">
          <FieldLabel htmlFor="dep-filter-state">{t("deposits.toolbar.filterState")}</FieldLabel>
          <AppSelect id="dep-filter-state" size="md" value={filterState} onChange={(e) => onFilterState(e.target.value)}>
            <option value="all">{t("deposits.toolbar.all")}</option>
            <option value="ACTIVE">{t("deposits.toolbar.stateActive")}</option>
            <option value="PENDING_APPROVAL">{t("deposits.toolbar.statePending")}</option>
            <option value="LOCKED">{t("deposits.toolbar.stateLocked")}</option>
            <option value="BLOCKED">{t("deposits.toolbar.stateBlocked")}</option>
            <option value="CLOSED">{t("deposits.toolbar.stateClosed")}</option>
          </AppSelect>
        </div>
        <div className="zelify-deposits-toolbar__filter">
          <FieldLabel htmlFor="dep-filter-product">{t("deposits.toolbar.filterProduct")}</FieldLabel>
          <AppSelect id="dep-filter-product" size="md" value={filterProduct} onChange={(e) => onFilterProduct(e.target.value)}>
            <option value="all">{t("deposits.toolbar.all")}</option>
            <option value="traditional">{t("deposits.toolbar.productTraditional")}</option>
            <option value="term_deposit">{t("deposits.toolbar.productTerm")}</option>
            <option value="payroll">{t("deposits.toolbar.productPayroll")}</option>
            <option value="flex_savings">{t("deposits.toolbar.productFlex")}</option>
          </AppSelect>
        </div>
        <div className="zelify-deposits-toolbar__filter">
          <FieldLabel htmlFor="dep-filter-branch">{t("deposits.toolbar.filterBranch")}</FieldLabel>
          <AppSelect id="dep-filter-branch" size="md" value={filterBranch} onChange={(e) => onFilterBranch(e.target.value)}>
            <option value="all">{t("deposits.toolbar.all")}</option>
            <option value="main">{t("deposits.branches.main")}</option>
            <option value="north">{t("deposits.branches.north")}</option>
            <option value="south">{t("deposits.branches.south")}</option>
            <option value="quito_central">{t("deposits.branches.quito_central")}</option>
            <option value="gye_port">{t("deposits.branches.gye_port")}</option>
            <option value="cuenca_sur">{t("deposits.branches.cuenca_sur")}</option>
          </AppSelect>
        </div>
      </div>

      <div className="zelify-deposits-toolbar__actions">
        <button type="button" className="zelify-deposits-toolbar__ghost" onClick={onDownload}>
          <Download size={16} strokeWidth={2} aria-hidden />
          {t("deposits.toolbar.downloadReport")}
        </button>
        <AppButton type="button" tone="neutral" onClick={onRefresh}>
          <RefreshCw size={16} strokeWidth={2} style={{ marginRight: 6 }} aria-hidden />
          {t("deposits.toolbar.refresh")}
        </AppButton>
      </div>
    </div>
  );
}
