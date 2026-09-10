export type OnboardingModuleKey =
  | "kyb"
  | "pldAml"
  | "technical"
  | "businessPlan"
  | "companyInfo"
  | "satKyc";

export type OnboardingNavItem = {
  title: string;
  href: string;
  percentKey?: OnboardingModuleKey;
  shortLabel: string;
};

export type ChecklistItemKind = "Dato" | "Documento" | "Declaración";

export type ChecklistItem = {
  code: string;
  label: string;
  kind: ChecklistItemKind;
  notes?: string;
};

export type ChecklistSubsection = {
  code: string;
  title: string;
  items: ChecklistItem[];
  description?: string;
};

export type ChecklistSection = {
  code: string;
  title: string;
  description?: string;
  subsections: ChecklistSubsection[];
};

export const onboardingNavigation = {
  label: "ONBOARDING",
  items: [
    {
      title: "1. Información del negocio",
      href: "/kyb",
      percentKey: "kyb",
      shortLabel: "NEG",
    },
    {
      title: "2. PLD/AML y Privacidad",
      href: "/kyb/pld-aml",
      percentKey: "pldAml",
      shortLabel: "AML",
    },
    {
      title: "3. Información Comercial",
      href: "/kyb/commercial-info",
      percentKey: "businessPlan",
      shortLabel: "COM",
    },
    {
      title: "4. De la Empresa",
      href: "/kyb/company-info",
      percentKey: "companyInfo",
      shortLabel: "EMP",
    },
    {
      title: "5. Conexión",
      href: "/kyb/sat-kyc",
      percentKey: "satKyc",
      shortLabel: "SAT",
    },
  ] satisfies OnboardingNavItem[],
};

