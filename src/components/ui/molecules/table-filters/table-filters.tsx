"use client";

import { AppInput } from "@/components/ui/atoms/input/app-input";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppSelect } from "@/components/ui/atoms/select/app-select";

import "./table-filters.css";

type TableFiltersProps = {
  isVisible: boolean;
  onClear: () => void;
};

export function TableFilters({ isVisible, onClear }: TableFiltersProps) {
  if (!isVisible) return null;

  return (
    <div className="zelify-table-filters animate-in-fade">
      <div className="zelify-table-filters__grid">
        <div className="zelify-table-filters__item">
          <label>Search Client</label>
          <AppInput placeholder="Name, ID or Email..." />
        </div>
        
        <div className="zelify-table-filters__item">
          <label>Branch</label>
          <AppSelect defaultValue="">
            <option value="">All Branches</option>
            <option value="milan">Milan Main</option>
            <option value="madrid">Madrid Central</option>
          </AppSelect>
        </div>

        <div className="zelify-table-filters__item">
          <label>State</label>
          <AppSelect defaultValue="">
            <option value="">All States</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="arrears">In Arrears</option>
          </AppSelect>
        </div>

        <div className="zelify-table-filters__actions">
          <AppButton tone="secondary" onClick={onClear} className="zelify-button--sm">
            Clear All
          </AppButton>
        </div>
      </div>
    </div>
  );
}
