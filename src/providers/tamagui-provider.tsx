"use client";

import type { PropsWithChildren } from "react";
import { TamaguiProvider as TamaguiRootProvider } from "tamagui";

import config from "../../tamagui.config";

export function TamaguiProvider({ children }: PropsWithChildren) {
  return (
    <TamaguiRootProvider config={config} defaultTheme="light">
      {children}
    </TamaguiRootProvider>
  );
}
