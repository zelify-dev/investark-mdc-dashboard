import type { Metadata } from "next";
import type { PropsWithChildren } from "react";

export const metadata: Metadata = {
  title: "Sign in — Zelify Core",
  description: "Sign in to your Zelify Core account",
};

export default function LoginLayout({ children }: PropsWithChildren) {
  return <>{children}</>;
}
