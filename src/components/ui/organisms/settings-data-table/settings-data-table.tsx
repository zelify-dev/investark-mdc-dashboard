import type { ReactNode } from "react";

import "./settings-data-table.css";

export type SettingsDataTableVariant = "default" | "clients" | "accounts";

type SettingsDataTableProps = {
  children: ReactNode;
  className?: string;
  /** `clients` / `accounts`: tablas de listado con cabeceras en mayúsculas y hover en filas. */
  variant?: SettingsDataTableVariant;
};

export function SettingsDataTable({
  children,
  className,
  variant = "default",
}: SettingsDataTableProps) {
  const wrapMods =
    variant === "default" ? "" : `zelify-settings-data-table-wrap--${variant}`;
  const tableMods =
    variant === "default" ? "" : `zelify-settings-data-table--${variant}`;

  return (
    <div
      className={["zelify-settings-data-table-wrap", wrapMods, className ?? ""]
        .filter(Boolean)
        .join(" ")}
    >
      <table className={["zelify-settings-data-table", tableMods].filter(Boolean).join(" ")}>
        {children}
      </table>
    </div>
  );
}
