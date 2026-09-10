import type { ReactNode } from "react";

import "./app-badge.css";

type BadgeTone = "success" | "error" | "warning" | "neutral";
type BadgeSize = "default" | "sm";

type AppBadgeProps = {
  children: ReactNode;
  className?: string;
  tone?: BadgeTone;
  size?: BadgeSize;
};

export function AppBadge({ children, className, tone, size = "default" }: AppBadgeProps) {
  const classes = [
    "zelify-badge",
    tone ? `zelify-badge--${tone}` : "",
    size === "sm" ? "zelify-badge--sm" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
}
