type SummaryGridItem = {
  title: string;
  description: string;
};

type SummaryGridProps = {
  items: SummaryGridItem[];
};

export function SummaryGrid({ items }: SummaryGridProps) {
  return (
    <div className="zelify-summary-grid">
      {items.map((item) => (
        <article key={item.title} className="zelify-summary-card">
          <strong className="zelify-summary-card__title">{item.title}</strong>
          <p className="zelify-summary-card__description">{item.description}</p>
        </article>
      ))}
    </div>
  );
}

export type { SummaryGridItem };
