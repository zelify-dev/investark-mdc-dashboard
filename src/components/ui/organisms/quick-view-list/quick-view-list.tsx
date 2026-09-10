import { AppButton } from "@/components/ui/atoms/button/app-button";

type QuickViewItem = {
  label: string;
  count?: string;
  meta?: string;
};

type QuickViewListProps = {
  items: QuickViewItem[];
};

export function QuickViewList({ items }: QuickViewListProps) {
  return (
    <div className="zelify-shortcuts">
      {items.map((item) => (
        <AppButton key={item.label} fullWidth className="zelify-shortcuts__item">
          {item.count ? <span className="zelify-shortcuts__count">{item.count}</span> : null}
          <span className="zelify-shortcuts__content">
            <span className="zelify-shortcuts__label">{item.label}</span>
            {item.meta ? <span className="zelify-shortcuts__meta">{item.meta}</span> : null}
          </span>
        </AppButton>
      ))}
    </div>
  );
}

export type { QuickViewItem };
