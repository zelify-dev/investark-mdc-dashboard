type TaskQueueSummaryItem = {
  label: string;
  value: string;
};

type TaskQueueItem = {
  title: string;
  owner: string;
  dueDate: string;
};

type TaskQueueProps = {
  summary: TaskQueueSummaryItem[];
  tasks: TaskQueueItem[];
};

export function TaskQueue({ summary, tasks }: TaskQueueProps) {
  return (
    <div className="zelify-task-queue">
      <div className="zelify-task-queue__summary">
        {summary.map((item) => (
          <div key={item.label} className="zelify-task-queue__metric">
            <span className="zelify-task-queue__metric-label">{item.label}</span>
            <strong className="zelify-task-queue__metric-value">{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="zelify-task-queue__list" role="list">
        {tasks.map((task) => (
          <div key={`${task.title}-${task.dueDate}`} className="zelify-task-queue__item" role="listitem">
            <div className="zelify-task-queue__item-main">
              <strong className="zelify-task-queue__item-title">{task.title}</strong>
              <span className="zelify-task-queue__item-owner">{task.owner}</span>
            </div>
            <time className="zelify-task-queue__item-date">{task.dueDate}</time>
          </div>
        ))}
      </div>
    </div>
  );
}

export type { TaskQueueItem, TaskQueueSummaryItem };
