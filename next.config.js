/** @type {import('next').NextConfig} */

// Import next-pwa with proper options
const withPWA = require("next-pwa")({
  dest: "public",                        // Where generated service worker is output
  register: true,                        // Auto-register service worker
  skipWaiting: true,                     // Immediately activate new SW
  disable: process.env.NEXT_PUBLIC_ENV === "dev", // Disable PWA in dev
  swSrc: "public/custom-sw.js",          // Custom worker file (where __WB_MANIFEST lives)
  buildExcludes: [/middleware-manifest.json$/], // Prevent caching Next internals
});

const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: ["res.cloudinary.com"],     // Allow Cloudinary images
  },
};

module.exports = withPWA(nextConfig);
