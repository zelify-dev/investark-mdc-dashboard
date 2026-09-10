import type { ReactNode } from "react";

type ContextSelectorProps = {
  label: string;
  icon?: ReactNode;
};

export function ContextSelector({ label, icon }: ContextSelectorProps) {
  return (
    <button type="button" className="zelify-context-selector">
      <span>{label}</span>
      {icon}
    </button>
  );
}
