/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 确保可以从任何IP地址访问
  webpack: (config) => {
    return config;
  }
};

module.exports = nextConfig; 