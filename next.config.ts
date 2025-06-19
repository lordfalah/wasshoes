import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "robohash.org",
      },
      {
        protocol: "https",
        hostname: "c9eruzymfc.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },

  allowedDevOrigins: [
    "local-origin.dev",
    "*.local-origin.dev",
    "http://172.16.95.227:3000",
  ],
};

export default nextConfig;
