/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // Optimisations pour accélérer le développement
  experimental: {
    optimizeCss: false, // Désactiver l'optimisation CSS en dev
  },
  // Compiler plus rapidement
  swcMinify: true,
  // Désactiver ESLint pendant le développement pour accélérer
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig 