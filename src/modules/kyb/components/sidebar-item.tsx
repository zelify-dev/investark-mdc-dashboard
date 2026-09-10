"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProgressBadge } from "@/modules/kyb/components/progress-badge";
import {
  Building2,
  ShieldCheck,
  Code2,
  LineChart,
  Users,
  Fingerprint,
} from "lucide-react";
import { OnboardingNavItem } from "@/modules/kyb/lib/onboarding-config";

const itemIcons = {
  "/kyb": Building2,
  "/kyb/pld-aml": ShieldCheck,
  "/kyb/commercial-info": LineChart,
  "/kyb/company-info": Users,
  "/kyb/sat-kyc": Fingerprint,
};

type SidebarItemProps = {
  item: OnboardingNavItem;
  percent: number;
  collapsed: boolean;
  onNavigate?: () => void;
};

export function SidebarItem({
  item,
  percent,
  collapsed,
  onNavigate,
}: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const Icon = itemIcons[item.href as keyof typeof itemIcons] || Building2;
  const progressValue = item.percentKey ? percent : null;

  return (
    <div className="group relative">
      <Link
        href={item.href}
        onClick={onNavigate}
        className={[
          "flex items-center rounded-xl border px-3 py-2.5 transition-all duration-200",
          collapsed ? "justify-center" : "justify-between gap-3",
          isActive
            ? "border-slate-200 bg-slate-50 text-slate-900"
            : "border-transparent text-slate-500 hover:border-slate-100 hover:bg-slate-50/50 hover:text-slate-800",
        ].join(" ")}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={[
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
              isActive ? "bg-slate-900 text-white" : "bg-slate-100/60 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-500",
            ].join(" ")}
          >
            <Icon className="h-4.5 w-4.5" size={18} />
          </span>
          {!collapsed && (
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold tracking-wide uppercase">{item.title}</span>
            </span>
          )}
        </span>
        {!collapsed && progressValue !== null && <ProgressBadge value={progressValue} compact />}
      </Link>

      {collapsed && (
        <div className="pointer-events-none absolute left-full top-1/2 z-20 ml-3 hidden -translate-y-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-panel group-hover:block">
          {item.title}
          {progressValue !== null ? ` · ${progressValue}%` : ""}
        </div>
      )}
    </div>
  );
}
