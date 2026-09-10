"use client";

import { useI18n } from "@/providers/i18n-provider";

import "./customer-segment-filters.css";

type InactiveFiltersProps = {
  variant: "inactive";
};

type BlacklistFiltersProps = {
  variant: "blacklist";
};

type CustomerSegmentFiltersProps = InactiveFiltersProps | BlacklistFiltersProps;

export function CustomerSegmentFilters(_props: CustomerSegmentFiltersProps) {
  const { t } = useI18n();

  if (_props.variant === "inactive") {
    return (
      <div
        className="zelify-customer-segment-filters"
        role="group"
        aria-label={t("customers.inactive.filters.ariaGroup")}
      >
        <div className="zelify-customer-segment-filters__field">
          <label className="zelify-customer-segment-filters__label" htmlFor="seg-in-branch">
            {t("customers.inactive.filters.branch")}
          </label>
          <select id="seg-in-branch" className="zelify-customer-segment-filters__select" defaultValue="all">
            <option value="all">{t("customers.inactive.filters.allBranches")}</option>
            <option value="main">{t("customers.inactive.filters.branchMain")}</option>
            <option value="east">{t("customers.inactive.filters.branchEast")}</option>
            <option value="west">{t("customers.inactive.filters.branchWest")}</option>
          </select>
        </div>
        <div className="zelify-customer-segment-filters__field">
          <label className="zelify-customer-segment-filters__label" htmlFor="seg-in-centre">
            {t("customers.inactive.filters.centre")}
          </label>
          <select id="seg-in-centre" className="zelify-customer-segment-filters__select" defaultValue="all">
            <option value="all">{t("customers.inactive.filters.allCentres")}</option>
            <option value="north">{t("customers.inactive.filters.centreNorth")}</option>
            <option value="central">{t("customers.inactive.filters.centreCentral")}</option>
            <option value="east1">{t("customers.inactive.filters.centreEast1")}</option>
          </select>
        </div>
        <div className="zelify-customer-segment-filters__field">
          <label className="zelify-customer-segment-filters__label" htmlFor="seg-in-status">
            {t("customers.inactive.filters.status")}
          </label>
          <select id="seg-in-status" className="zelify-customer-segment-filters__select" defaultValue="all">
            <option value="all">{t("customers.inactive.filters.allStatuses")}</option>
            <option value="inactive">{t("customers.inactive.filters.statusInactive")}</option>
            <option value="suspended">{t("customers.inactive.filters.statusSuspended")}</option>
            <option value="dormant">{t("customers.inactive.filters.statusDormant")}</option>
            <option value="closed">{t("customers.inactive.filters.statusClosed")}</option>
          </select>
        </div>
        <div className="zelify-customer-segment-filters__field">
          <label className="zelify-customer-segment-filters__label" htmlFor="seg-in-officer">
            {t("customers.inactive.filters.assignedOfficer")}
          </label>
          <select id="seg-in-officer" className="zelify-customer-segment-filters__select" defaultValue="all">
            <option value="all">{t("customers.inactive.filters.officerAny")}</option>
            <option value="laura">{t("customers.inactive.filters.officerLaura")}</option>
            <option value="miguel">{t("customers.inactive.filters.officerMiguel")}</option>
          </select>
        </div>
        <div className="zelify-customer-segment-filters__field">
          <label className="zelify-customer-segment-filters__label" htmlFor="seg-in-updated">
            {t("customers.inactive.filters.dateUpdated")}
          </label>
          <select id="seg-in-updated" className="zelify-customer-segment-filters__select" defaultValue="any">
            <option value="any">{t("customers.inactive.filters.dateAny")}</option>
            <option value="7d">{t("customers.inactive.filters.dateLast7")}</option>
            <option value="30d">{t("customers.inactive.filters.dateLast30")}</option>
            <option value="90d">{t("customers.inactive.filters.dateLast90")}</option>
          </select>
        </div>
      </div>
    );
  }

  return (
    <div
      className="zelify-customer-segment-filters"
      role="group"
      aria-label={t("customers.blacklist.filters.ariaGroup")}
    >
      <div className="zelify-customer-segment-filters__field">
        <label className="zelify-customer-segment-filters__label" htmlFor="seg-bl-reason">
          {t("customers.blacklist.filters.reason")}
        </label>
        <select id="seg-bl-reason" className="zelify-customer-segment-filters__select" defaultValue="all">
          <option value="all">{t("customers.blacklist.filters.allReasons")}</option>
          <option value="fraud">{t("customers.blacklist.filters.reasonFraud")}</option>
          <option value="aml">{t("customers.blacklist.filters.reasonAml")}</option>
          <option value="manual">{t("customers.blacklist.filters.reasonManual")}</option>
        </select>
      </div>
      <div className="zelify-customer-segment-filters__field">
        <label className="zelify-customer-segment-filters__label" htmlFor="seg-bl-risk">
          {t("customers.blacklist.filters.riskLevel")}
        </label>
        <select id="seg-bl-risk" className="zelify-customer-segment-filters__select" defaultValue="all">
          <option value="all">{t("customers.blacklist.filters.allLevels")}</option>
          <option value="critical">{t("customers.blacklist.filters.levelCritical")}</option>
          <option value="high">{t("customers.blacklist.filters.levelHigh")}</option>
          <option value="medium">{t("customers.blacklist.filters.levelMedium")}</option>
          <option value="low">{t("customers.blacklist.filters.levelLow")}</option>
        </select>
      </div>
      <div className="zelify-customer-segment-filters__field">
        <label className="zelify-customer-segment-filters__label" htmlFor="seg-bl-branch">
          {t("customers.blacklist.filters.branch")}
        </label>
        <select id="seg-bl-branch" className="zelify-customer-segment-filters__select" defaultValue="all">
          <option value="all">{t("customers.blacklist.filters.allBranches")}</option>
          <option value="main">{t("customers.blacklist.filters.branchMain")}</option>
          <option value="east">{t("customers.blacklist.filters.branchEast")}</option>
          <option value="west">{t("customers.blacklist.filters.branchWest")}</option>
        </select>
      </div>
      <div className="zelify-customer-segment-filters__field">
        <label className="zelify-customer-segment-filters__label" htmlFor="seg-bl-added">
          {t("customers.blacklist.filters.addedDate")}
        </label>
        <select id="seg-bl-added" className="zelify-customer-segment-filters__select" defaultValue="any">
          <option value="any">{t("customers.blacklist.filters.dateAny")}</option>
          <option value="7d">{t("customers.blacklist.filters.dateLast7")}</option>
          <option value="30d">{t("customers.blacklist.filters.dateLast30")}</option>
        </select>
      </div>
      <div className="zelify-customer-segment-filters__field">
        <label className="zelify-customer-segment-filters__label" htmlFor="seg-bl-officer">
          {t("customers.blacklist.filters.assignedOfficer")}
        </label>
        <select id="seg-bl-officer" className="zelify-customer-segment-filters__select" defaultValue="all">
          <option value="all">{t("customers.blacklist.filters.officerAny")}</option>
          <option value="compliance">{t("customers.blacklist.filters.officerCompliance")}</option>
          <option value="ana">{t("customers.blacklist.filters.officerAna")}</option>
        </select>
      </div>
    </div>
  );
}
