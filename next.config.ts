import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Optimizaciones de memoria
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  productionBrowserSourceMaps: false,
};

export default nextConfig;
