"use client";

import { type ActivityEvent } from "@/mocks/customers";

type CustomerActivityFeedProps = {
  events: ActivityEvent[];
};

export function CustomerActivityFeed({ events }: CustomerActivityFeedProps) {
  return (
    <aside className="zelify-panel zelify-activity-sidebar">
      <div className="zelify-panel__header">
        <h2 className="zelify-panel__title">Latest Activity</h2>
      </div>
      <div className="zelify-timeline">
        {events.map((event) => (
          <div key={event.id} className="zelify-timeline-item">
            <div className={`zelify-timeline-item__dot zelify-timeline-item__dot--${event.category.toLowerCase()}`} />
            <div className="zelify-timeline-item__content">
              <span className="zelify-timeline-item__type">{event.type}</span>
              <p className="zelify-timeline-item__desc">{event.description}</p>
              <time className="zelify-timeline-item__time">{event.timestamp}</time>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
