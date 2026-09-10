"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { jsPDF } from "jspdf";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";

import "@/components/ui/templates/workspace-page.css";
import "./reports-screen.css";

type Loan = { id: string; lifecycleState: string; principalAmount: number };
type Deposit = { id: string; state: string; balance: number };
type Activity = { id: string; module: string; action: string };
type Customer = { id: string; state: string };
type Company = { id: string; state: string; membersCount: number };
type ProductDef = { id: string; kind: "LOAN" | "DEPOSIT"; is_active: boolean };
type PromptReport = {
  titulo: string;
  descripcion: string;
  incluirRiesgo: boolean;
  incluirOperaciones: boolean;
};

export function ReportsScreen() {
  const [prompt, setPrompt] = useState(
    "Genera reporte ejecutivo de abril 2026 con foco en cartera activa, depósitos y riesgos por mora, incluyendo recomendaciones"
  );
  const [report, setReport] = useState<PromptReport | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loanProducts, setLoanProducts] = useState<ProductDef[]>([]);
  const [depositProducts, setDepositProducts] = useState<ProductDef[]>([]);
  const [loading, setLoading] = useState(false);

  const summary = useMemo(() => {
    const totalPrestamos = loans.length;
    const carteraActiva = loans.filter((l) => l.lifecycleState === "ACTIVE" || l.lifecycleState === "ACTIVE_IN_ARREARS").reduce((a, b) => a + Number(b.principalAmount), 0);
    const prestamosEnMora = loans.filter((l) => l.lifecycleState === "ACTIVE_IN_ARREARS").length;
    const totalDepositos = deposits.reduce((a, b) => a + Number(b.balance), 0);
    const depositosDormant = deposits.filter((d) => d.state === "DORMANT").length;
    const totalClientes = customers.length;
    const clientesActivos = customers.filter((c) => c.state === "ACTIVE").length;
    const totalEmpresas = companies.length;
    const totalMiembrosEmpresa = companies.reduce((acc, c) => acc + Number(c.membersCount || 0), 0);
    return {
      totalPrestamos,
      carteraActiva,
      prestamosEnMora,
      totalDepositos,
      depositosDormant,
      totalClientes,
      clientesActivos,
      totalEmpresas,
      totalMiembrosEmpresa,
    };
  }, [loans, deposits, customers, companies]);

  const chartData = useMemo(
    () => [
      { categoria: "Cartera activa", valor: Number(summary.carteraActiva.toFixed(2)) },
      { categoria: "Depósitos", valor: Number(summary.totalDepositos.toFixed(2)) },
      { categoria: "Préstamos en mora", valor: summary.prestamosEnMora },
      { categoria: "Depósitos dormant", valor: summary.depositosDormant },
    ],
    [summary]
  );
  const customerEntityData = useMemo(
    () => [
      { categoria: "Clientes", valor: summary.totalClientes },
      { categoria: "Clientes activos", valor: summary.clientesActivos },
      { categoria: "Empresas", valor: summary.totalEmpresas },
      { categoria: "Miembros empresa", valor: summary.totalMiembrosEmpresa },
    ],
    [summary]
  );
  const loanStateData = useMemo(() => {
    const count: Record<string, number> = {};
    for (const l of loans) count[l.lifecycleState] = (count[l.lifecycleState] ?? 0) + 1;
    return Object.entries(count).map(([estado, cantidad]) => ({ estado, cantidad }));
  }, [loans]);
  const depositStateData = useMemo(() => {
    const count: Record<string, number> = {};
    for (const d of deposits) count[d.state] = (count[d.state] ?? 0) + 1;
    return Object.entries(count).map(([estado, cantidad]) => ({ estado, cantidad }));
  }, [deposits]);
  const productTypeData = useMemo(
    () => [
      { name: "Préstamo activo", value: loanProducts.filter((p) => p.is_active).length },
      { name: "Préstamo inactivo", value: loanProducts.filter((p) => !p.is_active).length },
      { name: "Depósito activo", value: depositProducts.filter((p) => p.is_active).length },
      { name: "Depósito inactivo", value: depositProducts.filter((p) => !p.is_active).length },
    ],
    [loanProducts, depositProducts]
  );
  const trendData = useMemo(() => {
    const base = [
      { mes: "Sem 1", prestamos: 0, depositos: 0, eventos: 0 },
      { mes: "Sem 2", prestamos: 0, depositos: 0, eventos: 0 },
      { mes: "Sem 3", prestamos: 0, depositos: 0, eventos: 0 },
      { mes: "Sem 4", prestamos: 0, depositos: 0, eventos: 0 },
    ];
    loans.forEach((_, i) => { base[i % 4].prestamos += 1; });
    deposits.forEach((_, i) => { base[i % 4].depositos += 1; });
    activities.forEach((_, i) => { base[i % 4].eventos += 1; });
    return base;
  }, [loans, deposits, activities]);

  const moduleData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of activities) counts[a.module] = (counts[a.module] ?? 0) + 1;
    return Object.entries(counts).map(([modulo, eventos]) => ({ modulo, eventos }));
  }, [activities]);

  const parsePrompt = (value: string): PromptReport => {
    const text = value.toLowerCase();
    return {
      titulo: "Reporte Ejecutivo Automatizado",
      descripcion: value,
      incluirRiesgo: text.includes("riesgo") || text.includes("mora"),
      incluirOperaciones: text.includes("operacion") || text.includes("actividad"),
    };
  };

  const generar = async () => {
    setLoading(true);
    const [loansRes, depositsRes, activitiesRes, customersRes, groupsRes, loanProductsRes, depositProductsRes] = await Promise.all([
      fetch("/api/loans", { cache: "no-store" }),
      fetch("/api/deposits", { cache: "no-store" }),
      fetch("/api/activities?page=1&pageSize=200&module=all&branch=all", { cache: "no-store" }),
      fetch("/api/customers", { cache: "no-store" }),
      fetch("/api/groups", { cache: "no-store" }),
      fetch("/api/product-type-definitions?kind=LOAN", { cache: "no-store" }),
      fetch("/api/product-type-definitions?kind=DEPOSIT", { cache: "no-store" }),
    ]);
    if (loansRes.ok) {
      const j = (await loansRes.json()) as { data: Loan[] };
      setLoans(j.data ?? []);
    }
    if (depositsRes.ok) {
      const j = (await depositsRes.json()) as { data: Deposit[] };
      setDeposits(j.data ?? []);
    }
    if (activitiesRes.ok) {
      const j = (await activitiesRes.json()) as { data: Activity[] };
      setActivities(j.data ?? []);
    }
    if (customersRes.ok) {
      const j = (await customersRes.json()) as { data: Customer[] };
      setCustomers(j.data ?? []);
    }
    if (groupsRes.ok) {
      const j = (await groupsRes.json()) as { data: Company[] };
      setCompanies(j.data ?? []);
    }
    if (loanProductsRes.ok) {
      const j = (await loanProductsRes.json()) as { data: ProductDef[] };
      setLoanProducts(j.data ?? []);
    }
    if (depositProductsRes.ok) {
      const j = (await depositProductsRes.json()) as { data: ProductDef[] };
      setDepositProducts(j.data ?? []);
    }
    setReport(parsePrompt(prompt));
    setLoading(false);
  };

  useEffect(() => {
    void generar();
  }, []);

  const exportarPdf = () => {
    if (!report) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(16);
    doc.text(report.titulo, 40, 50);
    doc.setFontSize(10);
    doc.text(`Prompt: ${report.descripcion}`, 40, 72, { maxWidth: 520 });
    doc.text(`Fecha: ${new Date().toLocaleString("es-MX")}`, 40, 96);

    doc.setFontSize(12);
    doc.text("Resumen", 40, 130);
    doc.setFontSize(10);
    doc.text(`- Préstamos totales: ${summary.totalPrestamos}`, 48, 150);
    doc.text(`- Cartera activa: ${summary.carteraActiva.toLocaleString("es-MX")}`, 48, 166);
    doc.text(`- Préstamos en mora: ${summary.prestamosEnMora}`, 48, 182);
    doc.text(`- Saldo total de depósitos: ${summary.totalDepositos.toLocaleString("es-MX")}`, 48, 198);
    doc.text(`- Cuentas dormant: ${summary.depositosDormant}`, 48, 214);
    doc.text(`- Clientes: ${summary.totalClientes} (activos ${summary.clientesActivos})`, 48, 230);
    doc.text(`- Empresas: ${summary.totalEmpresas} (miembros ${summary.totalMiembrosEmpresa})`, 48, 246);

    doc.setFontSize(12);
    doc.text("Gráfico 1: Magnitudes clave", 40, 276);
    const baseX = 60;
    const baseY = 390;
    const barW = 70;
    const maxVal = Math.max(...chartData.map((x) => x.valor), 1);
    chartData.forEach((d, i) => {
      const h = (d.valor / maxVal) * 90;
      const x = baseX + i * 110;
      const y = baseY - h;
      doc.setFillColor(29, 78, 216);
      doc.rect(x, y, barW, h, "F");
      doc.setTextColor(15, 23, 42);
      doc.text(d.categoria, x, baseY + 14, { maxWidth: barW });
      doc.text(String(Math.round(d.valor)), x, y - 6);
    });

    doc.setFontSize(12);
    doc.text("Gráfico 2: Actividad por módulo", 40, 440);
    let y = 460;
    moduleData.forEach((m) => {
      doc.setFontSize(10);
      doc.text(`${m.modulo}: ${m.eventos} eventos`, 48, y);
      y += 16;
    });

    if (report.incluirRiesgo) {
      doc.setFontSize(12);
      doc.text("Bloque de riesgo", 40, y + 18);
      doc.setFontSize(10);
      doc.text(`Se detectan ${summary.prestamosEnMora} préstamos en mora sobre ${summary.totalPrestamos} préstamos totales.`, 48, y + 36);
    }

    if (report.incluirOperaciones) {
      doc.setFontSize(12);
      doc.text("Bloque operativo", 40, y + 64);
      doc.setFontSize(10);
      doc.text(`Se registraron ${activities.length} eventos recientes en la plataforma.`, 48, y + 82);
    }

    doc.save(`reporte-automatizado-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />

      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner zelify-reports-page__inner">
          <h1 className="zelify-workspace-page__title">Reportes</h1>
          <div className="zelify-report-card zelify-report-prompt-card">
            <span>Reporte basado en prompt</span>
            <AppInput value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe qué reporte necesitas..." />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <AppButton tone="primary" onClick={() => void generar()}>{loading ? "Generando..." : "Generar reporte"}</AppButton>
              <AppButton tone="secondary" onClick={exportarPdf} disabled={!report}>Exportar PDF automático</AppButton>
            </div>
            <p className="zelify-report-pdf-preview__meta">
              Ejemplo de prompt: "Genera reporte ejecutivo de abril 2026 con foco en cartera activa, depósitos y riesgos por mora, incluyendo recomendaciones"
            </p>
          </div>

          {report ? (
            <>
              <div className="zelify-report-kpi-grid">
                <article className="zelify-report-card"><span>Préstamos</span><strong>{summary.totalPrestamos}</strong></article>
                <article className="zelify-report-card"><span>Cartera activa</span><strong>{summary.carteraActiva.toLocaleString("es-MX")}</strong></article>
                <article className="zelify-report-card"><span>Saldo depósitos</span><strong>{summary.totalDepositos.toLocaleString("es-MX")}</strong></article>
                <article className="zelify-report-card"><span>Clientes</span><strong>{summary.totalClientes}</strong></article>
                <article className="zelify-report-card"><span>Empresas</span><strong>{summary.totalEmpresas}</strong></article>
                <article className="zelify-report-card"><span>Eventos</span><strong>{activities.length}</strong></article>
              </div>
              <div className="zelify-report-charts">
                <article className="zelify-report-card">
                  <h3>Métricas clave reales</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="categoria" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="valor" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </article>
                <article className="zelify-report-card">
                  <h3>Eventos por módulo</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={moduleData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="modulo" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="eventos" fill="#0f766e" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </article>
              </div>
              <div className="zelify-report-charts">
                <article className="zelify-report-card">
                  <h3>Clientes y empresas</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={customerEntityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="categoria" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="valor" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </article>
                <article className="zelify-report-card">
                  <h3>Estado de préstamos</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={loanStateData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="estado" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#dc2626" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </article>
              </div>
              <div className="zelify-report-charts">
                <article className="zelify-report-card">
                  <h3>Estado de depósitos</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={depositStateData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="estado" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#0891b2" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </article>
                <article className="zelify-report-card">
                  <h3>Tipos de producto de cuentas</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={productTypeData} dataKey="value" nameKey="name" outerRadius={96} fill="#2563eb" />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </article>
              </div>
              <article className="zelify-report-card">
                <h3>Tendencia operativa (muestra interna)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="prestamos" stroke="#2563eb" strokeWidth={2} />
                    <Line type="monotone" dataKey="depositos" stroke="#0f766e" strokeWidth={2} />
                    <Line type="monotone" dataKey="eventos" stroke="#7c3aed" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </article>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

