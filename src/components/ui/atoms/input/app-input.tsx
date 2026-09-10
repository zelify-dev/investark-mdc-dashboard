import type { InputHTMLAttributes } from "react";

import "./app-input.css";

type AppInputVariant = "surface" | "ghost";

type AppInputProps = InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
  /** `surface`: formularios en fondo claro. `ghost`: buscador del topbar y fondos oscuros. */
  variant?: AppInputVariant;
};

export function AppInput({
  className,
  type = "text",
  variant = "surface",
  ...props
}: AppInputProps) {
  const classes = [
    "zelify-input",
    variant === "surface" ? "zelify-input--surface" : "zelify-input--ghost",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return <input type={type} className={classes} {...props} />;
}
