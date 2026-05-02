import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: "standalone",
  deploymentId: process.env.DEPLOYMENT_VERSION,
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
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/og-image.png",
          destination: "/share-image.png",
        },
      ],
    };
  },
};

export default nextConfig;
