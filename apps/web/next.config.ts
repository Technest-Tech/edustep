import type { NextConfig } from "next";

const apiProxyUrl = process.env.API_PROXY_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyUrl}/api/:path*`,
      },
      {
        source: "/sanctum/:path*",
        destination: `${apiProxyUrl}/sanctum/:path*`,
      },
    ];
  },
};

export default nextConfig;