// SECCIÓN 1 — Información del negocio
export const kybChecklistSections: ChecklistSection[] = [
  {
    code: "SECCIÓN 1",
    title: "Información del negocio",
    description:
      "Datos constitutivos, identificación corporativa, representación legal, estructura accionaria y documentación legal de la empresa cliente.",
    subsections: [
      {
        code: "1.1",
        title: "Datos Constitutivos y de Identificación de la Empresa",
        items: [
          { code: "1.1.1", label: "Denominación social", kind: "Dato" },
          { code: "1.1.2", label: "Nombre del Notario o Corredor", kind: "Dato" },
          { code: "1.1.3", label: "Número de la Notaría o Correduría", kind: "Dato" },
          { code: "1.1.4", label: "Número de Escritura o Póliza", kind: "Dato" },
          { code: "1.1.5", label: "Entidad Federativa", kind: "Dato" },
          {
            code: "1.1.6",
            label: "Folio Mercantil / Inscripción en el Registro Público",
            kind: "Dato",
          },
          {
            code: "1.1.7",
            label: "Fecha de Inscripción en el Registro Público",
            kind: "Dato",
          },
          {
            code: "1.1.8",
            label: "Identificación fiscal (RFC - Registro Federal de Contribuyente)",
            kind: "Dato",
          },
          { code: "1.1.9", label: "Nacionalidad", kind: "Dato" },
          { code: "1.1.10", label: "Tipo societario", kind: "Dato" },
          { code: "1.1.11", label: "Dirección fiscal de la empresa", kind: "Dato" },
          { code: "1.1.12", label: "Número de teléfono corporativo", kind: "Dato" },
          { code: "1.1.13", label: "Correo electrónico corporativo", kind: "Dato" },
          { code: "1.1.14", label: "Sitio web oficial", kind: "Dato" },
        ],
      },
      {
        code: "1.2",
        title: "Representante legal",
        items: [
          { code: "1.2.1", label: "Nombre completo del representante", kind: "Dato" },
          { code: "1.2.2", label: "Fecha de nacimiento", kind: "Dato" },
          { code: "1.2.3", label: "Nacionalidad y país de residencia", kind: "Dato" },
          { code: "1.2.4", label: "Cargo que ocupa en la empresa", kind: "Dato" },
          {
            code: "1.2.5",
            label: "Número de documento de identidad oficial (INE, Pasaporte)",
            kind: "Documento",
          },
          { code: "1.2.6", label: "CURP", kind: "Dato" },
          { code: "1.2.7", label: "RFC", kind: "Dato" },
          { code: "1.2.8", label: "Estado civil", kind: "Dato" },
          {
            code: "1.2.9",
            label: "Comprobante de domicilio (máx. 3 meses de antigüedad)",
            kind: "Documento",
          },
          {
            code: "1.2.10",
            label: "Copia certificada del poder notarial o escritura pública (acreditación representante legal)",
            kind: "Documento",
          },
        ],
      },
      {
        code: "1.4",
        title: "Datos del Testimonio de otorgamiento de poder del Representante legal",
        items: [
          { code: "1.4.1", label: "Nombre del Notario", kind: "Dato" },
          { code: "1.4.2", label: "Número de la Notaría", kind: "Dato" },
          { code: "1.4.3", label: "Número de Escritura", kind: "Dato" },
          { code: "1.4.4", label: "Entidad Federativa", kind: "Dato" },
          {
            code: "1.4.5",
            label: "Folio Mercantil / Inscripción en el Registro Público",
            kind: "Dato",
          },
          {
            code: "1.4.6",
            label: "Fecha de Inscripción en el Registro Público",
            kind: "Dato",
          },
        ],
      },
      {
        code: "1.5",
        title: "Propietarios y Directivos",
        items: [
          {
            code: "1.5.1",
            label:
              "Socios/accionistas con ≥ 25% de participación — indique nombre completo (regístrelos en el panel KYB de esta sección)",
            kind: "Dato",
          },
          {
            code: "1.5.2",
            label:
              "Cargo de control: CEO — nombre completo e INE (si aplica; regístrelo en el panel KYB)",
            kind: "Dato",
          },
          {
            code: "1.5.3",
            label: "Cargo de control: CFO — nombre completo e INE (regístrelo en el panel KYB)",
            kind: "Dato",
          },
          {
            code: "1.5.4",
            label:
              "Cargo de control: Presidente / Director — nombre completo e INE (regístrelo en el panel KYB)",
            kind: "Dato",
          },
          {
            code: "1.5.5",
            label:
              "Documentación de identidad (INE) de cada propietario/directivo con ≥ 25% — adjunte por integrante en el panel KYB o archivo consolidado aquí",
            kind: "Documento",
          },
          {
            code: "1.5.6",
            label: "Documentación de participación accionaria: Libro de Registro de Acciones o Libro de Variaciones de Capital",
            kind: "Documento",
          },
        ],
      },
      {
        code: "1.6",
        title: "Documentos Legales",
        items: [
          {
            code: "1.6.1",
            label: "Acta Constitutiva y últimas modificaciones societarias",
            kind: "Documento",
          },
          {
            code: "1.6.2",
            label: "Constancia de Situación Fiscal (CSF)",
            kind: "Documento",
          },
          {
            code: "1.6.3",
            label: "Licencias, permisos o autorizaciones regulatorias aplicables al giro: Registro CNBV, Registro CONDUSEF, Aviso ante SAT, Licencia municipal, Permisos estatales, Registro SOFOM / IFPE / fintech",
            kind: "Documento",
          },
        ],
      },
    ],
  },
];

// SECCIÓN 2 — Documentación PLD/AML y Politica de Tratamientos de Datos Personales
export const pldAmlChecklistSections: ChecklistSection[] = [
  {
    code: "SECCIÓN 2",
    title: "Documentación PLD/AML y Política de Tratamiento de Datos Personales",
    description:
      "Cargue la documentación relacionada con medidas Anti-Lavado de Dinero (AML) de su empresa y la protección de datos.",
    subsections: [
      {
        code: "2.1",
        title: "Documentación AML y Privacidad",
        items: [
          {
            code: "2.1.1",
            label: "Política de PLD/AML en la empresa (documento)",
            kind: "Documento",
          },
          {
            code: "2.1.2",
            label: "Política de tratamiento de datos personales",
            kind: "Documento",
          },
        ],
      },
    ],
  },
];

