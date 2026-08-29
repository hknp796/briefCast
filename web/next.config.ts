import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repo root has its own package-lock.json (the Node pipeline), so Next
  // otherwise infers the wrong workspace root. Pin it to web/.
  turbopack: { root: __dirname },
};

export default nextConfig;
