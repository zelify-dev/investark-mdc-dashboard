"use client";

export type CustomerState = "Active" | "Inactive" | "In Arrears" | "Blacklisted" | "Pending Approval";

export type CustomerAccount = {
  id: string;
  name: string;
  type: "Loan" | "Deposit" | "Current Account" | "Savings";
  state: "Active" | "In Arrears" | "Closed" | "Matured";
  balance: number;
  currency: string;
};

export type ActivityEvent = {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  category: "Operation" | "Compliance" | "Product" | "Identity";
};

export type Customer = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  state: CustomerState;
  branch: string;
  creditOfficer: string;
  totalBalance: number;
  lastModified: string;
  createdDate: string;
  approvedDate?: string;
  closedDate?: string;
  clientType: "Individual" | "Corporate";
  assignedCentre: string;
  personalInfo: {
    gender: string;
    birthDate: string;
    preferredLanguage: string;
    address: string;
  };
  accounts: CustomerAccount[];
  activity: ActivityEvent[];
};

export const mockCustomers: Customer[] = [
  {
    id: "CL-EC-1001",
    fullName: "María Fernanda Paredes",
    email: "m.paredes@correo.ec",
    phone: "+593 99 321 4455",
    state: "Active",
    branch: "Quito Centro",
    creditOfficer: "Daniela Rojas",
    totalBalance: 18420.55,
    lastModified: "2026-04-19 10:22",
    createdDate: "2024-02-10",
    approvedDate: "2024-02-11",
    clientType: "Individual",
    assignedCentre: "Ecuador Sierra",
    personalInfo: {
      gender: "Female",
      birthDate: "1991-05-16",
      preferredLanguage: "Spanish",
      address: "La Carolina, Quito, Ecuador",
    },
    accounts: [
      {
        id: "ACC-USD-3011",
        name: "Cuenta de Ahorros Preferente",
        type: "Savings",
        state: "Active",
        balance: 6420.55,
        currency: "USD",
      },
      {
        id: "ACC-USD-9014",
        name: "Crédito Consumo Plus",
        type: "Loan",
        state: "Active",
        balance: 12000.0,
        currency: "USD",
      },
    ],
    activity: [
      {
        id: "EV-EC-0001",
        type: "Product Event",
        description: "Desembolso de crédito por $12,000.00",
        timestamp: "2026-04-19 09:45",
        category: "Product",
      },
      {
        id: "EV-EC-0002",
        type: "Compliance",
        description: "Validación KYC anual completada",
        timestamp: "2026-04-18 16:20",
        category: "Compliance",
      },
    ],
  },
  {
    id: "CL-CO-1002",
    fullName: "Transportes del Pacífico S.A.S.",
    email: "tesoreria@transportespacifico.co",
    phone: "+57 310 556 7722",
    state: "Active",
    branch: "Bogotá Norte",
    creditOfficer: "Camila Bernal",
    totalBalance: 245300.0,
    lastModified: "2026-04-19 08:30",
    createdDate: "2023-07-08",
    approvedDate: "2023-07-09",
    clientType: "Corporate",
    assignedCentre: "Colombia Corporativo",
    personalInfo: {
      gender: "N/A",
      birthDate: "2008-04-15",
      preferredLanguage: "Spanish",
      address: "Chapinero, Bogotá, Colombia",
    },
    accounts: [
      {
        id: "ACC-USD-4100",
        name: "Cuenta Corriente Operativa",
        type: "Current Account",
        state: "Active",
        balance: 95300.0,
        currency: "USD",
      },
      {
        id: "ACC-USD-9101",
        name: "Línea de Capital de Trabajo",
        type: "Loan",
        state: "Active",
        balance: 150000.0,
        currency: "USD",
      },
    ],
    activity: [
      {
        id: "EV-CO-0001",
        type: "Operation",
        description: "Transferencia masiva aprobada por tesorería",
        timestamp: "2026-04-19 08:02",
        category: "Operation",
      },
    ],
  },
  {
    id: "CL-PE-1003",
    fullName: "Luis Alberto Cárdenas",
    email: "l.cardenas@correo.pe",
    phone: "+51 987 555 102",
    state: "In Arrears",
    branch: "Lima San Isidro",
    creditOfficer: "Natalia Vela",
    totalBalance: 21450.0,
    lastModified: "2026-04-18 18:11",
    createdDate: "2022-09-21",
    approvedDate: "2022-09-22",
    clientType: "Individual",
    assignedCentre: "Perú Lima",
    personalInfo: {
      gender: "Male",
      birthDate: "1987-03-09",
      preferredLanguage: "Spanish",
      address: "San Isidro, Lima, Perú",
    },
    accounts: [
      {
        id: "ACC-USD-9207",
        name: "Crédito Vehicular",
        type: "Loan",
        state: "In Arrears",
        balance: 21450.0,
        currency: "USD",
      },
    ],
    activity: [
      {
        id: "EV-PE-0001",
        type: "Status Change",
        description: "Cuenta en mora > 30 días",
        timestamp: "2026-04-18 17:58",
        category: "Product",
      },
    ],
  },
  {
    id: "CL-MX-1004",
    fullName: "Comercializadora Maya S.A. de C.V.",
    email: "operaciones@maya.mx",
    phone: "+52 55 8811 2244",
    state: "Pending Approval",
    branch: "CDMX Reforma",
    creditOfficer: "Paola Mena",
    totalBalance: 0.0,
    lastModified: "2026-04-19 09:00",
    createdDate: "2026-04-17",
    clientType: "Corporate",
    assignedCentre: "México Empresas",
    personalInfo: {
      gender: "N/A",
      birthDate: "2018-02-12",
      preferredLanguage: "Spanish",
      address: "Paseo de la Reforma, CDMX, México",
    },
    accounts: [],
    activity: [],
  },
  {
    id: "CL-DO-1005",
    fullName: "Carolina Guzmán",
    email: "c.guzman@correo.do",
    phone: "+1 809 445 2233",
    state: "Inactive",
    branch: "Santo Domingo Centro",
    creditOfficer: "José M. Herrera",
    totalBalance: 5200.0,
    lastModified: "2026-03-14 11:40",
    createdDate: "2021-05-19",
    approvedDate: "2021-05-21",
    clientType: "Individual",
    assignedCentre: "Caribe",
    personalInfo: {
      gender: "Female",
      birthDate: "1979-10-04",
      preferredLanguage: "Spanish",
      address: "Gazcue, Santo Domingo, República Dominicana",
    },
    accounts: [
      {
        id: "ACC-USD-5501",
        name: "Cuenta Ahorro Familiar",
        type: "Savings",
        state: "Matured",
        balance: 5200.0,
        currency: "USD",
      },
    ],
    activity: [],
  },
  {
    id: "CL-CL-1006",
    fullName: "Inversiones Cordillera Ltda.",
    email: "finanzas@cordillera.cl",
    phone: "+56 9 6112 8844",
    state: "Active",
    branch: "Santiago Apoquindo",
    creditOfficer: "Valentina Riquelme",
    totalBalance: 870000.0,
    lastModified: "2026-04-19 07:55",
    createdDate: "2020-11-10",
    approvedDate: "2020-11-11",
    clientType: "Corporate",
    assignedCentre: "Chile Corporativo",
    personalInfo: {
      gender: "N/A",
      birthDate: "2014-06-05",
      preferredLanguage: "Spanish",
      address: "Las Condes, Santiago, Chile",
    },
    accounts: [
      {
        id: "ACC-USD-8800",
        name: "Depósito a Plazo Empresarial",
        type: "Deposit",
        state: "Active",
        balance: 500000.0,
        currency: "USD",
      },
      {
        id: "ACC-USD-8801",
        name: "Crédito Comercial Rotativo",
        type: "Loan",
        state: "Active",
        balance: 370000.0,
        currency: "USD",
      },
    ],
    activity: [],
  },
  {
    id: "CL-AR-1007",
    fullName: "Patricio Nieves",
    email: "p.nieves@correo.ar",
    phone: "+54 9 11 5544 2201",
    state: "Blacklisted",
    branch: "Buenos Aires Microcentro",
    creditOfficer: "Agustín Ferreyra",
    totalBalance: 980.4,
    lastModified: "2026-04-16 13:10",
    createdDate: "2023-04-01",
    approvedDate: "2023-04-02",
    clientType: "Individual",
    assignedCentre: "Argentina Riesgo",
    personalInfo: {
      gender: "Male",
      birthDate: "1994-12-01",
      preferredLanguage: "Spanish",
      address: "San Nicolás, Buenos Aires, Argentina",
    },
    accounts: [],
    activity: [
      {
        id: "EV-AR-0001",
        type: "Compliance",
        description: "Cliente bloqueado por alerta AML en revisión",
        timestamp: "2026-04-16 12:58",
        category: "Identity",
      },
    ],
  },
  {
    id: "CL-UY-1008",
    fullName: "Federico Acosta",
    email: "f.acosta@correo.uy",
    phone: "+598 99 880 440",
    state: "Active",
    branch: "Montevideo Pocitos",
    creditOfficer: "Marina Cabrera",
    totalBalance: 12450.5,
    lastModified: "2026-04-18 12:45",
    createdDate: "2023-11-05",
    clientType: "Individual",
    assignedCentre: "Uruguay Retail",
    personalInfo: {
      gender: "Female",
      birthDate: "1992-05-20",
      preferredLanguage: "Spanish",
      address: "Pocitos, Montevideo, Uruguay",
    },
    accounts: [],
    activity: [],
  },
];

