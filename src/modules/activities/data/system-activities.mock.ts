import type { SystemActivityRow } from "../types/system-activity.types";

export const SYSTEM_ACTIVITIES_TOTAL = 865;

const SAMPLE_ROWS: Omit<SystemActivityRow, "id">[] = [
  {
    created_at: "2026-06-30T15:48:00.000Z",
    actor: "Camila Rojas",
    action: "Actualizacion de deposito",
    module: "deposits",
    affected_item_name: "Cuenta de ahorro empresarial",
    affected_item_id: "DEP-OPS-1001",
    affected_client_name: "Maria Fernanda Paredes",
    affected_client_id: "CL-DEP-001",
    branch_id: "main",
  },
  {
    created_at: "2026-06-30T13:16:00.000Z",
    actor: "Jose Herrera",
    action: "Inicio de sesion",
    module: "customers",
    affected_item_name: "Revision de perfil",
    affected_item_id: "CUS-SEC-203",
    affected_client_name: "Luis Cardenas",
    affected_client_id: "CL-CUS-118",
    branch_id: "main",
  },
  {
    created_at: "2026-06-29T18:02:00.000Z",
    actor: "Andrea Molina",
    action: "Conciliacion completada",
    module: "branches",
    affected_item_name: "Cierre diario",
    affected_item_id: "BR-EOD-991",
    affected_client_name: "Sucursal principal",
    affected_client_id: "BR-001",
    branch_id: "main",
  },
  {
    created_at: "2026-06-29T16:40:00.000Z",
    actor: "Juan Carlos Soto",
    action: "Condiciones de credito actualizadas",
    module: "loans",
    affected_item_name: "Credito capital de trabajo",
    affected_item_id: "LN-WC-244",
    affected_client_name: "Transporte Pacifico",
    affected_client_id: "CL-LN-044",
    branch_id: "main",
  },
  {
    created_at: "2026-06-28T23:55:00.000Z",
    actor: "Sistema",
    action: "Proceso programado completado",
    module: "companies",
    affected_item_name: "Sincronizacion nocturna",
    affected_item_id: "JOB-SYNC-778",
    affected_client_name: "—",
    affected_client_id: null,
    branch_id: "main",
  },
];

export function getSystemActivitiesSlice(page: number, pageSize: number): SystemActivityRow[] {
  const start = (page - 1) * pageSize;
  const out: SystemActivityRow[] = [];

  for (let i = 0; i < pageSize && start + i < SYSTEM_ACTIVITIES_TOTAL; i += 1) {
    const idx = start + i;
    const base = SAMPLE_ROWS[idx % SAMPLE_ROWS.length];
    out.push({
      ...base,
      id: `activity-${idx + 1}`,
      affected_item_id: base.affected_item_id ? `${base.affected_item_id}-${idx + 1}` : null,
    });
  }

  return out;
}
