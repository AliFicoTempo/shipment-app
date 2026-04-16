import type { NextConfig } from "next";
import path from "path";

import nextPWA from "@ducanh2912/next-pwa";

const withPWA = nextPWA({
  dest: "public",
  register: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
});

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default withPWA(nextConfig);
