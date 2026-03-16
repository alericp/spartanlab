/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      // ========================================
      // SEO CANONICAL REDIRECTS
      // Eliminate duplicate pages targeting same keywords
      // ========================================
      
      // Calculator duplicates -> canonical calculators
      {
        source: '/tools/front-lever-calculator',
        destination: '/front-lever-readiness-calculator',
        permanent: true,
      },
      {
        source: '/tools/front-lever-strength-test',
        destination: '/front-lever-readiness-calculator',
        permanent: true,
      },
      {
        source: '/tools/planche-strength-calculator',
        destination: '/planche-readiness-calculator',
        permanent: true,
      },
      {
        source: '/calculators/skill-readiness-score',
        destination: '/front-lever-readiness-calculator',
        permanent: true,
      },
      
      // Training guide duplicates -> canonical guides
      {
        source: '/front-lever-training-guide',
        destination: '/guides/front-lever-training',
        permanent: true,
      },
      {
        source: '/planche-training-guide',
        destination: '/guides/planche-progression',
        permanent: true,
      },
      
      // Old muscle-up path
      {
        source: '/muscle-up-readiness',
        destination: '/muscle-up-readiness-calculator',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
