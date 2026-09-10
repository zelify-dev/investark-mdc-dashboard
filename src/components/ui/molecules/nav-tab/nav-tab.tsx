import Link from "next/link";
import type { ReactNode } from "react";

type NavTabProps = {
  label: string;
  href?: string;
  isActive?: boolean;
  trailingIcon?: ReactNode;
  variant?: "default" | "adminSub";
};

export function NavTab({
  label,
  href = "#",
  isActive = false,
  trailingIcon,
  variant = "default",
}: NavTabProps) {
  const variantClass = variant === "adminSub" ? "zelify-nav-tab--admin-sub" : "";
  return (
    <Link
      href={href}
      className={`zelify-nav-tab ${variantClass} ${isActive ? "is-active" : ""}`}
    >
      <span>{label}</span>
      {trailingIcon}
    </Link>
  );
}
