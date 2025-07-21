import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker optimization
  output: "standalone",

  // Enable output file tracing for smaller Docker images
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
