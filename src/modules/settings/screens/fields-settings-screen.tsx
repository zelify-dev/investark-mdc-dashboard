"use client";

import { useMemo, useState } from "react";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { AppCheckbox } from "@/components/ui/atoms/checkbox/app-checkbox";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";

import "./settings-workspace-shared.css";
import "./fields-settings-screen.css";

type FieldType = "STRING" | "NUMBER" | "SELECT" | "PERCENTAGE" | "BOOLEAN";
type FieldModule = "Clients" | "Groups" | "Loans" | "Deposits";

type FieldRow = {
  id: string;
  label: string;
  technicalId: string;
  type: FieldType;
  required: boolean;
  active: boolean;
  source: string;
  motorUsage: string;
};

const TABS: FieldModule[] = ["Clients", "Groups", "Loans", "Deposits"];

const INITIAL_FIELDS: Record<FieldModule, FieldRow[]> = {
  Clients: [
    {
      id: "cli_1",
      label: "Score buro",
      technicalId: "applicant.creditScore",
      type: "NUMBER",
      required: true,
      active: true,
      source: "Buro / originacion",
      motorUsage: "Define riesgo base y elegibilidad automatica.",
    },
    {
      id: "cli_2",
      label: "Ingreso neto mensual",
      technicalId: "applicant.monthlyNetIncome",
      type: "NUMBER",
      required: true,
      active: true,
      source: "Comprobante de ingresos",
      motorUsage: "Se usa para capacidad de pago y DTI.",
    },
    {
      id: "cli_3",
      label: "Relacion deuda / ingreso (DTI)",
      technicalId: "ratios.dti",
      type: "PERCENTAGE",
      required: true,
      active: true,
      source: "Motor de ratios",
      motorUsage: "Aprueba, manda a revision o rechaza por bandas.",
    },
    {
      id: "cli_4",
      label: "Antiguedad laboral",
      technicalId: "employment.months",
      type: "NUMBER",
      required: true,
      active: true,
      source: "Solicitud / validacion laboral",
      motorUsage: "Mide estabilidad del solicitante.",
    },
    {
      id: "cli_5",
      label: "Dias maximos de atraso",
      technicalId: "bureau.maxDaysPastDue",
      type: "NUMBER",
      required: true,
      active: true,
      source: "Buro de credito",
      motorUsage: "Bloquea perfiles con deterioro reciente.",
    },
    {
      id: "cli_6",
      label: "RFC validado",
      technicalId: "kyc.rfcValidated",
      type: "BOOLEAN",
      required: true,
      active: true,
      source: "KYC / SAT",
      motorUsage: "Valida consistencia documental.",
    },
    {
      id: "cli_7",
      label: "CURP validado",
      technicalId: "kyc.curpValidated",
      type: "BOOLEAN",
      required: true,
      active: true,
      source: "KYC",
      motorUsage: "Confirma identidad del cliente.",
    },
    {
      id: "cli_8",
      label: "Producto solicitado",
      technicalId: "application.productType",
      type: "SELECT",
      required: true,
      active: true,
      source: "Solicitud",
      motorUsage: "Activa reglas y pricing segun producto.",
    },
  ],
  Groups: [
    {
      id: "grp_1",
      label: "Segmento empresarial",
      technicalId: "group.segment",
      type: "SELECT",
      required: true,
      active: true,
      source: "Alta comercial",
      motorUsage: "Determina reglas para PYME, corporativo o grupo.",
    },
    {
      id: "grp_2",
      label: "Indice sectorial NAICS",
      technicalId: "group.naicsRiskIndex",
      type: "NUMBER",
      required: true,
      active: true,
      source: "Riesgo sectorial",
      motorUsage: "Dispara rechazos o revision por sector.",
    },
    {
      id: "grp_3",
      label: "Concentracion por cliente principal",
      technicalId: "group.topClientConcentration",
      type: "PERCENTAGE",
      required: true,
      active: true,
      source: "Analisis financiero",
      motorUsage: "Mide dependencia comercial del grupo.",
    },
    {
      id: "grp_4",
      label: "Antiguedad de la empresa",
      technicalId: "group.operatingMonths",
      type: "NUMBER",
      required: true,
      active: true,
      source: "KYB / acta constitutiva",
      motorUsage: "Revisa madurez operativa.",
    },
    {
      id: "grp_5",
      label: "Opinion SAT 32-D",
      technicalId: "group.taxCompliance32D",
      type: "NUMBER",
      required: true,
      active: true,
      source: "SAT",
      motorUsage: "1 aprueba, 0 revision, -1 rechazo.",
    },
    {
      id: "grp_6",
      label: "Alertas AML / PLD",
      technicalId: "group.amlAlerts",
      type: "NUMBER",
      required: true,
      active: true,
      source: "Compliance",
      motorUsage: "Define bloqueo o escalamiento.",
    },
    {
      id: "grp_7",
      label: "Beneficiarios reales identificados",
      technicalId: "group.uboCoverage",
      type: "PERCENTAGE",
      required: true,
      active: true,
      source: "KYB",
      motorUsage: "Mide completitud societaria.",
    },
    {
      id: "grp_8",
      label: "Score socios / aval",
      technicalId: "group.shareholderScore",
      type: "NUMBER",
      required: false,
      active: true,
      source: "Buro personas relacionadas",
      motorUsage: "Complementa apetito de riesgo empresarial.",
    },
  ],
  Loans: [
    {
      id: "loan_1",
      label: "Monto solicitado",
      technicalId: "application.requestedAmount",
      type: "NUMBER",
      required: true,
      active: true,
      source: "Solicitud",
      motorUsage: "Entra a limites por producto y segmento.",
    },
    {
      id: "loan_2",
      label: "Monto aprobado",
      technicalId: "application.approvedAmount",
      type: "NUMBER",
      required: false,
      active: true,
      source: "Comite / motor de decision",
      motorUsage: "Define la oferta economica final.",
    },
    {
      id: "loan_3",
      label: "Plazo solicitado",
      technicalId: "application.requestedTermMonths",
      type: "NUMBER",
      required: true,
      active: true,
      source: "Solicitud",
      motorUsage: "Valida rango permitido y amortizacion.",
    },
    {
      id: "loan_4",
      label: "Plazo aprobado",
      technicalId: "application.approvedTermMonths",
      type: "NUMBER",
      required: false,
      active: true,
      source: "Comite / motor de decision",
      motorUsage: "Aterriza las condiciones finales del credito.",
    },
    {
      id: "loan_5",
      label: "Producto de credito",
      technicalId: "application.productType",
      type: "SELECT",
      required: true,
      active: true,
      source: "Catalogo de productos",
      motorUsage: "Activa reglas y pricing segun linea de credito.",
    },
    {
      id: "loan_6",
      label: "Segmento del cliente",
      technicalId: "application.customerSegment",
      type: "SELECT",
      required: true,
      active: true,
      source: "Comercial / onboarding",
      motorUsage: "Define limites, tasa y ruta de aprobacion.",
    },
    {
      id: "loan_7",
      label: "Score interno",
      technicalId: "risk.internalScore",
      type: "NUMBER",
      required: true,
      active: true,
      source: "Motor de riesgo",
      motorUsage: "Determina semaforo base de aprobacion.",
    },
    {
      id: "loan_8",
      label: "Score buro",
      technicalId: "risk.bureauScore",
      type: "NUMBER",
      required: true,
      active: true,
      source: "Buro de credito",
      motorUsage: "Complementa la evaluacion de riesgo externo.",
    },
    {
      id: "loan_9",
      label: "Nivel de riesgo",
      technicalId: "risk.level",
      type: "SELECT",
      required: true,
      active: true,
      source: "Motor de scoring",
      motorUsage: "Clasifica bajo, medio o alto para decision.",
    },
    {
      id: "loan_10",
      label: "Ingreso mensual validado",
      technicalId: "income.validatedMonthlyIncome",
      type: "NUMBER",
      required: true,
      active: true,
      source: "SAT / comprobantes",
      motorUsage: "Base para capacidad de pago y ratios.",
    },
    {
      id: "loan_11",
      label: "Gasto mensual estimado",
      technicalId: "income.estimatedMonthlyExpenses",
      type: "NUMBER",
      required: false,
      active: true,
      source: "Analitica",
      motorUsage: "Ajusta el flujo libre proyectado.",
    },
    {
      id: "loan_12",
      label: "Relacion deuda / ingreso (DTI)",
      technicalId: "ratios.dti",
      type: "PERCENTAGE",
      required: true,
      active: true,
      source: "Motor de ratios",
      motorUsage: "Aprueba, revisa o rechaza por bandas.",
    },
    {
      id: "loan_13",
      label: "Relacion cuota / ingreso (PTI)",
      technicalId: "ratios.pti",
      type: "PERCENTAGE",
      required: true,
      active: true,
      source: "Motor de capacidad de pago",
      motorUsage: "Mide la presion de la cuota sobre el ingreso.",
    },
    {
      id: "loan_14",
      label: "LTV",
      technicalId: "ratios.ltv",
      type: "PERCENTAGE",
      required: false,
      active: true,
      source: "Garantias / valuacion",
      motorUsage: "Controla aforo para creditos con colateral.",
    },
    {
      id: "loan_15",
      label: "Dias maximos de atraso",
      technicalId: "risk.maxDaysPastDue",
      type: "NUMBER",
      required: true,
      active: true,
      source: "Buro de credito",
      motorUsage: "Bloquea deterioro reciente del historial.",
    },
    {
      id: "loan_16",
      label: "Consultas duras recientes",
      technicalId: "risk.hardInquiries90d",
      type: "NUMBER",
      required: false,
      active: true,
      source: "Buro de credito",
      motorUsage: "Mide intensidad reciente de busqueda de credito.",
    },
    {
      id: "loan_17",
      label: "Antiguedad del historial",
      technicalId: "risk.creditHistoryMonths",
      type: "NUMBER",
      required: false,
      active: true,
      source: "Buro de credito",
      motorUsage: "Mide profundidad y madurez del historial.",
    },
    {
      id: "loan_18",
      label: "Tasa base",
      technicalId: "pricing.baseRate",
      type: "PERCENTAGE",
      required: true,
      active: true,
      source: "Pricing",
      motorUsage: "Punto de partida para descuentos y oferta.",
    },
    {
      id: "loan_19",
      label: "Tasa piso",
      technicalId: "pricing.floorRate",
      type: "PERCENTAGE",
      required: true,
      active: true,
      source: "Politica comercial",
      motorUsage: "Evita descuentos por debajo de la tasa minima.",
    },
    {
      id: "loan_20",
      label: "Banda de tasa",
      technicalId: "pricing.rateBand",
      type: "SELECT",
      required: false,
      active: true,
      source: "Motor de pricing",
      motorUsage: "Ubica la cotizacion en la banda permitida.",
    },
    {
      id: "loan_21",
      label: "Tasa final",
      technicalId: "pricing.finalRate",
      type: "PERCENTAGE",
      required: true,
      active: true,
      source: "Pricing",
      motorUsage: "Resultado final despues de reglas y cross-sell.",
    },
    {
      id: "loan_22",
      label: "Descuento total por cross-sell",
      technicalId: "pricing.crossSellDiscountBps",
      type: "NUMBER",
      required: false,
      active: true,
      source: "Motor comercial",
      motorUsage: "Acumula pbs por productos vinculados.",
    },
    {
      id: "loan_23",
      label: "Productos de cross-sell activados",
      technicalId: "pricing.crossSellProducts",
      type: "STRING",
      required: false,
      active: true,
      source: "Relacion comercial",
      motorUsage: "Explica que productos redujeron la tasa.",
    },
    {
      id: "loan_24",
      label: "CAT estimado",
      technicalId: "pricing.estimatedCat",
      type: "PERCENTAGE",
      required: false,
      active: true,
      source: "Motor de credito",
      motorUsage: "Explica costo integral del credito.",
    },
    {
      id: "loan_25",
      label: "Comision de apertura",
      technicalId: "pricing.openingFee",
      type: "PERCENTAGE",
      required: false,
      active: true,
      source: "Producto",
      motorUsage: "Completa oferta economica.",
    },
    {
      id: "loan_26",
      label: "Pago mensual estimado",
      technicalId: "pricing.estimatedMonthlyPayment",
      type: "NUMBER",
      required: false,
      active: true,
      source: "Motor de amortizacion",
      motorUsage: "Proyecta el esfuerzo mensual del cliente.",
    },
    {
      id: "loan_27",
      label: "Seguro incluido",
      technicalId: "pricing.insuranceIncluded",
      type: "BOOLEAN",
      required: false,
      active: true,
      source: "Producto / cross-sell",
      motorUsage: "Ajusta costo y condiciones del credito.",
    },
    {
      id: "loan_28",
      label: "Destino del credito",
      technicalId: "application.loanPurpose",
      type: "SELECT",
      required: true,
      active: true,
      source: "Solicitud comercial",
      motorUsage: "Activa politicas segun uso del financiamiento.",
    },
    {
      id: "loan_29",
      label: "Tipo de garantia",
      technicalId: "collateral.type",
      type: "SELECT",
      required: false,
      active: true,
      source: "Garantias",
      motorUsage: "Determina aforo y formalizacion.",
    },
    {
      id: "loan_30",
      label: "Valor de garantia",
      technicalId: "collateral.appraisedValue",
      type: "NUMBER",
      required: false,
      active: true,
      source: "Valuacion",
      motorUsage: "Se usa para suficiencia de colateral.",
    },
    {
      id: "loan_31",
      label: "Cobertura de garantia",
      technicalId: "collateral.coverageRatio",
      type: "PERCENTAGE",
      required: false,
      active: true,
      source: "Valuacion / formalizacion",
      motorUsage: "Confirma cobertura minima del credito.",
    },
    {
      id: "loan_32",
      label: "Decision final",
      technicalId: "decision.status",
      type: "SELECT",
      required: true,
      active: true,
      source: "Motor de decision",
      motorUsage: "Aprobado, rechazo, revision u override.",
    },
    {
      id: "loan_33",
      label: "Motivo de decision",
      technicalId: "decision.reason",
      type: "STRING",
      required: false,
      active: true,
      source: "Motor de decision",
      motorUsage: "Explica el resultado de negocio.",
    },
    {
      id: "loan_34",
      label: "Severidad de decision",
      technicalId: "decision.severity",
      type: "SELECT",
      required: false,
      active: true,
      source: "Politica de credito",
      motorUsage: "Marca aprobacion, revision o rechazo.",
    },
    {
      id: "loan_35",
      label: "Reglas disparadas",
      technicalId: "decision.triggeredRules",
      type: "STRING",
      required: false,
      active: true,
      source: "Audit trail",
      motorUsage: "Explica por que se tomo la decision.",
    },
    {
      id: "loan_36",
      label: "Cantidad de reglas disparadas",
      technicalId: "decision.triggeredRuleCount",
      type: "NUMBER",
      required: false,
      active: true,
      source: "Motor de reglas",
      motorUsage: "Resume la carga de hallazgos del expediente.",
    },
    {
      id: "loan_37",
      label: "Override aplicado",
      technicalId: "decision.overrideApplied",
      type: "BOOLEAN",
      required: false,
      active: true,
      source: "Analista / comite",
      motorUsage: "Marca intervencion manual en la originacion.",
    },
    {
      id: "loan_38",
      label: "Usuario que aplico override",
      technicalId: "decision.overrideUser",
      type: "STRING",
      required: false,
      active: true,
      source: "Auditoria",
      motorUsage: "Identifica quien cambio la decision.",
    },
    {
      id: "loan_39",
      label: "Justificacion de override",
      technicalId: "decision.overrideReason",
      type: "STRING",
      required: false,
      active: true,
      source: "Auditoria",
      motorUsage: "Deja soporte de la excepcion aprobada.",
    },
    {
      id: "loan_40",
      label: "Canal de originacion",
      technicalId: "audit.channel",
      type: "SELECT",
      required: false,
      active: true,
      source: "Captura",
      motorUsage: "Distingue sucursal, digital, call center o aliado.",
    },
    {
      id: "loan_41",
      label: "Correlacion de auditoria",
      technicalId: "audit.correlationId",
      type: "STRING",
      required: false,
      active: true,
      source: "Trazabilidad",
      motorUsage: "Relaciona eventos del expediente y del motor.",
    },
    {
      id: "loan_42",
      label: "Fecha de decision",
      technicalId: "audit.decisionTimestamp",
      type: "STRING",
      required: false,
      active: true,
      source: "Trazabilidad",
      motorUsage: "Permite auditoria temporal del credito.",
    },
  ],
  Deposits: [
    {
      id: "dep_1",
      label: "Saldo promedio mensual",
      technicalId: "deposit.avgMonthlyBalance",
      type: "NUMBER",
      required: true,
      active: true,
      source: "Tesoreria",
      motorUsage: "Determina tier y pricing aplicado.",
    },
    {
      id: "dep_2",
      label: "Saldo actual",
      technicalId: "deposit.currentBalance",
      type: "NUMBER",
      required: true,
      active: true,
      source: "Core de depositos",
      motorUsage: "Calcula liquidez y bucket de vencimiento.",
    },
    {
      id: "dep_3",
      label: "Tipo de deposito",
      technicalId: "deposit.type",
      type: "SELECT",
      required: true,
      active: true,
      source: "Producto",
      motorUsage: "Distingue vista vs plazo.",
    },
    {
      id: "dep_4",
      label: "Tier asignado",
      technicalId: "deposit.tier",
      type: "SELECT",
      required: true,
      active: true,
      source: "Motor de pricing",
      motorUsage: "Ubica al cliente en banda comercial.",
    },
    {
      id: "dep_5",
      label: "Factor TIIE",
      technicalId: "deposit.tiieFactor",
      type: "PERCENTAGE",
      required: true,
      active: true,
      source: "Pricing depositos",
      motorUsage: "Multiplica la TIIE vigente para tasa final.",
    },
    {
      id: "dep_6",
      label: "Tasa aplicada",
      technicalId: "deposit.appliedRate",
      type: "PERCENTAGE",
      required: true,
      active: true,
      source: "Pricing depositos",
      motorUsage: "Tasa final ofrecida al cliente.",
    },
    {
      id: "dep_7",
      label: "Fecha de calculo",
      technicalId: "deposit.calculationDate",
      type: "STRING",
      required: true,
      active: true,
      source: "Motor de pricing",
      motorUsage: "Sirve para trazabilidad y auditoria.",
    },
    {
      id: "dep_8",
      label: "Override comercial",
      technicalId: "deposit.overrideApplied",
      type: "BOOLEAN",
      required: false,
      active: true,
      source: "Tesoreria / comercial",
      motorUsage: "Marca excepciones al pricing estandar.",
    },
  ],
};

