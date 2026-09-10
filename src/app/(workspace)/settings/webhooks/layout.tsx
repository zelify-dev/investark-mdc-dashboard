import { WebhooksSetupShell } from "@/modules/settings/components/webhooks-setup-shell";

export default function WebhooksSettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <WebhooksSetupShell>{children}</WebhooksSetupShell>;
}
