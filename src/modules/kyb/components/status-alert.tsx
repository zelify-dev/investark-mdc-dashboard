import { Info } from "lucide-react";

type StatusAlertProps = {
  title: string;
  description: string;
  tone: "info" | "success" | "error";
};

const toneStyles = {
  info: "border-l-sky-500 bg-transparent",
  success: "border-l-emerald-500 bg-transparent",
  error: "border-l-rose-500 bg-transparent",
};

const iconColors = {
  info: "text-sky-500",
  success: "text-emerald-500",
  error: "text-rose-500",
};

export function StatusAlert({ title, description, tone }: StatusAlertProps) {
  return (
    <div className={["border-l-2 pl-4 py-0.5 bg-transparent", toneStyles[tone]].join(" ")}>
      <div className="flex items-start gap-3">
        <span className={["mt-0.5 shrink-0", iconColors[tone]].join(" ")}>
          <Info size={16} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-800 leading-none pt-0.5">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  );
}
