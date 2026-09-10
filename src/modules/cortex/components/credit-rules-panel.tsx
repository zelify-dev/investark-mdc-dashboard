"use client";

import { Percent, Scale, ShieldCheck } from "lucide-react";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppCheckbox } from "@/components/ui/atoms/checkbox/app-checkbox";
import { CATEGORY_LABELS } from "../data/credit-catalog";
import type { CreditProductCategory, ProductRule } from "../types/credit-pricing.types";
import "./credit-rules-panel.css";

const GROUP_META: Record<
  NonNullable<ProductRule["group"]>,
  { title: string; hint: string; icon: typeof ShieldCheck }
> = {
  aprobacion: {
    title: "Políticas de aprobación",
    hint: "Bloquean la cotización si no se cumplen",
    icon: ShieldCheck,
  },
  validacion: {
    title: "Validaciones operativas",
    hint: "Documentación y condiciones del desembolso",
    icon: Scale,
  },
  pricing: {
    title: "Descuentos en tasa",
    hint: "Beneficios en puntos base (pbs) al cotizar",
    icon: Percent,
  },
};

type CreditRulesPanelProps = {
  category: CreditProductCategory;
  rules: ProductRule[];
  onToggle: (ruleId: string, enabled: boolean) => void;
};

export function CreditRulesPanel({ category, rules, onToggle }: CreditRulesPanelProps) {
  const enabledCount = rules.filter((r) => r.enabled).length;
  const groups = (["aprobacion", "validacion", "pricing"] as const).map((key) => ({
    key,
    meta: GROUP_META[key],
    items: rules.filter((r) => (r.group ?? (r.bpsDiscount > 0 ? "pricing" : r.blocksApproval ? "aprobacion" : "validacion")) === key),
  }));

  return (
    <section className="cortex-rules-panel" data-tour="credit-product-rules">
      <header className="cortex-rules-panel__header">
        <div>
          <p className="cortex-rules-panel__eyebrow">Motor de decisión · Políticas</p>
          <h3 className="cortex-rules-panel__title">Reglas · {CATEGORY_LABELS[category]}</h3>
          <p className="cortex-rules-panel__subtitle">
            Activa reglas. El motor las evalúa al cotizar antes de la verificación IA.
          </p>
        </div>
        <div className="cortex-rules-panel__meta">
          <AppBadge tone="neutral">{enabledCount} activas</AppBadge>
          <span className="cortex-rules-panel__total">{rules.length} reglas</span>
        </div>
      </header>

      <div className="cortex-rules-panel__groups">
        {groups.map(({ key, meta, items }) => {
          if (items.length === 0) return null;
          const Icon = meta.icon;
          return (
            <div key={key} className="cortex-rules-group">
              <div className="cortex-rules-group__head">
                <span className="cortex-rules-group__icon" aria-hidden>
                  <Icon size={16} strokeWidth={1.75} />
                </span>
                <div>
                  <h4>{meta.title}</h4>
                  <p>{meta.hint}</p>
                </div>
                <span className="cortex-rules-group__count">{items.filter((r) => r.enabled).length}/{items.length}</span>
              </div>
              <ul className="cortex-rules-group__list">
                {items.map((rule) => (
                  <li key={rule.id} className={`cortex-rule-item${rule.enabled ? " cortex-rule-item--on" : ""}`}>
                    <AppCheckbox
                      id={`rule-${rule.id}`}
                      checked={rule.enabled}
                      onChange={(e) => onToggle(rule.id, e.target.checked)}
                      label={
                        <span className="cortex-rule-item__content">
                          <span className="cortex-rule-item__main">
                            <strong>{rule.label}</strong>
                            {rule.blocksApproval && <AppBadge size="sm" tone="neutral">Obligatoria</AppBadge>}
                            {rule.bpsDiscount > 0 && (
                              <AppBadge size="sm" tone="success">−{rule.bpsDiscount} pbs</AppBadge>
                            )}
                          </span>
                          <span className="cortex-rule-item__desc">{rule.description}</span>
                        </span>
                      }
                      className="cortex-rule-item__checkbox"
                    />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
