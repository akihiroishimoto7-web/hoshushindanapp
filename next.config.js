/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // ねこのチーズ工房（public/cheese に静的ファイルとして置く）
    return [{ source: '/cheese', destination: '/cheese/index.html' }];
  },
};
module.exports = nextConfig;
