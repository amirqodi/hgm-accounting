import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",

  webpack(config) {
    // اضافه کردن loader برای SVG
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },

  // فایل‌هایی که حتماً باید در خروجی standalone باشند
  outputFileTracingIncludes: {
    "/*": [
      "src/config/runtime/**/*.json",
      "public/**/*", // اضافه کردن کل فولدر public
    ],
    "/products/*": ["src/lib/payments/**/*"],
  },

  // فایل‌هایی که نباید در trace قرار بگیرند
  outputFileTracingExcludes: {
    "/api/*": ["src/temp/**/*", "public/large-logs/**/*"],
  },
};

export default nextConfig;
