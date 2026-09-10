export type MdcRequestStatus = "Revision manual" | "Aprobada" | "Rechazada" | "Override" | "Pendiente";
export type MdcRequestRisk = "Bajo" | "Medio" | "Alto";

export interface MdcRequest {
  id: string;
  applicant: string;
  email: string;
  product: string;
  amount: number;
  status: MdcRequestStatus;
  risk: { level: MdcRequestRisk; score: number };
  date: string;
}

export const MDC_REQUESTS: MdcRequest[] = [
  { id: "APP-001252", applicant: "Juan Hernandez", email: "juan.hdz479948@gmail.com", product: "Credito automotriz", amount: 835993, status: "Revision manual", risk: { level: "Medio", score: 50 }, date: "27/05/26, 5:48 p.m." },
  { id: "APP-001274", applicant: "Luis Alberto García", email: "luis.garcia104110@gmail.com", product: "Credito automotriz", amount: 144449, status: "Aprobada", risk: { level: "Bajo", score: 31 }, date: "27/05/26, 1:34 a.m." },
  { id: "APP-001259", applicant: "Elena Gomez", email: "elena.gomez100003@gmail.com", product: "Credito automotriz", amount: 591845, status: "Rechazada", risk: { level: "Alto", score: 75 }, date: "26/05/26, 9:31 p.m." },
  { id: "APP-001273", applicant: "Ana Lucía Méndez Torres", email: "ana.mendez@gmail.com", product: "Credito personal", amount: 454240, status: "Override", risk: { level: "Bajo", score: 40 }, date: "24/05/26, 6:03 p.m." },
  { id: "APP-001258", applicant: "TechStart Solutions SA de CV", email: "credito@techstart.mx", product: "Credito personal", amount: 721636, status: "Aprobada", risk: { level: "Bajo", score: 27 }, date: "24/05/26, 2:59 p.m." },
  { id: "APP-001251", applicant: "José Arevalo", email: "jose.arevalo894293@gmail.com", product: "Credito personal", amount: 170784, status: "Pendiente", risk: { level: "Medio", score: 45 }, date: "24/05/26, 10:17 a.m." },
  { id: "APP-001272", applicant: "Ana Sofía Ramírez", email: "ana.ramirez443177@gmail.com", product: "Credito automotriz", amount: 224031, status: "Revision manual", risk: { level: "Medio", score: 50 }, date: "21/05/26, 11:31 a.m." },
  { id: "APP-001257", applicant: "Roberto Méndez García", email: "roberto.mendez@gmail.com", product: "Credito automotriz", amount: 1091427, status: "Override", risk: { level: "Bajo", score: 40 }, date: "21/05/26, 7:28 a.m." },
  { id: "APP-001250", applicant: "María Fernanda Torres", email: "maria.torres263818@gmail.com", product: "Credito automotriz", amount: 815575, status: "Rechazada", risk: { level: "Alto", score: 75 }, date: "21/05/26, 3:45 a.m." },
];
