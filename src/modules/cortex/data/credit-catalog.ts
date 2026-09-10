import type {
  CreditProductCategory,
  CreditProductTemplate,
  CrossSellOption,
  ProductRule,
} from "../types/credit-pricing.types";

export const CATEGORY_SHORT_LABELS: Record<CreditProductCategory, string> = {
  automotriz: "Automotriz",
  personal: "Personal / Línea",
};

export const CATEGORY_PRODUCT_ID: Record<CreditProductCategory, string> = {
  automotriz: "AUTO-EV-01",
  personal: "PERS-LIB-01",
};

export const CATEGORY_LABELS: Record<CreditProductCategory, string> = {
  automotriz: "Crédito Automotriz",
  personal: "Crédito Personal / Línea de Crédito",
};

export const CATEGORY_DESCRIPTIONS: Record<CreditProductCategory, string> = {
  automotriz:
    "Financiamiento para compra de vehículos nuevos o seminuevos, incluyendo autos eléctricos e híbridos.",
  personal:
    "Préstamos de libre uso para consumo, emergencias, viajes, consolidación de deudas o liquidez empresarial.",
};

export const DEFAULT_PRODUCTS: CreditProductTemplate[] = [
  {
    id: "AUTO-EV-01",
    category: "automotriz",
    name: "Auto Eléctrico / Híbrido",
    description: CATEGORY_DESCRIPTIONS.automotriz,
    restrictions: [
      "Vehículo modelo ≤ 3 años",
      "Enganche mínimo 20%",
      "Seguro de auto obligatorio",
      "Buró score ≥ 650",
    ],
    baseRate: 15.0,
    discountBandMin: 13.75,
    discountBandMax: 15.0,
    termMinMonths: 12,
    termMaxMonths: 60,
    amountMin: 100_000,
    amountMax: 2_500_000,
    fixedRateForTerm: true,
    openingFeePct: 1.5,
  },
  {
    id: "PERS-LIB-01",
    category: "personal",
    name: "Préstamo Personal Libre",
    description: CATEGORY_DESCRIPTIONS.personal,
    restrictions: [
      "Antigüedad laboral ≥ 12 meses",
      "Capacidad de pago ≤ 35% ingreso",
      "Sin morosidad activa en buró",
      "Monto máx. 18× ingreso mensual",
    ],
    baseRate: 22.0,
    discountBandMin: 20.75,
    discountBandMax: 22.0,
    termMinMonths: 6,
    termMaxMonths: 48,
    amountMin: 25_000,
    amountMax: 800_000,
    fixedRateForTerm: true,
    openingFeePct: 2.0,
  },
];

