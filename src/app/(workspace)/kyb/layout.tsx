import { DashboardLayout } from "@/modules/kyb/components/dashboard-layout";
import { OnboardingProvider } from "@/modules/kyb/components/onboarding-provider";

export default function KybLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </OnboardingProvider>
  );
}
