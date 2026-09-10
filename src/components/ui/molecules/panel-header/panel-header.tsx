import type { ReactNode } from "react";

type PanelHeaderProps = {
  eyebrow: string;
  title: string;
  aside?: ReactNode;
};

export function PanelHeader({ eyebrow, title, aside }: PanelHeaderProps) {
  return (
    <div className="zelify-panel__header">
      <div>
        <p className="zelify-panel__eyebrow">{eyebrow}</p>
        <h2 className="zelify-panel__title">{title}</h2>
      </div>
      {aside ? <div>{aside}</div> : null}
    </div>
  );
}
