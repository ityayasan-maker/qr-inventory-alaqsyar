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
      {
        source: '/a/:path*',
        has: [
          {
            type: 'host',
            value: 'qr-aset-aqis.vercel.app',
          },
        ],
        destination: 'https://inventaris.alaqsyar.sch.id/a/:path*',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
