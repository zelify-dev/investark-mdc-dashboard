"use client";

import { useCallback, useEffect, useId, useState } from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  CircleHelp,
  GripVertical,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Strikethrough,
  Underline,
} from "lucide-react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppCheckbox } from "@/components/ui/atoms/checkbox/app-checkbox";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { AppSelect } from "@/components/ui/atoms/select/app-select";
import { FieldLabel } from "@/components/ui/atoms/field-label/field-label";
import { FormField } from "@/components/ui/molecules/form-field/form-field";

import "./create-loan-product-modal.css";

export type CreateLoanProductModalProps = {
  open: boolean;
  onClose: () => void;
  /** Al guardar (demo: cierra el modal). */
  onSave?: () => void;
};

type LoanProductDraft = {
  productName: string;
  productId: string;
  category: string;
  productType: string;
  active: boolean;
  description: string;
  availClients: boolean;
  availGroups: boolean;
  availGroupsSolidarity: boolean;
  availAllBranches: boolean;
  idType: string;
  idTemplate: string;
  initialAccountState: string;
  currency: string;
  loanAmountDefault: string;
  loanAmountMin: string;
  loanAmountMax: string;
  creditArrangement: string;
  interestCalc: string;
  accruedPosting: string;
  interestType: string;
  interestChargedUnit: string;
  interestRateSource: "fixed" | "index";
  fixedRateDefault: string;
  fixedRateMin: string;
  fixedRateMax: string;
  indexSource: string;
  spreadDefault: string;
  spreadMin: string;
  spreadMax: string;
  rateFloor: string;
  rateCeiling: string;
  reviewFrequency: string;
  reviewUnit: string;
  daysInYear: string;
  paymentsMethod: string;
  paymentIntervalMethod: string;
  repayEveryN: string;
  repayEveryUnit: string;
  installmentsDef: string;
  installmentsMin: string;
  installmentsMax: string;
  firstDueDef: string;
  firstDueMin: string;
  firstDueMax: string;
  collectPrincipalEvery: string;
  gracePeriod: string;
  roundingSchedules: string;
  roundingCurrency: string;
  adjustPaymentDates: boolean;
  configureHolidays: boolean;
  nonWorkingReschedule: string;
  paymentAlloc: string;
  prepayAccept: string;
  prepayInterest: string;
  prepayAlloc: string;
  prepayRecalc: string;
  markPaidWhen: string;
  overduePayments: string;
  arrearsTolDef: string;
  arrearsTolMin: string;
  arrearsTolMax: string;
  arrearsFrom: string;
  arrearsNonWorking: string;
  arrearsAmtDef: string;
  arrearsAmtMin: string;
  arrearsAmtMax: string;
  arrearsFloor: string;
  penaltyMethod: string;
  penaltyTolDays: string;
  penaltyRateDef: string;
  penaltyRateMin: string;
  penaltyRateMax: string;
  internalDormant: boolean;
  internalLockArrears: boolean;
  internalCapCharges: boolean;
  feeArbitrary: boolean;
  feeName: string;
  feeType: string;
  feeId: string;
  feePayment: string;
  feeAmount: string;
  feeShowInactive: boolean;
  linkEnable: boolean;
  fundingEnable: boolean;
  guarantors: boolean;
  collateral: boolean;
  taxInterest: boolean;
  taxFees: boolean;
  taxPenalty: boolean;
  accountingMethod: string;
  interestAccruedMethod: string;
};

const INITIAL: LoanProductDraft = {
  productName: "Loan Demo 6 aug",
  productId: "DEMO6ago",
  category: "PERSONAL_LENDING",
  productType: "FIXED_TERM_LOAN",
  active: true,
  description: "",
  availClients: true,
  availGroups: false,
  availGroupsSolidarity: false,
  availAllBranches: true,
  idType: "random",
  idTemplate: "@@@@###",
  initialAccountState: "pending",
  currency: "USD",
  loanAmountDefault: "",
  loanAmountMin: "1000",
  loanAmountMax: "20000",
  creditArrangement: "optional",
  interestCalc: "declining",
  accruedPosting: "on-repayment",
  interestType: "simple",
  interestChargedUnit: "per-year",
  interestRateSource: "fixed",
  fixedRateDefault: "",
  fixedRateMin: "",
  fixedRateMax: "",
  indexSource: "dbc",
  spreadDefault: "",
  spreadMin: "",
  spreadMax: "",
  rateFloor: "",
  rateCeiling: "",
  reviewFrequency: "",
  reviewUnit: "days",
  daysInYear: "30e360",
  paymentsMethod: "standard",
  paymentIntervalMethod: "interval",
  repayEveryN: "",
  repayEveryUnit: "",
  installmentsDef: "",
  installmentsMin: "",
  installmentsMax: "",
  firstDueDef: "",
  firstDueMin: "",
  firstDueMax: "",
  collectPrincipalEvery: "1",
  gracePeriod: "none",
  roundingSchedules: "round-last",
  roundingCurrency: "none",
  adjustPaymentDates: false,
  configureHolidays: false,
  nonWorkingReschedule: "next-working",
  paymentAlloc: "horizontal",
  prepayAccept: "accept",
  prepayInterest: "auto",
  prepayAlloc: "upcoming",
  prepayRecalc: "reduce-installment",
  markPaidWhen: "principal-expected",
  overduePayments: "increase-last",
  arrearsTolDef: "",
  arrearsTolMin: "",
  arrearsTolMax: "",
  arrearsFrom: "first-arrears",
  arrearsNonWorking: "exclude",
  arrearsAmtDef: "",
  arrearsAmtMin: "",
  arrearsAmtMax: "",
  arrearsFloor: "",
  penaltyMethod: "overdue-principal-days",
  penaltyTolDays: "",
  penaltyRateDef: "",
  penaltyRateMin: "",
  penaltyRateMax: "",
  internalDormant: false,
  internalLockArrears: false,
  internalCapCharges: false,
  feeArbitrary: false,
  feeName: "",
  feeType: "manual",
  feeId: "",
  feePayment: "flat",
  feeAmount: "",
  feeShowInactive: false,
  linkEnable: false,
  fundingEnable: false,
  guarantors: false,
  collateral: false,
  taxInterest: false,
  taxFees: false,
  taxPenalty: false,
  accountingMethod: "none",
  interestAccruedMethod: "none",
};

