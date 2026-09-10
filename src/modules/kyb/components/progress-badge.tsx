type ProgressBadgeProps = {
  value: number;
  compact?: boolean;
};

export function ProgressBadge({ value, compact = false }: ProgressBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full bg-slate-100 font-semibold text-slate-600",
        compact ? "px-2 py-1 text-[11px]" : "px-2.5 py-1 text-xs",
      ].join(" ")}
    >
      {value}%
    </span>
  );
}