export const DEFAULT_RULES: Record<CreditProductCategory, ProductRule[]> = {
  automotriz: [
    { id: "r-auto-buro", group: "aprobacion", label: "Buró ≥ 650", description: "Score mínimo de buró de crédito", enabled: true, bpsDiscount: 0, blocksApproval: true },
    { id: "r-auto-enganche", group: "aprobacion", label: "Enganche ≥ 20%", description: "Validación de enganche mínimo", enabled: true, bpsDiscount: 0, blocksApproval: true },
    { id: "r-auto-mora", group: "aprobacion", label: "Sin mora vigente", description: "Sin claves de mora en buró", enabled: true, bpsDiscount: 0, blocksApproval: true },
    { id: "r-auto-kyc", group: "aprobacion", label: "KYC vigente", description: "Identidad verificada · PEP en revisión", enabled: true, bpsDiscount: 0, blocksApproval: true },
    { id: "r-auto-capacidad", group: "aprobacion", label: "Capacidad de pago", description: "Cuota ≤ 35% del ingreso neto", enabled: true, bpsDiscount: 0, blocksApproval: true },
    { id: "r-auto-monto", group: "validacion", label: "Monto en rango", description: "Entre mínimo y máximo del producto", enabled: true, bpsDiscount: 0 },
    { id: "r-auto-plazo", group: "validacion", label: "Plazo permitido", description: "12–60 meses según política", enabled: true, bpsDiscount: 0 },
    { id: "r-auto-modelo", group: "validacion", label: "Modelo ≤ 3 años", description: "Vehículo dentro de antigüedad permitida", enabled: true, bpsDiscount: 0 },
    { id: "r-auto-seguro", group: "validacion", label: "Seguro obligatorio", description: "Póliza vigente al momento del desembolso", enabled: true, bpsDiscount: 0 },
    { id: "r-auto-factura", group: "validacion", label: "Factura y tenencia", description: "Documentación del vehículo completa", enabled: true, bpsDiscount: 0 },
    { id: "r-auto-nomina", group: "pricing", label: "Descuento nómina", description: "−50 pbs si tiene nómina activa", enabled: true, bpsDiscount: 50 },
    { id: "r-auto-tdc", group: "pricing", label: "Descuento TDC", description: "−50 pbs si tiene tarjeta activa", enabled: true, bpsDiscount: 50 },
    { id: "r-auto-eco", group: "pricing", label: "Bono vehículo eco", description: "−25 pbs auto eléctrico / híbrido", enabled: true, bpsDiscount: 25 },
  ],
  personal: [
    { id: "r-pers-buro", group: "aprobacion", label: "Buró ≥ 650", description: "Score mínimo de buró de crédito", enabled: true, bpsDiscount: 0, blocksApproval: true },
    { id: "r-pers-capacidad", group: "aprobacion", label: "Capacidad ≤ 35%", description: "Relación pago/ingreso máxima", enabled: true, bpsDiscount: 0, blocksApproval: true },
    { id: "r-pers-mora", group: "aprobacion", label: "Sin morosidad", description: "Sin claves de mora vigentes", enabled: true, bpsDiscount: 0, blocksApproval: true },
    { id: "r-pers-kyc", group: "aprobacion", label: "KYC vigente", description: "Identidad verificada · PEP en revisión", enabled: true, bpsDiscount: 0, blocksApproval: true },
    { id: "r-pers-antig", group: "aprobacion", label: "Antigüedad ≥ 12m", description: "Relación laboral o crediticia mínima", enabled: true, bpsDiscount: 0, blocksApproval: true },
    { id: "r-pers-monto", group: "aprobacion", label: "Monto ≤ 18× ingreso", description: "Tope de exposición por cliente", enabled: true, bpsDiscount: 0, blocksApproval: true },
    { id: "r-pers-ingreso", group: "validacion", label: "Ingreso comprobable", description: "Recibos de nómina o estados de cuenta", enabled: true, bpsDiscount: 0 },
    { id: "r-pers-plazo", group: "validacion", label: "Plazo permitido", description: "6–48 meses según producto", enabled: true, bpsDiscount: 0 },
    { id: "r-pers-dom", group: "validacion", label: "Domicilio verificado", description: "Comprobante de domicilio ≤ 3 meses", enabled: true, bpsDiscount: 0 },
    { id: "r-pers-ref", group: "validacion", label: "Referencias", description: "Mínimo 2 referencias personales", enabled: true, bpsDiscount: 0 },
    { id: "r-pers-nomina", group: "pricing", label: "Descuento nómina", description: "−50 pbs nómina domiciliada", enabled: true, bpsDiscount: 50 },
    { id: "r-pers-tdc", group: "pricing", label: "Descuento TDC", description: "−50 pbs tarjeta activa", enabled: true, bpsDiscount: 50 },
    { id: "r-pers-relacion", group: "pricing", label: "Cliente preferente", description: "−25 pbs relación > 2 años", enabled: true, bpsDiscount: 25 },
  ],
};

export const DEFAULT_CROSS_SELL: Record<CreditProductCategory, CrossSellOption[]> = {
  automotriz: [
    { id: "xs-seguro-auto", label: "Seguro del auto", bps: 50, description: "Póliza con aseguradora aliada" },
    { id: "xs-tdc", label: "Tarjeta de crédito", bps: 50, description: "TDC con tasa preferencial" },
    { id: "xs-ahorro", label: "Cuenta de ahorros", bps: 25, description: "Cuenta sin comisiones 12 meses" },
    { id: "xs-asistencia", label: "Asistencia vial", bps: 25, description: "Plan anual de asistencia" },
  ],
  personal: [
    { id: "xs-seguro-vida", label: "Seguro de vida", bps: 50, description: "Cobertura saldo deudor" },
    { id: "xs-tdc", label: "Tarjeta de crédito", bps: 50, description: "Línea revolvente complementaria" },
    { id: "xs-inversion", label: "Inversión patrimonial", bps: 50, description: "Fondo de inversión a plazo" },
    { id: "xs-nomina", label: "Domiciliación nómina", bps: 25, description: "Descuento por domiciliar nómina" },
  ],
};