// SECCIÓN 3 — Documentación Técnica
export const technicalChecklistSections: ChecklistSection[] = [
  {
    code: "SECCIÓN 3",
    title: "Documentación Técnica",
    description:
      "Ambientes de desarrollo y documentos técnicos requeridos para la integración con el panel Zelify.",
    subsections: [
      {
        code: "3.1",
        title: "Ambientes de Desarrollo",
        items: [
          {
            code: "3.1.1",
            label: "URLs de desarrollo registradas en el panel Zelify",
            kind: "Dato",
          },
          {
            code: "3.1.2",
            label: "API Keys de desarrollo configuradas",
            kind: "Dato",
          },
        ],
      },
      {
        code: "3.2",
        title: "Documentos Técnicos Requeridos",
        items: [
          {
            code: "3.2.1",
            label: "Diagrama de flujo de datos (PDF, DOC, DOCX o ZIP — máx. 30MB)",
            kind: "Documento",
          },
          {
            code: "3.2.2",
            label: "Política de seguridad (PDF, DOC, DOCX — máx. 25MB)",
            kind: "Documento",
          },
          {
            code: "3.2.3",
            label: "Certificaciones (PCI DSS, ISO 27001, SOC 2, etc.) — PDF, DOC, DOCX — máx. 25MB",
            kind: "Documento",
          },
          {
            code: "3.2.4",
            label: "Documentación de procesos (PDF, DOC, DOCX — máx. 25MB)",
            kind: "Documento",
          },
        ],
      },
    ],
  },
];

// SECCIÓN 4 — Información Comercial
export const commercialInfoChecklistSections: ChecklistSection[] = [
  {
    code: "SECCIÓN 4",
    title: "Información Comercial",
    description:
      "Describa el modelo de negocio, mercado, operación comercial y volumetría estimada de la empresa.",
    subsections: [
      {
        code: "4.1",
        title: "Perfil comercial del negocio",
        items: [
          {
            code: "4.1.1",
            label: "Descripción del producto o servicio principal",
            kind: "Dato",
          },
          {
            code: "4.1.2",
            label: "Mercado objetivo y segmentos de clientes",
            kind: "Dato",
          },
          {
            code: "4.1.3",
            label: "Modelo de ingresos y canales de venta",
            kind: "Dato",
          },
          {
            code: "4.1.4",
            label: "Principales competidores y diferenciadores",
            kind: "Dato",
          },
          {
            code: "4.1.5",
            label: "Volumen estimado de operaciones mensuales (MXN)",
            kind: "Dato",
          },
          {
            code: "4.1.6",
            label: "Ticket promedio por transacción o cliente",
            kind: "Dato",
          },
          {
            code: "4.1.7",
            label: "Países o regiones donde opera comercialmente",
            kind: "Dato",
          },
        ],
      },
    ],
  },
];

/** @deprecated Use commercialInfoChecklistSections */
export const businessPlanChecklistSections = commercialInfoChecklistSections;

// SECCIÓN 5 — De la Empresa
export const companyInfoChecklistSections: ChecklistSection[] = [
  {
    code: "SECCIÓN 5",
    title: "De la Empresa",
    description:
      "Declaraciones complementarias sobre extranjería, contexto laboral, relación con funcionarios públicos y actividad económica.",
    subsections: [
      {
        code: "5.1",
        title: "Extranjería",
        items: [
          {
            code: "5.1.1",
            label: "Si cuenta con domicilio en el extranjero",
            kind: "Declaración",
          },
          { code: "5.1.2", label: "Indicar país", kind: "Dato" },
        ],
      },
      {
        code: "5.2",
        title: "Laboral",
        items: [
          {
            code: "5.2.1",
            label: "Indicar el número de empleados que laboran en la empresa",
            kind: "Dato",
          },
          {
            code: "5.2.2",
            label: "Indicar el número de oficinas o sucursales",
            kind: "Dato",
          },
        ],
      },
      {
        code: "5.3",
        title: "Funcionarios Públicos",
        items: [
          {
            code: "5.3.1",
            label: "Nombre completo del miembro de la empresa, accionista, representante legal o administrador único que desempeña o ha desempeñado funciones públicas destacadas en el extranjero o en territorio nacional (En caso de aplicar)",
            kind: "Declaración",
          },
          { code: "5.3.2", label: "Cargo", kind: "Dato" },
          { code: "5.3.3", label: "Periodo", kind: "Dato" },
          {
            code: "5.3.4",
            label: "Nombre completo del familiar de hasta segundo grado de consanguinidad o afinidad de algún miembro de la empresa, accionista, representante legal o administrador único, que se encuentre en el supuesto antes mencionado",
            kind: "Declaración",
          },
        ],
      },
      {
        code: "5.4",
        title: "Actividad Económica",
        items: [
          {
            code: "5.4.1",
            label: "Tipo de empresa (pública, privada, A.C., otra)",
            kind: "Dato",
          },
          { code: "5.4.2", label: "Tipo de actividad", kind: "Dato" },
        ],
      },
    ],
  },
];
