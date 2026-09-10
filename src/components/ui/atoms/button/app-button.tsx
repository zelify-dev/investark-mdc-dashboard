"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import "./app-button.css";

export type AppButtonTone = "primary" | "secondary" | "neutral";

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: AppButtonTone;
  size?: "md";
  fullWidth?: boolean;
};

export function AppButton({
  children,
  className,
  tone = "neutral",
  size = "md",
  fullWidth = false,
  type = "button",
  ...props
}: AppButtonProps) {
  const classes = [
    "zelify-button",
    `zelify-button--${tone}`,
    `zelify-button--${size}`,
    fullWidth ? "is-full-width" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
