import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // Invoice uploads (max 10 MB) go through a Server Action; lift the 1 MB default.
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
