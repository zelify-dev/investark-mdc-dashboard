"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { AppSelect } from "@/components/ui/atoms/select/app-select";
import { FieldLabel } from "@/components/ui/atoms/field-label/field-label";
import { FormField } from "@/components/ui/molecules/form-field/form-field";
import type { Translate } from "@/i18n/translate";

import "./new-deposit-account-modal.css";

export type NewDepositAccountModalProps = {
  open: boolean;
  onClose: () => void;
  t: Translate;
};

const STEPS = 4 as const;

export function NewDepositAccountModal({ open, onClose, t }: NewDepositAccountModalProps) {
  const titleId = useId();
  const [step, setStep] = useState(1);
  const [clientQuery, setClientQuery] = useState("");
  const [product, setProduct] = useState("flex_savings");
  const [officer, setOfficer] = useState("");
  const [beneficiaries, setBeneficiaries] = useState("");
  const [branch, setBranch] = useState("main");

  const reset = useCallback(() => {
    setStep(1);
    setClientQuery("");
    setProduct("flex_savings");
    setOfficer("");
    setBeneficiaries("");
    setBranch("main");
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, handleClose]);

  if (!open) return null;

  const goNext = () => setStep((s) => Math.min(STEPS, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div
      className="zelify-new-dep-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="zelify-new-dep-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="zelify-new-dep-modal__header">
          <p className="zelify-new-dep-modal__eyebrow">Depósitos</p>
          <h2 id={titleId} className="zelify-new-dep-modal__title">
            {t("deposits.modal.title")}
          </h2>
        </header>
        <div className="zelify-new-dep-modal__steps" aria-hidden>
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className={["zelify-new-dep-modal__step", step === n ? "is-active" : ""].filter(Boolean).join(" ")}>
              {n}
            </span>
          ))}
        </div>
        <div className="zelify-new-dep-modal__body">
          {step === 1 ? (
            <>
              <p className="zelify-new-dep-modal__hint">{t("deposits.modal.step1Hint")}</p>
              <FormField
                label={<FieldLabel htmlFor="new-dep-client">{t("deposits.modal.clientSearch")}</FieldLabel>}
                control={
                  <AppInput
                    id="new-dep-client"
                    value={clientQuery}
                    onChange={(e) => setClientQuery(e.target.value)}
                    placeholder={t("deposits.modal.clientSearch")}
                  />
                }
              />
            </>
          ) : null}
          {step === 2 ? (
            <>
              <p className="zelify-new-dep-modal__hint">{t("deposits.modal.rulesHint")}</p>
              <FormField
                label={<FieldLabel htmlFor="new-dep-product">{t("deposits.modal.productLabel")}</FieldLabel>}
                control={
                  <AppSelect id="new-dep-product" size="md" value={product} onChange={(e) => setProduct(e.target.value)}>
                    <option value="traditional">{t("deposits.products.traditional")}</option>
                    <option value="term_deposit">{t("deposits.products.term_deposit")}</option>
                    <option value="payroll">{t("deposits.products.payroll")}</option>
                    <option value="flex_savings">{t("deposits.products.flex_savings")}</option>
                  </AppSelect>
                }
              />
            </>
          ) : null}
          {step === 3 ? (
            <>
              <FormField
                label={<FieldLabel htmlFor="new-dep-officer">{t("deposits.modal.officer")}</FieldLabel>}
                control={
                  <AppInput id="new-dep-officer" value={officer} onChange={(e) => setOfficer(e.target.value)} />
                }
              />
              <FormField
                label={<FieldLabel htmlFor="new-dep-ben">{t("deposits.modal.beneficiaries")}</FieldLabel>}
                control={
                  <AppInput id="new-dep-ben" value={beneficiaries} onChange={(e) => setBeneficiaries(e.target.value)} />
                }
              />
              <FormField
                label={<FieldLabel htmlFor="new-dep-branch">{t("deposits.modal.branch")}</FieldLabel>}
                control={
                  <AppSelect id="new-dep-branch" size="md" value={branch} onChange={(e) => setBranch(e.target.value)}>
                    <option value="main">{t("deposits.branches.main")}</option>
                    <option value="north">{t("deposits.branches.north")}</option>
                    <option value="south">{t("deposits.branches.south")}</option>
                    <option value="quito_central">{t("deposits.branches.quito_central")}</option>
                  </AppSelect>
                }
              />
            </>
          ) : null}
          {step === 4 ? (
            <>
              <p className="zelify-new-dep-modal__hint">{t("deposits.modal.summaryHint")}</p>
              <p className="zelify-new-dep-modal__hint">
                {t("deposits.modal.productLabel")}: {t(`deposits.products.${product}`)}
              </p>
              <p className="zelify-new-dep-modal__hint">
                {t("deposits.modal.branch")}: {t(`deposits.branches.${branch}`)}
              </p>
            </>
          ) : null}
        </div>
        <footer className="zelify-new-dep-modal__footer">
          <AppButton type="button" tone="neutral" onClick={handleClose}>
            {t("deposits.modal.cancel")}
          </AppButton>
          {step > 1 ? (
            <AppButton type="button" tone="neutral" onClick={goBack}>
              {t("deposits.modal.back")}
            </AppButton>
          ) : null}
          {step < STEPS ? (
            <AppButton type="button" tone="primary" onClick={goNext}>
              {t("deposits.modal.next")}
            </AppButton>
          ) : (
            <AppButton type="button" tone="primary" onClick={handleClose}>
              {t("deposits.modal.create")}
            </AppButton>
          )}
        </footer>
      </div>
    </div>
  );
}
