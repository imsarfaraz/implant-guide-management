import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow all hosts/origins so preview subdomains, custom domains, localhost,
  // or proxy-forwarded requests never get rejected by Server Actions CSRF/Origin check.
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
