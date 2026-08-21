import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: "standalone",
  deploymentId: process.env.DEPLOYMENT_VERSION,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  experimental: {
    cpus: 1,
    workerThreads: true,
    webpackBuildWorker: false,
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
