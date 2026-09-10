"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppCheckbox } from "@/components/ui/atoms/checkbox/app-checkbox";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { AppSelect } from "@/components/ui/atoms/select/app-select";
import { FieldLabel } from "@/components/ui/atoms/field-label/field-label";
import { FormField } from "@/components/ui/molecules/form-field/form-field";

import "./create-menu-item-modal.css";

export type CreateMenuItemModalProps = {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
};

export function CreateMenuItemModal({ open, onClose, onSave }: CreateMenuItemModalProps) {
  const titleId = useId();
  const [name, setName] = useState("");
  const [type, setType] = useState("clients");
  const [allUsers, setAllUsers] = useState(false);
  const [apiRoles, setApiRoles] = useState(false);
  const [centable, setCentable] = useState(false);
  const [streaming, setStreaming] = useState(false);

  const handleCancel = useCallback(() => {
    setName("");
    setType("clients");
    setAllUsers(false);
    setApiRoles(false);
    setCentable(false);
    setStreaming(false);
    onClose();
  }, [onClose]);

  const handleSave = useCallback(() => {
    onSave?.();
    handleCancel();
  }, [handleCancel, onSave]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCancel();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, handleCancel]);

  if (!open) return null;

  return (
    <div
      className="zelify-menu-item-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <div
        className="zelify-menu-item-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="zelify-menu-item-modal__header">
          <p className="zelify-menu-item-modal__eyebrow">Menú</p>
          <h2 id={titleId} className="zelify-menu-item-modal__title">
            Creating A New Menu Item
          </h2>
        </header>

        <div className="zelify-menu-item-modal__body">
          <div className="zelify-menu-item-modal__card">
            <FormField
              label={<FieldLabel htmlFor="menu-item-name">Name</FieldLabel>}
              control={<AppInput id="menu-item-name" value={name} onChange={(e) => setName(e.target.value)} />}
            />
            <FormField
              label={<FieldLabel htmlFor="menu-item-type">Type</FieldLabel>}
              control={
                <AppSelect id="menu-item-type" size="md" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="clients">Clients</option>
                  <option value="groups">Groups</option>
                  <option value="credit-arr">Credit Arrangements</option>
                  <option value="loan-accounts">Loan Accounts</option>
                  <option value="loan-tx">Loan Transactions</option>
                  <option value="installments">Installments</option>
                  <option value="deposit-accounts">Deposit Accounts</option>
                  <option value="deposit-tx">Deposit Transactions</option>
                  <option value="activities">System Activities</option>
                  <option value="branches">Branches</option>
                  <option value="centres">Centres</option>
                  <option value="users">Users</option>
                  <option value="communications">Communications</option>
                </AppSelect>
              }
            />
          </div>

          <details className="zelify-menu-item-modal__details" open>
            <summary>
              <ChevronDown size={16} className="zelify-menu-item-modal__chev" aria-hidden />
              Usage rights
            </summary>
            <div className="zelify-menu-item-modal__details-body">
              <div className="zelify-menu-item-modal__checkbox-stack">
                <AppCheckbox
                  id="ur-all-users"
                  checked={allUsers}
                  onChange={(e) => setAllUsers(e.target.checked)}
                  label="All Users"
                />
                <AppCheckbox
                  id="ur-api"
                  checked={apiRoles}
                  onChange={(e) => setApiRoles(e.target.checked)}
                  label="API Roles"
                />
                <AppCheckbox
                  id="ur-centable"
                  checked={centable}
                  onChange={(e) => setCentable(e.target.checked)}
                  label="Centable"
                />
                <AppCheckbox
                  id="ur-streaming"
                  checked={streaming}
                  onChange={(e) => setStreaming(e.target.checked)}
                  label="Streaming"
                />
              </div>
            </div>
          </details>
        </div>

        <footer className="zelify-menu-item-modal__footer">
          <AppButton type="button" tone="secondary" onClick={handleCancel}>
            Cancel
          </AppButton>
          <AppButton type="button" tone="primary" onClick={handleSave}>
            Save menu item
          </AppButton>
        </footer>
      </div>
    </div>
  );
}
