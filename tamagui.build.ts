import type { TamaguiBuildOptions } from "@tamagui/core";

const config: TamaguiBuildOptions = {
  components: ["tamagui"],
  config: "./tamagui.config.ts",
  outputCSS: "./public/tamagui.generated.css",
};

export default config;
