type ActivityFeedItem = {
  id?: string;
  type: string;
  title: string;
  meta: string;
  time: string;
  marker: string;
};

type ActivityFeedProps = {
  items: ActivityFeedItem[];
};

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <div className="zelify-activity-feed">
      {items.map((item, index) => (
        <div key={item.id ?? `${item.title}-${item.time}-${index}`} className="zelify-activity-item">
          <div className="zelify-activity-item__marker">{item.marker}</div>
          <div className="zelify-activity-item__body">
            <span className="zelify-activity-item__type">{item.type}</span>
            <strong className="zelify-activity-item__title">{item.title}</strong>
            <span className="zelify-activity-item__meta">{item.meta}</span>
          </div>
          <time className="zelify-activity-item__time">{item.time}</time>
        </div>
      ))}
    </div>
  );
}

export type { ActivityFeedItem };
