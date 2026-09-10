"use client";

import { useEffect, useMemo, useState } from "react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { AppSelect } from "@/components/ui/atoms/select/app-select";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";
import { depositsLifecycleService } from "../services/deposits-lifecycle.service";
import { DepositAccount, DepositHold, DepositTransaction } from "../types/deposit-lifecycle.types";

import "@/components/ui/templates/workspace-page.css";
import "./deposits-screen.css";

type CustomerLite = { id: string; fullName: string };
type CompanyLite = { id: string; name: string };
type DepositProductLite = { id: string; name: string; code: string; isActive: boolean };
const money = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

export function DepositsScreen() {
  const [accounts, setAccounts] = useState<DepositAccount[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [transactions, setTransactions] = useState<DepositTransaction[]>([]);
  const [holds, setHolds] = useState<DepositHold[]>([]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"ciclo" | "interes" | "transacciones">("ciclo");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [customers, setCustomers] = useState<CustomerLite[]>([]);
  const [companies, setCompanies] = useState<CompanyLite[]>([]);
  const [products, setProducts] = useState<DepositProductLite[]>([]);

  const selected = useMemo(() => accounts.find((a) => a.id === selectedId) ?? null, [accounts, selectedId]);
  const filtered = useMemo(() => {
    if (!query.trim()) return accounts;
    const q = query.toLowerCase();
    return accounts.filter((a) => a.id.toLowerCase().includes(q) || a.holderName.toLowerCase().includes(q) || a.productCode.toLowerCase().includes(q));
  }, [accounts, query]);

  const loadAll = async () => {
    setLoading(true);
    const [accRows, customersRes, companiesRes, productsRes] = await Promise.all([
      depositsLifecycleService.listAccounts(),
      fetch("/api/customers", { cache: "no-store" }),
      fetch("/api/groups", { cache: "no-store" }),
      fetch("/api/product-type-definitions?kind=DEPOSIT", { cache: "no-store" }),
    ]);
    setAccounts(accRows);
    setSelectedId((prev) => prev || accRows[0]?.id || "");
    if (customersRes.ok) {
      const json = (await customersRes.json()) as { data: Array<{ id: string; fullName: string }> };
      setCustomers(json.data ?? []);
    }
    if (companiesRes.ok) {
      const json = (await companiesRes.json()) as { data: Array<{ id: string; name: string }> };
      setCompanies(json.data ?? []);
    }
    if (productsRes.ok) {
      const json = (await productsRes.json()) as { data: Array<{ id: string; name: string; code: string; is_active: boolean }> };
      setProducts((json.data ?? []).map((x) => ({ id: x.id, name: x.name, code: x.code, isActive: x.is_active })).filter((x) => x.isActive));
    }
    setLoading(false);
  };

  const loadDetail = async (accountId: string) => {
    if (!accountId) return;
    const [tx, hs] = await Promise.all([
      depositsLifecycleService.getTransactions(accountId),
      depositsLifecycleService.getHolds(accountId),
    ]);
    setTransactions(tx);
    setHolds(hs);
  };

  useEffect(() => { void loadAll(); }, []);
  useEffect(() => { if (selectedId) void loadDetail(selectedId); }, [selectedId]);

  const runAction = async (action: string, extra: Record<string, unknown> = {}) => {
    if (!selectedId) return;
    await depositsLifecycleService.applyAction(selectedId, { action, ...extra });
    await loadAll();
    await loadDetail(selectedId);
    setMsg(`${actionLabel(action)} aplicada correctamente.`);
  };

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />

      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner zelify-deposits-page__inner">
          <header className="zelify-deposits-page__head">
            <div>
              <h1 className="zelify-workspace-page__title">Depósitos</h1>
            </div>
            <AppButton type="button" tone="primary" onClick={() => setCreateOpen(true)}>
              Nueva cuenta de depósito
            </AppButton>
          </header>
          <div className="zelify-deposits-tabs">
            <button className={tab === "ciclo" ? "is-active" : ""} onClick={() => setTab("ciclo")} type="button">Ciclo de vida</button>
            <button className={tab === "interes" ? "is-active" : ""} onClick={() => setTab("interes")} type="button">Interés y sobregiro</button>
            <button className={tab === "transacciones" ? "is-active" : ""} onClick={() => setTab("transacciones")} type="button">Transacciones</button>
          </div>
          {msg ? <div style={{ marginBottom: 12, color: "#166534", fontWeight: 700 }}>{msg}</div> : null}
          <div className="zelify-deposits-toolbar">
            <AppInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre o código..." />
          </div>
          {loading ? <div>Cargando depósitos...</div> : (
            <SettingsDataTable variant="clients">
              <thead><tr><th>Cuenta</th><th>Titular</th><th>Producto</th><th>Estado</th><th>Balance</th><th>Disponible</th></tr></thead>
              <tbody>{filtered.map((a) => (
                <tr key={a.id} className={selectedId === a.id ? "is-selected" : ""} onClick={() => setSelectedId(a.id)}>
                  <td className="zelify-mono">{a.id}</td>
                  <td>{a.holderName}</td>
                  <td>{a.productName}</td>
                  <td><AppBadge tone={stateTone(a.state)} size="sm">{stateLabel(a.state)}</AppBadge></td>
                  <td>{money(a.balance)}</td>
                  <td>{money(a.availableBalance)}</td>
                </tr>
              ))}</tbody>
            </SettingsDataTable>
          )}
          {selected ? (
            <div style={{ marginTop: 12, border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
              {tab === "ciclo" ? (
                <>
                  <h3>{selected.id} · {selected.holderName}</h3>
                  <p style={{ marginTop: 0 }}>{selected.productName} ({selected.productCode})</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {availableLifecycleActions(selected.state).map((a) => <AppButton key={a} tone="secondary" onClick={() => runAction(a)}>{actionLabel(a)}</AppButton>)}
                    <AppButton tone="neutral" onClick={() => runAction("WRITE_OFF", { amount: Math.abs(selected.balance), reason: "Sobregiro no recuperado" })}>Baja de activos por sobregiro</AppButton>
                  </div>
                </>
              ) : null}
              {tab === "interes" ? (
                <ul>
                  <li>Base de cálculo: {selected.interestBaseMethod}</li>
                  <li>Modo tasa: {selected.rateMode} · {selected.nominalRate}%</li>
                  <li>Retención: {selected.withholdingTaxPct}%</li>
                  <li>Interés sobregiro: {selected.overdraftInterestRate}%</li>
                  <li>Convención de días: {selected.daysConvention}</li>
                  <li>Dormant tras {selected.dormantAfterDays} días: {selected.isDormant ? "Sí" : "No"}</li>
                  <li>Límite sobregiro: {money(selected.overdraftLimit)}</li>
                  <li>Límite retiro por transacción: {money(selected.maxWithdrawalAmount)}</li>
                  <li>Mínimo por transacción: {money(selected.minTxAmount)}</li>
                </ul>
              ) : null}
              {tab === "transacciones" ? (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    <AppButton tone="primary" onClick={() => runAction("DEPOSIT", { amount: 1000, channel: "CAJA" })}>Depósito / ingreso</AppButton>
                    <AppButton tone="primary" onClick={() => runAction("WITHDRAWAL", { amount: 500, channel: "CAJA" })}>Retiro</AppButton>
                    <AppButton tone="primary" onClick={() => runAction("TRANSFER_TO_LOAN", { amount: 750, relatedLoanId: "LN-2026-0001", channel: "INTERNO" })}>Depósito → Préstamo</AppButton>
                    <AppButton tone="primary" onClick={() => runAction("TRANSFER_TO_DEPOSIT", { amount: 600, relatedAccountId: "DEP-2026-0001", channel: "INTERNO" })}>Depósito → Depósito</AppButton>
                    <AppButton tone="secondary" onClick={() => runAction("ADJUSTMENT", { amount: 100, reason: "Ajuste operativo" })}>Ajuste</AppButton>
                    <AppButton tone="secondary" onClick={() => runAction("INTEREST_REVERSAL", { amount: 50, reason: "Reversión interés" })}>Reversión de interés</AppButton>
                    <AppButton tone="neutral" onClick={() => runAction("APPLY_INTEREST")}>Aplicar interés</AppButton>
                    <AppButton tone="neutral" onClick={() => runAction("CARD_HOLD", { amount: 350, merchantName: "Comercio Demo" })}>Card hold</AppButton>
                    <AppButton tone="neutral" onClick={() => runAction("RELEASE_HOLD")}>Liberar hold</AppButton>
                  </div>
                  <SettingsDataTable variant="clients">
                    <thead><tr><th>Fecha</th><th>Tipo</th><th>Monto</th><th>Canal</th><th>Detalle</th></tr></thead>
                    <tbody>{transactions.map((tx) => (
                      <tr key={tx.id}><td>{tx.txDate}</td><td>{txTypeLabel(tx.txType)}</td><td>{money(tx.amount)}</td><td>{tx.channel ?? "N/D"}</td><td>{tx.note ?? tx.auditReason ?? "—"}</td></tr>
                    ))}</tbody>
                  </SettingsDataTable>
                  <h4 style={{ marginTop: 12, marginBottom: 6 }}>Card holds</h4>
                  <ul>{holds.map((h) => <li key={h.id}>{`${h.merchantName}: ${money(h.amount)} · ${h.status === "HELD" ? "Retenido" : "Liberado"}`}</li>)}</ul>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <CreateDepositModal
        open={createOpen}
        customers={customers}
        companies={companies}
        products={products}
        onClose={() => setCreateOpen(false)}
        onCreate={async (payload) => {
          await depositsLifecycleService.createAccount(payload);
          setCreateOpen(false);
          await loadAll();
        }}
      />
    </div>
  );
}

function stateTone(state: DepositAccount["state"]): "success" | "warning" | "error" | "neutral" {
  if (state === "ACTIVE" || state === "APPROVED" || state === "MATURED") return "success";
  if (state === "DORMANT" || state === "BEGIN_MATURITY_PERIOD") return "warning";
  if (state === "WRITTEN_OFF") return "error";
  return "neutral";
}
function stateLabel(state: DepositAccount["state"]): string {
  const map: Record<DepositAccount["state"], string> = {
    PENDING_APPROVAL: "Pendiente de aprobación",
    APPROVED: "Aprobada",
    ACTIVE: "Activa",
    DORMANT: "Dormant",
    BEGIN_MATURITY_PERIOD: "Inicio de madurez",
    MATURED: "Madurada",
    CLOSED: "Cerrada",
    WRITTEN_OFF: "Castigada",
  };
  return map[state];
}
function availableLifecycleActions(state: DepositAccount["state"]): string[] {
  const map: Record<DepositAccount["state"], string[]> = {
    PENDING_APPROVAL: ["APPROVE"],
    APPROVED: ["ACTIVATE"],
    ACTIVE: ["MARK_DORMANT", "BEGIN_MATURITY", "CLOSE"],
    DORMANT: ["REACTIVATE", "CLOSE"],
    BEGIN_MATURITY_PERIOD: ["MATURE"],
    MATURED: ["CLOSE"],
    CLOSED: [],
    WRITTEN_OFF: [],
  };
  return map[state];
}
function actionLabel(action: string): string {
  const map: Record<string, string> = {
    APPROVE: "Aprobar",
    ACTIVATE: "Activar",
    MARK_DORMANT: "Marcar como dormant",
    REACTIVATE: "Reactivar",
    BEGIN_MATURITY: "Iniciar madurez",
    MATURE: "Marcar madurada",
    CLOSE: "Cerrar cuenta",
    WRITE_OFF: "Castigar saldo",
  };
  return map[action] ?? action;
}
function txTypeLabel(type: string): string {
  const map: Record<string, string> = {
    DEPOSIT: "Depósito",
    WITHDRAWAL: "Retiro",
    TRANSFER_TO_LOAN: "Transferencia a préstamo",
    TRANSFER_TO_DEPOSIT: "Transferencia a depósito",
    ADJUSTMENT: "Ajuste",
    REVERSAL: "Reversión",
    INTEREST_APPLIED: "Interés aplicado",
    INTEREST_REVERSAL: "Reversión de interés",
    WRITE_OFF: "Write-off",
  };
  return map[type] ?? type;
}

function CreateDepositModal({
  open, customers, companies, products, onClose, onCreate,
}: {
  open: boolean;
  customers: CustomerLite[];
  companies: CompanyLite[];
  products: DepositProductLite[];
  onClose: () => void;
  onCreate: (payload: {
    id: string;
    productTypeId: string;
    holderKind: "INDIVIDUAL" | "COMPANY";
    holderId: string;
    holderName: string;
    nominalRate: number;
    overdraftLimit: number;
  }) => Promise<void>;
}) {
  const [holderKind, setHolderKind] = useState<"INDIVIDUAL" | "COMPANY">("INDIVIDUAL");
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    id: `DEP-${Date.now()}`,
    productTypeId: "",
    holderId: "",
    holderName: "",
    nominalRate: 4,
    overdraftLimit: 0,
  });
  const parties = useMemo(() => {
    const base = holderKind === "INDIVIDUAL" ? customers.map((x) => ({ id: x.id, name: x.fullName })) : companies.map((x) => ({ id: x.id, name: x.name }));
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter((x) => x.id.toLowerCase().includes(q) || x.name.toLowerCase().includes(q));
  }, [holderKind, customers, companies, query]);
  useEffect(() => {
    if (!open) return;
    setForm((p) => ({ ...p, productTypeId: products[0]?.id ?? "", holderId: "", holderName: "" }));
    setQuery("");
  }, [open, products]);
  if (!open) return null;
  return (
    <div className="zelify-deposits-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="zelify-deposits-modal" role="dialog" aria-modal="true">
        <header className="zelify-deposits-modal__head">
          <p>Depósitos</p>
          <h3>Nueva cuenta de depósito</h3>
          <span>Selecciona producto de depósito y titular real (cliente o empresa).</span>
        </header>
        <div className="zelify-deposits-modal-grid">
          <AppInput value={form.id} onChange={(e) => setForm((p) => ({ ...p, id: e.target.value }))} placeholder="ID cuenta depósito" />
          <AppSelect value={form.productTypeId} onChange={(e) => setForm((p) => ({ ...p, productTypeId: e.target.value }))}>
            {products.map((p) => <option key={p.id} value={p.id}>{`${p.name} (${p.code})`}</option>)}
          </AppSelect>
          <AppSelect value={holderKind} onChange={(e) => setHolderKind(e.target.value as "INDIVIDUAL" | "COMPANY")}>
            <option value="INDIVIDUAL">Cliente individual</option>
            <option value="COMPANY">Empresa</option>
          </AppSelect>
          <AppInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder={holderKind === "INDIVIDUAL" ? "Buscar cliente..." : "Buscar empresa..."} />
          <AppSelect
            value={form.holderId}
            onChange={(e) => {
              const party = parties.find((x) => x.id === e.target.value);
              setForm((p) => ({ ...p, holderId: e.target.value, holderName: party?.name ?? "" }));
            }}
          >
            <option value="">Selecciona titular</option>
            {parties.map((p) => <option key={p.id} value={p.id}>{`${p.name} (${p.id})`}</option>)}
          </AppSelect>
          <AppInput value={form.holderName} disabled placeholder="Titular seleccionado" />
          <AppInput type="number" value={String(form.nominalRate)} onChange={(e) => setForm((p) => ({ ...p, nominalRate: Number(e.target.value || 0) }))} placeholder="Tasa nominal %" />
          <AppInput type="number" value={String(form.overdraftLimit)} onChange={(e) => setForm((p) => ({ ...p, overdraftLimit: Number(e.target.value || 0) }))} placeholder="Límite sobregiro" />
        </div>
        <div className="zelify-deposits-modal-actions">
          <AppButton tone="secondary" onClick={onClose}>Cancelar</AppButton>
          <AppButton
            tone="primary"
            onClick={() => void onCreate({
              id: form.id,
              productTypeId: form.productTypeId,
              holderKind,
              holderId: form.holderId,
              holderName: form.holderName,
              nominalRate: form.nominalRate,
              overdraftLimit: form.overdraftLimit,
            })}
            disabled={!form.productTypeId || !form.holderId || !form.holderName}
          >
            Crear cuenta
          </AppButton>
        </div>
      </div>
    </div>
  );
}
