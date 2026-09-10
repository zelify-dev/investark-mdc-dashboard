import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/** Raíz real del app (donde está este next.config). Evita que Turbopack use otro lockfile padre y deje de cargar `.env`. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flowchart-diagrams-zelify.s3.us-east-1.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
  /** Tamagui + strict TS: muchos props de Stack no coinciden con los tipos generados hasta alinear versión/tokens. */
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: [
    "react-native-web",
    "react-native-svg",
    "@tamagui/react-native-svg",
    "tamagui",
    "lucide-react",
    "@tamagui/lucide-icons",
  ],
  /** Mismo criterio que `turbopack.resolveAlias` — necesario para `next dev --webpack`. */
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "react-native": "react-native-web",
      "react-native-svg": "@tamagui/react-native-svg",
    };
    return config;
  },
  turbopack: {
    root: projectRoot,
    resolveAlias: {
      "react-native": "react-native-web",
      "react-native-svg": "@tamagui/react-native-svg",
    },
  },
};

export default nextConfig;
