/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable server-side external package handling for better-sqlite3
  serverExternalPackages: ['better-sqlite3'],
};

export default nextConfig;
