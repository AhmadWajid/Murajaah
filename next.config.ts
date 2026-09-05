import type { NextConfig } from "next";
import { dirname } from "path";
import { fileURLToPath } from "url";

const nextConfig: NextConfig = {
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
  },
  experimental: {
    optimizePackageImports: ['tailwindcss'],
  },
};

export default nextConfig;
