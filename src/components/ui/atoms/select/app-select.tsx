import type { SelectHTMLAttributes } from "react";

import "./app-select.css";

type AppSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  className?: string;
  /** Alineado con inputs de formulario (40px). */
  size?: "md" | "default";
};

export function AppSelect({
  className,
  size = "default",
  children,
  ...props
}: AppSelectProps) {
  const classes = [
    "zelify-select",
    size === "md" ? "zelify-select--full-height" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <select className={classes} {...props}>
      {children}
    </select>
  );
}
