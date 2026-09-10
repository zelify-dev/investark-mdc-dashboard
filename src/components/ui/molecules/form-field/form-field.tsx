import type { ReactNode } from "react";

import "./form-field.css";

type FormFieldProps = {
  children: ReactNode;
  className?: string;
  /** Etiqueta superior (texto o nodo, p. ej. label + ayuda). */
  label: ReactNode;
  /** Controles del campo (input, select, etc.). */
  control: ReactNode;
};

export function FormField({ label, control, className }: FormFieldProps) {
  return (
    <div className={["zelify-form-field", className ?? ""].filter(Boolean).join(" ")}>
      <div className="zelify-form-field__label">{label}</div>
      <div className="zelify-form-field__control">{control}</div>
    </div>
  );
}
