import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable server-side features for better-sqlite3
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
