import { AppButton } from "@/components/ui/atoms/button/app-button";

type IndicatorTileProps = {
  label: string;
  value: string;
  meta?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function IndicatorTile({
  label,
  value,
  meta,
  actionLabel = "Open view",
  onAction,
}: IndicatorTileProps) {
  return (
    <article className="zelify-indicator-tile">
      <span className="zelify-indicator-tile__label">{label}</span>
      <strong className="zelify-indicator-tile__value">{value}</strong>
      {meta ? <span className="zelify-indicator-tile__meta">{meta}</span> : null}
      <AppButton className="zelify-indicator-tile__action" onClick={onAction}>
        {actionLabel}
      </AppButton>
    </article>
  );
}
