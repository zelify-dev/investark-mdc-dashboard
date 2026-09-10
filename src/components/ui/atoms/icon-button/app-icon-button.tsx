import type { ButtonHTMLAttributes, ReactNode } from "react";

type AppIconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  ariaLabel: string;
  chrome?: "subtle";
};

export function AppIconButton({
  ariaLabel,
  children,
  chrome = "subtle",
  className,
  type = "button",
  ...props
}: AppIconButtonProps) {
  const classes = [
    "zelify-icon-button",
    `zelify-icon-button--${chrome}`,
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} aria-label={ariaLabel} className={classes} {...props}>
      {children}
    </button>
  );
}
