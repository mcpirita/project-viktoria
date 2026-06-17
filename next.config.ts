import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Railway: self-contained server bundle
  output: "standalone",

  // Next 16: explicit opt-in to the new caching model (Cache Components)
  cacheComponents: true,

  images: {
    // Next 16 defaults; kept explicit so later phases can extend
    formats: ["image/avif", "image/webp"],
    qualities: [75],
  },
};

export default nextConfig;
