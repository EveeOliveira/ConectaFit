/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  distDir: 'dist',
  // Configuração do servidor
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
}

export default nextConfig
