"use client";

import React, { useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";

import { useI18n } from "@/providers/i18n-provider";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { LoanTransaction } from "../types/loan-transaction.types";
import { loanTransactionsService } from "../services/loan-transactions.service";
import { LoanTransactionsTable } from "../components/loan-transactions-table";
import { LoanTransactionsFilters } from "../components/loan-transactions-filters";

import "@/components/ui/templates/workspace-page.css";
import "./loan-transactions-screen.css";

export const LoanTransactionsScreen: React.FC = () => {
  const { t } = useI18n();
  const [transactions, setTransactions] = useState<LoanTransaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<LoanTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    async function loadData() {
      try {
        const data = await loanTransactionsService.getTransactions();
        setAllTransactions(data);
        setTransactions(data);
      } catch (error) {
        console.error("Failed to load loan transactions:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="zelify-workspace-page zelify-loan-transactions-page">
      <ZelifyTopNavbar activeNavId="loanTransactions" />

      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner">
          <header className="zelify-workspace-page__header">
            <div className="zelify-workspace-page__title-stack">
              <h1 className="zelify-workspace-page__title">
                {t("nav.top.loanTransactions")}
              </h1>
              <p className="zelify-workspace-page__subtitle">
                {t("loans.transactions.subtitle")}
              </p>
              <p className="zelify-workspace-page__subtitle">
                Operaciones vinculadas a productos de préstamo con trazabilidad para auditoría.
              </p>
            </div>
            <div className="zelify-workspace-page__actions zelify-loan-transactions__actions">
              <AppButton
                type="button"
                tone="secondary"
                className="zelify-loan-transactions__action-btn"
              >
                <Download size={18} />
                <span>{t("loans.common.export")}</span>
              </AppButton>
              <AppButton
                type="button"
                tone="secondary"
                className="zelify-loan-transactions__action-btn"
                aria-label={t("loans.common.reload")}
                onClick={() => {
                  setLoading(true);
                  loanTransactionsService.getTransactions().then((data) => {
                    setAllTransactions(data);
                    setTransactions(data);
                    setLoading(false);
                  });
                }}
              >
                <RefreshCw size={18} className={loading ? "zelify-loan-transactions-spin" : ""} />
                <span>{t("loans.common.reload")}</span>
              </AppButton>
            </div>
          </header>

          <section className="zelify-workspace-page__filters">
            <LoanTransactionsFilters
              query={query}
              onQueryChange={(value) => {
                setQuery(value);
              }}
              productId={selectedProductId}
              onProductIdChange={setSelectedProductId}
              status={selectedStatus}
              onStatusChange={setSelectedStatus}
              productOptions={Array.from(
                new Map(allTransactions.map((tx) => [tx.productId, { id: tx.productId, name: tx.productName }])).values()
              )}
            />
          </section>

          <main className="zelify-workspace-page__content">
            {loading ? (
              <div className="zelify-loading-state">
                <p>{t("loans.transactions.loading")}</p>
              </div>
            ) : (
              <LoanTransactionsTable
                transactions={transactions.filter((tx) => {
                  if (selectedProductId !== "all" && tx.productId !== selectedProductId) return false;
                  if (selectedStatus !== "all" && tx.status !== selectedStatus) return false;
                  if (!query.trim()) return true;
                  const q = query.toLowerCase();
                  return (
                    tx.id.toLowerCase().includes(q) ||
                    tx.accountId.toLowerCase().includes(q) ||
                    tx.accountHolder.toLowerCase().includes(q) ||
                    tx.productName.toLowerCase().includes(q) ||
                    tx.productId.toLowerCase().includes(q)
                  );
                })}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
