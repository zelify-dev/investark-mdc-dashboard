import type { LabelHTMLAttributes, ReactNode } from "react";

import "./field-label.css";

type FieldLabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  children: ReactNode;
  className?: string;
};

export function FieldLabel({ children, className, ...props }: FieldLabelProps) {
  const classes = ["zelify-field-label", className ?? ""].filter(Boolean).join(" ");
  return (
    <label className={classes} {...props}>
      {children}
    </label>
  );
}
