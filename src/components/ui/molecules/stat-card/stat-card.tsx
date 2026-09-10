type StatCardProps = {
  label: string;
  value: string;
  delta?: string;
};

export function StatCard({ label, value, delta }: StatCardProps) {
  return (
    <article className="zelify-kpi-card">
      <span className="zelify-kpi-card__label">{label}</span>
      <strong className="zelify-kpi-card__value">{value}</strong>
      {delta ? <span className="zelify-kpi-card__delta">{delta}</span> : null}
    </article>
  );
}
