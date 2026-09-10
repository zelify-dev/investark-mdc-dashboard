import type { HTMLAttributes, ReactNode } from "react";

import "./section-title.css";

type SectionTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  children: ReactNode;
  className?: string;
};

export function SectionTitle({ children, className, ...props }: SectionTitleProps) {
  const classes = ["zelify-section-title", className ?? ""].filter(Boolean).join(" ");
  return (
    <h2 className={classes} {...props}>
      {children}
    </h2>
  );
}
