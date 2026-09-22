"use client";

import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  children: ReactNode;
};

export function AmlField({ label, children }: FieldProps) {
  return (
    <label className="pld-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function AmlBanner({
  tone = "info",
  children,
}: {
  tone?: "info" | "error" | "ok";
  children: ReactNode;
}) {
  return <p className={`pld-banner pld-banner--${tone}`}>{children}</p>;
}

export function AmlJson({ value }: { value: unknown }) {
  if (value == null) return <p className="pld-muted">Sin datos.</p>;
  return <pre className="pld-json">{JSON.stringify(value, null, 2)}</pre>;
}

export function AmlTable({
  columns,
  rows,
  empty = "Sin registros.",
}: {
  columns: string[];
  rows: ReactNode[][];
  empty?: string;
}) {
  if (!rows.length) {
    return <p className="pld-muted">{empty}</p>;
  }

  return (
    <div className="pld-table-wrap">
      <table className="pld-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, index) => (
            <tr key={index}>
              {cells.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function formatWhen(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function pickId(item: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value) return value;
  }
  return "";
}

export function pickLabel(item: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value) return value;
    if (typeof value === "number") return String(value);
  }
  return "—";
}
