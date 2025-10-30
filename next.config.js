/** @type {import('next').NextConfig} */

const withPWA = require("next-pwa")({
    dest: "public",
    register: true,
    disable: process.env.NEXT_PUBLIC_ENV === "dev" ? false : true,
});

const nextConfig = {
    images: {
        domains: ["res.cloudinary.com"],
    },
    // Add other Next.js config options if needed
};

module.exports = withPWA(nextConfig);