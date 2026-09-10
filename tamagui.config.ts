import { defaultConfig } from "@tamagui/config/v5";
import { createTamagui } from "tamagui";

const config = createTamagui(defaultConfig);

export type AppConfig = typeof config;

declare module "tamagui" {
  // Required by Tamagui so custom config types flow through the package.
  /* eslint-disable-next-line @typescript-eslint/no-empty-object-type */
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config;