export function CreateLoanProductModal({ open, onClose, onSave }: CreateLoanProductModalProps) {
  const titleId = useId();
  const [form, setForm] = useState<LoanProductDraft>(INITIAL);
  const [showFeeForm, setShowFeeForm] = useState(false);

  const patch = useCallback(<K extends keyof LoanProductDraft>(key: K, value: LoanProductDraft[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  }, []);

  const handleSave = useCallback(() => {
    onSave?.();
    onClose();
    setForm(INITIAL);
    setShowFeeForm(false);
  }, [onClose, onSave]);

  const handleCancel = useCallback(() => {
    setForm(INITIAL);
    setShowFeeForm(false);
    onClose();
  }, [onClose]);

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
      className="zelify-loan-product-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <div
        className="zelify-loan-product-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="zelify-loan-product-modal__header">
          <div>
            <p className="zelify-loan-product-modal__eyebrow">Producto</p>
            <h2 id={titleId} className="zelify-loan-product-modal__title">
              Creating A New Loan Product
            </h2>
          </div>
          <button type="button" className="zelify-loan-product-modal__header-help" aria-label="Help">
            <CircleHelp size={20} strokeWidth={1.75} />
          </button>
        </header>

        <div className="zelify-loan-product-modal__body">
          <div className="zelify-loan-product-modal__card">
            <div className="zelify-loan-product-modal__grid2">
              <FormField
                label={<FieldLabel htmlFor="loan-product-name">Product</FieldLabel>}
                control={
                  <AppInput
                    id="loan-product-name"
                    value={form.productName}
                    onChange={(e) => patch("productName", e.target.value)}
                  />
                }
              />
              <FormField
                label={<FieldLabel htmlFor="loan-product-id">ID</FieldLabel>}
                control={
                  <AppInput
                    id="loan-product-id"
                    value={form.productId}
                    onChange={(e) => patch("productId", e.target.value)}
                    className="zelify-mono"
                  />
                }
              />
              <FormField
                label={<FieldLabel htmlFor="loan-product-cat">Product category</FieldLabel>}
                control={
                  <AppSelect
                    id="loan-product-cat"
                    size="md"
                    value={form.category}
                    onChange={(e) => patch("category", e.target.value)}
                  >
                    <option value="PERSONAL_LENDING">Personal Lending</option>
                    <option value="BUSINESS_LENDING">Business Lending</option>
                    <option value="MICROFINANCE">Microfinance</option>
                    <option value="MORTGAGES">Mortgages</option>
                    <option value="PURCHASE_FINANCE">Purchase Financing</option>
                    <option value="UNCATEGORIZED">Uncategorized</option>
                  </AppSelect>
                }
              />
              <FormField
                label={
                  <span className="zelify-loan-product-modal__label-help">
                    <FieldLabel htmlFor="loan-product-type">Product type</FieldLabel>
                    <button type="button" className="zelify-loan-product-modal__field-help" aria-label="Help">
                      <CircleHelp size={14} />
                    </button>
                  </span>
                }
                control={
                  <AppSelect
                    id="loan-product-type"
                    size="md"
                    value={form.productType}
                    onChange={(e) => patch("productType", e.target.value)}
                  >
                    <option value="FIXED_TERM_LOAN">Fixed Term Loan</option>
                    <option value="DYNAMIC_TERM_LOAN">Dynamic Term Loan</option>
                    <option value="REVOLVING_CREDIT">Revolving Credit</option>
                    <option value="TRANCHED_LOAN">Tranched Loan ↳ Dynamic Term</option>
                    <option value="DYNAMIC_MORTGAGE">Dynamic Mortgage ↳ Dynamic Term</option>
                  </AppSelect>
                }
              />
            </div>
            <div style={{ marginTop: 16 }}>
              <FieldLabel>State</FieldLabel>
              <div style={{ marginTop: 8 }}>
                <AppCheckbox
                  id="loan-product-active"
                  checked={form.active}
                  onChange={(e) => patch("active", e.target.checked)}
                  label="Active"
                />
              </div>
            </div>
          </div>

          <div className="zelify-loan-product-modal__accordion-stack">
          <details className="zelify-loan-product-modal__details">
            <summary>
              <ChevronDown size={18} className="zelify-loan-product-modal__chev" aria-hidden />
              Product description
            </summary>
            <div className="zelify-loan-product-modal__details-body">
              <div className="zelify-loan-product-modal__rte-toolbar" aria-hidden>
                <button type="button" className="zelify-loan-product-modal__rte-btn" tabIndex={-1}>
                  <Bold size={16} />
                </button>
                <button type="button" className="zelify-loan-product-modal__rte-btn" tabIndex={-1}>
                  <Italic size={16} />
                </button>
                <button type="button" className="zelify-loan-product-modal__rte-btn" tabIndex={-1}>
                  <Underline size={16} />
                </button>
                <button type="button" className="zelify-loan-product-modal__rte-btn" tabIndex={-1}>
                  <Strikethrough size={16} />
                </button>
                <button type="button" className="zelify-loan-product-modal__rte-btn" tabIndex={-1}>
                  <AlignLeft size={16} />
                </button>
                <button type="button" className="zelify-loan-product-modal__rte-btn" tabIndex={-1}>
                  <AlignCenter size={16} />
                </button>
                <button type="button" className="zelify-loan-product-modal__rte-btn" tabIndex={-1}>
                  <AlignRight size={16} />
                </button>
                <button type="button" className="zelify-loan-product-modal__rte-btn" tabIndex={-1}>
                  <AlignJustify size={16} />
                </button>
                <button type="button" className="zelify-loan-product-modal__rte-btn" tabIndex={-1}>
                  <List size={16} />
                </button>
                <button type="button" className="zelify-loan-product-modal__rte-btn" tabIndex={-1}>
                  <ListOrdered size={16} />
                </button>
                <button type="button" className="zelify-loan-product-modal__rte-btn" tabIndex={-1}>
                  <Link2 size={16} />
                </button>
                <button type="button" className="zelify-loan-product-modal__rte-btn" tabIndex={-1}>
                  <Minus size={16} />
                </button>
                <button type="button" className="zelify-loan-product-modal__rte-btn" tabIndex={-1}>
                  <ImageIcon size={16} />
                </button>
              </div>
              <textarea
                className="zelify-loan-product-modal__rte-area"
                value={form.description}
                onChange={(e) => patch("description", e.target.value)}
                placeholder="Describe the loan product…"
              />
            </div>
          </details>

          <details className="zelify-loan-product-modal__details">
            <summary>
              <ChevronDown size={18} className="zelify-loan-product-modal__chev" aria-hidden />
              Product availability
            </summary>
            <div className="zelify-loan-product-modal__details-body">
              <p className="zelify-loan-product-modal__subsection-title">Available to</p>
              <div className="zelify-loan-product-modal__checkbox-grid">
                <AppCheckbox
                  id="avail-clients"
                  checked={form.availClients}
                  onChange={(e) => patch("availClients", e.target.checked)}
                  label="Clients"
                />
                <AppCheckbox
                  id="avail-groups"
                  checked={form.availGroups}
                  onChange={(e) => patch("availGroups", e.target.checked)}
                  label="Groups"
                />
                <AppCheckbox
                  id="avail-solidarity"
                  checked={form.availGroupsSolidarity}
                  onChange={(e) => patch("availGroupsSolidarity", e.target.checked)}
                  label="Groups (Solidarity)"
                />
                <AppCheckbox
                  id="avail-branches"
                  checked={form.availAllBranches}
                  onChange={(e) => patch("availAllBranches", e.target.checked)}
                  label="All Branches"
                />
              </div>
            </div>
          </details>

          <details className="zelify-loan-product-modal__details">
            <summary>
              <ChevronDown size={18} className="zelify-loan-product-modal__chev" aria-hidden />
              New account settings
            </summary>
            <div className="zelify-loan-product-modal__details-body">
              <div className="zelify-loan-product-modal__grid2">
                <FormField
                  label={
                    <span className="zelify-loan-product-modal__label-help">
                      <FieldLabel htmlFor="loan-id-type">ID type</FieldLabel>
                      <button type="button" className="zelify-loan-product-modal__field-help" aria-label="Help">
                        <CircleHelp size={14} />
                      </button>
                    </span>
                  }
                  control={
                    <AppSelect
                      id="loan-id-type"
                      size="md"
                      value={form.idType}
                      onChange={(e) => patch("idType", e.target.value)}
                    >
                      <option value="incremental">Incremental Number</option>
                      <option value="random">Random Pattern</option>
                    </AppSelect>
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="loan-id-template">Using template</FieldLabel>}
                  control={
                    <AppInput
                      id="loan-id-template"
                      value={form.idTemplate}
                      onChange={(e) => patch("idTemplate", e.target.value)}
                      className="zelify-mono"
                    />
                  }
                />
                <FormField
                  className="zelify-loan-product-modal__field-span2"
                  label={<FieldLabel htmlFor="loan-initial-state">Initial account state</FieldLabel>}
                  control={
                    <AppSelect
                      id="loan-initial-state"
                      size="md"
                      value={form.initialAccountState}
                      onChange={(e) => patch("initialAccountState", e.target.value)}
                    >
                      <option value="pending">Pending Approval</option>
                      <option value="active">Active</option>
                    </AppSelect>
                  }
                />
              </div>
            </div>
          </details>

          <details className="zelify-loan-product-modal__details">
            <summary>
              <ChevronDown size={18} className="zelify-loan-product-modal__chev" aria-hidden />
              Currencies
            </summary>
            <div className="zelify-loan-product-modal__details-body">
              <FormField
                label={<FieldLabel htmlFor="loan-currency">Currency</FieldLabel>}
                control={
                  <AppSelect
                    id="loan-currency"
                    size="md"
                    value={form.currency}
                    onChange={(e) => patch("currency", e.target.value)}
                  >
                    <option value="USD">US Dollar (USD)</option>
                    <option value="GBP">British Pound (GBP)</option>
                  </AppSelect>
                }
              />
            </div>
          </details>

          <details className="zelify-loan-product-modal__details">
            <summary>
              <ChevronDown size={18} className="zelify-loan-product-modal__chev" aria-hidden />
              Loan amount constraints ($)
            </summary>
            <div className="zelify-loan-product-modal__details-body">
              <div className="zelify-loan-product-modal__grid3">
                <FormField
                  label={<FieldLabel htmlFor="lam-def">Default</FieldLabel>}
                  control={
                    <AppInput
                      id="lam-def"
                      value={form.loanAmountDefault}
                      onChange={(e) => patch("loanAmountDefault", e.target.value)}
                    />
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="lam-min">Min</FieldLabel>}
                  control={
                    <AppInput id="lam-min" value={form.loanAmountMin} onChange={(e) => patch("loanAmountMin", e.target.value)} />
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="lam-max">Max</FieldLabel>}
                  control={
                    <AppInput id="lam-max" value={form.loanAmountMax} onChange={(e) => patch("loanAmountMax", e.target.value)} />
                  }
                />
              </div>
              <FormField
                label={
                  <FieldLabel htmlFor="loan-credit-arr">Accounts managed under Credit Arrangement</FieldLabel>
                }
                control={
                  <AppSelect
                    id="loan-credit-arr"
                    size="md"
                    value={form.creditArrangement}
                    onChange={(e) => patch("creditArrangement", e.target.value)}
                  >
                    <option value="optional">Optional</option>
                    <option value="required">Required</option>
                    <option value="none">None</option>
                  </AppSelect>
                }
              />
            </div>
          </details>

          <details className="zelify-loan-product-modal__details">
            <summary>
              <ChevronDown size={18} className="zelify-loan-product-modal__chev" aria-hidden />
              Interest rate
            </summary>
            <div className="zelify-loan-product-modal__details-body">
              <div className="zelify-loan-product-modal__grid2">
                <FormField
                  label={<FieldLabel htmlFor="int-calc">Interest calculation method</FieldLabel>}
                  control={
                    <AppSelect
                      id="int-calc"
                      size="md"
                      value={form.interestCalc}
                      onChange={(e) => patch("interestCalc", e.target.value)}
                    >
                      <option value="declining">Declining Balance</option>
                      <option value="declining-equal">Declining Balance (Equal Installments)</option>
                    </AppSelect>
                  }
                />
                <FormField
                  label={<FieldLabel>Accrued interest posting frequency</FieldLabel>}
                  control={<AppInput value="On Repayment" readOnly />}
                />
                <FormField
                  label={<FieldLabel htmlFor="int-type">Interest type</FieldLabel>}
                  control={
                    <AppSelect
                      id="int-type"
                      size="md"
                      value={form.interestType}
                      onChange={(e) => patch("interestType", e.target.value)}
                    >
                      <option value="simple">Simple Interest</option>
                      <option value="capitalized">Capitalized Interest</option>
                      <option value="compound">Compound Interest</option>
                    </AppSelect>
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="int-charged">How is the interest rate charged?</FieldLabel>}
                  control={
                    <AppSelect
                      id="int-charged"
                      size="md"
                      value={form.interestChargedUnit}
                      onChange={(e) => patch("interestChargedUnit", e.target.value)}
                    >
                      <option value="per-year">% per year</option>
                      <option value="per-month">% per month</option>
                    </AppSelect>
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="int-source">Interest rate source</FieldLabel>}
                  control={
                    <AppSelect
                      id="int-source"
                      size="md"
                      value={form.interestRateSource}
                      onChange={(e) => patch("interestRateSource", e.target.value as "fixed" | "index")}
                    >
                      <option value="fixed">Fixed Interest Rate</option>
                      <option value="index">Index Interest Rate</option>
                    </AppSelect>
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="days-year">Days in year</FieldLabel>}
                  control={
                    <AppSelect
                      id="days-year"
                      size="md"
                      value={form.daysInYear}
                      onChange={(e) => patch("daysInYear", e.target.value)}
                    >
                      <option value="30e360">30E/360 ISDA (30/360 German)</option>
                      <option value="act360">ACT/360</option>
                      <option value="act365">ACT/365</option>
                    </AppSelect>
                  }
                />
              </div>

              {form.interestRateSource === "fixed" ? (
                <div style={{ marginTop: 16 }}>
                  <p className="zelify-loan-product-modal__subsection-title">Interest rate constraints (%)</p>
                  <div className="zelify-loan-product-modal__grid3">
                    <FormField
                      label={<FieldLabel htmlFor="fx-def">Default</FieldLabel>}
                      control={
                        <AppInput id="fx-def" value={form.fixedRateDefault} onChange={(e) => patch("fixedRateDefault", e.target.value)} />
                      }
                    />
                    <FormField
                      label={<FieldLabel htmlFor="fx-min">Min</FieldLabel>}
                      control={
                        <AppInput id="fx-min" value={form.fixedRateMin} onChange={(e) => patch("fixedRateMin", e.target.value)} />
                      }
                    />
                    <FormField
                      label={<FieldLabel htmlFor="fx-max">Max</FieldLabel>}
                      control={
                        <AppInput id="fx-max" value={form.fixedRateMax} onChange={(e) => patch("fixedRateMax", e.target.value)} />
                      }
                    />
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 16 }} className="zelify-loan-product-modal__grid2">
                  <FormField
                    label={<FieldLabel htmlFor="idx-src">Index source</FieldLabel>}
                    control={
                      <AppSelect
                        id="idx-src"
                        size="md"
                        value={form.indexSource}
                        onChange={(e) => patch("indexSource", e.target.value)}
                      >
                        <option value="dbc">DBC interest rate</option>
                        <option value="sofr">SOFR</option>
                      </AppSelect>
                    }
                  />
                  <p className="zelify-loan-product-modal__subsection-title" style={{ gridColumn: "1 / -1" }}>
                    Interest spread constraints (%)
                  </p>
                  <FormField
                    label={<FieldLabel htmlFor="sp-def">Default</FieldLabel>}
                    control={
                      <AppInput id="sp-def" value={form.spreadDefault} onChange={(e) => patch("spreadDefault", e.target.value)} />
                    }
                  />
                  <FormField
                    label={<FieldLabel htmlFor="sp-min">Min</FieldLabel>}
                    control={<AppInput id="sp-min" value={form.spreadMin} onChange={(e) => patch("spreadMin", e.target.value)} />}
                  />
                  <FormField
                    label={<FieldLabel htmlFor="sp-max">Max</FieldLabel>}
                    control={<AppInput id="sp-max" value={form.spreadMax} onChange={(e) => patch("spreadMax", e.target.value)} />}
                  />
                  <FormField
                    label={<FieldLabel htmlFor="floor">Interest rate floor (%)</FieldLabel>}
                    control={<AppInput id="floor" value={form.rateFloor} onChange={(e) => patch("rateFloor", e.target.value)} />}
                  />
                  <FormField
                    label={<FieldLabel htmlFor="ceil">Interest rate ceiling (%)</FieldLabel>}
                    control={<AppInput id="ceil" value={form.rateCeiling} onChange={(e) => patch("rateCeiling", e.target.value)} />}
                  />
                  <FormField
                    label={<FieldLabel htmlFor="rev-freq">Interest rate review frequency</FieldLabel>}
                    control={
                      <div style={{ display: "flex", gap: 8 }}>
                        <AppInput
                          id="rev-freq"
                          value={form.reviewFrequency}
                          onChange={(e) => patch("reviewFrequency", e.target.value)}
                        />
                        <AppSelect
                          size="md"
                          value={form.reviewUnit}
                          onChange={(e) => patch("reviewUnit", e.target.value)}
                          aria-label="Unit"
                        >
                          <option value="days">Days</option>
                          <option value="months">Months</option>
                        </AppSelect>
                      </div>
                    }
                  />
                </div>
              )}
            </div>
          </details>

          <details className="zelify-loan-product-modal__details">
            <summary>
              <ChevronDown size={18} className="zelify-loan-product-modal__chev" aria-hidden />
              Repayment scheduling
            </summary>
            <div className="zelify-loan-product-modal__details-body">
              <div className="zelify-loan-product-modal__grid2">
                <FormField
                  label={<FieldLabel htmlFor="pay-meth">Payments method</FieldLabel>}
                  control={
                    <AppSelect
                      id="pay-meth"
                      size="md"
                      value={form.paymentsMethod}
                      onChange={(e) => patch("paymentsMethod", e.target.value)}
                    >
                      <option value="standard">Standard Payments</option>
                    </AppSelect>
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="pay-int">Payment interval method</FieldLabel>}
                  control={
                    <AppSelect
                      id="pay-int"
                      size="md"
                      value={form.paymentIntervalMethod}
                      onChange={(e) => patch("paymentIntervalMethod", e.target.value)}
                    >
                      <option value="interval">Interval</option>
                    </AppSelect>
                  }
                />
                <FormField
                  label={<FieldLabel>Repayments are made every</FieldLabel>}
                  control={
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <AppInput
                        value={form.repayEveryN}
                        onChange={(e) => patch("repayEveryN", e.target.value)}
                        style={{ maxWidth: 80 }}
                      />
                      <AppSelect
                        size="md"
                        value={form.repayEveryUnit}
                        onChange={(e) => patch("repayEveryUnit", e.target.value)}
                        aria-label="Interval unit"
                      >
                        <option value="">—</option>
                        <option value="months">Months</option>
                        <option value="weeks">Weeks</option>
                      </AppSelect>
                    </div>
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="grace">Grace period</FieldLabel>}
                  control={
                    <AppSelect
                      id="grace"
                      size="md"
                      value={form.gracePeriod}
                      onChange={(e) => patch("gracePeriod", e.target.value)}
                    >
                      <option value="none">No Grace Period</option>
                    </AppSelect>
                  }
                />
              </div>
              <p className="zelify-loan-product-modal__subsection-title">Installments constraints (#)</p>
              <div className="zelify-loan-product-modal__grid3">
                <FormField
                  label={<FieldLabel htmlFor="ins-def">Default</FieldLabel>}
                  control={
                    <AppInput id="ins-def" value={form.installmentsDef} onChange={(e) => patch("installmentsDef", e.target.value)} />
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="ins-min">Min</FieldLabel>}
                  control={
                    <AppInput id="ins-min" value={form.installmentsMin} onChange={(e) => patch("installmentsMin", e.target.value)} />
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="ins-max">Max</FieldLabel>}
                  control={
                    <AppInput id="ins-max" value={form.installmentsMax} onChange={(e) => patch("installmentsMax", e.target.value)} />
                  }
                />
              </div>
              <p className="zelify-loan-product-modal__subsection-title">First due date offset constraints (days)</p>
              <div className="zelify-loan-product-modal__grid3">
                <FormField
                  label={<FieldLabel htmlFor="fdd-def">Default</FieldLabel>}
                  control={
                    <AppInput id="fdd-def" value={form.firstDueDef} onChange={(e) => patch("firstDueDef", e.target.value)} />
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="fdd-min">Min</FieldLabel>}
                  control={<AppInput id="fdd-min" value={form.firstDueMin} onChange={(e) => patch("firstDueMin", e.target.value)} />}
                />
                <FormField
                  label={<FieldLabel htmlFor="fdd-max">Max</FieldLabel>}
                  control={<AppInput id="fdd-max" value={form.firstDueMax} onChange={(e) => patch("firstDueMax", e.target.value)} />}
                />
              </div>
              <div className="zelify-loan-product-modal__grid2" style={{ marginTop: 12 }}>
                <FormField
                  label={<FieldLabel>Collect principal every</FieldLabel>}
                  control={
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <AppInput
                        value={form.collectPrincipalEvery}
                        onChange={(e) => patch("collectPrincipalEvery", e.target.value)}
                        style={{ maxWidth: 64 }}
                      />
                      <span style={{ fontSize: 14, color: "#475569" }}>Repayments</span>
                    </div>
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="round-sch">Rounding of repayment schedules</FieldLabel>}
                  control={
                    <AppSelect
                      id="round-sch"
                      size="md"
                      value={form.roundingSchedules}
                      onChange={(e) => patch("roundingSchedules", e.target.value)}
                    >
                      <option value="round-last">Round Principal Remainder Into Last Repayment</option>
                    </AppSelect>
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="round-cur">Rounding of repayment currency</FieldLabel>}
                  control={
                    <AppSelect
                      id="round-cur"
                      size="md"
                      value={form.roundingCurrency}
                      onChange={(e) => patch("roundingCurrency", e.target.value)}
                    >
                      <option value="none">No Rounding</option>
                    </AppSelect>
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="nwr">Non working days rescheduling</FieldLabel>}
                  control={
                    <AppSelect
                      id="nwr"
                      size="md"
                      value={form.nonWorkingReschedule}
                      onChange={(e) => patch("nonWorkingReschedule", e.target.value)}
                    >
                      <option value="next-working">Move ahead to next working day</option>
                    </AppSelect>
                  }
                />
              </div>
              <div style={{ marginTop: 12 }} className="zelify-loan-product-modal__checkbox-grid">
                <AppCheckbox
                  id="adj-dates"
                  checked={form.adjustPaymentDates}
                  onChange={(e) => patch("adjustPaymentDates", e.target.checked)}
                  label="Adjust payment dates"
                />
                <AppCheckbox
                  id="cfg-holidays"
                  checked={form.configureHolidays}
                  onChange={(e) => patch("configureHolidays", e.target.checked)}
                  label="Configure payment holidays"
                />
              </div>
            </div>
          </details>

          <details className="zelify-loan-product-modal__details">
            <summary>
              <ChevronDown size={18} className="zelify-loan-product-modal__chev" aria-hidden />
              Repayment collection
            </summary>
            <div className="zelify-loan-product-modal__details-body">
              <div className="zelify-loan-product-modal__grid2">
                <FormField
                  label={<FieldLabel htmlFor="palloc">Payment allocation method</FieldLabel>}
                  control={
                    <AppSelect
                      id="palloc"
                      size="md"
                      value={form.paymentAlloc}
                      onChange={(e) => patch("paymentAlloc", e.target.value)}
                    >
                      <option value="horizontal">Horizontal</option>
                    </AppSelect>
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="pre-acc">Pre-payments acceptance</FieldLabel>}
                  control={
                    <AppSelect
                      id="pre-acc"
                      size="md"
                      value={form.prepayAccept}
                      onChange={(e) => patch("prepayAccept", e.target.value)}
                    >
                      <option value="accept">Accept Pre-Payments</option>
                    </AppSelect>
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="pre-int">Apply interest on pre-payment</FieldLabel>}
                  control={
                    <AppSelect
                      id="pre-int"
                      size="md"
                      value={form.prepayInterest}
                      onChange={(e) => patch("prepayInterest", e.target.value)}
                    >
                      <option value="auto">Automatic</option>
                    </AppSelect>
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="pre-alloc">Pre-payment allocation</FieldLabel>}
                  control={
                    <AppSelect
                      id="pre-alloc"
                      size="md"
                      value={form.prepayAlloc}
                      onChange={(e) => patch("prepayAlloc", e.target.value)}
                    >
                      <option value="upcoming">On Upcoming Pending Installment Only</option>
                    </AppSelect>
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="pre-recalc">Pre-payment recalculation</FieldLabel>}
                  control={
                    <AppSelect
                      id="pre-recalc"
                      size="md"
                      value={form.prepayRecalc}
                      onChange={(e) => patch("prepayRecalc", e.target.value)}
                    >
                      <option value="reduce-installment">Reduce Amount per Installment</option>
                    </AppSelect>
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="mark-paid">Mark installment as paid when</FieldLabel>}
                  control={
                    <AppSelect
                      id="mark-paid"
                      size="md"
                      value={form.markPaidWhen}
                      onChange={(e) => patch("markPaidWhen", e.target.value)}
                    >
                      <option value="principal-expected">Principal Expected is Paid Before/on Due Date</option>
                    </AppSelect>
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="overdue">Overdue payments</FieldLabel>}
                  control={
                    <AppSelect
                      id="overdue"
                      size="md"
                      value={form.overduePayments}
                      onChange={(e) => patch("overduePayments", e.target.value)}
                    >
                      <option value="increase-last">Increase the Last Installment</option>
                    </AppSelect>
                  }
                />
              </div>
              <p className="zelify-loan-product-modal__subsection-title">Repayment allocation order</p>
              <ul className="zelify-loan-product-modal__allocation-list">
                <li className="zelify-loan-product-modal__allocation-item">
                  <GripVertical size={16} aria-hidden />
                  Fee
                </li>
                <li className="zelify-loan-product-modal__allocation-item">
                  <GripVertical size={16} aria-hidden />
                  Penalty
                </li>
              </ul>
            </div>
          </details>

          <details className="zelify-loan-product-modal__details">
            <summary>
              <ChevronDown size={18} className="zelify-loan-product-modal__chev" aria-hidden />
              Arrears settings
            </summary>
            <div className="zelify-loan-product-modal__details-body">
              <p className="zelify-loan-product-modal__subsection-title">Arrears tolerance period (days)</p>
              <div className="zelify-loan-product-modal__grid3">
                <FormField
                  label={<FieldLabel htmlFor="at-def">Default</FieldLabel>}
                  control={<AppInput id="at-def" value={form.arrearsTolDef} onChange={(e) => patch("arrearsTolDef", e.target.value)} />}
                />
                <FormField
                  label={<FieldLabel htmlFor="at-min">Min</FieldLabel>}
                  control={<AppInput id="at-min" value={form.arrearsTolMin} onChange={(e) => patch("arrearsTolMin", e.target.value)} />}
                />
                <FormField
                  label={<FieldLabel htmlFor="at-max">Max</FieldLabel>}
                  control={<AppInput id="at-max" value={form.arrearsTolMax} onChange={(e) => patch("arrearsTolMax", e.target.value)} />}
                />
              </div>
              <div className="zelify-loan-product-modal__grid2" style={{ marginTop: 12 }}>
                <FormField
                  label={<FieldLabel htmlFor="arr-from">Arrears days calculated from</FieldLabel>}
                  control={
                    <AppSelect
                      id="arr-from"
                      size="md"
                      value={form.arrearsFrom}
                      onChange={(e) => patch("arrearsFrom", e.target.value)}
                    >
                      <option value="first-arrears">Date Account First Went Into Arrears</option>
                    </AppSelect>
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="arr-nw">Non-working days in arrears tolerance period…</FieldLabel>}
                  control={
                    <AppSelect
                      id="arr-nw"
                      size="md"
                      value={form.arrearsNonWorking}
                      onChange={(e) => patch("arrearsNonWorking", e.target.value)}
                    >
                      <option value="exclude">Exclude Non-Working Days</option>
                    </AppSelect>
                  }
                />
              </div>
              <p className="zelify-loan-product-modal__subsection-title">Arrears tolerance amount (% of outstanding principal)</p>
              <div className="zelify-loan-product-modal__grid3">
                <FormField
                  label={<FieldLabel htmlFor="aa-def">Default</FieldLabel>}
                  control={<AppInput id="aa-def" value={form.arrearsAmtDef} onChange={(e) => patch("arrearsAmtDef", e.target.value)} />}
                />
                <FormField
                  label={<FieldLabel htmlFor="aa-min">Min</FieldLabel>}
                  control={<AppInput id="aa-min" value={form.arrearsAmtMin} onChange={(e) => patch("arrearsAmtMin", e.target.value)} />}
                />
                <FormField
                  label={<FieldLabel htmlFor="aa-max">Max</FieldLabel>}
                  control={<AppInput id="aa-max" value={form.arrearsAmtMax} onChange={(e) => patch("arrearsAmtMax", e.target.value)} />}
                />
              </div>
              <FormField
                label={<FieldLabel htmlFor="arr-floor">With a floor (minimum) ($)</FieldLabel>}
                control={<AppInput id="arr-floor" value={form.arrearsFloor} onChange={(e) => patch("arrearsFloor", e.target.value)} />}
              />
            </div>
          </details>

          <details className="zelify-loan-product-modal__details">
            <summary>
              <ChevronDown size={18} className="zelify-loan-product-modal__chev" aria-hidden />
              Penalties settings
            </summary>
            <div className="zelify-loan-product-modal__details-body">
              <FormField
                label={<FieldLabel htmlFor="pen-meth">Penalty calculation method</FieldLabel>}
                control={
                  <AppSelect
                    id="pen-meth"
                    size="md"
                    value={form.penaltyMethod}
                    onChange={(e) => patch("penaltyMethod", e.target.value)}
                  >
                    <option value="none">No Penalty</option>
                    <option value="overdue-principal-days">Overdue Principal × # of Late Days × Penalty Rate</option>
                    <option value="overdue-both-days">(Overdue Principal + Overdue Interest) × # of Late Days × Penalty Rate</option>
                    <option value="outstanding-days">Outstanding Principal × # of Late Days × Penalty Rate</option>
                  </AppSelect>
                }
              />
              <div className="zelify-loan-product-modal__grid2" style={{ marginTop: 12 }}>
                <FormField
                  label={<FieldLabel htmlFor="pen-tol">Penalty tolerance period (days)</FieldLabel>}
                  control={
                    <AppInput id="pen-tol" value={form.penaltyTolDays} onChange={(e) => patch("penaltyTolDays", e.target.value)} />
                  }
                />
                <FormField
                  label={<FieldLabel>How is the penalty rate charged?</FieldLabel>}
                  control={<AppInput readOnly value="% per Day" />}
                />
              </div>
              <p className="zelify-loan-product-modal__subsection-title">Penalty rate constraints (%)</p>
              <div className="zelify-loan-product-modal__grid3">
                <FormField
                  label={<FieldLabel htmlFor="pr-def">Default</FieldLabel>}
                  control={
                    <AppInput id="pr-def" value={form.penaltyRateDef} onChange={(e) => patch("penaltyRateDef", e.target.value)} />
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="pr-min">Min</FieldLabel>}
                  control={<AppInput id="pr-min" value={form.penaltyRateMin} onChange={(e) => patch("penaltyRateMin", e.target.value)} />}
                />
                <FormField
                  label={<FieldLabel htmlFor="pr-max">Max</FieldLabel>}
                  control={<AppInput id="pr-max" value={form.penaltyRateMax} onChange={(e) => patch("penaltyRateMax", e.target.value)} />}
                />
              </div>
            </div>
          </details>

          <details className="zelify-loan-product-modal__details">
            <summary>
              <ChevronDown size={18} className="zelify-loan-product-modal__chev" aria-hidden />
              Internal controls
            </summary>
            <div className="zelify-loan-product-modal__details-body">
              <div className="zelify-loan-product-modal__checkbox-grid">
                <AppCheckbox
                  id="ic-dormant"
                  checked={form.internalDormant}
                  onChange={(e) => patch("internalDormant", e.target.checked)}
                  label="Close dormant accounts"
                />
                <AppCheckbox
                  id="ic-lock"
                  checked={form.internalLockArrears}
                  onChange={(e) => patch("internalLockArrears", e.target.checked)}
                  label="Lock arrears accounts"
                />
                <AppCheckbox
                  id="ic-cap"
                  checked={form.internalCapCharges}
                  onChange={(e) => patch("internalCapCharges", e.target.checked)}
                  label="Cap charges"
                />
              </div>
            </div>
          </details>

          <details className="zelify-loan-product-modal__details">
            <summary>
              <ChevronDown size={18} className="zelify-loan-product-modal__chev" aria-hidden />
              Product fees
            </summary>
            <div className="zelify-loan-product-modal__details-body">
              <AppCheckbox
                id="fee-arb"
                checked={form.feeArbitrary}
                onChange={(e) => patch("feeArbitrary", e.target.checked)}
                label="Allow arbitrary fees"
              />
              <div style={{ marginTop: 12 }}>
                <AppButton
                  type="button"
                  tone="secondary"
                  className="zelify-button--compact"
                  disabled={!form.feeArbitrary}
                  onClick={() => setShowFeeForm(true)}
                >
                  Add fee
                </AppButton>
              </div>
              {showFeeForm && form.feeArbitrary ? (
                <div className="zelify-loan-product-modal__fee-box">
                  <div className="zelify-loan-product-modal__grid2">
                    <FormField
                      label={<FieldLabel htmlFor="fee-name">Name</FieldLabel>}
                      control={<AppInput id="fee-name" value={form.feeName} onChange={(e) => patch("feeName", e.target.value)} />}
                    />
                    <FormField
                      label={<FieldLabel htmlFor="fee-type">Type</FieldLabel>}
                      control={
                        <AppSelect
                          id="fee-type"
                          size="md"
                          value={form.feeType}
                          onChange={(e) => patch("feeType", e.target.value)}
                        >
                          <option value="manual">Manual</option>
                          <option value="planned">Planned (Applied on Due Dates)</option>
                          <option value="deduct-disb">Deducted Disbursement</option>
                          <option value="cap-disb">Capitalized Disbursement</option>
                          <option value="upfront-disb">Upfront Disbursement</option>
                          <option value="late">Late Repayment</option>
                          <option value="due-upfront">Payment Due (Applied Upfront)</option>
                        </AppSelect>
                      }
                    />
                    <FormField
                      label={<FieldLabel htmlFor="fee-id">ID</FieldLabel>}
                      control={<AppInput id="fee-id" value={form.feeId} onChange={(e) => patch("feeId", e.target.value)} />}
                    />
                    <FormField
                      label={<FieldLabel htmlFor="fee-pay">Fee payment</FieldLabel>}
                      control={
                        <AppSelect
                          id="fee-pay"
                          size="md"
                          value={form.feePayment}
                          onChange={(e) => patch("feePayment", e.target.value)}
                        >
                          <option value="flat">Flat ID</option>
                        </AppSelect>
                      }
                    />
                    <FormField
                      label={<FieldLabel htmlFor="fee-amt">Amount ($)</FieldLabel>}
                      control={<AppInput id="fee-amt" value={form.feeAmount} onChange={(e) => patch("feeAmount", e.target.value)} />}
                    />
                  </div>
                  <AppCheckbox
                    id="fee-inactive"
                    checked={form.feeShowInactive}
                    onChange={(e) => patch("feeShowInactive", e.target.checked)}
                    label="Show inactive fees"
                  />
                </div>
              ) : null}
            </div>
          </details>

          <details className="zelify-loan-product-modal__details">
            <summary>
              <ChevronDown size={18} className="zelify-loan-product-modal__chev" aria-hidden />
              Product links &amp; funding
            </summary>
            <div className="zelify-loan-product-modal__details-body">
              <AppCheckbox
                id="link-en"
                checked={form.linkEnable}
                onChange={(e) => patch("linkEnable", e.target.checked)}
                label="Enable linking"
              />
              <AppCheckbox
                id="fund-en"
                checked={form.fundingEnable}
                onChange={(e) => patch("fundingEnable", e.target.checked)}
                label="Enable funding sources"
              />
            </div>
          </details>

          <details className="zelify-loan-product-modal__details">
            <summary>
              <ChevronDown size={18} className="zelify-loan-product-modal__chev" aria-hidden />
              Securities
            </summary>
            <div className="zelify-loan-product-modal__details-body">
              <AppCheckbox
                id="sec-guar"
                checked={form.guarantors}
                onChange={(e) => patch("guarantors", e.target.checked)}
                label="Enable guarantors"
              />
              <AppCheckbox
                id="sec-coll"
                checked={form.collateral}
                onChange={(e) => patch("collateral", e.target.checked)}
                label="Enable collateral"
              />
            </div>
          </details>

          <details className="zelify-loan-product-modal__details">
            <summary>
              <ChevronDown size={18} className="zelify-loan-product-modal__chev" aria-hidden />
              Taxes
            </summary>
            <div className="zelify-loan-product-modal__details-body">
              <AppCheckbox
                id="tax-int"
                checked={form.taxInterest}
                onChange={(e) => patch("taxInterest", e.target.checked)}
                label="Interest"
              />
              <AppCheckbox
                id="tax-fee"
                checked={form.taxFees}
                onChange={(e) => patch("taxFees", e.target.checked)}
                label="Fees"
              />
              <AppCheckbox
                id="tax-pen"
                checked={form.taxPenalty}
                onChange={(e) => patch("taxPenalty", e.target.checked)}
                label="Penalty"
              />
            </div>
          </details>

          <details className="zelify-loan-product-modal__details">
            <summary>
              <ChevronDown size={18} className="zelify-loan-product-modal__chev" aria-hidden />
              Accounting rules
            </summary>
            <div className="zelify-loan-product-modal__details-body">
              <div className="zelify-loan-product-modal__grid2">
                <FormField
                  label={<FieldLabel htmlFor="acc-meth">Methodology</FieldLabel>}
                  control={
                    <AppSelect
                      id="acc-meth"
                      size="md"
                      value={form.accountingMethod}
                      onChange={(e) => patch("accountingMethod", e.target.value)}
                    >
                      <option value="none">None</option>
                      <option value="cash">Cash</option>
                      <option value="accrual">Accrual</option>
                    </AppSelect>
                  }
                />
                <FormField
                  label={<FieldLabel htmlFor="acc-int">Interest accrued method</FieldLabel>}
                  control={
                    <AppSelect
                      id="acc-int"
                      size="md"
                      value={form.interestAccruedMethod}
                      onChange={(e) => patch("interestAccruedMethod", e.target.value)}
                    >
                      <option value="none">None</option>
                    </AppSelect>
                  }
                />
              </div>
              {(form.accountingMethod === "cash" || form.accountingMethod === "accrual") && (
                <div style={{ marginTop: 16 }}>
                  <p className="zelify-loan-product-modal__subsection-title">Accounting mapping</p>
                  {[
                    { key: "Portfolio Control", cat: "Asset" },
                    { key: "Transaction Source", cat: "Income" },
                    { key: "Write-Off Expense", cat: "Expense" },
                    { key: "Interest Receivable", cat: "Asset" },
                  ].map((row) => (
                    <div key={row.key} className="zelify-loan-product-modal__accounting-row">
                      <span className="zelify-loan-product-modal__accounting-label">
                        {row.key}{" "}
                        <span style={{ color: "#94a3b8", fontSize: 12 }}>({row.cat})</span>
                      </span>
                      <AppSelect size="md" defaultValue="">
                        <option value="">Select GL account…</option>
                        <option value="gl1">1200 — Loans Receivable</option>
                        <option value="gl2">4100 — Interest Income</option>
                      </AppSelect>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>
          </div>
        </div>

        <footer className="zelify-loan-product-modal__footer">
          <AppButton type="button" tone="secondary" onClick={handleCancel}>
            Cancel
          </AppButton>
          <AppButton type="button" tone="primary" onClick={handleSave}>
            Save product
          </AppButton>
        </footer>
      </div>
    </div>
  );
}
