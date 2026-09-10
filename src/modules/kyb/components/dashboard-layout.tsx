"use client";

import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { Header } from "@/modules/kyb/components/header";
import { Sidebar } from "@/modules/kyb/components/sidebar";
import { useOnboarding } from "@/modules/kyb/components/onboarding-provider";
import "./kyb-theme.css";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed } = useOnboarding();

  return (
    <div className="zelify-kyb-shell min-h-screen bg-transparent">
      <ZelifyTopNavbar activeNavId="kyb" />
      <div
        className={[
          "min-h-[calc(100vh-116px)] lg:grid",
          isSidebarCollapsed
            ? "lg:grid-cols-[80px_minmax(0,1fr)]"
            : "lg:grid-cols-[280px_minmax(0,1fr)]",
        ].join(" ")}
      >
        <Sidebar />
        <div className="min-w-0 transition-all duration-300">
          <Header />
          <main className="zelify-kyb-main px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
