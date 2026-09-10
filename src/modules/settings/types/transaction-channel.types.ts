export type TransactionChannelRow = {
  id: string;
  name: string;
  /** Canal por defecto del sistema (badge DEFAULT). */
  isDefault: boolean;
  created: string;
  createdBy: string;
  /** Si es false, “Created by” se muestra como texto plano (ej. Zelify Core). */
  createdByIsLink: boolean;
  isActive: boolean;
  /** Oculto salvo que “Show deactivated” esté activado. */
  isDeactivated: boolean;
};
