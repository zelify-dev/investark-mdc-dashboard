"use client";

import { usePathname } from "next/navigation";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { resolveActiveTopNavId, zelifyTopNavItems } from "@/config/navigation";

type WorkspaceShellProps = {
  children: React.ReactNode;
};

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  const pathname = usePathname();

  const activeNavId = resolveActiveTopNavId(pathname, zelifyTopNavItems);

  return (
    <div className="zelify-workspace-shell">
      <ZelifyTopNavbar activeNavId={activeNavId} />
      {children}
    </div>
  );
}
