import type { HTMLAttributes, ReactNode } from "react";

type AppTextProps = HTMLAttributes<HTMLParagraphElement> & {
  children: ReactNode;
  tone?: "default" | "muted" | "strong";
};

export function AppText({
  children,
  className,
  tone = "default",
  ...props
}: AppTextProps) {
  const classes = ["zelify-text", `zelify-text--${tone}`, className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <p className={classes} {...props}>
      {children}
    </p>
  );
}
