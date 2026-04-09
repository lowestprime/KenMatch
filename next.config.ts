import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: "standalone",
  deploymentId: process.env.DEPLOYMENT_VERSION,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    cpus: 1,
    workerThreads: true,
    webpackBuildWorker: false,
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
