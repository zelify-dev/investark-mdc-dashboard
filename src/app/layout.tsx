import type { Metadata } from "next";
import localFont from "next/font/local";

import { AuthGuard } from "@/components/auth/auth-guard";
import { getLocaleFromCookie } from "@/i18n/server";
import { getMessages } from "@/i18n/messages";
import { I18nProvider } from "@/providers/i18n-provider";
import { BrandingProvider } from "@/providers/branding-provider";
import { TamaguiProvider } from "@/providers/tamagui-provider";
import { QueryProvider } from "@/providers/query-provider";

import "@/styles/tailwind.css";
import "./globals.css";
import "../../public/tamagui.generated.css";

const nataSans = localFont({
  variable: "--font-nata-sans",
  src: [
    {
      path: "../../public/fonts/Nata_Sans/NataSans-VariableFont_wght.ttf",
      style: "normal",
      weight: "100 900",
    },
  ],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromCookie();
  const messages = getMessages(locale);
  return {
    title: messages.meta.title,
    description: messages.meta.description,
    icons: {
      icon: "/logo-icon.svg",
      apple: "/logo-icon.svg",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocaleFromCookie();
  const messages = getMessages(locale);

  return (
    <html lang={locale} className={nataSans.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <TamaguiProvider>
          <QueryProvider>
            <BrandingProvider>
              <I18nProvider initialLocale={locale} initialMessages={messages}>
                <AuthGuard>{children}</AuthGuard>
              </I18nProvider>
            </BrandingProvider>
          </QueryProvider>
        </TamaguiProvider>
      </body>
    </html>
  );
}
