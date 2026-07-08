/** @type {import('next').NextConfig} */
const nextConfig = {
  // Xuất bản build gọn cho Docker (COPY .next/standalone trong Dockerfile).
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
