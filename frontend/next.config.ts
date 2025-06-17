import type { NextConfig } from "next";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: new URL(backendUrl).hostname,
        port: new URL(backendUrl).port || undefined,
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;