function getTypeLabel(type: FieldType) {
  switch (type) {
    case "STRING":
      return "Texto";
    case "NUMBER":
      return "Numero";
    case "SELECT":
      return "Lista";
    case "PERCENTAGE":
      return "Porcentaje";
    case "BOOLEAN":
      return "Booleano";
    default:
      return type;
  }
}

export function FieldsSettingsScreen() {
  const [activeTab, setActiveTab] = useState<FieldModule>("Clients");
  const [rowsByTab, setRowsByTab] = useState<Record<FieldModule, FieldRow[]>>(INITIAL_FIELDS);
  const [modalOpen, setModalOpen] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newId, setNewId] = useState("");
  const [newType, setNewType] = useState<FieldType>("STRING");
  const [newSource, setNewSource] = useState("");
  const [newUsage, setNewUsage] = useState("");
  const [newRequired, setNewRequired] = useState(false);
  const [selectOptions, setSelectOptions] = useState("Aprobado, Revision, Rechazado");

  const typeTone = (type: FieldType) => {
    if (type === "STRING") return "neutral";
    if (type === "NUMBER") return "warning";
    if (type === "PERCENTAGE") return "warning";
    if (type === "BOOLEAN") return "success";
    return "success";
  };

  const rows = useMemo(() => rowsByTab[activeTab] ?? [], [activeTab, rowsByTab]);

  const activeSummary = useMemo(() => {
    if (activeTab === "Clients") {
      return "Variables de originacion para persona natural: score, ingreso, DTI, identidad y producto.";
    }
    if (activeTab === "Groups") {
      return "Variables empresariales y de cumplimiento: SAT, KYB, AML, sector, socios y concentracion.";
    }
    if (activeTab === "Loans") {
      return "Variables de decision y pricing del credito: monto, plazo, tasa, CAT, destino y trazabilidad.";
    }
    return "Variables de depositos vinculadas a tesoreria y pricing: saldo, tier, TIIE y overrides.";
  }, [activeTab]);

  const addField = () => {
    if (!newLabel.trim() || !newId.trim()) return;
    setRowsByTab((prev) => {
      const currentRows = prev[activeTab] ?? [];
      return {
        ...prev,
        [activeTab]: [
          ...currentRows,
          {
            id: `${activeTab.toLowerCase()}_${currentRows.length + 1}_${Date.now()}`,
            label: newLabel.trim(),
            technicalId: newId.trim(),
            type: newType,
            required: newRequired,
            active: true,
            source: newSource.trim() || "Configuracion manual",
            motorUsage:
              newUsage.trim() ||
              (newType === "SELECT" ? `Opciones configuradas: ${selectOptions}` : "Disponible para reglas y vistas del motor."),
          },
        ],
      };
    });
    setModalOpen(false);
    setNewLabel("");
    setNewId("");
    setNewType("STRING");
    setNewSource("");
    setNewUsage("");
    setNewRequired(false);
  };

  return (
    <div className="zelify-settings-workspace">
      <header className="zelify-settings-workspace__head">
        <div>
          <h1>Campos y variables</h1>
          <p className="zelify-fields-settings__lead">
            Catalogo funcional de variables que alimentan originacion, scoring, KYB, pricing y trazabilidad.
          </p>
        </div>
        <AppButton type="button" tone="primary" onClick={() => setModalOpen(true)}>
          <Plus size={16} />
          Nuevo campo
        </AppButton>
      </header>

      <div className="zelify-settings-tabs" role="tablist" aria-label="Modulos">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? "is-active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "Clients"
              ? "Clientes"
              : tab === "Groups"
                ? "Empresas / grupos"
                : tab === "Loans"
                  ? "Creditos"
                  : "Depositos"}
          </button>
        ))}
      </div>

      <section className="zelify-fields-settings__summary">
        <AppBadge tone="neutral" size="sm">
          {activeTab === "Clients"
            ? "MDC persona natural"
            : activeTab === "Groups"
              ? "MDC persona moral"
              : activeTab === "Loans"
                ? "Motor de credito"
                : "LCC / depositos"}
        </AppBadge>
        <p>{activeSummary}</p>
      </section>

      <SettingsDataTable variant="clients">
        <thead>
          <tr>
            <th />
            <th>Variable</th>
            <th>ID tecnico</th>
            <th>Tipo</th>
            <th>Fuente</th>
            <th>Uso en motor</th>
            <th>Req.</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <GripVertical size={16} />
              </td>
              <td>{row.label}</td>
              <td className="zelify-mono">{row.technicalId}</td>
              <td>
                <AppBadge tone={typeTone(row.type)} size="sm">
                  {getTypeLabel(row.type)}
                </AppBadge>
              </td>
              <td>{row.source}</td>
              <td className="zelify-fields-settings__usage">{row.motorUsage}</td>
              <td>
                <input type="checkbox" checked={row.required} disabled />
              </td>
              <td>
                <label className="zelify-switch">
                  <input
                    type="checkbox"
                    checked={row.active}
                    onChange={(e) =>
                      setRowsByTab((prev) => ({
                        ...prev,
                        [activeTab]: (prev[activeTab] ?? []).map((item) =>
                          item.id === row.id ? { ...item, active: e.target.checked } : item
                        ),
                      }))
                    }
                  />
                  <span />
                </label>
              </td>
              <td className="is-actions">
                <button type="button" className="zelify-icon-btn">
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className="zelify-icon-btn danger"
                  onClick={() =>
                    setRowsByTab((prev) => ({
                      ...prev,
                      [activeTab]: (prev[activeTab] ?? []).filter((item) => item.id !== row.id),
                    }))
                  }
                >
                  <Trash2 size={14} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </SettingsDataTable>

      {modalOpen ? (
        <div className="zelify-settings-modal-backdrop" role="presentation" onMouseDown={() => setModalOpen(false)}>
          <div className="zelify-settings-modal" role="dialog" aria-modal="true" onMouseDown={(e) => e.stopPropagation()}>
            <header className="zelify-settings-modal__head">
              <p>Configuración</p>
              <h2>Nuevo campo</h2>
            </header>
            <div className="zelify-settings-modal__body">
              <div className="zelify-fields-settings__modal-note">
                Se agregara sobre el modulo activo: <strong>{activeTab}</strong>
              </div>
              <AppInput placeholder="Nombre visible de la variable" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} />
              <AppInput placeholder="ID tecnico (ej. applicant.creditScore)" value={newId} onChange={(e) => setNewId(e.target.value)} />
              <select
                className="zelify-fields-native-select"
                value={newType}
                onChange={(e) => setNewType(e.target.value as FieldType)}
              >
                <option value="STRING">Texto</option>
                <option value="NUMBER">Numero</option>
                <option value="PERCENTAGE">Porcentaje</option>
                <option value="BOOLEAN">Booleano</option>
                <option value="SELECT">Lista</option>
              </select>
              <AppInput placeholder="Fuente del dato (SAT, buro, solicitud, KYB, pricing...)" value={newSource} onChange={(e) => setNewSource(e.target.value)} />
              <AppInput placeholder="Como se usa en el motor o en reporting" value={newUsage} onChange={(e) => setNewUsage(e.target.value)} />
              {newType === "SELECT" ? (
                <AppInput
                  placeholder="Opciones separadas por coma"
                  value={selectOptions}
                  onChange={(e) => setSelectOptions(e.target.value)}
                />
              ) : null}
              <AppCheckbox id="new-required" label="Campo requerido" checked={newRequired} onChange={(e) => setNewRequired(e.target.checked)} />
            </div>
            <footer className="zelify-settings-modal__footer">
              <AppButton type="button" tone="neutral" onClick={() => setModalOpen(false)}>
                Cancelar
              </AppButton>
              <AppButton type="button" tone="primary" onClick={addField}>
                Guardar
              </AppButton>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
