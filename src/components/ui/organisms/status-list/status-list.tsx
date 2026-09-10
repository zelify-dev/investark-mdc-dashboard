type StatusListItem = {
  label: string;
  value: string;
};

type StatusListProps = {
  items: StatusListItem[];
};

export function StatusList({ items }: StatusListProps) {
  return (
    <div className="zelify-status-grid">
      {items.map((item) => (
        <div key={item.label} className="zelify-status-card">
          <div className="zelify-status-card__header">
            <span className="zelify-status-card__label">{item.label}</span>
          </div>
          <strong className="zelify-status-card__value">{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

export type { StatusListItem };
