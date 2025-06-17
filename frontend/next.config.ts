import type { NextConfig } from "next";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8012";

const url = new URL(backendUrl);
const protocol = url.protocol.replace(":", "");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: protocol as "http" | "https",
        hostname: url.hostname,
        port: url.port || undefined,
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;
